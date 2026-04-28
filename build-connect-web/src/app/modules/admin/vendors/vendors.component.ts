import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-admin-vendors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <h1 class="text-3xl font-heading font-bold text-primary mb-6">Vendor Management</h1>

      <!-- Tabs -->
      <div class="flex gap-2 mb-6 border-b border-gray-200">
        <button *ngFor="let tab of tabs" (click)="activeTab = tab; loadVendors()"
                [class.border-primary]="activeTab === tab" [class.text-primary]="activeTab === tab"
                [class.border-transparent]="activeTab !== tab" [class.text-gray-400]="activeTab !== tab"
                class="px-4 py-2 font-bold border-b-2 transition text-sm">
          {{tab === 'pending_vendor' ? 'Pending' : tab | titlecase}} ({{tabCounts[tab] || 0}})
        </button>
      </div>

      <!-- Search -->
      <input [(ngModel)]="searchQuery" (input)="loadVendors()" placeholder="Search by name, phone, city..."
             class="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary">

      <div *ngIf="loading" class="text-center py-8"><div class="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto"></div></div>

      <!-- Table -->
      <table *ngIf="!loading" class="w-full text-sm">
        <thead><tr class="bg-gray-50 text-left">
          <th class="p-3 font-bold">Business</th><th class="p-3 font-bold">Owner</th><th class="p-3 font-bold">Phone</th>
          <th class="p-3 font-bold">Status</th><th class="p-3 font-bold">Docs</th><th class="p-3 font-bold">Actions</th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let v of vendors" class="border-b border-gray-50 hover:bg-gray-50" [class.opacity-50]="!v.is_active">
            <td class="p-3">
              <div class="font-bold">{{v.name || '—'}}</div>
              <div class="text-xs text-gray-400">{{v.city}}</div>
            </td>
            <td class="p-3">{{v.profiles?.name || '—'}}</td>
            <td class="p-3 font-mono text-xs">{{v.profiles?.phone || '—'}}</td>
            <td class="p-3">
              <span *ngIf="!v.is_active" class="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">Disabled</span>
              <span *ngIf="v.is_active && !v.accepts_leads" class="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">No Leads</span>
              <span *ngIf="v.is_active && v.accepts_leads && v.profiles?.role === 'vendor'" class="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">Active</span>
              <span *ngIf="v.profiles?.role === 'pending_vendor'" class="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">Pending</span>
            </td>
            <td class="p-3">
              <span *ngIf="v.vendor_verifications?.[0]?.gst_number" class="text-green-600 text-xs font-bold mr-1">GST✓</span>
              <span *ngIf="v.vendor_verifications?.[0]?.msme_number" class="text-green-600 text-xs font-bold">MSME✓</span>
              <span *ngIf="!v.vendor_verifications?.[0]?.gst_number && !v.vendor_verifications?.[0]?.msme_number" class="text-gray-400 text-xs">None</span>
            </td>
            <td class="p-3">
              <button (click)="openDetail(v)" class="bg-primary text-white px-3 py-1 rounded text-xs font-bold hover:bg-opacity-90">Manage</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div *ngIf="!loading && vendors.length === 0" class="text-center py-8 text-gray-400 font-bold">No vendors found.</div>

      <!-- Detail / Management Modal -->
      <div *ngIf="selectedVendor" class="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50" (click)="selectedVendor = null">
        <div class="bg-white w-full max-w-xl h-full overflow-y-auto shadow-2xl" (click)="$event.stopPropagation()">
          <div class="bg-gray-900 text-white p-6">
            <button (click)="selectedVendor = null" class="float-right text-gray-400 hover:text-white text-xl font-bold">✕</button>
            <h2 class="text-xl font-heading font-bold">{{selectedVendor.name}}</h2>
            <p class="text-gray-400 text-sm">{{selectedVendor.city}} • Role: <span class="font-bold text-yellow-400">{{selectedVendor.profiles?.role}}</span></p>
          </div>
          
          <div class="p-6 space-y-6">
            <!-- Vendor Info -->
            <div>
              <h3 class="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3">Business Info</h3>
              <div class="space-y-2 text-sm">
                <div><strong>Category:</strong> {{selectedVendor.categories?.name}}</div>
                <div><strong>Address:</strong> {{selectedVendor.address}}</div>
                <div class="text-gray-500 leading-relaxed">{{selectedVendor.description}}</div>
              </div>
            </div>
            
            <!-- Owner Info -->
            <div class="border-t pt-4">
              <h3 class="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3">Owner</h3>
              <div class="space-y-2 text-sm">
                <div><strong>Name:</strong> {{selectedVendor.profiles?.name}}</div>
                <div><strong>Phone:</strong> {{selectedVendor.profiles?.phone}}</div>
              </div>
            </div>

            <!-- Documents -->
            <div class="border-t pt-4">
              <h3 class="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3">Verification Documents</h3>
              <div *ngIf="selectedVendor.vendor_verifications?.[0] as ver" class="space-y-3 text-sm">
                <div *ngIf="ver.gst_number">
                  <span class="font-bold">GST:</span> <code class="bg-gray-100 px-2 py-0.5 rounded text-xs ml-1">{{ver.gst_number}}</code>
                  <a *ngIf="ver.gst_certificate_url" [href]="ver.gst_certificate_url" target="_blank" class="text-primary text-xs font-bold ml-2">View →</a>
                </div>
                <div *ngIf="ver.msme_number">
                  <span class="font-bold">MSME:</span> <code class="bg-gray-100 px-2 py-0.5 rounded text-xs ml-1">{{ver.msme_number}}</code>
                  <a *ngIf="ver.msme_certificate_url" [href]="ver.msme_certificate_url" target="_blank" class="text-primary text-xs font-bold ml-2">View →</a>
                </div>
                <div *ngIf="!ver.gst_number && !ver.msme_number" class="text-gray-400">No documents submitted.</div>
              </div>
              <div *ngIf="!selectedVendor.vendor_verifications?.length" class="text-gray-400 text-sm">No verification record.</div>
            </div>

            <!-- Approval Actions -->
            <div *ngIf="selectedVendor.profiles?.role === 'pending_vendor'" class="border-t pt-4">
              <h3 class="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3">Registration Approval</h3>
              <div class="flex gap-3">
                <button (click)="approveVendor(selectedVendor)" [disabled]="actionLoading" class="flex-1 bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition disabled:opacity-50">✅ Approve Vendor</button>
                <button (click)="rejectRegistration()" class="flex-1 bg-red-500 text-white py-3 rounded-lg font-bold hover:bg-red-600 transition">❌ Reject</button>
              </div>
            </div>

            <!-- ⭐ Admin Controls (for active vendors) -->
            <div class="border-t pt-4">
              <h3 class="text-xs uppercase tracking-widest font-bold text-gray-400 mb-4">🛠 Admin Controls</h3>
              <div class="space-y-4">
            
                <!-- Toggle: Account Active -->
                <div class="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
                  <div>
                    <p class="font-bold text-sm">Account Enabled</p>
                    <p class="text-xs text-gray-500">If OFF, vendor cannot log in or access the portal.</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" [checked]="selectedVendor.is_active !== false" (change)="toggleField('is_active', $event)" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                <!-- Toggle: Accept Leads -->
                <div class="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
                  <div>
                    <p class="font-bold text-sm">Accepting Leads</p>
                    <p class="text-xs text-gray-500">If OFF, "Request Quote" is hidden on their profile.</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" [checked]="selectedVendor.accepts_leads !== false" (change)="toggleField('accepts_leads', $event)" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                <!-- Toggle: Visible in Search -->
                <div class="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
                  <div>
                    <p class="font-bold text-sm">Visible in Search</p>
                    <p class="text-xs text-gray-500">If OFF, business is hidden from all user searches.</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" [checked]="selectedVendor.is_active !== false" (change)="toggleField('is_active', $event)" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-secondary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                <!-- Toggle: Premium -->
                <div class="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
                  <div>
                    <p class="font-bold text-sm">⭐ Premium Status</p>
                    <p class="text-xs text-gray-500">Mark as premium — appears higher in search and gets a badge.</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" [checked]="selectedVendor.is_premium" (change)="toggleField('is_premium', $event)" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-yellow-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                <!-- Admin Note -->
                <div class="bg-gray-50 p-4 rounded-lg border">
                  <label class="block font-bold text-sm mb-2">Admin Note (Internal)</label>
                  <textarea [(ngModel)]="adminNote" rows="2" placeholder="Private admin note about this vendor..." class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"></textarea>
                  <button (click)="saveAdminNote()" class="mt-2 bg-primary text-white px-4 py-2 rounded font-bold text-sm hover:bg-opacity-90 transition">Save Note</button>
                </div>
              </div>
            </div>

            <!-- 🗑️ DANGER ZONE -->
            <div class="border-t pt-4 mt-4">
              <h3 class="text-xs uppercase tracking-widest font-bold text-red-400 mb-4">⚠️ Danger Zone</h3>
              <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-sm text-red-700 font-semibold mb-1">Delete Vendor</p>
                <p class="text-xs text-red-500 mb-3">Permanently deletes this vendor's business profile and resets their account. This cannot be undone.</p>
                <button (click)="confirmingDelete = true" [disabled]="actionLoading" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition disabled:opacity-50">
                  🗑️ Delete Vendor
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Reject Modal -->
      <div *ngIf="rejectingRegistration" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
          <h2 class="text-lg font-bold text-red-600 mb-3">Reject {{selectedVendor?.name}}?</h2>
          <textarea [(ngModel)]="rejectReason" rows="3" placeholder="Rejection reason (required)" class="w-full border border-gray-300 rounded p-3 text-sm mb-4"></textarea>
          <div class="flex gap-3">
            <button (click)="confirmReject()" [disabled]="!rejectReason || actionLoading" class="flex-1 bg-red-600 text-white py-2 rounded font-bold disabled:opacity-50">Confirm</button>
            <button (click)="rejectingRegistration = false" class="flex-1 border border-gray-300 py-2 rounded font-bold">Cancel</button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div *ngIf="confirmingDelete" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
        <div class="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border-2 border-red-200">
          <div class="text-center mb-4">
            <span class="text-5xl">🗑️</span>
          </div>
          <h2 class="text-lg font-bold text-red-600 mb-2 text-center">Delete {{selectedVendor?.name}}?</h2>
          <p class="text-sm text-gray-600 text-center mb-6">This will permanently delete the business profile and reset the user's role. <strong>This action cannot be undone.</strong></p>
          <div class="flex gap-3">
            <button (click)="deleteVendor()" [disabled]="actionLoading" class="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold disabled:opacity-50 transition">
              {{ actionLoading ? 'Deleting...' : '🗑️ Yes, Delete' }}
            </button>
            <button (click)="confirmingDelete = false" [disabled]="actionLoading" class="flex-1 border-2 border-gray-300 py-3 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminVendorsComponent implements OnInit {
  tabs = ['all', 'pending_vendor', 'vendor'];
  activeTab = 'pending_vendor';
  vendors: any[] = [];
  tabCounts: Record<string, number> = {};
  loading = true;
  searchQuery = '';
  selectedVendor: any = null;
  rejectingRegistration = false;
  confirmingDelete = false;
  rejectReason = '';
  actionLoading = false;
  adminNote = '';

  constructor(private supabase: SupabaseService) { }

  ngOnInit() { this.loadVendors(); this.loadCounts(); }

  openDetail(v: any) {
    this.selectedVendor = v;
    this.adminNote = v.admin_note || '';
  }

  async loadVendors() {
    this.loading = true;
    const { data } = await this.supabase.client.from('businesses')
      .select('*, categories(name), profiles:owner_id(id, name, phone, role), vendor_verifications(gst_number, msme_number, gst_certificate_url, msme_certificate_url, status)')
      .order('created_at', { ascending: false });

    let results = (data || []) as any[];
    if (this.activeTab === 'pending_vendor') results = results.filter(b => b.profiles?.role === 'pending_vendor');
    else if (this.activeTab === 'vendor') results = results.filter(b => b.profiles?.role === 'vendor');

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      results = results.filter(b => b.name?.toLowerCase().includes(q) || b.profiles?.name?.toLowerCase().includes(q) || b.profiles?.phone?.includes(q) || b.city?.toLowerCase().includes(q));
    }

    this.vendors = results;
    this.loading = false;
  }

  async loadCounts() {
    const { data: all } = await this.supabase.client.from('businesses').select('profiles:owner_id(role)');
    const arr = (all || []) as any[];
    this.tabCounts['all'] = arr.length;
    this.tabCounts['pending_vendor'] = arr.filter(b => b.profiles?.role === 'pending_vendor').length;
    this.tabCounts['vendor'] = arr.filter(b => b.profiles?.role === 'vendor').length;
  }

  async toggleField(field: string, event: Event) {
    if (!this.selectedVendor?.id) return;
    const checked = (event.target as HTMLInputElement).checked;
    const update: any = {};
    update[field] = checked;
    await this.supabase.client.from('businesses').update(update).eq('id', this.selectedVendor.id);
    this.selectedVendor[field] = checked;
    await this.loadVendors();
  }

  async saveAdminNote() {
    if (!this.selectedVendor?.id) return;
    await this.supabase.client.from('businesses').update({ admin_note: this.adminNote }).eq('id', this.selectedVendor.id);
    this.selectedVendor.admin_note = this.adminNote;
  }

  async approveVendor(v: any) {
    if (!v.profiles?.id) return;
    this.actionLoading = true;
    try {
      await this.supabase.client.functions.invoke('approve-vendor-registration', { body: { vendor_user_id: v.profiles.id } });
      this.selectedVendor = null;
      await this.loadVendors(); await this.loadCounts();
    } catch (e) { console.error(e); }
    this.actionLoading = false;
  }

  rejectRegistration() { this.rejectingRegistration = true; this.rejectReason = ''; }

  async confirmReject() {
    if (!this.selectedVendor?.profiles?.id || !this.rejectReason) return;
    this.actionLoading = true;
    try {
      await this.supabase.client.functions.invoke('reject-vendor-registration', { body: { vendor_user_id: this.selectedVendor.profiles.id, rejection_reason: this.rejectReason } });
      this.rejectingRegistration = false;
      this.selectedVendor = null;
      await this.loadVendors(); await this.loadCounts();
    } catch (e) { console.error(e); }
    this.actionLoading = false;
  }

  async deleteVendor() {
    if (!this.selectedVendor?.id) return;
    this.actionLoading = true;
    try {
      // 1. Delete the business record
      const { error: bizErr } = await this.supabase.client.from('businesses').delete().eq('id', this.selectedVendor.id);
      if (bizErr) throw bizErr;

      // 2. Reset the user's role to 'user' so they are not orphaned
      if (this.selectedVendor.profiles?.id) {
        await this.supabase.client.from('profiles').update({ role: 'user' }).eq('id', this.selectedVendor.profiles.id);
      }

      this.confirmingDelete = false;
      this.selectedVendor = null;
      await this.loadVendors();
      await this.loadCounts();
    } catch (e: any) {
      console.error(e);
      alert('Error deleting vendor: ' + e.message);
    } finally {
      this.actionLoading = false;
    }
  }
}
