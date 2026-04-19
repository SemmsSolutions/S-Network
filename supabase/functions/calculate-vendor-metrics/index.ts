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

        const { business_id } = await req.json();

        const { data: leads } = await supabase.from('leads').select('created_at, contacted_at, status').eq('business_id', business_id);

        if (!leads || leads.length === 0) {
            return new Response(JSON.stringify({ response_rate: 0, avg_response_time_hours: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        let respondedCount = 0;
        let totalDeltaHours = 0;
        let validContactedDrops = 0;

        for (const lead of leads) {
            if (lead.status !== 'new') {
                respondedCount++;
                if (lead.contacted_at) {
                    const created = new Date(lead.created_at).getTime();
                    const contacted = new Date(lead.contacted_at).getTime();
                    const deltaHours = (contacted - created) / (1000 * 60 * 60);
                    if (deltaHours >= 0) {
                        totalDeltaHours += deltaHours;
                        validContactedDrops++;
                    }
                }
            }
        }

        const response_rate = (respondedCount / leads.length) * 100;
        const avg_response_time_hours = validContactedDrops > 0 ? (totalDeltaHours / validContactedDrops) : 0;

        await supabase.from('businesses').update({
            response_rate: response_rate,
            avg_response_time_hours: avg_response_time_hours
        }).eq('id', business_id);

        return new Response(JSON.stringify({ response_rate, avg_response_time_hours }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }
});
