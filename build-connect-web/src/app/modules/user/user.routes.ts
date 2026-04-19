import { Routes } from '@angular/router';

export const USER_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
    },
    {
        path: 'search',
        loadComponent: () => import('./search-results/search-results.component').then(m => m.SearchResultsComponent)
    },
    {
        path: 'business/:id',
        loadComponent: () => import('./business-profile/business-profile.component').then(m => m.BusinessProfileComponent)
    }
];
