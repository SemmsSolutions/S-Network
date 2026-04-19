// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        const { city } = req.method === 'POST' ? await req.json() : { city: null };

        // Featured vendors
        const { data: featuredOverrides } = await supabase
            .from('admin_overrides')
            .select('business_id, position_order')
            .eq('override_type', 'homepage_featured').eq('is_active', true)
            .order('position_order', { ascending: true }).limit(6);

        // Popular vendors
        const { data: popularOverrides } = await supabase
            .from('admin_overrides')
            .select('business_id, position_order')
            .eq('override_type', 'homepage_popular').eq('is_active', true)
            .order('position_order', { ascending: true }).limit(8);

        // Recommended vendors
        const { data: recommendedOverrides } = await supabase
            .from('admin_overrides')
            .select('business_id, position_order')
            .eq('override_type', 'homepage_recommended').eq('is_active', true)
            .order('position_order', { ascending: true }).limit(6);

        // Helper to fetch businesses by IDs in order
        const fetchByIds = async (ids: string[]) => {
            if (!ids.length) return [];
            const { data } = await supabase
                .from('businesses')
                .select('*, categories(name), profiles:owner_id(name, avatar_url)')
                .in('id', ids).eq('is_active', true);
            // Re-order to match the override position order
            return ids.map(id => (data || []).find((b: any) => b.id === id)).filter(Boolean);
        };

        const featured = await fetchByIds((featuredOverrides || []).map((o: any) => o.business_id));
        const popular = await fetchByIds((popularOverrides || []).map((o: any) => o.business_id));
        const recommended = await fetchByIds((recommendedOverrides || []).map((o: any) => o.business_id));

        // Top rated (by rating, optionally filtered by city)
        let topQuery = supabase.from('businesses')
            .select('*, categories(name), profiles:owner_id(name, avatar_url)')
            .eq('is_active', true).eq('is_verified', true)
            .order('rating', { ascending: false }).limit(8);
        if (city) topQuery = topQuery.ilike('city', `%${city}%`);
        const { data: topRated } = await topQuery;

        // Recent
        let recentQuery = supabase.from('businesses')
            .select('*, categories(name), profiles:owner_id(name, avatar_url)')
            .eq('is_active', true)
            .order('created_at', { ascending: false }).limit(8);
        if (city) recentQuery = recentQuery.ilike('city', `%${city}%`);
        const { data: recent } = await recentQuery;

        return new Response(JSON.stringify({
            featured: featured || [],
            popular: popular || [],
            recommended: recommended || [],
            top_rated: topRated || [],
            recent: recent || []
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
