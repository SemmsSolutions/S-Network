import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface VendorVerification {
    id: string;
    business_id: string;
    gst_number: string | null;
    gst_certificate_url: string | null;
    msme_number: string | null;
    msme_certificate_url: string | null;
    status: 'pending' | 'approved' | 'rejected';
    submitted_at: string;
    reviewed_at: string | null;
    reviewed_by: string | null;
    rejection_reason: string | null;
    submission_count: number;
    businesses?: any;
}

@Injectable({ providedIn: 'root' })
export class VerificationService {
    constructor(private supabase: SupabaseService) { }

    async getVerificationStatus(businessId: string): Promise<VendorVerification | null> {
        const { data } = await this.supabase.client
            .from('vendor_verifications')
            .select('*')
            .eq('business_id', businessId)
            .maybeSingle();
        return data as VendorVerification | null;
    }

    async uploadDocument(businessId: string, file: File, type: 'gst' | 'msme'): Promise<string> {
        const ext = file.name.split('.').pop();
        const path = `verifications/${businessId}/${type}-certificate.${ext}`;
        await this.supabase.client.storage.from('s-network-media').upload(path, file, { upsert: true });
        const { data } = this.supabase.client.storage.from('s-network-media').getPublicUrl(path);
        return data.publicUrl;
    }

    async submitVerification(payload: {
        business_id: string;
        gst_number?: string;
        gst_certificate_url?: string;
        msme_number?: string;
        msme_certificate_url?: string;
    }): Promise<any> {
        const { data, error } = await this.supabase.client.functions.invoke('submit-verification', { body: payload });
        if (error) throw error;
        return data;
    }

    async getAllVerifications(status?: string): Promise<VendorVerification[]> {
        let query = this.supabase.client
            .from('vendor_verifications')
            .select('*, businesses!inner(id, name, city, owner_id)')
            .order('submitted_at', { ascending: false });
        if (status) query = query.eq('status', status);
        const { data } = await query;
        const items = (data || []) as any[];

        // Fetch owner profiles separately (avoids PostgREST 400 on nested alias)
        for (const item of items) {
            if (item.businesses?.owner_id) {
                const { data: profile } = await this.supabase.client
                    .from('profiles')
                    .select('name, phone')
                    .eq('id', item.businesses.owner_id)
                    .maybeSingle();
                item.businesses.ownerProfile = profile;
            }
        }
        return items as VendorVerification[];
    }

    async reviewVerification(verificationId: string, action: 'approve' | 'reject', rejectionReason?: string): Promise<any> {
        const { data, error } = await this.supabase.client.functions.invoke('review-verification', {
            body: { verification_id: verificationId, action, rejection_reason: rejectionReason }
        });
        if (error) throw error;
        return data;
    }
}
