import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { AuthService } from './auth-service';
import { CANDIDATE_JWT } from './testing/fake-tokens';
import { authGuard } from './auth-guard';
import { roleGuard } from './role-guard';

const route = {} as ActivatedRouteSnapshot;
const state = { url: '/company/jobs' } as RouterStateSnapshot;

async function loginAsCandidate(): Promise<void> {
  const auth = TestBed.inject(AuthService);
  const http = TestBed.inject(HttpTestingController);
  const login = auth.login('nora@example.no', 'Passw0rd!');
  http.expectOne('/api/auth/login').flush({
    accessToken: CANDIDATE_JWT,
    accessTokenExpiresAtUtc: new Date().toISOString(),
    refreshToken: 'refresh-1',
  });
  await login;
}

describe('authGuard', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });
  afterEach(() => sessionStorage.clear());

  it('redirects anonymous users to login with a returnTo url', async () => {
    const result = await TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(result).toBeInstanceOf(UrlTree);
    expect(String(result)).toBe('/login?returnTo=%2Fcompany%2Fjobs');
  });

  it('allows authenticated users through', async () => {
    await loginAsCandidate();
    const result = await TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(result).toBe(true);
  });
});

describe('roleGuard', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });
  afterEach(() => sessionStorage.clear());

  it('blocks a candidate from company routes, redirecting to their home', async () => {
    await loginAsCandidate();
    const result = await TestBed.runInInjectionContext(() =>
      roleGuard('CompanyAdmin', 'Recruiter')(route, state),
    );
    expect(String(result)).toBe('/candidate');
  });

  it('allows a candidate into candidate routes', async () => {
    await loginAsCandidate();
    const result = await TestBed.runInInjectionContext(() => roleGuard('Candidate')(route, state));
    expect(result).toBe(true);
  });

  it('sends anonymous users to login', async () => {
    const result = await TestBed.runInInjectionContext(() => roleGuard('Candidate')(route, state));
    expect(String(result)).toBe('/login?returnTo=%2Fcompany%2Fjobs');
  });
});
