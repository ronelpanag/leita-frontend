import {
  HttpErrorResponse,
  type HttpEvent,
  type HttpInterceptorFn,
  type HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { type Observable, from, switchMap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SKIP_AUTH_REFRESH } from '../api/api-client';
import { AuthService } from './auth-service';

/**
 * Attaches the bearer token to API requests, and on a 401 attempts one
 * silent refresh before retrying. If the refresh fails, the session is
 * cleared and the user is sent to login with a return URL.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const authedRequest = withBearer(request, auth.accessToken());

  if (request.context.get(SKIP_AUTH_REFRESH)) {
    return next(authedRequest);
  }

  return next(authedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }
      return from(auth.refresh()).pipe(
        switchMap(() => next(withBearer(request, auth.accessToken()))),
        catchError((refreshError: unknown) => onSessionLost(auth, router, refreshError)),
      );
    }),
  );
};

function withBearer(request: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;
}

function onSessionLost(
  auth: AuthService,
  router: Router,
  error: unknown,
): Observable<HttpEvent<unknown>> {
  auth.logout();
  void router.navigate(['/login'], { queryParams: { returnTo: router.url } });
  return throwError(() => error);
}
