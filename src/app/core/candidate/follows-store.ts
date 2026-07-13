import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../api/api-client';
import type { Company } from '../api/api-types';

/**
 * Followed-companies state for the signed-in candidate. Lives in core so both
 * the public job detail page (follow button) and the candidate portal
 * (followed list) share one source of truth without crossing feature
 * boundaries. Mutations are optimistic with rollback on failure.
 */
@Injectable({ providedIn: 'root' })
export class FollowsStore {
  private readonly api = inject(ApiClient);

  private readonly companiesSignal = signal<readonly Company[] | null>(null);
  private readonly pendingSignal = signal<ReadonlySet<string>>(new Set());

  /** null until the first load completes. */
  readonly companies = this.companiesSignal.asReadonly();
  readonly loaded = computed(() => this.companiesSignal() !== null);

  isFollowing(companyId: string): boolean {
    return (this.companiesSignal() ?? []).some((company) => company.id === companyId);
  }

  isPending(companyId: string): boolean {
    return this.pendingSignal().has(companyId);
  }

  async load(): Promise<void> {
    this.companiesSignal.set(await firstValueFrom(this.api.getFollowedCompanies()));
  }

  /**
   * Follows optimistically (a placeholder row keeps isFollowing truthful
   * immediately), then reloads the authoritative list for real names.
   */
  async follow(companyId: string): Promise<void> {
    const before = this.companiesSignal();
    this.companiesSignal.set([
      ...(before ?? []),
      { id: companyId, name: '…', description: null, website: null },
    ]);
    this.markPending(companyId, true);
    try {
      await firstValueFrom(this.api.followCompany(companyId));
      await this.load();
    } catch (error) {
      this.companiesSignal.set(before);
      throw error;
    } finally {
      this.markPending(companyId, false);
    }
  }

  async unfollow(companyId: string): Promise<void> {
    const before = this.companiesSignal();
    this.companiesSignal.set((before ?? []).filter((company) => company.id !== companyId));
    this.markPending(companyId, true);
    try {
      await firstValueFrom(this.api.unfollowCompany(companyId));
    } catch (error) {
      this.companiesSignal.set(before);
      throw error;
    } finally {
      this.markPending(companyId, false);
    }
  }

  /** Called on logout so the next candidate does not see stale rows. */
  reset(): void {
    this.companiesSignal.set(null);
    this.pendingSignal.set(new Set());
  }

  private markPending(companyId: string, pending: boolean): void {
    this.pendingSignal.update((current) => {
      const next = new Set(current);
      if (pending) {
        next.add(companyId);
      } else {
        next.delete(companyId);
      }
      return next;
    });
  }
}
