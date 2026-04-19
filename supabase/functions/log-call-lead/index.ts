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
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        const authHeader = req.headers.get('Authorization') || '';
        const userClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );
        // Explicitly bypass errors if anon tracking
        const _authHeader = req.headers.get('Authorization');
        if (!_authHeader) throw new Error('Missing Authorization header');
        const _token = _authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await userClient.auth.getUser(_token).catch(() => ({ data: { user: null }, error: null }));

        const { business_id } = await req.json();

        let userName = 'Anonymous Caller';
        let userPhone = 'Unknown';
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('name, phone').eq('id', user.id).single();
            if (profile) {
                userName = profile.name;
                userPhone = profile.phone || 'Unknown';
            }
        }

        await supabase.from('leads').insert({
            business_id,
            user_name: userName,
            user_phone: userPhone,
            message: 'Direct phone call log.',
            type: 'call',
            status: 'new'
        });

        const { data: biz } = await supabase.from('businesses').select('total_leads').eq('id', business_id).single();
        if (biz) {
            await supabase.from('businesses').update({ total_leads: (biz.total_leads || 0) + 1 }).eq('id', business_id);
        }

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }
});
