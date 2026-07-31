import type { Routes } from '@angular/router';
import { unsavedChangesGuard } from '@core';

export const COMPANY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./company-home-page').then((m) => m.CompanyHomePage),
    title: 'Hiring dashboard — Leita',
  },
  {
    path: 'jobs/new',
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () => import('./job-create-page').then((m) => m.JobCreatePage),
    title: 'New job posting — Leita',
  },
  {
    path: 'jobs/:id/edit',
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () => import('./job-edit-page').then((m) => m.JobEditPage),
    title: 'Edit job posting — Leita',
  },
  {
    path: 'jobs/:id/pipeline',
    loadComponent: () => import('./pipeline-page').then((m) => m.PipelinePage),
    title: 'Pipeline — Leita',
  },
];
