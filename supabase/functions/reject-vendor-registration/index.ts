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

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        if (!user) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || profile.role !== 'admin') return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        const { vendor_user_id, rejection_reason } = await req.json();
        if (!vendor_user_id) return new Response(JSON.stringify({ error: 'vendor_user_id is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (!rejection_reason || rejection_reason.trim() === '') return new Response(JSON.stringify({ error: 'rejection_reason is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        // Keep as pending_vendor — they can reapply
        // Deactivate business
        await supabase.from('businesses').update({ is_active: false, verification_status: 'rejected', verification_rejection_reason: rejection_reason }).eq('owner_id', vendor_user_id);

        // Reject verification records
        const { data: biz } = await supabase.from('businesses').select('id').eq('owner_id', vendor_user_id).maybeSingle();
        if (biz) {
            await supabase.from('vendor_verifications').update({
                status: 'rejected', rejection_reason, reviewed_at: new Date().toISOString(), reviewed_by: user.id
            }).eq('business_id', biz.id);
        }

        // Get vendor email
        const { data: vendorAuth } = await supabase.auth.admin.getUserById(vendor_user_id);
        const vendorEmail = vendorAuth?.user?.email || '';
        const vendorName = vendorAuth?.user?.user_metadata?.full_name || 'Vendor';

        // Send rejection email via Resend
        const resendKey = Deno.env.get('RESEND_API_KEY');
        if (resendKey && vendorEmail) {
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: 'S-Network <noreply@snetwork.app>',
                    to: [vendorEmail],
                    subject: 'Update on your S-Network registration',
                    html: `<p>Dear ${vendorName},</p>
                 <p>Unfortunately, your vendor registration was not approved.</p>
                 <p><strong>Reason:</strong> ${rejection_reason}</p>
                 <p>You may reapply by updating your information and resubmitting your documents.</p>
                 <p>— S-Network Team</p>`
                })
            });

            await supabase.from('email_notifications').insert({
                recipient_id: vendor_user_id, recipient_email: vendorEmail,
                email_type: 'vendor_rejected', subject: 'Registration not approved',
                metadata: { rejection_reason }
            });
        }

        // In-app notification
        await supabase.from('notifications').insert({
            user_id: vendor_user_id,
            title: 'Registration Not Approved',
            body: `Your registration was not approved. Reason: ${rejection_reason}. You can resubmit from your profile.`,
            type: 'vendor_rejected'
        });

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
