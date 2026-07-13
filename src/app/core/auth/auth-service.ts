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

const REFRESH_TOKEN_KEY = 'leita.refreshToken';

/**
 * Holds the session. The access token lives in memory only (a signal); the
 * rotating refresh token is kept in sessionStorage so a page reload can
 * silently restore the session — see docs/auth-token-storage.md for the
 * tradeoff and the backend follow-up (httpOnly cookie refresh).
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

  /** Resolves once the initial session restore (if any) has finished. */
  readonly ready: Promise<void> = this.restoreSession();

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

  /** Exchanges the stored refresh token for a new pair. Throws if none or rejected. */
  async refresh(): Promise<void> {
    const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error('No refresh token available.');
    }
    this.applyTokens(await firstValueFrom(this.api.refresh(refreshToken)));
  }

  logout(): void {
    this.accessTokenSignal.set(null);
    this.userSignal.set(null);
    this.follows.reset();
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  private applyTokens(tokens: AuthResponse): void {
    this.accessTokenSignal.set(tokens.accessToken);
    this.userSignal.set(decodeUser(tokens.accessToken));
    sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  private async restoreSession(): Promise<void> {
    if (!sessionStorage.getItem(REFRESH_TOKEN_KEY)) {
      return;
    }
    try {
      await this.refresh();
    } catch {
      this.logout();
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
