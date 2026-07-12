import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import type { LeitaRole } from '../api/api-types';
import { AuthService } from './auth-service';

/**
 * Requires one of the given roles. Anonymous callers go to login with a
 * return URL; authenticated callers with the wrong role go to their own home.
 */
export function roleGuard(...roles: readonly LeitaRole[]): CanActivateFn {
  return async (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    await auth.ready;
    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login'], { queryParams: { returnTo: state.url } });
    }
    const role = auth.user()?.role;
    if (role && roles.includes(role)) {
      return true;
    }
    return router.createUrlTree([auth.homeUrl()]);
  };
}
