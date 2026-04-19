import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-pending-vendors',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-6xl">
      <h1 class="text-3xl font-heading font-bold text-gray-900 mb-6 tracking-wide">Pending Approvals</h1>
      
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-widest text-gray-500 font-bold">
              <th class="p-4">Business Name</th>
              <th class="p-4">Location</th>
              <th class="p-4">Contact</th>
              <th class="p-4">Status</th>
              <th class="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let v of vendors" class="hover:bg-gray-50 transition">
              <td class="p-4 font-bold text-gray-800">{{v.name}}</td>
              <td class="p-4 text-gray-600">{{v.city}}</td>
              <td class="p-4 text-gray-600">{{v.phone || v.whatsapp || 'N/A'}}</td>
              <td class="p-4">
                <span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Pending</span>
              </td>
              <td class="p-4 text-right space-x-3">
                <button (click)="approve(v.id)" [disabled]="isProcessing" class="bg-success hover:bg-opacity-90 text-white px-4 py-2 rounded-lg font-bold transition text-sm disabled:opacity-50">Approve</button>
                <button (click)="reject(v.id)" [disabled]="isProcessing" class="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-lg font-bold transition text-sm disabled:opacity-50">Reject</button>
              </td>
            </tr>
            <tr *ngIf="vendors.length === 0">
              <td colspan="5" class="p-12 text-center text-gray-500 font-medium">No pending vendor approvals.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class PendingVendorsComponent implements OnInit {
  vendors: any[] = [];
  isProcessing = false;

  constructor(private supabase: SupabaseService) { }

  async ngOnInit() {
    this.loadVendors();
  }

  async loadVendors() {
    const { data } = await this.supabase.client
      .from('businesses')
      .select('*')
      .eq('is_verified', false)
      .order('created_at', { ascending: true });
    if (data) this.vendors = data;
  }

  async approve(id: string) {
    if (!confirm('Are you sure you want to approve this vendor?')) return;
    this.isProcessing = true;
    try {
      const { error } = await this.supabase.client.functions.invoke('approve-vendor', {
        body: { business_id: id }
      });
      if (!error) {
        this.vendors = this.vendors.filter(v => v.id !== id);
      } else {
        alert('Failed to approve vendor');
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.isProcessing = false;
    }
  }

  async reject(id: string) {
    if (!confirm('Are you sure you want to reject and delete this vendor profile?')) return;
    this.isProcessing = true;
    try {
      await this.supabase.client.from('businesses').delete().eq('id', id);
      this.vendors = this.vendors.filter(v => v.id !== id);
    } catch (e) {
      console.error(e);
    } finally {
      this.isProcessing = false;
    }
  }
}
