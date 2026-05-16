import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
          <div class="text-sm text-gray-600 font-bold">Pending Accounts</div>
        </div>
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 flex-1 text-center">
          <div class="text-2xl font-bold text-green-600">{{approvedCount}}</div>
          <div class="text-sm text-gray-600 font-bold">Approved Docs</div>
        </div>
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 flex-1 text-center">
          <div class="text-2xl font-bold text-red-600">{{rejectedCount}}</div>
          <div class="text-sm text-gray-600 font-bold">Rejected Docs</div>
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

      <div *ngIf="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto"></div>
      </div>

      <!-- Pending Vendor Accounts Panel (all + pending tabs) -->
      <div *ngIf="!loading && (activeTab === 'all' || activeTab === 'pending')" class="space-y-3">
        <div *ngFor="let item of filteredVendors()"
             class="bg-white rounded-xl border border-gray-200 p-4 flex flex-col md:flex-row md:items-center gap-4 shadow-sm">
          <div class="flex-1">
            <div class="font-bold text-gray-900">{{ item.profile.name }}</div>
            <div class="text-sm text-gray-500">
              {{ item.business?.name ?? 'No business created yet' }}
              &bull; {{ item.profile.created_at | date:'mediumDate' }}
            </div>
            <div class="text-xs text-gray-400 font-mono mt-1">{{ item.profile.phone }}</div>
          </div>
          <div>
            <span class="inline-block text-xs font-bold px-3 py-1 rounded-full"
                  [class.bg-gray-100]="item.docStatus === 'not_submitted'"
                  [class.text-gray-700]="item.docStatus === 'not_submitted'"
                  [class.bg-yellow-100]="item.docStatus === 'pending'"
                  [class.text-yellow-800]="item.docStatus === 'pending'"
                  [class.bg-green-100]="item.docStatus === 'approved'"
                  [class.text-green-800]="item.docStatus === 'approved'"
                  [class.bg-red-100]="item.docStatus === 'rejected'"
                  [class.text-red-800]="item.docStatus === 'rejected'">
              {{ item.docStatus === 'not_submitted' ? '📄 No Documents' :
                 item.docStatus === 'pending'       ? '🕐 Docs Pending Review' :
                 item.docStatus === 'approved'      ? '✅ Docs Approved' :
                                                     '❌ Docs Rejected' }}
            </span>
          </div>
          <div class="flex gap-2">
            <button class="bg-green-500 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-600 transition disabled:opacity-50"
                    (click)="approveVendorAccount(item)"
                    [disabled]="item.approving">
              {{ item.approving ? '...' : '✅ Approve Account' }}
            </button>
            <button class="bg-red-500 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-red-600 transition"
                    (click)="openRejectModal(item)">
              Reject
            </button>
            <button *ngIf="item.verification"
                    class="border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-50 transition"
                    (click)="openDetail(item.verification)">
              View Docs
            </button>
          </div>
        </div>
        <div *ngIf="filteredVendors().length === 0" class="text-center py-12 text-gray-400 font-bold">
          No pending vendor registrations.
        </div>
      </div>

      <!-- Approved/Rejected: show verification docs table -->
      <table *ngIf="!loading && (activeTab === 'approved' || activeTab === 'rejected') && verifications.length > 0" class="w-full text-sm">
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

      <div *ngIf="!loading && (activeTab === 'approved' || activeTab === 'rejected') && verifications.length === 0"
           class="text-center py-12 text-gray-400 font-bold">No {{ activeTab }} verifications found.</div>

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
                <p class="font-bold mb-2">GST: <span class="font-mono bg-white px-2 py-1 rounded border">{{selected.gst_number}}</span>
                  <a href="https://www.gstn.gov.in" target="_blank" class="text-blue-600 text-xs hover:underline ml-2">Verify ↗</a>
                </p>
                <ng-container *ngIf="selected.gst_certificate_url">
                  <img *ngIf="isImage(selected.gst_certificate_url)" [src]="selected.gst_certificate_url" class="max-w-full rounded border mt-2">
                  <iframe *ngIf="!isImage(selected.gst_certificate_url)" [src]="sanitize(selected.gst_certificate_url)" width="100%" height="200" class="border rounded mt-2"></iframe>
                  <a [href]="selected.gst_certificate_url" target="_blank" class="text-primary text-sm font-bold hover:underline block mt-2">Open document in new tab →</a>
                </ng-container>
              </div>

              <div *ngIf="selected.msme_number" class="mb-4 bg-gray-50 p-3 rounded">
                <p class="font-bold mb-2">MSME: <span class="font-mono bg-white px-2 py-1 rounded border">{{selected.msme_number}}</span>
                  <a href="https://udyamregistration.gov.in" target="_blank" class="text-blue-600 text-xs hover:underline ml-2">Verify ↗</a>
                </p>
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

      <!-- Reject Modal for pending vendor accounts -->
      <div *ngIf="rejectTarget" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" (click)="rejectTarget = null">
        <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" (click)="$event.stopPropagation()">
          <h3 class="font-bold text-lg mb-4">Reject: {{ rejectTarget.profile.name }}</h3>
          <input [(ngModel)]="rejectReason" placeholder="Rejection reason (required)" class="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-4">
          <div class="flex gap-3">
            <button (click)="confirmRejectAccount()" [disabled]="!rejectReason || actionLoading"
                    class="bg-red-600 text-white px-4 py-2 rounded font-bold disabled:opacity-50">Confirm Reject</button>
            <button (click)="rejectTarget = null" class="border border-gray-300 px-4 py-2 rounded text-gray-600">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminVerificationsComponent implements OnInit {
  tabs = ['all', 'pending', 'approved', 'rejected'];
  activeTab = 'pending';
  verifications: VendorVerification[] = [];
  // Combined pending vendor list (profiles + biz + docs)
  pendingVendors: any[] = [];
  loading = true;
  selected: VendorVerification | null = null;
  showReject = false;
  rejectReason = '';
  actionLoading = false;
  pendingCount = 0;
  approvedCount = 0;
  rejectedCount = 0;
  rejectTarget: any = null;

  constructor(
    private verificationService: VerificationService,
    private supabase: SupabaseService,
    private domSanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() { this.loadData(); this.loadCounts(); }

  isImage(url: string | undefined | null): boolean {
    return /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(url || '');
  }

  sanitize(url: string | undefined | null) {
    return this.domSanitizer.bypassSecurityTrustResourceUrl(url || '');
  }

  filteredVendors(): any[] {
    if (this.activeTab === 'all') return this.pendingVendors;
    if (this.activeTab === 'pending') return this.pendingVendors.filter(v => v.docStatus === 'pending' || v.docStatus === 'not_submitted');
    if (this.activeTab === 'approved') return this.pendingVendors.filter(v => v.docStatus === 'approved');
    if (this.activeTab === 'rejected') return this.pendingVendors.filter(v => v.docStatus === 'rejected');
    return this.pendingVendors;
  }

  async loadData() {
    this.loading = true;
    this.pendingVendors = [];
    this.verifications = [];

    try {
      if (this.activeTab === 'all' || this.activeTab === 'pending') {
        // Step 1: ALL pending_vendor profiles — this is the key fix
        const { data: pendingProfiles, error: profileError } = await this.supabase.client
          .from('profiles')
          .select('id, name, phone, role, created_at')
          .eq('role', 'pending_vendor');

        if (profileError) throw profileError;

        if (!pendingProfiles?.length) {
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        // Step 2: Get their businesses (may not exist yet)
        const profileIds = pendingProfiles.map(p => p.id);
        const { data: businesses } = await this.supabase.client
          .from('businesses')
          .select('id, name, city, category_id, owner_id, created_at')
          .in('owner_id', profileIds);

        // Step 3: Get verification documents for those businesses
        const bizIds = (businesses ?? []).map(b => b.id);
        let verifications: any[] = [];
        if (bizIds.length > 0) {
          const { data: verifs } = await this.supabase.client
            .from('vendor_verifications')
            .select('*')
            .in('business_id', bizIds);
          verifications = verifs ?? [];
        }

        // Step 4: Combine
        const bizByOwner: Record<string, any> = {};
        (businesses ?? []).forEach(b => { bizByOwner[b.owner_id] = b; });
        const verifByBiz: Record<string, any> = {};
        verifications.forEach(v => { verifByBiz[v.business_id] = v; });

        this.pendingVendors = pendingProfiles.map(profile => {
          const business = bizByOwner[profile.id];
          const verification = business ? verifByBiz[business.id] : null;
          return {
            profile,
            business: business ?? null,
            verification: verification ?? null,
            docStatus: verification?.status ?? 'not_submitted',
            approving: false
          };
        });

        this.pendingCount = this.pendingVendors.length;

      } else {
        // approved / rejected tabs — show from vendor_verifications table
        this.verifications = await this.verificationService.getAllVerifications(this.activeTab);
      }
    } catch (err) {
      console.error('Verifications load error:', err);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async loadCounts() {
    const all = await this.verificationService.getAllVerifications();
    this.approvedCount = all.filter(v => v.status === 'approved').length;
    this.rejectedCount = all.filter(v => v.status === 'rejected').length;
  }

  openDetail(v: VendorVerification) {
    this.selected = v;
    this.showReject = false;
    this.rejectReason = '';
  }

  openRejectModal(item: any) {
    this.rejectTarget = item;
    this.rejectReason = '';
  }

  async approveVendorAccount(item: any): Promise<void> {
    item.approving = true;
    try {
      const vendorUserId = item.profile.id;
      const businessId = item.business?.id ?? null;

      const { error } = await this.supabase.client.functions.invoke(
        'approve-vendor-registration',
        { body: { vendor_user_id: vendorUserId, business_id: businessId } }
      );

      if (error) throw error;

      // Remove from list immediately
      this.pendingVendors = this.pendingVendors.filter(v => v.profile.id !== vendorUserId);
      this.pendingCount = this.pendingVendors.length;
      this.cdr.detectChanges();
      alert(`${item.profile.name} has been approved!`);
    } catch (err: any) {
      alert('Approval error: ' + (err?.message ?? err));
      item.approving = false;
      this.cdr.detectChanges();
    }
  }

  async confirmRejectAccount(): Promise<void> {
    if (!this.rejectTarget || !this.rejectReason) return;
    this.actionLoading = true;
    try {
      await this.supabase.client.from('profiles')
        .update({ role: 'rejected' })
        .eq('id', this.rejectTarget.profile.id);
      this.pendingVendors = this.pendingVendors.filter(v => v.profile.id !== this.rejectTarget!.profile.id);
      this.pendingCount = this.pendingVendors.length;
      this.rejectTarget = null;
      this.rejectReason = '';
      this.cdr.detectChanges();
    } catch (err: any) {
      alert('Reject error: ' + (err?.message ?? err));
    } finally {
      this.actionLoading = false;
    }
  }

  async approve() {
    if (!this.selected) return;
    this.actionLoading = true;
    try {
      if (this.selected.id.startsWith('no-doc')) {
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
