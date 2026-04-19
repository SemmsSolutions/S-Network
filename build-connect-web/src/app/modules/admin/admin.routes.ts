import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { AuthService } from '../../core/services/auth.service';

import { adminGuard } from '../../core/guards/vendor.guard';

export const ADMIN_ROUTES: Routes = [
    {
        path: '',
        component: AdminLayoutComponent,
        canActivate: [adminGuard],
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./dashboard/dashboard.component').then(m => m.AdminDashboardComponent)
            },
            {
                path: 'vendors',
                loadComponent: () => import('./vendors/vendors.component').then(m => m.AdminVendorsComponent)
            },
            {
                path: 'leads',
                loadComponent: () => import('./leads/admin-leads.component').then(m => m.AdminLeadsComponent)
            },
            {
                path: 'rankings',
                loadComponent: () => import('./rankings/admin-rankings.component').then(m => m.AdminRankingsComponent)
            },
            {
                path: 'verifications',
                loadComponent: () => import('./verifications/verifications.component').then(m => m.AdminVerificationsComponent)
            },
            {
                path: 'pending-vendors',
                loadComponent: () => import('./pending-vendors/pending-vendors.component').then(m => m.PendingVendorsComponent)
            },
            {
                path: 'reviews',
                loadComponent: () => import('./reviews-moderation/reviews-moderation.component').then(m => m.ReviewsModerationComponent)
            },
            {
                path: 'categories',
                loadComponent: () => import('./categories-management/categories-management.component').then(m => m.CategoriesManagementComponent)
            },
            {
                path: 'settings',
                loadComponent: () => import('./settings/admin-settings.component').then(m => m.AdminSettingsComponent)
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    }
];
