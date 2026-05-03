import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
    { path: 'login', loadComponent: () => import('./login.component').then(c => c.LoginComponent) },
    // Role selection is now the entry point for /auth/register
    { path: 'register', loadComponent: () => import('./role-select/role-select.component').then(c => c.RoleSelectComponent) },
    // The actual register form is accessed with ?role=user or ?role=vendor from role-select
    { path: 'register/form', loadComponent: () => import('./register.component').then(c => c.RegisterComponent) },
    { path: 'callback', loadComponent: () => import('./callback/callback.component').then(c => c.CallbackComponent) },
    { path: 'pending-approval', loadComponent: () => import('./pending-approval/pending-approval.component').then(c => c.PendingApprovalComponent) },
    { path: '', redirectTo: 'login', pathMatch: 'full' }
];
