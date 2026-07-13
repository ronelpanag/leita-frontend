import type { Routes } from '@angular/router';

export const JOBS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./job-board-page').then((m) => m.JobBoardPage),
    title: 'Open roles — Leita',
  },
  {
    path: ':id',
    // Title is set per job by the component once the posting loads.
    loadComponent: () => import('./job-detail-page').then((m) => m.JobDetailPage),
    title: 'Role — Leita',
  },
];
