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
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        );
        let params: any = {};
        try { params = await req.json(); } catch (_) { /* empty body is OK */ }
        const {
            query, city, category_id,
            lat, lng, radius,
            rating_min,
            verified_only,
            sort_by = 'relevance',
            page = 1, limit = 10
        } = params;

        let selectStr = `
      *,
      categories ( name, icon ),
      business_images ( image_url ),
      reviews ( rating )
    `;
        if (params.spec_id) {
            selectStr += `, vendor_specializations!inner ( specialization_id )`;
        }

        let dbQuery = supabase.from('businesses').select(selectStr);

        // Apply strict filtering
        dbQuery = dbQuery.eq('is_on_vacation', false);

        if (query) {
            dbQuery = dbQuery.ilike('name', `%${query}%`);
        }
        if (city) {
            dbQuery = dbQuery.ilike('city', `%${city}%`);
        }
        if (category_id) {
            dbQuery = dbQuery.eq('category_id', category_id);
        }
        if (params.spec_id) {
            dbQuery = dbQuery.eq('vendor_specializations.specialization_id', params.spec_id);
        }
        if (verified_only) {
            dbQuery = dbQuery.eq('is_verified', true);
        }

        const { data: rawBusinesses, error } = await dbQuery;

        if (error) throw error;

        let processed = rawBusinesses.map((biz: any) => {
            const avgRating = biz.reviews && biz.reviews.length > 0
                ? biz.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / biz.reviews.length
                : 0;

            let distance_km = null;
            if (lat && lng && biz.lat && biz.lng) {
                const earthRadius = 6371; // km
                const dLat = (biz.lat - lat) * Math.PI / 180;
                const dLng = (biz.lng - lng) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat * Math.PI / 180) * Math.cos(biz.lat * Math.PI / 180) *
                    Math.sin(dLng / 2) * Math.sin(dLng / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                distance_km = earthRadius * c;
            }

            let is_open_now = false;
            if (biz.working_hours) {
                try {
                    const now = new Date();
                    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    const today = days[now.getDay()];
                    const hours = biz.working_hours[today];
                    if (hours && hours.open && hours.close) {
                        const currentMinutes = now.getHours() * 60 + now.getMinutes();
                        const [oh, om] = hours.open.split(':').map(Number);
                        const [ch, cm] = hours.close.split(':').map(Number);
                        is_open_now = currentMinutes >= (oh * 60 + om) && currentMinutes < (ch * 60 + cm);
                    }
                } catch (_) { /* fallback to closed */ }
            }

            // Calculate score based on relevance, premium bump
            let score = 0;
            if (biz.is_premium) score += 0.3;
            if (biz.is_verified) score += 0.1;

            return {
                ...biz,
                avg_rating: avgRating,
                distance_km,
                is_open_now,
                relevance_score: score
            };
        });

        if (rating_min) {
            processed = processed.filter((b: any) => b.avg_rating >= rating_min);
        }
        if (lat && lng && radius) {
            processed = processed.filter((b: any) => b.distance_km === null || b.distance_km <= radius);
        }

        // Sorting
        processed.sort((a: any, b: any) => {
            if (sort_by === 'relevance') {
                return b.relevance_score - a.relevance_score;
            } else if (sort_by === 'rating') {
                return b.avg_rating - a.avg_rating;
            } else if (sort_by === 'newest') {
                return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() < 0 ? 1 : -1;
            } else if (sort_by === 'most_reviewed') {
                return (b.reviews?.length || 0) - (a.reviews?.length || 0);
            }
            return 0; // preserve order
        });

        const start = (page - 1) * limit;
        const paginated = processed.slice(start, start + limit);

        return new Response(
            JSON.stringify({
                data: paginated,
                page,
                totalCount: processed.length,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
