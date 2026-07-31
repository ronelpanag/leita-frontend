import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../api/api-client';
import { FollowsStore } from '../candidate/follows-store';
import type {
  AuthResponse,
  LeitaRole,
  RegisterCandidateRequest,
  RegisterCompanyRequest,
} from '../api/api-types';

export interface AuthUser {
  readonly email: string;
  readonly role: LeitaRole;
  readonly candidateId: string | null;
  readonly companyId: string | null;
}

/**
 * Non-sensitive hint that a refresh cookie should exist, so anonymous visitors
 * to the public board don't pay for a doomed refresh round-trip on every load.
 * It is only an optimisation: the cookie is the actual credential, and the API
 * is the one that decides.
 */
const SESSION_HINT_KEY = 'leita.hasSession';

/**
 * Holds the session. The access token lives in memory only (a signal); the
 * rotating refresh token never reaches JavaScript at all — it is an httpOnly
 * cookie set by the API on login/register and rotated on every refresh. See
 * docs/auth-token-storage.md.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClient);
  private readonly follows = inject(FollowsStore);

  private readonly accessTokenSignal = signal<string | null>(null);
  private readonly userSignal = signal<AuthUser | null>(null);

  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.accessTokenSignal() !== null);

  /** Where this user lands after login: their portal, or the public board. */
  readonly homeUrl = computed(() => {
    switch (this.userSignal()?.role) {
      case 'Candidate':
        return '/candidate';
      case 'CompanyAdmin':
      case 'Recruiter':
        return '/company';
      default:
        return '/jobs';
    }
  });

  private restorePromise: Promise<void> | null = null;

  /**
   * Resolves once the initial session restore (if any) has finished.
   *
   * Deliberately lazy: kicking the restore off from a field initializer would
   * issue an HTTP call while this service is still being constructed, and
   * `authInterceptor` injects AuthService — Angular reports that as a circular
   * dependency (NG0200), the refresh fails, and every reload silently logs the
   * user out. Starting on first access means the instance is fully constructed
   * by the time the interceptor asks for it. `provideAppInitializer` in
   * app.config.ts touches this during bootstrap, so the restore still happens
   * before the first route renders.
   */
  get ready(): Promise<void> {
    this.restorePromise ??= this.restoreSession();
    return this.restorePromise;
  }

  async login(email: string, password: string): Promise<void> {
    this.applyTokens(await firstValueFrom(this.api.login(email, password)));
  }

  async registerCandidate(request: RegisterCandidateRequest): Promise<void> {
    const response = await firstValueFrom(this.api.registerCandidate(request));
    this.applyTokens(response.tokens);
  }

  async registerCompany(request: RegisterCompanyRequest): Promise<void> {
    const response = await firstValueFrom(this.api.registerCompany(request));
    this.applyTokens(response.tokens);
  }

  /** Exchanges the refresh cookie for a new pair. Rejects when the API declines. */
  async refresh(): Promise<void> {
    this.applyTokens(await firstValueFrom(this.api.refresh()));
  }

  /**
   * Clears the local session and revokes the refresh token server-side. The
   * local state is dropped first so the UI never lags behind the user's intent
   * even if the network call fails.
   */
  logout(): void {
    this.clearSession();
    firstValueFrom(this.api.logout()).catch(() => undefined);
  }

  private applyTokens(tokens: AuthResponse): void {
    this.accessTokenSignal.set(tokens.accessToken);
    this.userSignal.set(decodeUser(tokens.accessToken));
    localStorage.setItem(SESSION_HINT_KEY, '1');
    // An explicit login/register settles the session: guards awaiting `ready`
    // must not kick off a redundant restore for the session we just created.
    this.restorePromise ??= Promise.resolve();
  }

  private clearSession(): void {
    this.accessTokenSignal.set(null);
    this.userSignal.set(null);
    this.follows.reset();
    localStorage.removeItem(SESSION_HINT_KEY);
    // There is nothing left to restore; keep `ready` from starting one later.
    this.restorePromise ??= Promise.resolve();
  }

  private async restoreSession(): Promise<void> {
    if (localStorage.getItem(SESSION_HINT_KEY) === null) {
      return;
    }
    try {
      await this.refresh();
    } catch {
      // The cookie is gone or expired; drop the hint so the next load is quiet.
      this.clearSession();
    }
  }
}

interface LeitaTokenPayload {
  readonly email?: string;
  readonly role?: string | readonly string[];
  readonly 'leita:candidate_id'?: string;
  readonly 'leita:company_id'?: string;
}

/** Decodes the JWT payload (no signature verification — the API enforces that). */
function decodeUser(accessToken: string): AuthUser | null {
  try {
    const payloadPart = accessToken.split('.')[1];
    const json = atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as LeitaTokenPayload;
    const roles = Array.isArray(payload.role) ? payload.role : [payload.role];
    const role = roles.find(
      (r): r is LeitaRole => r === 'Candidate' || r === 'CompanyAdmin' || r === 'Recruiter',
    );
    if (!role || !payload.email) {
      return null;
    }
    return {
      email: payload.email,
      role,
      candidateId: payload['leita:candidate_id'] ?? null,
      companyId: payload['leita:company_id'] ?? null,
    };
  } catch {
    return null;
  }
}
