import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth-service';
import { CANDIDATE_JWT } from './testing/fake-tokens';
import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
    localStorage.clear();
  });

  async function login(): Promise<void> {
    const auth = TestBed.inject(AuthService);
    const request = auth.login('nora@example.no', 'Passw0rd!');
    controller.expectOne('/api/auth/login').flush({
      accessToken: CANDIDATE_JWT,
      accessTokenExpiresAtUtc: new Date().toISOString(),
    });
    await request;
  }

  it('attaches the bearer token when a session exists', async () => {
    await login();
    const call = firstValueFrom(http.get('/api/candidate/applications'));
    const request = controller.expectOne('/api/candidate/applications');
    expect(request.request.headers.get('Authorization')).toBe(`Bearer ${CANDIDATE_JWT}`);
    request.flush([]);
    await call;
  });

  it('sends no Authorization header without a session', async () => {
    const call = firstValueFrom(http.get('/api/public/jobs'));
    const request = controller.expectOne('/api/public/jobs');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 });
    await call;
  });

  it('silently refreshes on 401 and retries the original request', async () => {
    await login();
    const call = firstValueFrom(http.get('/api/candidate/applications'));

    controller
      .expectOne('/api/candidate/applications')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    const refresh = controller.expectOne('/api/auth/refresh');
    // The refresh token travels as an httpOnly cookie, never in the body.
    expect(refresh.request.body).toBeNull();
    expect(refresh.request.withCredentials).toBe(true);
    refresh.flush({
      accessToken: CANDIDATE_JWT,
      accessTokenExpiresAtUtc: new Date().toISOString(),
    });
    // The retry is issued after the refresh promise resolves (a microtask).
    await new Promise((resolve) => setTimeout(resolve, 0));

    const retried = controller.expectOne('/api/candidate/applications');
    expect(retried.request.headers.get('Authorization')).toBe(`Bearer ${CANDIDATE_JWT}`);
    retried.flush([{ id: 'a1' }]);

    await expect(call).resolves.toEqual([{ id: 'a1' }]);
  });

  it('logs out and redirects to login when the refresh also fails', async () => {
    await login();
    const auth = TestBed.inject(AuthService);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const call = firstValueFrom(http.get('/api/candidate/applications'));
    controller
      .expectOne('/api/candidate/applications')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    controller
      .expectOne('/api/auth/refresh')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(call).rejects.toBeTruthy();
    // Losing the session also revokes it server-side.
    controller.expectOne('/api/auth/logout').flush(null);
    expect(auth.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnTo: expect.any(String) },
    });
  });

  it('restores a session at bootstrap with the interceptor installed', async () => {
    // Regression: starting the restore from AuthService's field initializer
    // made the interceptor's inject(AuthService) a circular dependency
    // (NG0200), so every reload silently logged the user out. The restore is
    // lazy now, and this test is the one that fails if it moves back.
    localStorage.setItem('leita.hasSession', '1');

    const auth = TestBed.inject(AuthService);
    const readyPromise = auth.ready;

    const request = controller.expectOne('/api/auth/refresh');
    expect(request.request.withCredentials).toBe(true);
    request.flush({
      accessToken: CANDIDATE_JWT,
      accessTokenExpiresAtUtc: new Date().toISOString(),
    });
    await readyPromise;

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.user()?.role).toBe('Candidate');
  });

  it('does not try to refresh when the login itself returns 401', async () => {
    const auth = TestBed.inject(AuthService);
    const attempt = auth.login('nora@example.no', 'wrong');
    controller
      .expectOne('/api/auth/login')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    await expect(attempt).rejects.toBeTruthy();
    controller.expectNone('/api/auth/refresh');
  });
});
