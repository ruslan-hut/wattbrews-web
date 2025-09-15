import { Routes } from '@angular/router';

export const profileRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent)
  },
  {
    path: 'payment',
    loadComponent: () => import('./payment/payment.component').then(m => m.PaymentComponent)
  },
  {
    path: 'notifications',
    loadComponent: () => import('./notifications/notifications.component').then(m => m.NotificationsComponent)
  }
];
