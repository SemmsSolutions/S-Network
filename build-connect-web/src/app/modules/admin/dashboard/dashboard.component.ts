import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6">
      <h1 class="text-3xl font-heading font-bold text-primary mb-6">Admin Dashboard</h1>

      <!-- Stats Row -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
          <div class="text-3xl font-bold text-orange-600">{{stats.pending}}</div>
          <div class="text-sm text-gray-600 font-bold mt-1">🕐 Pending Approvals</div>
        </div>
        <div class="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <div class="text-3xl font-bold text-green-600">{{stats.activeVendors}}</div>
          <div class="text-sm text-gray-600 font-bold mt-1">✅ Active Vendors</div>
        </div>
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <div class="text-3xl font-bold text-blue-600">{{stats.todayLeads}}</div>
          <div class="text-sm text-gray-600 font-bold mt-1">📋 Leads Today</div>
        </div>
        <div class="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
          <div class="text-3xl font-bold text-purple-600">{{stats.totalUsers}}</div>
          <div class="text-sm text-gray-600 font-bold mt-1">👤 Total Users</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Urgent: Pending Vendors -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-heading font-bold text-secondary">⏳ Pending Vendor Registrations</h2>
            <a routerLink="/admin/vendors" [queryParams]="{tab:'pending'}" class="text-primary text-sm font-bold hover:underline">View All →</a>
          </div>
          <div *ngIf="pendingVendors.length === 0" class="text-gray-400 text-sm">No pending vendors.</div>
          <div *ngFor="let v of pendingVendors" class="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
            <div>
              <p class="font-bold text-gray-800">{{v.businesses?.name || v.name}}</p>
              <p class="text-xs text-gray-400">Registered {{v.created_at | date:'mediumDate'}}</p>
            </div>
            <a routerLink="/admin/vendors" class="bg-primary text-white px-3 py-1 rounded text-xs font-bold">Review →</a>
          </div>
        </div>

        <!-- Recent Leads -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-heading font-bold text-secondary">📋 Recent Leads</h2>
            <a routerLink="/admin/leads" class="text-primary text-sm font-bold hover:underline">View All →</a>
          </div>
          <div *ngIf="recentLeads.length === 0" class="text-gray-400 text-sm">No recent leads.</div>
          <div *ngFor="let l of recentLeads" class="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
            <div>
              <p class="font-bold text-gray-800">{{l.businesses?.name}}</p>
              <p class="text-xs text-gray-400">{{l.project_type}} · ₹{{l.budget}} · {{l.status}}</p>
            </div>
            <span class="text-xs text-gray-400">{{l.created_at | date:'shortTime'}}</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  stats = { pending: 0, activeVendors: 0, todayLeads: 0, totalUsers: 0 };
  pendingVendors: any[] = [];
  recentLeads: any[] = [];

  constructor(private supabase: SupabaseService) { }

  async ngOnInit() {
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [p, v, l, u] = await Promise.all([
      this.supabase.client.from('profiles').select('id, name, created_at, role').eq('role', 'pending_vendor').order('created_at', { ascending: false }).limit(5),
      this.supabase.client.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'vendor'),
      this.supabase.client.from('leads').select('*, businesses(name)', { count: 'exact' }).gte('created_at', today.toISOString()).order('created_at', { ascending: false }).limit(10),
      this.supabase.client.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
    ]);

    this.stats.pending = p.data?.length || 0;
    this.stats.activeVendors = v.count || 0;
    this.stats.todayLeads = l.count || 0;
    this.stats.totalUsers = u.count || 0;
    this.pendingVendors = p.data || [];
    this.recentLeads = l.data || [];
  }
}
