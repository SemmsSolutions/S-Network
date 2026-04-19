import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async (route, state) => {
    const supabase = inject(SupabaseService);
    const router = inject(Router);

    // Always check the actual session from Supabase — not a cached observable
    const { data: { session } } = await supabase.client.auth.getSession();

    if (!session) {
        return router.createUrlTree(['/auth/login']);
    }

    // Fetch role directly — no caching, no race conditions
    const { data: profile } = await supabase.client
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

    const role = profile?.role || session.user.user_metadata?.['role'] || 'user';

    // Gate pending_vendor
    if (role === 'pending_vendor' && !state.url.includes('pending-approval')) {
        return router.createUrlTree(['/auth/pending-approval']);
    }

    return true;
};
