// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url)
        const businessId = url.searchParams.get('business_id')

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const _authHeader = req.headers.get('Authorization');
        if (!_authHeader) throw new Error('Missing Authorization header');
        const _token = _authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(_token)
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401
            })
        }

        // Find the business. If business_id is passed, use it, else get the first one owned by user.
        let bizQuery = supabase.from('businesses').select('id, total_leads, total_views').eq('owner_id', user.id)
        if (businessId) {
            bizQuery = bizQuery.eq('id', businessId)
        }

        const { data: businessData, error: bizError } = await bizQuery.limit(1).single()
        if (bizError || !businessData) throw new Error('Business not found or forbidden')

        const targetBizId = businessData.id
        const totalLeads = businessData.total_leads || 0

        // Compute conversion rate (Count leads with status = 'converted')
        const { count: convertedCount, error: leadError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', targetBizId)
            .eq('status', 'converted')

        if (leadError) throw leadError

        const conversionRate = totalLeads > 0 ? ((convertedCount || 0) / totalLeads) * 100 : 0
        const profileViews = businessData.total_views || 0

        return new Response(
            JSON.stringify({
                analytics: {
                    business_id: targetBizId,
                    profile_views: profileViews,
                    total_leads: totalLeads,
                    conversion_rate: conversionRate
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
