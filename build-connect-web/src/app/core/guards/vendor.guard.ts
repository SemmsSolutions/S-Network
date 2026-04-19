import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const vendorGuard: CanActivateFn = async () => {
    const supabase = inject(SupabaseService);
    const router = inject(Router);

    const { data: { session } } = await supabase.client.auth.getSession();
    if (!session) return router.createUrlTree(['/auth/login']);

    const { data: profile } = await supabase.client
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

    const role = profile?.role || 'user';

    if (role === 'vendor' || role === 'admin') {
        return true;
    }

    if (role === 'pending_vendor') {
        return router.createUrlTree(['/auth/pending-approval']);
    }

    return router.createUrlTree(['/auth/login']);
};

export const adminGuard: CanActivateFn = async () => {
    const supabase = inject(SupabaseService);
    const router = inject(Router);

    const { data: { session } } = await supabase.client.auth.getSession();
    if (!session) return router.createUrlTree(['/auth/login']);

    const { data: profile } = await supabase.client
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

    if (profile?.role === 'admin') {
        return true;
    }

    return router.createUrlTree(['/home']);
};

export const pendingVendorGuard: CanActivateFn = async () => {
    const supabase = inject(SupabaseService);
    const router = inject(Router);

    const { data: { session } } = await supabase.client.auth.getSession();
    if (!session) return router.createUrlTree(['/auth/login']);

    const { data: profile } = await supabase.client
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

    if (profile?.role === 'pending_vendor') {
        return true;
    }

    if (profile?.role === 'vendor') {
        return router.createUrlTree(['/vendor/dashboard']);
    }

    return router.createUrlTree(['/home']);
};
