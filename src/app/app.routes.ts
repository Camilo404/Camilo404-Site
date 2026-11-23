import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/pages/home-page/home-page.component').then(m => m.HomePageComponent)
  },
  {
    path: 'homelab',
    title: 'Homelab · Camilo404',
    loadComponent: () => import('./features/homelab/homelab-page.component').then(m => m.HomelabPageComponent)
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
