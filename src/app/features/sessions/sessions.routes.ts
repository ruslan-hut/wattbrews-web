import { Routes } from '@angular/router';

export const sessionsRoutes: Routes = [
  {
    path: '',
    redirectTo: 'active',
    pathMatch: 'full'
  },
  {
    path: 'active',
    loadComponent: () => import('./active-sessions/active-sessions.component').then(m => m.ActiveSessionsComponent)
  },
  {
    path: 'history',
    loadComponent: () => import('./sessions-history/sessions-history.component').then(m => m.SessionsHistoryComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./session-detail/session-detail.component').then(m => m.SessionDetailComponent)
  }
];
