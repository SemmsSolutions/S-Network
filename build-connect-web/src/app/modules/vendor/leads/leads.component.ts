import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Lead } from '../../../shared/models/lead.model';

@Component({
  selector: 'app-leads-inbox',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <h1 class="text-3xl font-heading font-bold text-primary mb-6 tracking-wide">Leads Inbox</h1>
      
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <ul class="divide-y divide-gray-100">
          <li *ngFor="let lead of leads" (click)="openDetail(lead)" 
              class="p-4 hover:bg-gray-50 cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-3 mb-1">
                <span class="font-bold text-lg text-gray-800">{{lead.user_name || 'Anonymous User'}}</span>
                <span class="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest" 
                      [ngClass]="{
                        'bg-blue-100 text-blue-700': lead.status === 'new',
                        'bg-yellow-100 text-yellow-700': lead.status === 'contacted',
                        'bg-green-100 text-success': lead.status === 'converted',
                        'bg-red-100 text-secondary': lead.status === 'lost'
                      }">
                  {{ lead.status }}
                </span>
              </div>
              <p class="text-sm font-medium text-gray-500">{{lead.project_type}} &bull; {{lead.created_at | date:'shortDate'}}</p>
            </div>
            <div class="text-right flex-shrink-0">
               <p class="font-bold text-primary text-lg">{{lead.budget_max ? '₹' + lead.budget_max : 'No Budget Set'}}</p>
            </div>
          </li>
          <li *ngIf="leads.length === 0" class="p-8 text-center text-gray-500 font-medium">No leads found.</li>
        </ul>
      </div>

      <!-- Lead Detail Drawer (Overlay) -->
      <div *ngIf="selectedLead" class="fixed inset-0 z-50 flex justify-end bg-secondary bg-opacity-40 backdrop-blur-sm transition-opacity">
        <div class="bg-white w-full md:w-[450px] h-full shadow-2xl flex flex-col animate-slide-in-right">
          <div class="bg-primary text-white p-6 flex justify-between items-center shrink-0 shadow-md">
            <h2 class="text-xl font-heading font-bold tracking-wide">Quote Request Detail</h2>
            <button (click)="closeDetail()" class="text-white hover:opacity-70 text-2xl font-bold transition">✕</button>
          </div>
          
          <div class="p-6 overflow-y-auto flex-1 space-y-8 font-body">
            <div>
              <p class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 border-b border-gray-100 pb-1">Client Info</p>
              <h3 class="text-xl font-bold text-gray-800 mt-2">{{selectedLead.user_name || 'Anonymous'}}</h3>
              <div class="mt-2 flex flex-wrap gap-3">
                <a *ngIf="selectedLead.user_phone" [href]="'tel:' + selectedLead.user_phone" class="flex items-center gap-2 bg-primary text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-opacity-90 transition">
                  📞 {{selectedLead.user_phone}}
                </a>
                <a *ngIf="selectedLead.user_phone" [href]="'https://wa.me/' + selectedLead.user_phone.replace('+', '')" target="_blank" class="flex items-center gap-2 bg-green-500 text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-opacity-90 transition">
                  💬 WhatsApp
                </a>
              </div>
              <p *ngIf="selectedLead.user_email" class="text-sm text-gray-500 font-medium mt-2">📧 {{selectedLead.user_email}}</p>
            </div>
            
            <div>
              <p class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 border-b border-gray-100 pb-1">Project Details</p>
              <div class="mt-2 space-y-1">
                <p class="font-medium text-gray-800"><span class="font-bold w-20 inline-block">Type:</span> {{selectedLead.project_type}}</p>
                <p class="font-medium text-gray-800"><span class="font-bold w-20 inline-block">Budget:</span> ₹{{selectedLead.budget_min}} - ₹{{selectedLead.budget_max}}</p>
                <p class="font-medium text-gray-800"><span class="font-bold w-20 inline-block">Timeline:</span> {{selectedLead.timeline || 'Not specified'}}</p>
              </div>
            </div>

            <div>
              <p class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-100 pb-1">Message</p>
              <div class="bg-surface p-4 rounded-lg border border-gray-200 mt-2">
                <p class="text-gray-700 whitespace-pre-wrap font-medium">{{selectedLead.message}}</p>
              </div>
            </div>

            <div>
              <p class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-100 pb-1">Update Status</p>
              <div class="grid grid-cols-2 gap-3 mt-2">
                 <button (click)="updateStatus('contacted')" [class.border-transparent]="selectedLead.status !== 'contacted'" [class.border-primary]="selectedLead.status === 'contacted'" class="p-3 text-sm font-bold border-2 bg-yellow-50 text-yellow-700 rounded-lg transition hover:bg-yellow-100">Contacted</button>
                 <button (click)="updateStatus('converted')" [class.border-transparent]="selectedLead.status !== 'converted'" [class.border-primary]="selectedLead.status === 'converted'" class="p-3 text-sm font-bold border-2 bg-green-50 text-success rounded-lg transition hover:bg-green-100">Converted</button>
                 <button (click)="updateStatus('lost')" [class.border-transparent]="selectedLead.status !== 'lost'" [class.border-primary]="selectedLead.status === 'lost'" class="p-3 text-sm font-bold border-2 bg-red-50 text-secondary rounded-lg transition hover:bg-red-100">Lost</button>
              </div>
            </div>
          </div>
          
          <div class="p-6 bg-gray-50 border-t border-gray-200 shrink-0">
             <a *ngIf="selectedLead.user_phone" 
                [href]="'https://wa.me/' + selectedLead.user_phone.replace('+', '')" 
                target="_blank" 
                class="w-full flex items-center justify-center gap-2 bg-success hover:bg-opacity-90 text-white font-bold tracking-wide py-4 rounded-xl transition shadow-md font-heading text-lg">
               💬 WhatsApp User
             </a>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    .animate-slide-in-right { animation: slideInRight 0.3s ease-out forwards; }
  `]
})
export class LeadsInboxComponent implements OnInit {
  leads: Lead[] = [];
  selectedLead: Lead | null = null;

  constructor(private supabase: SupabaseService) { }

  async ngOnInit() {
    const { data: userData } = await this.supabase.client.auth.getUser();
    if (!userData.user) return;

    // Get Business ID
    const { data: biz } = await this.supabase.client
      .from('businesses')
      .select('id')
      .eq('owner_id', userData.user.id)
      .single();

    if (biz) {
      const { data: leadsData } = await this.supabase.client
        .from('leads')
        .select('*')
        .eq('business_id', biz.id)
        .order('created_at', { ascending: false });

      if (leadsData) {
        this.leads = leadsData as unknown as Lead[];
      }
    }
  }

  openDetail(lead: Lead) {
    this.selectedLead = lead;
  }

  closeDetail() {
    this.selectedLead = null;
  }

  async updateStatus(status: 'new' | 'contacted' | 'converted' | 'lost') {
    if (!this.selectedLead) return;

    try {
      const { data, error } = await this.supabase.client.functions.invoke('update-lead-status', {
        body: { lead_id: this.selectedLead.id, status }
      });
      if (!error && data?.lead) {
        this.selectedLead.status = status;
        const idx = this.leads.findIndex(l => l.id === data.lead.id);
        if (idx !== -1) this.leads[idx].status = status;
      }
    } catch (err) {
      console.error('Error updating status', err);
    }
  }
}
