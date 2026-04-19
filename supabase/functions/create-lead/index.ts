// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const adminSupabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // Parse body safely
        let body: any = {}
        try { body = await req.json() } catch { body = {} }

        const { business_id, project_type, message, budget_min, budget_max,
            timeline, user_name, user_phone, user_email } = body

        // Validate required fields
        if (!business_id) {
            return new Response(
                JSON.stringify({ error: 'business_id is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }
        if (!project_type) {
            return new Response(
                JSON.stringify({ error: 'project_type is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Get authenticated user (optional — allows anonymous leads)
        let userId: string | null = null
        let authUserEmail: string | null = user_email || null
        const authHeader = req.headers.get('Authorization')
        if (authHeader) {
            const userClient = createClient(
                Deno.env.get('SUPABASE_URL')!,
                Deno.env.get('SUPABASE_ANON_KEY')!,
                { global: { headers: { Authorization: authHeader } } }
            )
            const { data: { user } } = await userClient.auth.getUser()
            if (user) {
                userId = user.id
                authUserEmail = user.email || authUserEmail
                // Fetch profile for name/phone if not provided
                if (!user_name || !user_phone) {
                    const { data: profile } = await adminSupabase.from('profiles').select('name, phone').eq('id', user.id).maybeSingle()
                    if (profile) {
                        body.user_name = user_name || profile.name
                        body.user_phone = user_phone || profile.phone
                    }
                }
            }
        }

        // Verify business exists
        const { data: business } = await adminSupabase
            .from('businesses')
            .select('id, name, owner_id')
            .eq('id', business_id)
            .maybeSingle()

        if (!business) {
            return new Response(
                JSON.stringify({ error: 'Business not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Insert lead
        const { data: lead, error: leadError } = await adminSupabase
            .from('leads')
            .insert({
                business_id,
                user_id: userId,
                user_name: body.user_name || user_name || null,
                user_phone: body.user_phone || user_phone || null,
                user_email: authUserEmail,
                project_type,
                message: message || null,
                budget_min: budget_min || null,
                budget_max: budget_max || null,
                timeline: timeline || null,
                status: 'new'
            })
            .select()
            .single()

        if (leadError) throw leadError

        // Increment total_leads on business
        await adminSupabase.rpc('increment_business_leads', { business_id_param: business_id })
            .catch(async () => {
                const { data: biz } = await adminSupabase.from('businesses').select('total_leads').eq('id', business_id).single()
                await adminSupabase.from('businesses').update({ total_leads: (biz?.total_leads || 0) + 1 }).eq('id', business_id)
            })

        // Notify vendor with realtime notification
        await adminSupabase.from('notifications').insert({
            user_id: business.owner_id,
            title: '🔔 New Lead Received',
            body: `${body.user_name || user_name || 'Someone'} is enquiring about ${project_type} for your business ${business.name}`,
            type: 'new_lead',
            ref_id: lead.id,
            is_read: false
        }).catch(() => { /* Non-critical — don't fail on notification error */ })

        // Send confirmation email to user if email is available
        const siteUrl = Deno.env.get('SITE_URL') || 'https://snetwork.app'
        const resendKey = Deno.env.get('RESEND_API_KEY')
        if (resendKey && authUserEmail) {
            try {
                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        from: 'S-Network <noreply@snetwork.app>',
                        to: [authUserEmail],
                        subject: `Your enquiry has been sent to ${business.name}`,
                        html: `<div style="font-family:DM Sans,sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <div style="background:#1A1A2E;padding:16px 24px;border-radius:8px 8px 0 0">
                <h1 style="color:#fff;margin:0;font-size:20px"><span style="color:#E85D26">S</span>-<span style="color:#E85D26">N</span>etwork</h1>
              </div>
              <div style="background:#fff;padding:24px;border:1px solid #eee">
                <h2 style="color:#1A1A2E">Enquiry Sent!</h2>
                <p style="color:#555;line-height:1.6">Hi ${body.user_name || 'there'},<br><br>
                Your <strong>${project_type}</strong> enquiry has been sent to <strong>${business.name}</strong>.
                They will contact you within 24 hours.</p>
                <a href="${siteUrl}" style="display:inline-block;background:#E85D26;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin-top:16px">View on S-Network</a>
              </div>
              <p style="color:#aaa;font-size:12px;text-align:center;margin-top:16px">S-Network — Find. Verify. Build.</p>
            </div>`
                    })
                })
            } catch { /* Email is non-critical */ }
        }

        return new Response(
            JSON.stringify({ success: true, lead_id: lead.id }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (err: any) {
        return new Response(
            JSON.stringify({ error: err.message || 'Internal error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
