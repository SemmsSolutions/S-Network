import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-admin-leads',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="p-6">
      <h1 class="text-3xl font-heading font-bold text-primary mb-6">Lead Monitoring</h1>

      <!-- Stats -->
      <div class="grid grid-cols-5 gap-4 mb-6">
        <div class="bg-gray-50 rounded-lg p-4 text-center"><div class="text-2xl font-bold text-gray-700">{{leads.length}}</div><div class="text-xs text-gray-500 font-bold">Total</div></div>
        <div class="bg-blue-50 rounded-lg p-4 text-center"><div class="text-2xl font-bold text-blue-600">{{statusCount('new')}}</div><div class="text-xs text-gray-500 font-bold">New</div></div>
        <div class="bg-yellow-50 rounded-lg p-4 text-center"><div class="text-2xl font-bold text-yellow-600">{{statusCount('contacted')}}</div><div class="text-xs text-gray-500 font-bold">Contacted</div></div>
        <div class="bg-green-50 rounded-lg p-4 text-center"><div class="text-2xl font-bold text-green-600">{{statusCount('converted')}}</div><div class="text-xs text-gray-500 font-bold">Converted</div></div>
        <div class="bg-purple-50 rounded-lg p-4 text-center"><div class="text-2xl font-bold text-purple-600">{{conversionRate}}%</div><div class="text-xs text-gray-500 font-bold">Rate</div></div>
      </div>

      <!-- Filters -->
      <div class="flex gap-3 mb-4 flex-wrap">
        <select [(ngModel)]="filterStatus" (change)="applyFilters()" class="border border-gray-300 rounded px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
        <input [(ngModel)]="filterSearch" (input)="applyFilters()" placeholder="Search vendor or user..." class="border border-gray-300 rounded px-3 py-2 text-sm flex-1">
      </div>

      <table class="w-full text-sm">
        <thead><tr class="bg-gray-50 text-left">
          <th class="p-3 font-bold">Vendor</th><th class="p-3 font-bold">Customer Name</th><th class="p-3 font-bold">Customer Phone</th><th class="p-3 font-bold">Project</th>
          <th class="p-3 font-bold">Budget</th><th class="p-3 font-bold">City</th><th class="p-3 font-bold">Status</th><th class="p-3 font-bold">Date</th><th class="p-3 font-bold">Actions</th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let l of filteredLeads" class="border-b border-gray-50 hover:bg-gray-50">
            <td class="p-3 font-bold">{{l.businesses?.name || '—'}}</td>
            <td class="p-3">{{l.user_name || '—'}}</td>
            <td class="p-3">{{l.user_phone || '—'}}</td>
            <td class="p-3">{{l.project_type || '—'}}</td>
            <td class="p-3 font-mono">{{l.budget_min || l.budget_max ? '₹' + (l.budget_min || 0) + '–₹' + (l.budget_max || 0) : '—'}}</td>
            <td class="p-3">{{l.businesses?.city || '—'}}</td>
            <td class="p-3"><span class="px-2 py-1 rounded text-xs font-bold"
              [class.bg-blue-100]="l.status==='new'" [class.text-blue-700]="l.status==='new'"
              [class.bg-yellow-100]="l.status==='contacted'" [class.text-yellow-700]="l.status==='contacted'"
              [class.bg-green-100]="l.status==='converted'" [class.text-green-700]="l.status==='converted'"
              [class.bg-red-100]="l.status==='lost'" [class.text-red-700]="l.status==='lost'"
            >{{l.status}}</span></td>
            <td class="p-3 text-xs text-gray-500">{{l.created_at | date:'short'}}</td>
            <td class="p-3"><button (click)="openDetail(l)" class="bg-primary text-white px-3 py-1 text-xs rounded hover:bg-opacity-90 font-bold">View</button></td>
          </tr>
        </tbody>
      </table>
      <div *ngIf="filteredLeads.length === 0" class="text-center py-8 text-gray-400 font-bold">No leads found.</div>

      <!-- Detail Modal -->
      <div *ngIf="selectedLead" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" (click)="selectedLead = null">
        <div class="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6" (click)="$event.stopPropagation()">
          <div class="flex justify-between items-center mb-6 border-b pb-4">
            <h2 class="text-2xl font-heading font-bold text-primary">Lead Detail</h2>
            <button (click)="selectedLead = null" class="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
          </div>
          
          <div class="grid grid-cols-2 gap-6 mb-6">
            <!-- Customer Details -->
            <div class="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 class="font-bold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">👤 Customer Details</h3>
              <p class="mb-2"><strong>Name:</strong> {{selectedLead.user_name || '—'}}</p>
              <p class="mb-2"><strong>Phone:</strong> 
                <a *ngIf="selectedLead.user_phone" [href]="'tel:' + selectedLead.user_phone" class="text-primary hover:underline font-mono">{{selectedLead.user_phone}}</a>
                <span *ngIf="!selectedLead.user_phone">—</span>
              </p>
              <p class="mb-2"><strong>Email:</strong> 
                <a *ngIf="selectedLead.user_email" [href]="'mailto:' + selectedLead.user_email" class="text-primary hover:underline">{{selectedLead.user_email}}</a>
                <span *ngIf="!selectedLead.user_email">—</span>
              </p>
              <p class="mb-2"><strong>City:</strong> {{selectedLead.user_city || '—'}}</p>
              <p class="mt-3 text-xs p-2 rounded" [class.bg-blue-100]="selectedLead.user_id" [class.text-blue-800]="selectedLead.user_id" [class.bg-orange-100]="!selectedLead.user_id" [class.text-orange-800]="!selectedLead.user_id">
                <strong>Account:</strong> {{selectedLead.user_id ? 'Registered User' : 'Anonymous Guest Enquiry'}}
              </p>
            </div>

            <!-- Vendor Details -->
            <div class="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 class="font-bold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">🏢 Vendor Details</h3>
              <p class="mb-2"><strong>Business Name:</strong> <a [routerLink]="['/business', selectedLead.businesses?.id]" target="_blank" class="text-primary hover:underline">{{selectedLead.businesses?.name}}</a></p>
              <p class="mb-2"><strong>City:</strong> {{selectedLead.businesses?.city}}</p>
              <p class="mb-2"><strong>Owner Name:</strong> {{selectedLead.businesses?.profiles?.name || '—'}}</p>
              <p class="mb-2"><strong>Owner Phone:</strong> 
                <a *ngIf="selectedLead.businesses?.profiles?.phone" [href]="'tel:' + selectedLead.businesses?.profiles?.phone" class="text-primary hover:underline font-mono">{{selectedLead.businesses?.profiles?.phone}}</a>
                <span *ngIf="!selectedLead.businesses?.profiles?.phone">—</span>
              </p>
            </div>
          </div>

          <!-- Lead Info -->
          <div class="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
            <h3 class="font-bold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">📋 Enquiry Request</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <p><strong>Project Type:</strong> {{selectedLead.project_type || '—'}}</p>
              <p><strong>Budget Range:</strong> <span class="font-mono bg-white px-2 py-1 rounded border">{{selectedLead.budget_min || selectedLead.budget_max ? '₹' + (selectedLead.budget_min || 0) + ' – ₹' + (selectedLead.budget_max || 0) : 'Not specified'}}</span></p>
              <p><strong>Timeline:</strong> {{selectedLead.timeline || '—'}}</p>
              <p><strong>Date Submitted:</strong> {{selectedLead.created_at | date:'medium'}}</p>
              <div class="col-span-2 mt-2">
                <p><strong>Message / Description:</strong></p>
                <div class="bg-white p-3 rounded border border-gray-200 mt-1 whitespace-pre-wrap">{{selectedLead.message || 'No additional message provided.'}}</div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="border-t pt-4 flex gap-4 items-start">
             <div class="flex-1">
               <label class="block text-sm font-bold text-gray-700 mb-1">Admin Note (Internal only)</label>
               <textarea [(ngModel)]="selectedLead.admin_note" (blur)="saveAdminNote()" placeholder="Add internal notes about this lead..." rows="2" class="w-full border border-gray-300 rounded p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"></textarea>
               <span *ngIf="noteSaved" class="text-xs text-green-600 font-bold mt-1 inline-block">✓ Saved</span>
             </div>
             <div>
               <label class="block text-sm font-bold text-gray-700 mb-1">Override Status</label>
               <select [(ngModel)]="selectedLead.status" (change)="updateLeadStatus($event)" class="border border-gray-300 rounded px-3 py-2 text-sm bg-white cursor-pointer hover:border-gray-400">
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
               </select>
             </div>
          </div>
          
        </div>
      </div>
    </div>
  `
})
export class AdminLeadsComponent implements OnInit {
  leads: any[] = [];
  filteredLeads: any[] = [];
  filterStatus = '';
  filterSearch = '';
  selectedLead: any = null;
  noteSaved = false;

  constructor(private supabase: SupabaseService) { }

  async ngOnInit() {
    const { data } = await this.supabase.client.from('leads')
      .select(`
        id, project_type, message, budget_min, budget_max, timeline,
        status, type, created_at, admin_note,
        user_id, user_name, user_phone, user_email, user_city,
        businesses!inner(id, name, city, owner_id,
          profiles:owner_id(name, phone)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(200);
    this.leads = data || [];
    this.filteredLeads = this.leads;
  }

  statusCount(status: string): number { return this.leads.filter(l => l.status === status).length; }
  get conversionRate(): string {
    if (!this.leads.length) return '0';
    return ((this.statusCount('converted') / this.leads.length) * 100).toFixed(1);
  }

  applyFilters() {
    let r = this.leads;
    if (this.filterStatus) r = r.filter(l => l.status === this.filterStatus);
    if (this.filterSearch) {
      const q = this.filterSearch.toLowerCase();
      r = r.filter(l => l.businesses?.name?.toLowerCase().includes(q) || l.user_name?.toLowerCase().includes(q));
    }
    this.filteredLeads = r;
  }

  openDetail(lead: any) {
    this.selectedLead = lead;
    this.noteSaved = false;
  }

  async saveAdminNote() {
    if (!this.selectedLead) return;
    this.noteSaved = false;
    await this.supabase.client.from('leads')
      .update({ admin_note: this.selectedLead.admin_note })
      .eq('id', this.selectedLead.id);
    this.noteSaved = true;
    setTimeout(() => this.noteSaved = false, 2000);
  }

  async updateLeadStatus(event: any) {
    if (!this.selectedLead) return;
    const newStatus = event.target.value;
    await this.supabase.client.functions.invoke('update-lead-status', {
      body: { leadId: this.selectedLead.id, status: newStatus }
    });
  }
}
