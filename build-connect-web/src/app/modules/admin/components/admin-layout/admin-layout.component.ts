import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationBellComponent } from '../../../../shared/components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationBellComponent],
  template: `
    <div class="min-h-screen flex bg-surface font-body">
      <!-- Sidebar -->
      <aside class="w-64 bg-gray-900 text-white flex-col hidden md:flex sticky top-0 h-screen shadow-xl z-20">
        <div class="p-6 border-b border-gray-700 border-opacity-50 flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-heading font-bold text-white tracking-wide">S-Network</h2>
            <p class="text-xs uppercase tracking-widest text-primary mt-1 font-bold">Admin Portal</p>
          </div>
          <app-notification-bell></app-notification-bell>
        </div>
        <nav class="flex-1 p-4 space-y-2">
          <a routerLink="/admin/dashboard" routerLinkActive="bg-white bg-opacity-10 text-white" 
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white hover:bg-opacity-5 transition font-bold tracking-wide">
             📈 Overview
          </a>
          <a routerLink="/admin/vendors" routerLinkActive="bg-white bg-opacity-10 text-white" 
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white hover:bg-opacity-5 transition font-bold tracking-wide">
             🏢 Businesses
          </a>
          <a routerLink="/admin/leads" routerLinkActive="bg-white bg-opacity-10 text-white" 
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white hover:bg-opacity-5 transition font-bold tracking-wide">
             📬 All Leads
          </a>
          <a routerLink="/admin/rankings" routerLinkActive="bg-white bg-opacity-10 text-white" 
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white hover:bg-opacity-5 transition font-bold tracking-wide">
             ⭐ Rankings
          </a>
          <a routerLink="/admin/pending-vendors" routerLinkActive="bg-white bg-opacity-10 text-white" 
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white hover:bg-opacity-5 transition font-bold tracking-wide">
             🛡️ Approvals
          </a>
          <a routerLink="/admin/verifications" routerLinkActive="bg-white bg-opacity-10 text-white" 
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white hover:bg-opacity-5 transition font-bold tracking-wide">
             📄 Verifications
          </a>
          <a routerLink="/admin/reviews" routerLinkActive="bg-white bg-opacity-10 text-white" 
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white hover:bg-opacity-5 transition font-bold tracking-wide">
             💬 Reviews
          </a>
          <a routerLink="/admin/categories" routerLinkActive="bg-white bg-opacity-10 text-white" 
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white hover:bg-opacity-5 transition font-bold tracking-wide">
             📁 Categories
          </a>
          <a routerLink="/admin/settings" routerLinkActive="bg-white bg-opacity-10 text-white" 
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white hover:bg-opacity-5 transition font-bold tracking-wide">
             ⚙️ Settings
          </a>
        </nav>
        <div class="p-6 border-t border-gray-700 border-opacity-50">
          <button (click)="logout()" class="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-bold transition">
            Log Out
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 relative flex flex-col h-screen overflow-y-auto">
        <!-- Mobile Header -->
        <header class="md:hidden bg-gray-900 text-white p-4 sticky top-0 z-30 flex justify-between items-center shadow-lg">
          <span class="font-heading font-bold text-xl tracking-wide">S-Network Admin</span>
          <div class="flex gap-4 items-center">
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
export class AdminLayoutComponent {
  constructor(private auth: AuthService) { }

  logout() {
    this.auth.logout();
  }
}
