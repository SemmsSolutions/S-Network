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

        // Verify admin
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        if (!user) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || profile.role !== 'admin') return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        const { vendor_user_id } = await req.json();
        if (!vendor_user_id) return new Response(JSON.stringify({ error: 'vendor_user_id is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        // 1. Update role to vendor
        const { error: roleErr } = await supabase.from('profiles').update({ role: 'vendor' }).eq('id', vendor_user_id).eq('role', 'pending_vendor');
        if (roleErr) throw roleErr;

        // 2. Activate business
        const { data: biz } = await supabase.from('businesses').select('id, name').eq('owner_id', vendor_user_id).maybeSingle();
        if (biz) {
            await supabase.from('businesses').update({ is_active: true }).eq('id', biz.id);
            // Also approve verification if pending
            await supabase.from('vendor_verifications').update({
                status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user.id
            }).eq('business_id', biz.id).eq('status', 'pending');
            await supabase.from('businesses').update({
                verification_status: 'verified', is_verified: true, verified_at: new Date().toISOString()
            }).eq('id', biz.id);
        }

        // 3. Get vendor email
        const { data: vendorAuth } = await supabase.auth.admin.getUserById(vendor_user_id);
        const vendorEmail = vendorAuth?.user?.email || '';
        const vendorName = vendorAuth?.user?.user_metadata?.full_name || 'Vendor';

        // 4. Send approval email via Resend
        const resendKey = Deno.env.get('RESEND_API_KEY');
        if (resendKey && vendorEmail) {
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: 'S-Network <noreply@snetwork.app>',
                    to: [vendorEmail],
                    subject: 'Your S-Network account has been approved!',
                    html: `<h2>Welcome to S-Network!</h2>
                 <p>Dear ${vendorName},</p>
                 <p>Congratulations! Your vendor account${biz ? ' for <strong>' + biz.name + '</strong>' : ''} has been approved.</p>
                 <p>You can now log in and start receiving leads.</p>
                 <p>— S-Network Team</p>`
                })
            });

            await supabase.from('email_notifications').insert({
                recipient_id: vendor_user_id, recipient_email: vendorEmail,
                email_type: 'vendor_approved', subject: 'Account approved'
            });
        }

        // 5. Send in-app notification
        await supabase.from('notifications').insert({
            user_id: vendor_user_id,
            title: '🎉 Account Approved!',
            body: 'Your S-Network vendor account has been approved. You can now log in and start receiving leads.',
            type: 'vendor_approved'
        });

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
