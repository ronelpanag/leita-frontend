import type { Routes } from '@angular/router';

export const JOBS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./job-board-page').then((m) => m.JobBoardPage),
    title: 'Open roles — Leita',
  },
];
