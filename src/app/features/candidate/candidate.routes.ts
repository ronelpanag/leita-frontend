import type { Routes } from '@angular/router';

export const CANDIDATE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./candidate-home-page').then((m) => m.CandidateHomePage),
    title: 'Your applications — Leita',
  },
  {
    path: 'apply/:jobId',
    loadComponent: () => import('./apply-page').then((m) => m.ApplyPage),
    title: 'Apply — Leita',
  },
];
