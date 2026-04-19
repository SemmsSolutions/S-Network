// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const MSME_REGEX = /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/;

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

        const { business_id, gst_number, gst_certificate_url, msme_number, msme_certificate_url } = await req.json();

        if (!business_id) return new Response(JSON.stringify({ error: 'business_id is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        // Verify ownership
        const { data: biz } = await supabase.from('businesses').select('id, name, owner_id').eq('id', business_id).single();
        if (!biz || biz.owner_id !== user.id) return new Response(JSON.stringify({ error: 'You do not own this business' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        // Validate at least one document pair
        const hasGst = gst_number && gst_certificate_url;
        const hasMsme = msme_number && msme_certificate_url;
        if (!hasGst && !hasMsme) return new Response(JSON.stringify({ error: 'At least one document (GST or MSME) with certificate is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        // Validate formats
        if (gst_number && !GST_REGEX.test(gst_number)) return new Response(JSON.stringify({ error: 'Invalid GST number format' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (msme_number && !MSME_REGEX.test(msme_number)) return new Response(JSON.stringify({ error: 'Invalid MSME/Udyam number format' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        // UPSERT verification record
        const { error: upsertError } = await supabase.from('vendor_verifications').upsert({
            business_id,
            gst_number: gst_number || null,
            gst_certificate_url: gst_certificate_url || null,
            msme_number: msme_number || null,
            msme_certificate_url: msme_certificate_url || null,
            status: 'pending',
            submitted_at: new Date().toISOString(),
            rejection_reason: null,
            reviewed_at: null,
            reviewed_by: null,
        }, { onConflict: 'business_id' });

        if (upsertError) throw upsertError;

        // Increment submission_count for resubmissions
        await supabase.rpc('increment_submission_count', { bid: business_id }).maybeSingle();

        // Update business status
        await supabase.from('businesses').update({ verification_status: 'pending' }).eq('id', business_id);

        // Notify admins
        const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
        if (admins) {
            for (const admin of admins) {
                await supabase.from('notifications').insert({
                    user_id: admin.id,
                    title: 'New Verification Request',
                    body: `Business "${biz.name}" has submitted documents for verification.`,
                    type: 'verification_request',
                    ref_id: business_id,
                });
            }
        }

        return new Response(JSON.stringify({ success: true, status: 'pending' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
