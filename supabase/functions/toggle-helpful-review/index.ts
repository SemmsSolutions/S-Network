// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );
        const _authHeader = req.headers.get('Authorization');
        if (!_authHeader) throw new Error('Missing Authorization header');
        const _token = _authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseClient.auth.getUser(_token);
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401
            });
        }

        const { review_id } = await req.json();
        const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

        const { data: existing } = await supabaseAdmin.from('review_helpful').select('id').eq('review_id', review_id).eq('user_id', user.id).maybeSingle();
        const { data: review } = await supabaseAdmin.from('reviews').select('helpful_count').eq('id', review_id).single();
        let currentCount = review?.helpful_count || 0;
        let isHelpful = false;

        if (existing) {
            await supabaseAdmin.from('review_helpful').delete().eq('id', existing.id);
            currentCount = Math.max(0, currentCount - 1);
        } else {
            await supabaseAdmin.from('review_helpful').insert({ review_id, user_id: user.id });
            currentCount += 1;
            isHelpful = true;
        }

        await supabaseAdmin.from('reviews').update({ helpful_count: currentCount }).eq('id', review_id);

        return new Response(JSON.stringify({ helpful: isHelpful, count: currentCount }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }
});
