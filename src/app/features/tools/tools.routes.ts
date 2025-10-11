import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const toolsRoutes: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['admin'])],
    children: [
      {
        path: '',
        redirectTo: 'websocket',
        pathMatch: 'full'
      },
      {
        path: 'websocket',
        loadComponent: () => import('./websocket-test/websocket-test.component')
          .then(m => m.WebsocketTestComponent)
      }
    ]
  }
];

