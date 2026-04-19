import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { SupabaseService } from '../../../core/services/supabase.service';
import { VerificationService, VendorVerification } from '../../../core/services/verification.service';

@Component({
  selector: 'app-admin-verifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <h1 class="text-3xl font-heading font-bold text-primary mb-2">Vendor Verifications</h1>
      
      <div class="flex gap-4 mb-6">
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-4 flex-1 text-center">
          <div class="text-2xl font-bold text-orange-600">{{pendingCount}}</div>
          <div class="text-sm text-gray-600 font-bold">Pending</div>
        </div>
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 flex-1 text-center">
          <div class="text-2xl font-bold text-green-600">{{approvedCount}}</div>
          <div class="text-sm text-gray-600 font-bold">Approved</div>
        </div>
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 flex-1 text-center">
          <div class="text-2xl font-bold text-red-600">{{rejectedCount}}</div>
          <div class="text-sm text-gray-600 font-bold">Rejected</div>
        </div>
      </div>

      <div class="flex gap-2 mb-6 border-b border-gray-200">
        <button *ngFor="let tab of tabs" (click)="activeTab = tab; loadData()" 
                [class.border-primary]="activeTab === tab" [class.text-primary]="activeTab === tab"
                [class.border-transparent]="activeTab !== tab" [class.text-gray-500]="activeTab !== tab"
                class="px-4 py-2 font-bold border-b-2 transition">
          {{tab | titlecase}}
        </button>
      </div>

      <div *ngIf="loading" class="text-center py-12"><div class="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto"></div></div>

      <table *ngIf="!loading && verifications.length > 0" class="w-full text-sm">
        <thead>
          <tr class="bg-gray-50 text-left">
            <th class="p-3 font-bold">Business</th>
            <th class="p-3 font-bold">Vendor</th>
            <th class="p-3 font-bold">GST No</th>
            <th class="p-3 font-bold">MSME No</th>
            <th class="p-3 font-bold">Submitted</th>
            <th class="p-3 font-bold">Attempts</th>
            <th class="p-3 font-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let v of verifications" class="border-b border-gray-100 hover:bg-gray-50">
            <td class="p-3 font-bold">{{v.businesses?.name || '—'}}</td>
            <td class="p-3">{{v.businesses?.ownerProfile?.name || '—'}}</td>
            <td class="p-3 font-mono text-xs">{{v.gst_number || '—'}}</td>
            <td class="p-3 font-mono text-xs">{{v.msme_number || '—'}}</td>
            <td class="p-3">{{v.submitted_at | date:'mediumDate'}}</td>
            <td class="p-3 text-center">{{v.submission_count}}</td>
            <td class="p-3">
              <button (click)="openDetail(v)" class="bg-primary text-white px-3 py-1 rounded text-xs font-bold hover:bg-opacity-90 transition">View & Review</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div *ngIf="!loading && verifications.length === 0" class="text-center py-12 text-gray-400 font-bold">No verifications found.</div>

      <!-- Detail Modal -->
      <div *ngIf="selected" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" (click)="selected = null">
        <div class="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6" (click)="$event.stopPropagation()">
          <h2 class="text-xl font-heading font-bold text-primary mb-4">Verification Detail</h2>
          
          <div class="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 class="font-bold text-gray-700 mb-2">Business Info</h3>
              <p><strong>Name:</strong> {{selected.businesses?.name}}</p>
              <p><strong>City:</strong> {{selected.businesses?.city}}</p>
              <p><strong>Vendor:</strong> {{selected.businesses?.ownerProfile?.name}}</p>
              <p><strong>Attempt:</strong> #{{selected.submission_count}}</p>
            </div>
            <div>
              <h3 class="font-bold text-gray-700 mb-2 border-b pb-2">Documents</h3>
              <div *ngIf="selected.id.startsWith('no-doc')" class="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                <p class="text-yellow-800 text-sm">⚠️ This vendor has not submitted verification documents. You can still approve their account manually.</p>
              </div>

              <div *ngIf="selected.gst_number" class="mb-4 bg-gray-50 p-3 rounded">
                <p class="font-bold mb-2">GST: <span class="font-mono bg-white px-2 py-1 rounded border">{{selected.gst_number}}</span> <a href="https://www.gstn.gov.in" target="_blank" class="text-blue-600 text-xs hover:underline ml-2">Verify ↗</a></p>
                <ng-container *ngIf="selected.gst_certificate_url">
                  <img *ngIf="isImage(selected.gst_certificate_url)" [src]="selected.gst_certificate_url" class="max-w-full rounded border mt-2">
                  <iframe *ngIf="!isImage(selected.gst_certificate_url)" [src]="sanitize(selected.gst_certificate_url)" width="100%" height="200" class="border rounded mt-2"></iframe>
                  <a [href]="selected.gst_certificate_url" target="_blank" class="text-primary text-sm font-bold hover:underline block mt-2">Open document in new tab →</a>
                </ng-container>
              </div>

              <div *ngIf="selected.msme_number" class="mb-4 bg-gray-50 p-3 rounded">
                <p class="font-bold mb-2">MSME: <span class="font-mono bg-white px-2 py-1 rounded border">{{selected.msme_number}}</span> <a href="https://udyamregistration.gov.in" target="_blank" class="text-blue-600 text-xs hover:underline ml-2">Verify ↗</a></p>
                <ng-container *ngIf="selected.msme_certificate_url">
                  <img *ngIf="isImage(selected.msme_certificate_url)" [src]="selected.msme_certificate_url" class="max-w-full rounded border mt-2">
                  <iframe *ngIf="!isImage(selected.msme_certificate_url)" [src]="sanitize(selected.msme_certificate_url)" width="100%" height="200" class="border rounded mt-2"></iframe>
                  <a [href]="selected.msme_certificate_url" target="_blank" class="text-primary text-sm font-bold hover:underline block mt-2">Open document in new tab →</a>
                </ng-container>
              </div>
            </div>
          </div>

          <div *ngIf="selected.status === 'pending'" class="flex gap-3 border-t pt-4">
            <button (click)="approve()" [disabled]="actionLoading" class="bg-green-500 text-white px-6 py-2 rounded font-bold hover:bg-green-600 transition disabled:opacity-50">✅ Approve</button>
            <button (click)="showReject = true" *ngIf="!showReject" class="bg-red-500 text-white px-6 py-2 rounded font-bold hover:bg-red-600 transition">❌ Reject</button>
            <div *ngIf="showReject" class="flex-1 flex gap-2">
              <input [(ngModel)]="rejectReason" placeholder="Rejection reason (required)" class="flex-1 border border-gray-300 rounded px-3 py-2 text-sm">
              <button (click)="reject()" [disabled]="actionLoading || !rejectReason" class="bg-red-600 text-white px-4 py-2 rounded font-bold text-sm disabled:opacity-50">Confirm Reject</button>
            </div>
          </div>

          <div *ngIf="selected.status === 'approved'" class="border-t pt-4 text-green-600 font-bold">✅ Approved</div>
          <div *ngIf="selected.status === 'rejected'" class="border-t pt-4 text-red-600 font-bold">❌ Rejected: {{selected.rejection_reason}}</div>

          <button (click)="selected = null" class="mt-4 text-gray-400 hover:text-gray-600 text-sm font-bold">Close</button>
        </div>
      </div>
    </div>
  `
})
export class AdminVerificationsComponent implements OnInit {
  tabs = ['all', 'pending', 'approved', 'rejected'];
  activeTab = 'pending';
  verifications: VendorVerification[] = [];
  loading = true;
  selected: VendorVerification | null = null;
  showReject = false;
  rejectReason = '';
  actionLoading = false;
  pendingCount = 0;
  approvedCount = 0;
  rejectedCount = 0;

  constructor(
    private verificationService: VerificationService,
    private supabase: SupabaseService,
    private domSanitizer: DomSanitizer
  ) { }

  ngOnInit() { this.loadData(); this.loadCounts(); }

  isImage(url: string | undefined | null): boolean {
    return /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(url || '');
  }

  sanitize(url: string | undefined | null) {
    return this.domSanitizer.bypassSecurityTrustResourceUrl(url || '');
  }

  async loadData() {
    this.loading = true;

    if (this.activeTab === 'pending') {
      // Custom cross-reference logic to include pending vendors without docs
      const { data: pendingProfiles } = await this.supabase.client
        .from('profiles').select('id, name, phone').eq('role', 'pending_vendor');

      const pendingIds = pendingProfiles?.map(p => p.id) ?? [];
      const { data: businesses } = await this.supabase.client
        .from('businesses').select('id, name, city, owner_id, created_at')
        .in('owner_id', pendingIds.length ? pendingIds : ['no-match']);

      const bizIds = businesses?.map(b => b.id) ?? [];
      const { data: verifications } = await this.supabase.client
        .from('vendor_verifications').select('*')
        .in('business_id', bizIds.length ? bizIds : ['no-match']);

      const verifMap: Record<string, any> = {};
      verifications?.forEach(v => verifMap[v.business_id] = v);
      const profileMap: Record<string, any> = {};
      pendingProfiles?.forEach(p => profileMap[p.id] = p);

      this.verifications = (businesses ?? []).map(biz => {
        const doc = verifMap[biz.id];
        return {
          id: doc?.id || ('no-doc-' + biz.id),
          business_id: biz.id,
          gst_number: doc?.gst_number || null,
          msme_number: doc?.msme_number || null,
          gst_certificate_url: doc?.gst_certificate_url || null,
          msme_certificate_url: doc?.msme_certificate_url || null,
          status: 'pending',
          submitted_at: doc?.submitted_at || biz.created_at,
          submission_count: doc?.submission_count || 0,
          businesses: {
            name: biz.name,
            city: biz.city,
            owner_id: biz.owner_id,
            ownerProfile: { name: profileMap[biz.owner_id]?.name, phone: profileMap[biz.owner_id]?.phone }
          }
        } as any;
      });
    } else {
      const status = this.activeTab === 'all' ? undefined : this.activeTab;
      this.verifications = await this.verificationService.getAllVerifications(status);
    }
    this.loading = false;
  }

  async loadCounts() {
    const all = await this.verificationService.getAllVerifications();
    this.pendingCount = all.filter(v => v.status === 'pending').length;
    this.approvedCount = all.filter(v => v.status === 'approved').length;
    this.rejectedCount = all.filter(v => v.status === 'rejected').length;
  }

  openDetail(v: VendorVerification) {
    this.selected = v;
    this.showReject = false;
    this.rejectReason = '';
  }

  async approve() {
    if (!this.selected) return;
    this.actionLoading = true;
    try {
      if (this.selected.id.startsWith('no-doc')) {
        // Manual override for missing docs
        await this.supabase.client.from('profiles').update({ role: 'vendor' }).eq('id', (this.selected as any).businesses.owner_id);
        await this.supabase.client.from('businesses').update({ is_verified: true }).eq('id', this.selected.business_id);
      } else {
        await this.verificationService.reviewVerification(this.selected.id, 'approve');
      }
      this.selected = null;
      await this.loadData();
      await this.loadCounts();
    } catch (e) { console.error(e); }
    this.actionLoading = false;
  }

  async reject() {
    if (!this.selected || !this.rejectReason) return;
    this.actionLoading = true;
    try {
      await this.verificationService.reviewVerification(this.selected.id, 'reject', this.rejectReason);
      this.selected = null;
      await this.loadData();
      await this.loadCounts();
    } catch (e) { console.error(e); }
    this.actionLoading = false;
  }
}
