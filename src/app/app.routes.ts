import { Routes } from '@angular/router';

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

export const routes: Routes = [...devRoutes];
