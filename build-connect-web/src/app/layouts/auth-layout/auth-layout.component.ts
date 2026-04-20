import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NotificationBellComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-surface font-body">
      <!-- Top Navbar -->
      <nav class="sticky top-0 z-50 bg-gradient-to-r from-[#0A1628] to-[#0D1F3C] shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <!-- Logo -->
            <a routerLink="/home" class="flex items-center gap-2 cursor-pointer group">
              <span class="text-2xl font-heading font-extrabold text-white tracking-wide group-hover:text-primary transition">S-Network</span>
              <span class="hidden sm:inline text-xs uppercase tracking-widest text-primary font-bold opacity-80">Find. Verify. Build.</span>
            </a>

            <!-- Center Search (desktop) -->
            <div class="hidden md:flex flex-1 max-w-xl mx-8">
              <div class="relative w-full">
                <input type="text" [(ngModel)]="searchQuery"
                  (keydown.enter)="doSearch()"
                  placeholder="Search contractors, architects..."
                  class="w-full pl-10 pr-4 py-2 rounded-lg bg-white bg-opacity-10 border border-white border-opacity-20 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-opacity-20 transition">
                <span class="absolute left-3 top-2.5 text-gray-400">🔍</span>
              </div>
            </div>

            <!-- Right: Notifications + User Dropdown -->
            <div class="flex items-center gap-4">
              <!-- Notification Bell -->
              <app-notification-bell></app-notification-bell>

              <!-- User Dropdown -->
              <div class="relative">
                <button (click)="showDropdown = !showDropdown" class="flex items-center gap-2 text-white hover:text-primary transition">
                  <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                    {{userInitial}}
                  </div>
                  <span class="hidden sm:inline text-sm font-bold">{{userName}}</span>
                  <span class="text-xs">▼</span>
                </button>

                <!-- Dropdown Menu -->
                <div *ngIf="showDropdown" class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                  <!-- User menu -->
                  <ng-container *ngIf="userRole === 'user'">
                    <a routerLink="/profile" (click)="showDropdown=false" class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">👤 My Profile</a>
                    <a routerLink="/saved" (click)="showDropdown=false" class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">💾 Saved Businesses</a>
                  </ng-container>
                  <!-- Vendor menu -->
                  <ng-container *ngIf="userRole === 'vendor'">
                    <a routerLink="/vendor/dashboard" (click)="showDropdown=false" class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">📊 Dashboard</a>
                    <a routerLink="/vendor/leads" (click)="showDropdown=false" class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">📥 My Leads</a>
                    <a routerLink="/vendor/profile" (click)="showDropdown=false" class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">⚙️ Edit Profile</a>
                  </ng-container>
                  <!-- Admin menu -->
                  <ng-container *ngIf="userRole === 'admin'">
                    <a routerLink="/admin" (click)="showDropdown=false" class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">🛡️ Admin Panel</a>
                  </ng-container>
                  <div class="border-t border-gray-100 my-1"></div>
                  <button (click)="logout()" class="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition w-full text-left">🚪 Logout</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile Search -->
        <div class="md:hidden px-4 pb-3">
          <div class="relative">
            <input type="text" [(ngModel)]="searchQuery"
              (keydown.enter)="doSearch()"
              placeholder="Search..."
              class="w-full pl-10 pr-4 py-2 rounded-lg bg-white bg-opacity-10 border border-white border-opacity-20 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition">
            <span class="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>
      </nav>

      <!-- Close dropdown on outside click -->
      <div *ngIf="showDropdown" (click)="showDropdown=false" class="fixed inset-0 z-40"></div>

      <!-- Main Content -->
      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>

      <!-- Bottom Navigation (Mobile) -->
      <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        <div class="flex justify-around py-2">
          <a routerLink="/home" routerLinkActive="text-primary" class="flex flex-col items-center text-gray-500 text-xs">
            <span class="text-xl mb-0.5">🏠</span> Home
          </a>
          <a routerLink="/search" routerLinkActive="text-primary" class="flex flex-col items-center text-gray-500 text-xs">
            <span class="text-xl mb-0.5">🔍</span> Search
          </a>
          <a routerLink="/saved" routerLinkActive="text-primary" class="flex flex-col items-center text-gray-500 text-xs">
            <span class="text-xl mb-0.5">💾</span> Saved
          </a>
          <a routerLink="/profile" routerLinkActive="text-primary" class="flex flex-col items-center text-gray-500 text-xs">
            <span class="text-xl mb-0.5">👤</span> Profile
          </a>
        </div>
      </nav>
    </div>
  `
})
export class AuthLayoutComponent {
  searchQuery = '';
  showDropdown = false;
  showNotifications = false;
  notifications: any[] = [];
  unreadCount = 0;

  constructor(
    private auth: AuthService,
    private supabase: SupabaseService,
    private router: Router
  ) {
    // Load notifications
    this.loadNotifications();
  }

  get userName(): string {
    return this.auth.currentUser?.user_metadata?.['full_name']
      || this.auth.currentUser?.email?.split('@')[0]
      || 'User';
  }

  get userInitial(): string {
    return this.userName.charAt(0).toUpperCase();
  }

  get userRole(): string {
    return this.auth.currentRole;
  }

  doSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery.trim() } });
    }
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    this.showDropdown = false;
  }

  async loadNotifications() {
    const user = this.auth.currentUser;
    if (!user) return;
    const { data } = await this.supabase.client
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    this.notifications = data || [];
    this.unreadCount = this.notifications.filter(n => !n.is_read).length;
  }

  async markAllRead() {
    const user = this.auth.currentUser;
    if (!user) return;
    await this.supabase.client
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    this.notifications.forEach(n => n.is_read = true);
    this.unreadCount = 0;
  }

  openNotification(n: any) {
    this.showNotifications = false;
    // Navigate based on type
    if (n.type === 'new_lead') this.router.navigate(['/vendor/leads']);
    else if (n.type === 'verification_approved') this.router.navigate(['/vendor/dashboard']);
    else if (n.type === 'vendor_approved') this.router.navigate(['/vendor/dashboard']);
    else this.router.navigate(['/home']);
  }

  async logout() {
    await this.auth.logout();
    this.showDropdown = false;
  }
}
