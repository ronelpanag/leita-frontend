import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth-service';

/** Builds an unsigned JWT with the given payload (decode-only on the client). */
export function fakeJwt(payload: Record<string, unknown>): string {
  const encode = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'none' })}.${encode(payload)}.sig`;
}

export const CANDIDATE_JWT = fakeJwt({
  sub: 'user-1',
  email: 'nora@example.no',
  role: 'Candidate',
  'leita:candidate_id': 'c0ffee00-0000-0000-0000-000000000001',
});

export const COMPANY_JWT = fakeJwt({
  sub: 'user-2',
  email: 'admin@fjellheim.no',
  role: 'CompanyAdmin',
  'leita:company_id': 'c0ffee00-0000-0000-0000-000000000002',
});

describe('AuthService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    sessionStorage.clear();
  });

  it('stores the access token in memory and decodes the user on login', async () => {
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    const login = auth.login('nora@example.no', 'Passw0rd!');
    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    request.flush({
      accessToken: CANDIDATE_JWT,
      accessTokenExpiresAtUtc: new Date(Date.now() + 900_000).toISOString(),
      refreshToken: 'refresh-1',
    });
    await login;

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.user()).toEqual({
      email: 'nora@example.no',
      role: 'Candidate',
      candidateId: 'c0ffee00-0000-0000-0000-000000000001',
      companyId: null,
    });
    expect(auth.homeUrl()).toBe('/candidate');
    // Refresh token persisted for reload restore; access token is not.
    expect(sessionStorage.getItem('leita.refreshToken')).toBe('refresh-1');
    expect(Object.values(sessionStorage).includes(CANDIDATE_JWT)).toBe(false);
  });

  it('maps company roles to the company home', async () => {
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    const login = auth.login('admin@fjellheim.no', 'Passw0rd!');
    http.expectOne('/api/auth/login').flush({
      accessToken: COMPANY_JWT,
      accessTokenExpiresAtUtc: new Date().toISOString(),
      refreshToken: 'refresh-2',
    });
    await login;

    expect(auth.user()?.role).toBe('CompanyAdmin');
    expect(auth.homeUrl()).toBe('/company');
  });

  it('rotates the stored refresh token on refresh', async () => {
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);
    sessionStorage.setItem('leita.refreshToken', 'refresh-old');

    const refresh = auth.refresh();
    const request = http.expectOne('/api/auth/refresh');
    expect(request.request.body).toEqual({ refreshToken: 'refresh-old' });
    request.flush({
      accessToken: CANDIDATE_JWT,
      accessTokenExpiresAtUtc: new Date().toISOString(),
      refreshToken: 'refresh-new',
    });
    await refresh;

    expect(sessionStorage.getItem('leita.refreshToken')).toBe('refresh-new');
    expect(auth.isAuthenticated()).toBe(true);
  });

  it('clears everything on logout', async () => {
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    const login = auth.login('nora@example.no', 'Passw0rd!');
    http.expectOne('/api/auth/login').flush({
      accessToken: CANDIDATE_JWT,
      accessTokenExpiresAtUtc: new Date().toISOString(),
      refreshToken: 'refresh-1',
    });
    await login;

    auth.logout();
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.user()).toBeNull();
    expect(sessionStorage.getItem('leita.refreshToken')).toBeNull();
  });

  it('refresh rejects when no refresh token is stored', async () => {
    const auth = TestBed.inject(AuthService);
    await expect(auth.refresh()).rejects.toThrow();
  });

  it('restores the session on construction when a refresh token survives reload', async () => {
    sessionStorage.setItem('leita.refreshToken', 'refresh-from-last-visit');

    const auth = TestBed.inject(AuthService); // construction kicks off restore
    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne('/api/auth/refresh');
    expect(request.request.body).toEqual({ refreshToken: 'refresh-from-last-visit' });
    request.flush({
      accessToken: CANDIDATE_JWT,
      accessTokenExpiresAtUtc: new Date().toISOString(),
      refreshToken: 'refresh-rotated',
    });
    await auth.ready;

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.user()?.role).toBe('Candidate');
    expect(sessionStorage.getItem('leita.refreshToken')).toBe('refresh-rotated');
  });

  it('clears the stale token when restore is rejected', async () => {
    sessionStorage.setItem('leita.refreshToken', 'refresh-expired');

    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/auth/refresh').flush(null, { status: 401, statusText: 'Unauthorized' });
    await auth.ready;

    expect(auth.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('leita.refreshToken')).toBeNull();
  });
});
