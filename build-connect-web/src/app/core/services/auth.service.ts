import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject } from 'rxjs';
import { User } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    private userRoleSubject = new BehaviorSubject<string>('user');
    public userRole$ = this.userRoleSubject.asObservable();

    private profileSubject = new BehaviorSubject<any>(null);
    public profile$ = this.profileSubject.asObservable();

    constructor(private supabase: SupabaseService) {
        this.supabase.client.auth.onAuthStateChange((_event, session) => {
            const user = session?.user || null;
            this.currentUserSubject.next(user);
            if (user) {
                this.fetchRoleWithRetry(user.id);
            } else {
                this.userRoleSubject.next('user');
                this.profileSubject.next(null);
            }
        });
    }

    get currentUser(): User | null {
        return this.currentUserSubject.value;
    }

    get currentRole(): string {
        return this.userRoleSubject.value;
    }

    get currentProfile(): any {
        return this.profileSubject.value;
    }

    /** Retry up to 5 times with backoff — fixes 406 race condition */
    private async fetchRoleWithRetry(userId: string, maxAttempts = 5, delayMs = 500) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const { data } = await this.supabase.client
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (data && data.role) {
                this.userRoleSubject.next(data.role);
                this.profileSubject.next(data);
                return;
            }

            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
            }
        }
        // Fallback
        this.userRoleSubject.next('user');
    }

    async logout(): Promise<void> {
        try {
            await this.supabase.client.auth.signOut({ scope: 'local' });
        } catch (e) { console.warn('Logout warning:', e); }
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';  // Hard redirect — clears all Angular state
    }

    /** @deprecated Use logout() instead */
    async signOut(): Promise<void> {
        return this.logout();
    }
}
