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
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        // Check admin role
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || profile.role !== 'admin') return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        const { verification_id, action, rejection_reason } = await req.json();

        if (!verification_id || !action) return new Response(JSON.stringify({ error: 'verification_id and action are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (action !== 'approve' && action !== 'reject') return new Response(JSON.stringify({ error: 'action must be approve or reject' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (action === 'reject' && (!rejection_reason || rejection_reason.trim() === '')) return new Response(JSON.stringify({ error: 'Rejection reason is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        // Get the verification record
        const { data: verification } = await supabase.from('vendor_verifications').select('*, businesses(id, name, owner_id)').eq('id', verification_id).single();
        if (!verification) return new Response(JSON.stringify({ error: 'Verification record not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        const businessId = verification.business_id;
        const vendorOwnerId = verification.businesses?.owner_id;

        if (action === 'approve') {
            await supabase.from('vendor_verifications').update({
                status: 'approved',
                reviewed_at: new Date().toISOString(),
                reviewed_by: user.id,
            }).eq('id', verification_id);

            await supabase.from('businesses').update({
                verification_status: 'verified',
                is_verified: true,
                verified_at: new Date().toISOString(),
                verification_rejection_reason: null,
            }).eq('id', businessId);

            if (vendorOwnerId) {
                await supabase.from('notifications').insert({
                    user_id: vendorOwnerId,
                    title: '🎉 Verification Approved!',
                    body: 'Your business is now Verified on S-Network. Your profile will show the Verified badge.',
                    type: 'verification_approved',
                    ref_id: businessId,
                });
            }
        } else {
            // reject
            await supabase.from('vendor_verifications').update({
                status: 'rejected',
                reviewed_at: new Date().toISOString(),
                reviewed_by: user.id,
                rejection_reason: rejection_reason,
            }).eq('id', verification_id);

            await supabase.from('businesses').update({
                verification_status: 'rejected',
                is_verified: false,
                verification_rejection_reason: rejection_reason,
            }).eq('id', businessId);

            if (vendorOwnerId) {
                await supabase.from('notifications').insert({
                    user_id: vendorOwnerId,
                    title: 'Verification Not Approved',
                    body: `Your verification was not approved. Reason: ${rejection_reason}. You can resubmit from Profile Settings.`,
                    type: 'verification_rejected',
                    ref_id: businessId,
                });
            }
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
