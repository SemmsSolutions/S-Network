// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        const { business_id } = await req.json();
        const forwardedFor = req.headers.get('x-forwarded-for') || 'unknown';
        const viewer_ip = forwardedFor.split(',')[0];

        // Deduplication check: Has this IP viewed this business in the last hour?
        const { data: recentView } = await supabase
            .from('business_views')
            .select('id')
            .eq('business_id', business_id)
            .eq('viewer_ip', viewer_ip)
            .gte('viewed_at', new Date(Date.now() - 3600 * 1000).toISOString())
            .maybeSingle();

        if (!recentView) {
            await supabase.from('business_views').insert({ business_id, viewer_ip });
            const { data: biz } = await supabase.from('businesses').select('total_views').eq('id', business_id).single();
            if (biz) {
                await supabase.from('businesses').update({ total_views: (biz.total_views || 0) + 1 }).eq('id', business_id);
            }
        }

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }
});
