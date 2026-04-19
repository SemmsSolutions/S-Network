import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
    { path: 'login', loadComponent: () => import('./login.component').then(c => c.LoginComponent) },
    { path: 'register', loadComponent: () => import('./register.component').then(c => c.RegisterComponent) },
    { path: 'callback', loadComponent: () => import('./callback/callback.component').then(c => c.CallbackComponent) },
    { path: 'pending-approval', loadComponent: () => import('./pending-approval/pending-approval.component').then(c => c.PendingApprovalComponent) },
    { path: '', redirectTo: 'login', pathMatch: 'full' }
];
