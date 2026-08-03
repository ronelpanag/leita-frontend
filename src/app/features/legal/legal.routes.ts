import type { Routes } from '@angular/router';

export const LEGAL_ROUTES: Routes = [
  {
    path: 'terms',
    loadComponent: () => import('./terms-page').then((m) => m.TermsPage),
    title: 'Terms and conditions — Leita',
  },
  {
    path: 'privacy',
    loadComponent: () => import('./privacy-page').then((m) => m.PrivacyPage),
    title: 'Privacy and cookies — Leita',
  },
];
