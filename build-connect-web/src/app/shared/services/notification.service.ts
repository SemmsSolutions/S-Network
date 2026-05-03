import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from '../../core/services/supabase.service';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
    unreadCount$ = new BehaviorSubject<number>(0);
    notifications$ = new BehaviorSubject<any[]>([]);

    private channel: RealtimeChannel | null = null;
    private currentUserId: string | null = null;
    private initialized = false;

    constructor(private supabase: SupabaseService) { }

    /** Call this ONCE after user logs in */
    async setup(userId: string): Promise<void> {
        if (this.initialized && this.currentUserId === userId) return;
        await this.teardown();
        this.currentUserId = userId;
        this.initialized = true;
        await this.loadNotifications(userId);

        // ALL handlers MUST be registered BEFORE calling subscribe()
        this.channel = this.supabase.client
            .channel(`user-notifications-${userId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
                (payload) => {
                    const current = this.notifications$.getValue();
                    this.notifications$.next([payload.new, ...current]);
                    this.unreadCount$.next(this.unreadCount$.getValue() + 1);
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
                () => { this.loadNotifications(userId); }
            );

        // Subscribe AFTER registering ALL handlers
        this.channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') console.log('[NotificationService] Channel subscribed for user', userId);
        });
    }

    async teardown(): Promise<void> {
        if (this.channel) {
            await this.supabase.client.removeChannel(this.channel);
            this.channel = null;
        }
        this.initialized = false;
        this.currentUserId = null;
    }

    async loadNotifications(userId: string): Promise<void> {
        const { data } = await this.supabase.client
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);
        const all = data ?? [];
        this.notifications$.next(all);
        this.unreadCount$.next(all.filter(n => !n.is_read).length);
    }

    async markAllRead(userId: string): Promise<void> {
        await this.supabase.client.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
        this.unreadCount$.next(0);
        this.notifications$.next(this.notifications$.getValue().map(n => ({ ...n, is_read: true })));
    }

    async markRead(notificationId: string): Promise<void> {
        await this.supabase.client.from('notifications').update({ is_read: true }).eq('id', notificationId);
        const current = this.notifications$.getValue();
        this.notifications$.next(current.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
        this.unreadCount$.next(Math.max(0, this.unreadCount$.getValue() - 1));
    }

    ngOnDestroy(): void { this.teardown(); }
}
