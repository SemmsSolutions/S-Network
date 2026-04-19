import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { vendorGuard, adminGuard } from './core/guards/vendor.guard';

export const routes: Routes = [
    // Public auth routes
    {
        path: 'auth',
        loadChildren: () => import('./modules/auth/auth.routes').then(m => m.AUTH_ROUTES)
    },

    // Public + Auth-required user routes — all under same layout shell (AuthLayoutComponent)
    // AuthLayoutComponent adapts its navbar for logged-in vs anonymous users
    {
        path: '',
        loadComponent: () => import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
        children: [
            // PUBLIC — no login required
            {
                path: 'home',
                loadComponent: () => import('./modules/user/home/home.component').then(m => m.HomeComponent)
            },
            {
                path: 'search',
                loadComponent: () => import('./modules/user/search-results/search-results.component').then(m => m.SearchResultsComponent)
            },
            {
                path: 'business/:id',
                loadComponent: () => import('./modules/user/business-profile/business-profile.component').then(m => m.BusinessProfileComponent)
            },
            // AUTH REQUIRED
            {
                path: 'profile',
                canActivate: [authGuard],
                loadComponent: () => import('./modules/user/profile/user-profile.component').then(m => m.UserProfileComponent)
            },
            {
                path: 'saved',
                canActivate: [authGuard],
                loadComponent: () => import('./modules/user/saved/saved.component').then(m => m.SavedComponent)
            }
        ]
    },

    // Vendor routes (vendor layout is inside vendor module)
    {
        path: 'vendor',
        canActivate: [authGuard, vendorGuard],
        loadChildren: () => import('./modules/vendor/vendor.routes').then(m => m.VENDOR_ROUTES)
    },

    // Admin routes (admin layout is inside admin module)
    {
        path: 'admin',
        canActivate: [authGuard, adminGuard],
        loadChildren: () => import('./modules/admin/admin.routes').then(m => m.ADMIN_ROUTES)
    },

    // Legal pages
    {
        path: 'privacy',
        loadComponent: () => import('./modules/legal/privacy.component').then(m => m.PrivacyComponent)
    },
    {
        path: 'terms',
        loadComponent: () => import('./modules/legal/terms.component').then(m => m.TermsComponent)
    },

    // Root redirect — home is now public
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: '**', redirectTo: 'home' }
];
