import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
    selector: 'app-callback',
    standalone: true,
    template: `
    <div class="flex items-center justify-center min-h-screen bg-surface font-body">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-gray-600 font-bold">Setting up your account...</p>
      </div>
    </div>
  `
})
export class CallbackComponent implements OnInit {

    constructor(private router: Router, private supabase: SupabaseService) { }

    async ngOnInit(): Promise<void> {
        try {
            // Fix race condition: Supabase needs time to parse the URL hash for OAuth
            let session = null;
            let retries = 0;
            while (!session && retries < 10) {
                const { data } = await this.supabase.client.auth.getSession();
                session = data.session;
                if (session) break;
                await new Promise(r => setTimeout(r, 200)); // wait 200ms
                retries++;
            }

            if (!session) {
                console.error('No session found after Google OAuth callback.');
                await this.router.navigate(['/auth/login']);
                return;
            }

            // Fetch profile with retry
            const profile = await this.fetchProfileWithRetry(session.user.id);

            if (!profile) {
                // Profile missing — create manually as fallback
                await this.createProfileFallback(session.user);

                // Refetch to get the proper role
                const newProfile = await this.fetchProfileWithRetry(session.user.id);
                this.routeByRole(newProfile?.role || 'user');
                return;
            }

            // Route by role
            this.routeByRole(profile.role);

        } catch (err) {
            console.error('Callback error:', err);
            await this.router.navigate(['/auth/login']);
        }
    }

    private async fetchProfileWithRetry(
        userId: string,
        maxAttempts = 5,
        delayMs = 500
    ): Promise<any | null> {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const { data } = await this.supabase.client
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();  // Returns null if not found — NO 406 error

            if (data) return data;

            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
            }
        }
        return null;
    }

    private async createProfileFallback(user: any): Promise<void> {
        await this.supabase.client.from('profiles').upsert({
            id: user.id,
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            phone: user.phone || user.user_metadata?.phone || null,
            role: user.user_metadata?.role === 'vendor' ? 'pending_vendor' : 'user',
            avatar_url: user.user_metadata?.avatar_url || ''
        }, { onConflict: 'id' });
    }

    private routeByRole(role: string): void {
        switch (role) {
            case 'admin':
                this.router.navigate(['/admin']);
                break;
            case 'vendor':
                this.router.navigate(['/vendor/dashboard']);
                break;
            case 'pending_vendor':
                this.router.navigate(['/auth/pending-approval']);
                break;
            case 'user':
            default:
                this.router.navigate(['/home']);
                break;
        }
    }
}
