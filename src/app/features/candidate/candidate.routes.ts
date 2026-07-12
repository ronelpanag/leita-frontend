import type { Routes } from '@angular/router';

export const CANDIDATE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./candidate-home-page').then((m) => m.CandidateHomePage),
    title: 'Your applications — Leita',
  },
];
