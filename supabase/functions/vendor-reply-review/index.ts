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

        const { review_id, reply } = await req.json();

        // Verify ownership
        const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
        const { data: review } = await supabaseAdmin.from('reviews').select('business_id').eq('id', review_id).single();
        if (!review) throw new Error("Review not found");

        const { data: biz } = await supabaseAdmin.from('businesses').select('owner_id').eq('id', review.business_id).single();
        if (biz?.owner_id !== user.id) {
            return new Response(JSON.stringify({ error: 'Forbidden: Not owner' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403
            });
        }

        await supabaseAdmin.from('reviews').update({ vendor_reply: reply }).eq('id', review_id);

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }
});
