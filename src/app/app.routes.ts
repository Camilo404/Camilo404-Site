import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/pages/home-page/home-page.component').then(m => m.HomePageComponent)
  },
  {
    path: 'profile/:id',
    loadComponent: () => import('./features/profile/pages/profile-viewer-page/profile-viewer-page.component').then(m => m.ProfileViewerPageComponent)
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
