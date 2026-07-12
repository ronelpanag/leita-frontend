import type { Routes } from '@angular/router';

export const COMPANY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./company-home-page').then((m) => m.CompanyHomePage),
    title: 'Hiring dashboard — Leita',
  },
];
