import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <button (click)="toggleDropdown()" class="relative p-2 text-gray-600 hover:text-primary transition rounded-full hover:bg-gray-100">
        <span class="text-xl">🔔</span>
        <span *ngIf="unreadCount > 0" class="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full transform scale-90 border-2 border-white">
          {{unreadCount > 9 ? '9+' : unreadCount}}
        </span>
      </button>

      <!-- Dropdown Panel -->
      <div *ngIf="isOpen" class="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden font-body">
        <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 class="font-heading font-bold text-gray-800">Notifications</h3>
          <button *ngIf="unreadCount > 0" (click)="markAllRead()" class="text-xs text-primary hover:underline font-bold">Mark all read</button>
        </div>
        
        <div class="max-h-96 overflow-y-auto">
          <div *ngIf="notifications.length === 0" class="p-8 text-center text-gray-500 text-sm">
            <span class="text-3xl block mb-2 opacity-50">📭</span>
            No new notifications
          </div>
          
          <div *ngFor="let n of notifications" 
               (click)="handleNotificationClick(n)"
               class="p-4 border-b border-gray-50 cursor-pointer hover:bg-orange-50 transition"
               [class.bg-white]="n.is_read"
               [class.bg-blue-50]="!n.is_read">
            <div class="flex gap-3">
              <div class="text-2xl mt-1">{{ getIcon(n.type) }}</div>
              <div>
                <p class="text-sm font-bold text-gray-800" [class.text-primary]="!n.is_read">{{n.title}}</p>
                <p class="text-xs text-gray-600 mt-1 line-clamp-2">{{n.body}}</p>
                <p class="text-[10px] text-gray-400 mt-2 font-bold">{{n.created_at | date:'short'}}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Overlay to close -->
      <div *ngIf="isOpen" (click)="isOpen = false" class="fixed inset-0 z-40"></div>
    </div>
    
    <!-- Toast Notification Container -->
    <div *ngIf="showToast && latestNotification" class="fixed bottom-4 right-4 bg-white rounded-xl shadow-xl border-l-4 border-primary p-4 max-w-sm z-50 animate-slide-up cursor-pointer" (click)="handleNotificationClick(latestNotification); showToast = false">
      <div class="flex justify-between items-start gap-4">
        <div>
          <h4 class="font-bold text-sm text-gray-800">{{latestNotification.title}}</h4>
          <p class="text-xs text-gray-600 mt-1">{{latestNotification.body}}</p>
        </div>
        <button (click)="showToast = false; $event.stopPropagation()" class="text-gray-400 hover:text-gray-600">✕</button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  notifications: any[] = [];
  unreadCount = 0;
  isOpen = false;

  showToast = false;
  latestNotification: any = null;
  toastTimeout: any;

  private subscription: any;

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
    private router: Router
  ) { }

  async ngOnInit() {
    this.auth.currentUser$.subscribe(user => {
      if (user) {
        this.loadNotifications(user.id);
        this.setupRealtime(user.id);
      } else {
        this.notifications = [];
        this.unreadCount = 0;
        if (this.subscription) this.subscription.unsubscribe();
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.supabase.client.removeChannel(this.subscription);
    }
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  async loadNotifications(userId: string) {
    const { data } = await this.supabase.client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    this.notifications = data || [];
    this.updateUnreadCount();
  }

  updateUnreadCount() {
    this.unreadCount = this.notifications.filter(n => !n.is_read).length;
  }

  setupRealtime(userId: string) {
    if (this.subscription) {
      this.supabase.client.removeChannel(this.subscription);
    }

    // Use a unique channel name to prevent Supabase Realtime channel state conflicts
    this.subscription = this.supabase.client.channel(`notifications-${userId}-${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, payload => {
        const newNotif = payload.new;
        this.notifications.unshift(newNotif);
        this.updateUnreadCount();

        // Show toast
        this.latestNotification = newNotif;
        this.showToast = true;
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => this.showToast = false, 4000);
      })
      .subscribe();
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    this.showToast = false; // Hide toast if they open the bell
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
    this.updateUnreadCount();
  }

  async handleNotificationClick(n: any) {
    this.isOpen = false;

    // Mark as read if unread
    if (!n.is_read) {
      n.is_read = true;
      this.updateUnreadCount();
      await this.supabase.client.from('notifications').update({ is_read: true }).eq('id', n.id);
    }

    // Route based on type
    if (n.type === 'new_lead') {
      this.router.navigate(['/vendor/leads']);
    } else if (n.type === 'lead_status_update') {
      // Navigate to user's saved/quotes page if they have one, for now /home
      this.router.navigate(['/home']);
    } else if (n.type === 'verification_approved' || n.type === 'vendor_approved') {
      this.router.navigate(['/vendor/dashboard']);
    }
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      'new_lead': '📥',
      'lead_status_update': '📝',
      'verification_approved': '✅',
      'vendor_approved': '🎉'
    };
    return icons[type] || '🔔';
  }
}
