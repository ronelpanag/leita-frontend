import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { AuthService, authInterceptor } from '@core';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Block bootstrap until the session restore settles. Without this, a page
    // reload renders one frame as anonymous — long enough for a signed-in
    // candidate to hit "Apply" and be bounced to login. AuthService.ready
    // never rejects, so a failed restore still boots (as anonymous).
    provideAppInitializer(() => inject(AuthService).ready),
  ],
};
