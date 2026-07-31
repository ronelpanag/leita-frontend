import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth-service';
import { CANDIDATE_JWT, COMPANY_JWT, fakeJwt } from './testing/fake-tokens';

const SESSION_HINT = 'leita.hasSession';

/** The refresh token lives in an httpOnly cookie, so responses only carry the pair. */
function tokens(accessToken = CANDIDATE_JWT) {
  return {
    accessToken,
    accessTokenExpiresAtUtc: new Date(Date.now() + 900_000).toISOString(),
    refreshToken: 'rotated-server-side',
  };
}

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    localStorage.clear();
  });

  it('keeps the access token in memory only and never persists a refresh token', async () => {
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    const login = auth.login('nora@example.no', 'Passw0rd!');
    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    request.flush(tokens());
    await login;

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.user()).toEqual({
      email: 'nora@example.no',
      role: 'Candidate',
      candidateId: 'c0ffee00-0000-0000-0000-000000000001',
      companyId: null,
    });
    expect(auth.homeUrl()).toBe('/candidate');
    // Only a non-sensitive hint is stored; no token material reaches storage.
    expect(localStorage.getItem(SESSION_HINT)).toBe('1');
    expect(JSON.stringify(localStorage)).not.toContain('rotated-server-side');
    expect(JSON.stringify(localStorage)).not.toContain(CANDIDATE_JWT);
  });

  it('maps company roles to the company home', async () => {
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    const login = auth.login('admin@fjellheim.no', 'Passw0rd!');
    http.expectOne('/api/auth/login').flush(tokens(COMPANY_JWT));
    await login;

    expect(auth.user()?.role).toBe('CompanyAdmin');
    expect(auth.homeUrl()).toBe('/company');
  });

  it('refreshes from the cookie, sending no token in the body', async () => {
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    const refresh = auth.refresh();
    const request = http.expectOne('/api/auth/refresh');
    expect(request.request.body).toBeNull();
    expect(request.request.withCredentials).toBe(true);
    request.flush(tokens());
    await refresh;

    expect(auth.isAuthenticated()).toBe(true);
  });

  it('revokes the session server-side on logout', async () => {
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    const login = auth.login('nora@example.no', 'Passw0rd!');
    http.expectOne('/api/auth/login').flush(tokens());
    await login;

    auth.logout();

    const request = http.expectOne('/api/auth/logout');
    expect(request.request.withCredentials).toBe(true);
    request.flush(null);

    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.user()).toBeNull();
    expect(localStorage.getItem(SESSION_HINT)).toBeNull();
  });

  it('stays quiet on boot when no previous session is hinted', async () => {
    const auth = TestBed.inject(AuthService);
    await auth.ready;
    // No hint → no doomed refresh round-trip for anonymous visitors.
    TestBed.inject(HttpTestingController).expectNone('/api/auth/refresh');
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('restores the session on boot when the hint says a cookie should exist', async () => {
    localStorage.setItem(SESSION_HINT, '1');

    const auth = TestBed.inject(AuthService);
    const readyPromise = auth.ready;
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/auth/refresh').flush(tokens());
    await readyPromise;

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.user()?.role).toBe('Candidate');
  });

  it('clears the hint when the cookie turns out to be gone', async () => {
    localStorage.setItem(SESSION_HINT, '1');

    const auth = TestBed.inject(AuthService);
    const readyPromise = auth.ready;
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/auth/refresh').flush(null, { status: 401, statusText: 'Unauthorized' });
    await readyPromise;

    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(SESSION_HINT)).toBeNull();
  });

  it('treats a malformed token as an unauthenticated session', async () => {
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    const login = auth.login('nora@example.no', 'pw');
    http.expectOne('/api/auth/login').flush(tokens('not-a-jwt'));
    await login;

    expect(auth.user()).toBeNull();
    expect(auth.homeUrl()).toBe('/jobs');
  });

  it('ignores a token whose role is not a Leita role', async () => {
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    const login = auth.login('someone@example.no', 'pw');
    http
      .expectOne('/api/auth/login')
      .flush(tokens(fakeJwt({ email: 'someone@example.no', role: 'Wizard' })));
    await login;

    expect(auth.user()).toBeNull();
  });
});
