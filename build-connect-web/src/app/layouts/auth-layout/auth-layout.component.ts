import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell.component';

import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NotificationBellComponent, NavbarComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-surface font-body">
      <!-- Top Navbar -->
      <app-navbar></app-navbar>

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
}
