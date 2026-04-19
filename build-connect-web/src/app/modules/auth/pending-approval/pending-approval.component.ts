import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
    selector: 'app-pending-approval',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="min-h-screen bg-surface flex items-center justify-center font-body px-4">
      <div class="max-w-lg w-full bg-white p-8 rounded-xl shadow-lg text-center">
        
        <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-100 flex items-center justify-center animate-pulse">
          <span class="text-4xl">🕐</span>
        </div>
        
        <h1 class="text-2xl font-heading font-bold text-primary mb-3">Account Under Review</h1>
        
        <p class="text-gray-600 mb-6 leading-relaxed">
          Your registration is successful. Our admin team is reviewing your documents.
          You will receive an email once your account is approved.
          <br><strong>This usually takes 1–2 business days.</strong>
        </p>

        <div *ngIf="verificationData" class="bg-gray-50 rounded-lg p-4 text-left mb-6 text-sm">
          <h3 class="font-bold text-gray-700 mb-2">Submission Details</h3>
          <p *ngIf="verificationData.businesses?.name"><strong>Business:</strong> {{verificationData.businesses?.name}}</p>
          <p *ngIf="verificationData.gst_number"><strong>GST:</strong> {{maskGst(verificationData.gst_number)}}</p>
          <p *ngIf="verificationData.msme_number"><strong>MSME:</strong> {{verificationData.msme_number}}</p>
          <p><strong>Submitted:</strong> {{verificationData.submitted_at | date:'mediumDate'}}</p>
          <p *ngIf="verificationData.status === 'rejected'" class="text-red-600 mt-2 font-bold">
            ❌ Rejected: {{verificationData.rejection_reason}}
          </p>
        </div>

        <div class="space-y-3">
          <a href="mailto:support@snetwork.app" class="block text-primary font-bold hover:underline">Contact Support</a>
          <button (click)="logout()" class="w-full py-3 px-4 border border-gray-300 rounded-md text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
            Logout
          </button>
        </div>
      </div>
    </div>
  `
})
export class PendingApprovalComponent implements OnInit {
    verificationData: any = null;

    constructor(private supabase: SupabaseService, private router: Router) { }

    async ngOnInit() {
        try {
            const { data: { user } } = await this.supabase.client.auth.getUser();
            if (!user) return;

            // Get business + verification info
            const { data: biz } = await this.supabase.client
                .from('businesses')
                .select('id, name')
                .eq('owner_id', user.id)
                .maybeSingle();

            if (biz) {
                const { data: ver } = await this.supabase.client
                    .from('vendor_verifications')
                    .select('*, businesses(name)')
                    .eq('business_id', biz.id)
                    .maybeSingle();
                this.verificationData = ver;
            }
        } catch (e) {
            console.error(e);
        }
    }

    maskGst(gst: string): string {
        if (!gst || gst.length < 6) return gst;
        return gst.substring(0, 4) + '****' + gst.substring(gst.length - 2);
    }

    async logout() {
        await this.supabase.client.auth.signOut();
        this.router.navigate(['/auth/login']);
    }
}
