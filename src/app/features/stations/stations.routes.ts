import { Routes } from '@angular/router';

export const stationsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./stations-list/stations-list.component').then(m => m.StationsListComponent)
  },
  {
    path: 'map',
    loadComponent: () => import('./stations-map/stations-map.component').then(m => m.StationsMapComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./station-detail/station-detail.component').then(m => m.StationDetailComponent)
  }
];
