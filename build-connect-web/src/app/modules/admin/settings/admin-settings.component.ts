import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
    selector: 'app-admin-settings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="p-6 max-w-3xl">
      <h1 class="text-3xl font-heading font-bold text-primary mb-6">⚙️ Admin Settings</h1>

      <!-- Change Password -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 class="text-lg font-bold text-gray-800 mb-4">🔒 Change Password</h2>
        <div class="space-y-4 max-w-md">
          <div>
            <label class="block text-sm font-bold text-gray-700">New Password</label>
            <input type="password" [(ngModel)]="newPassword" placeholder="Min 8 characters"
              class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary">
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700">Confirm New Password</label>
            <input type="password" [(ngModel)]="confirmPassword" placeholder="Repeat password"
              class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary">
          </div>
          <p *ngIf="confirmPassword && newPassword !== confirmPassword" class="text-red-500 text-xs">Passwords do not match</p>
          <button (click)="changePassword()" [disabled]="changingPassword || !newPassword || newPassword.length < 8 || newPassword !== confirmPassword"
            class="bg-primary text-white px-6 py-2 rounded-md font-bold text-sm disabled:opacity-50 hover:bg-opacity-90 transition">
            {{changingPassword ? 'Updating...' : 'Update Password'}}
          </button>
          <p *ngIf="passwordMsg" [class]="passwordSuccess ? 'text-green-600' : 'text-red-600'" class="text-sm font-bold">{{passwordMsg}}</p>
        </div>
      </div>

      <!-- Platform Overview -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 class="text-lg font-bold text-gray-800 mb-4">📊 Platform Overview</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-primary">{{overview.totalUsers}}</div>
            <div class="text-xs text-gray-500 mt-1">Total Users</div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-green-600">{{overview.activeVendors}}</div>
            <div class="text-xs text-gray-500 mt-1">Active Vendors</div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-orange-600">{{overview.pendingVendors}}</div>
            <div class="text-xs text-gray-500 mt-1">Pending Vendors</div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">{{overview.totalLeads}}</div>
            <div class="text-xs text-gray-500 mt-1">Total Leads</div>
          </div>
        </div>
      </div>

      <!-- Recent Email Logs -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 class="text-lg font-bold text-gray-800 mb-4">📧 Recent Email Notifications</h2>
        <div *ngIf="emailLogs.length === 0" class="text-gray-400 text-sm">No emails sent yet</div>
        <div class="overflow-x-auto">
          <table *ngIf="emailLogs.length > 0" class="w-full text-sm">
            <thead>
              <tr class="border-b text-left text-gray-500">
                <th class="py-2 pr-4">Type</th>
                <th class="py-2 pr-4">Recipient</th>
                <th class="py-2 pr-4">Subject</th>
                <th class="py-2">Sent</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of emailLogs" class="border-b border-gray-50">
                <td class="py-2 pr-4"><span class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">{{log.email_type}}</span></td>
                <td class="py-2 pr-4 text-gray-700">{{log.recipient_email}}</td>
                <td class="py-2 pr-4 text-gray-700">{{log.subject || '-'}}</td>
                <td class="py-2 text-gray-400 text-xs">{{log.sent_at | date:'short'}}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AdminSettingsComponent {
    newPassword = '';
    confirmPassword = '';
    changingPassword = false;
    passwordMsg = '';
    passwordSuccess = false;

    overview = { totalUsers: 0, activeVendors: 0, pendingVendors: 0, totalLeads: 0 };
    emailLogs: any[] = [];

    constructor(private supabase: SupabaseService) {
        this.loadData();
    }

    async changePassword() {
        this.changingPassword = true;
        this.passwordMsg = '';
        try {
            const { error } = await this.supabase.client.auth.updateUser({
                password: this.newPassword
            });
            if (error) throw error;
            this.passwordMsg = 'Password updated successfully!';
            this.passwordSuccess = true;
            this.newPassword = '';
            this.confirmPassword = '';
        } catch (e: any) {
            this.passwordMsg = e.message || 'Failed to update password';
            this.passwordSuccess = false;
        }
        this.changingPassword = false;
    }

    async loadData() {
        const [users, vendors, pending, leads, emails] = await Promise.all([
            this.supabase.client.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
            this.supabase.client.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'vendor'),
            this.supabase.client.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'pending_vendor'),
            this.supabase.client.from('leads').select('id', { count: 'exact', head: true }),
            this.supabase.client.from('email_notifications').select('*').order('sent_at', { ascending: false }).limit(20)
        ]);

        this.overview = {
            totalUsers: users.count || 0,
            activeVendors: vendors.count || 0,
            pendingVendors: pending.count || 0,
            totalLeads: leads.count || 0
        };
        this.emailLogs = emails.data || [];
    }
}
