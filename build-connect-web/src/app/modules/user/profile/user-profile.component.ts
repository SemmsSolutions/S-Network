import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
    selector: 'app-user-profile',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="max-w-4xl mx-auto py-8 px-4 font-body">
      <h1 class="text-2xl font-heading font-bold text-primary mb-6">My Profile</h1>

      <div class="bg-white rounded-xl shadow-md p-6 mb-6">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
            {{userInitial}}
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-800">{{profile?.name || 'User'}}</h2>
            <p class="text-sm text-gray-500">{{profile?.phone || 'No phone'}}</p>
            <span class="inline-block px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-bold mt-1">{{profile?.role}}</span>
          </div>
        </div>
      </div>

      <!-- My Submitted Leads -->
      <div class="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 class="text-lg font-bold text-gray-800 mb-4">📋 My Submitted Leads</h2>
        <div *ngIf="leads.length === 0" class="text-center py-8 text-gray-400">No leads submitted yet</div>
        <div *ngFor="let lead of leads" class="border-b py-3 last:border-0">
          <div class="flex justify-between items-start">
            <div>
              <p class="font-bold text-sm text-gray-800">{{lead.project_type || 'General Enquiry'}}</p>
              <p class="text-xs text-gray-500">Budget: ₹{{lead.budget_min}} - ₹{{lead.budget_max}}</p>
            </div>
            <span [class]="lead.status === 'new' ? 'bg-blue-100 text-blue-700' : lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'"
              class="px-2 py-0.5 rounded text-xs font-bold">{{lead.status}}</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UserProfileComponent implements OnInit {
    profile: any = null;
    leads: any[] = [];

    constructor(private auth: AuthService, private supabase: SupabaseService) { }

    get userInitial(): string {
        return (this.profile?.name || 'U').charAt(0).toUpperCase();
    }

    async ngOnInit() {
        const user = this.auth.currentUser;
        if (!user) return;

        // Load profile
        const { data: profileData } = await this.supabase.client
            .from('profiles').select('*').eq('id', user.id).maybeSingle();
        this.profile = profileData;

        // Load user's submitted leads
        const { data: leadsData } = await this.supabase.client
            .from('leads').select('*').eq('user_id', user.id)
            .order('created_at', { ascending: false }).limit(20);
        this.leads = leadsData || [];
    }
}
