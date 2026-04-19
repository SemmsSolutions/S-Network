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
        const { lead_id, status, vendor_notes } = await req.json()

        if (!lead_id) throw new Error('Missing lead_id')
        if (status && !['new', 'contacted', 'converted', 'lost'].includes(status)) {
            throw new Error('Invalid status value')
        }

        const _authHeader = req.headers.get('Authorization');
        if (!_authHeader) throw new Error('Missing Authorization header');
        const _token = _authHeader.replace('Bearer ', '')

        // Use SERVICE_ROLE client to bypass RLS for ownership check and DB operations
        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        )

        // Get user from JWT token
        const { data: { user }, error: userError } = await adminClient.auth.getUser(_token)
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401
            })
        }

        // Check if user is admin
        const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
        const isAdmin = profile?.role === 'admin'

        if (!isAdmin) {
            // Verify vendor owns the business related to this lead
            const { data: lead, error: fetchError } = await adminClient
                .from('leads')
                .select('business_id')
                .eq('id', lead_id)
                .single()

            if (fetchError || !lead) throw new Error('Lead not found')

            const { data: biz } = await adminClient
                .from('businesses')
                .select('owner_id')
                .eq('id', lead.business_id)
                .single()

            if (!biz || biz.owner_id !== user.id) {
                return new Response(JSON.stringify({ error: 'Forbidden: Not the owner of this business' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403
                })
            }
        }

        // Build update payload
        const updatePayload: any = {}
        if (status) {
            updatePayload.status = status
            if (status === 'contacted') updatePayload.contacted_at = new Date().toISOString()
            if (status === 'converted') updatePayload.converted_at = new Date().toISOString()
        }
        if (vendor_notes !== undefined) updatePayload.vendor_notes = vendor_notes

        if (Object.keys(updatePayload).length === 0) throw new Error('No fields to update')

        const { data: updatedLead, error: updateError } = await adminClient
            .from('leads')
            .update(updatePayload)
            .eq('id', lead_id)
            .select()
            .single()

        if (updateError) throw updateError

        // Section 7c: Notify user when vendor changes status to 'contacted' or 'converted'
        if (status === 'contacted' || status === 'converted') {
            const lead = updatedLead as any
            if (lead?.user_id) {
                const { data: bizData } = await adminClient
                    .from('businesses')
                    .select('name')
                    .eq('id', lead.business_id)
                    .maybeSingle()

                const title = status === 'contacted'
                    ? '✅ Vendor Responded to Your Enquiry'
                    : '🎉 Quote Accepted!'
                const body = status === 'contacted'
                    ? `${bizData?.name || 'A vendor'} has contacted you about your ${lead.project_type || 'project'} request`
                    : `${bizData?.name || 'A vendor'} has marked your enquiry as converted`

                await adminClient.from('notifications').insert({
                    user_id: lead.user_id,
                    title,
                    body,
                    type: 'lead_status_update',
                    ref_id: lead.id,
                    is_read: false
                }).catch(() => { /* Non-critical */ })
            }
        }

        return new Response(
            JSON.stringify({ lead: updatedLead }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
