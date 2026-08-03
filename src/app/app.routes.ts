import { Routes } from '@angular/router';
import { authGuard, roleGuard } from '@core';

declare const ngDevMode: boolean | undefined;

// The showcase route only exists in dev builds: the optimizer replaces
// ngDevMode with false in production, dead-code-eliminating the whole chunk.
const devRoutes: Routes =
  typeof ngDevMode !== 'undefined' && ngDevMode
    ? [
        {
          path: 'dev/components',
          loadComponent: () => import('./dev/showcase').then((m) => m.Showcase),
        },
      ]
    : [];

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'jobs' },
  {
    path: 'jobs',
    loadChildren: () => import('./features/jobs/jobs.routes').then((m) => m.JOBS_ROUTES),
  },
  {
    path: 'candidate',
    canActivate: [authGuard, roleGuard('Candidate')],
    loadChildren: () =>
      import('./features/candidate/candidate.routes').then((m) => m.CANDIDATE_ROUTES),
  },
  {
    path: 'company',
    canActivate: [authGuard, roleGuard('CompanyAdmin', 'Recruiter')],
    loadChildren: () => import('./features/company/company.routes').then((m) => m.COMPANY_ROUTES),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page').then((m) => m.LoginPage),
    title: 'Log in — Leita',
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register-page').then((m) => m.RegisterPage),
    title: 'Create an account — Leita',
  },
  {
    path: '',
    loadChildren: () => import('./features/legal/legal.routes').then((m) => m.LEGAL_ROUTES),
  },
  ...devRoutes,
  { path: '**', redirectTo: 'jobs' },
];
