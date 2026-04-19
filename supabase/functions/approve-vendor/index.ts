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
        const { business_id } = await req.json()

        if (!business_id) throw new Error('business_id is required')

        // Create client using the requesting user's JWT to verify their identity and role
        const supabaseSession = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const token = authHeader.replace('Bearer ', '');

        // Get Auth user explicitly with JWT
        const { data: { user }, error: userError } = await supabaseSession.auth.getUser(token)
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401
            })
        }

        // Verify admin role 
        const { data: profile, error: profileError } = await supabaseSession
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError || !profile || profile.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403
            })
        }

        // Since the actual 'update' RLS policy only allows the business owner to update,
        // we must use the Service Role key to bypass RLS and set is_verified = true.
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: updatedBusiness, error: updateError } = await supabaseAdmin
            .from('businesses')
            .update({ is_verified: true })
            .eq('id', business_id)
            .select()
            .single()

        if (updateError || !updatedBusiness) {
            return new Response(JSON.stringify({ error: 'Business not found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404
            })
        }

        // Create notification for the vendor
        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        await adminClient.from('notifications').insert({
            user_id: updatedBusiness.owner_id,
            title: 'Business Approved!',
            body: 'Your business has been verified and is now visible in search results.',
            type: 'approval',
            ref_id: business_id
        }).catch(() => { })

        return new Response(
            JSON.stringify({ business: updatedBusiness }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
