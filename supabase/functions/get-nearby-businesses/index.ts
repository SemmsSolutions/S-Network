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
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        );

        const { lat, lng, radius_km = 10, category_id = null, limit = 20 } = await req.json();

        if (lat == null || lng == null) {
            return new Response(JSON.stringify({ error: "Missing lat/lng parameters" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
        }

        const { data, error } = await supabase.rpc('get_nearby_businesses', {
            lat,
            lng,
            radius_km,
            target_category_id: category_id,
            row_limit: limit
        });

        if (error) throw error;

        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }
});
