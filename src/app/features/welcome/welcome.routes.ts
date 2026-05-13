import { Routes } from '@angular/router';

export const welcomeRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./welcome.component').then(m => m.WelcomeComponent)
  }
];
