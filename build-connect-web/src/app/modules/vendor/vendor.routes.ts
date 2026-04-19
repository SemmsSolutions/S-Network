import { Routes } from '@angular/router';
import { VendorLayoutComponent } from './components/vendor-layout/vendor-layout.component';

export const VENDOR_ROUTES: Routes = [
    {
        path: '',
        component: VendorLayoutComponent,
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'leads',
                loadComponent: () => import('./leads/leads.component').then(m => m.LeadsInboxComponent)
            },
            {
                path: 'profile',
                loadComponent: () => import('./profile-editor/profile-editor.component').then(m => m.ProfileEditorComponent)
            },
            {
                path: 'reviews',
                loadComponent: () => import('./reviews/vendor-reviews.component').then(m => m.VendorReviewsComponent)
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    }
];
