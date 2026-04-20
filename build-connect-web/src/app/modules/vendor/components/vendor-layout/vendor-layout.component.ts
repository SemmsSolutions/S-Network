import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { AuthService } from '../../../../core/services/auth.service';
import { RealtimeChannel } from '@supabase/supabase-js';
import { NotificationBellComponent } from '../../../../shared/components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-vendor-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationBellComponent],
  template: `
    <div class="min-h-screen flex bg-surface font-body">
      <!-- Sidebar -->
      <aside class="w-64 bg-secondary text-white flex-col hidden md:flex sticky top-0 h-screen shadow-xl z-20">
        <div class="p-6 border-b border-opacity-20 border-white flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-heading font-bold text-white">S-Network</h2>
            <p class="text-xs uppercase tracking-widest opacity-80 mt-1 font-bold">Vendor Portal</p>
          </div>
          <app-notification-bell></app-notification-bell>
        </div>
        <nav class="flex-1 p-4 space-y-2">
          <a routerLink="/vendor/dashboard" routerLinkActive="bg-white bg-opacity-10 text-white" 
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-white text-opacity-80 hover:bg-white hover:bg-opacity-5 transition font-bold tracking-wide">
             📊 Dashboard
          </a>
          <a routerLink="/vendor/leads" routerLinkActive="bg-white bg-opacity-10 text-white" 
             class="flex items-center justify-between px-4 py-3 rounded-lg text-white text-opacity-80 hover:bg-white hover:bg-opacity-5 transition font-bold tracking-wide">
            <div class="flex items-center gap-3">
              📥 Inbox
            </div>
            <span *ngIf="newLeadsCount > 0" class="bg-primary text-white text-[10px] px-2 py-1 flex items-center justify-center rounded-full animate-bounce shadow-md">{{newLeadsCount}} NEW</span>
          </a>
          <a routerLink="/vendor/reviews" routerLinkActive="bg-white bg-opacity-10 text-white" 
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-white text-opacity-80 hover:bg-white hover:bg-opacity-5 transition font-bold tracking-wide">
             ⭐ Reviews
          </a>
          <a routerLink="/vendor/profile" routerLinkActive="bg-white bg-opacity-10 text-white" 
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-white text-opacity-80 hover:bg-white hover:bg-opacity-5 transition font-bold tracking-wide">
             ⚙️ Profile
          </a>
        </nav>
        <div class="p-6 border-t border-opacity-20 border-white">
          <button (click)="logout()" class="w-full flex items-center justify-center gap-2 bg-white bg-opacity-10 hover:bg-opacity-20 text-white py-3 rounded-lg font-bold transition">
            Log Out
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-x-hidden relative flex flex-col">
        <!-- Mobile Header -->
        <header class="md:hidden bg-secondary text-white p-4 sticky top-0 z-30 flex justify-between items-center shadow-lg">
          <span class="font-heading font-bold text-xl tracking-wide">S-Network</span>
          <!-- Minimal mobile nav placeholder -->
          <div class="flex gap-4 items-center">
             <a routerLink="/vendor/leads" class="relative hover:opacity-80 transition">
               <span class="text-2xl">📥</span>
               <span *ngIf="newLeadsCount > 0" class="absolute -top-1 -right-2 bg-primary text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-bounce font-bold shadow">{{newLeadsCount}}</span>
             </a>
             <app-notification-bell></app-notification-bell>
          </div>
        </header>

        <div class="p-4 md:p-8 flex-1">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `
})
export class VendorLayoutComponent implements OnInit, OnDestroy {
  newLeadsCount = 0;
  private channel!: RealtimeChannel;
  private businessId?: string;

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) { }

  async ngOnInit() {
    const user = this.auth.currentUser;
    if (!user) return;

    const { data } = await this.supabase.client
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (data && data.id) {
      this.businessId = data.id;
      this.setupRealtime();
    }
  }

  setupRealtime() {
    if (!this.businessId) return;

    this.channel = this.supabase.client.channel('leads-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads', filter: `business_id=eq.${this.businessId}` },
        (payload) => {
          this.newLeadsCount++;
        }
      )
      .subscribe();
  }

  ngOnDestroy() {
    if (this.channel) {
      this.supabase.client.removeChannel(this.channel);
    }
  }

  logout() {
    this.auth.logout();
  }
}
