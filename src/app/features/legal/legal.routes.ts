import { Routes } from '@angular/router';

export const legalRoutes: Routes = [
  {
    path: 'privacy',
    data: { kind: 'privacy' },
    loadComponent: () => import('./legal-page.component').then(m => m.LegalPageComponent)
  },
  {
    path: 'terms',
    data: { kind: 'terms' },
    loadComponent: () => import('./legal-page.component').then(m => m.LegalPageComponent)
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'privacy'
  }
];
