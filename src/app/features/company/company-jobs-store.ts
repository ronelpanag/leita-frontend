import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiClient, AuthService, type JobPostingStatus, type JobPostingSummary } from '@core';
import { firstValueFrom } from 'rxjs';

export interface CompanyJobRow {
  readonly id: string;
  readonly title: string;
  readonly location: string | null;
  readonly status: JobPostingStatus;
  readonly applicationCount: number | null;
}

/**
 * The company's postings. The API has no "list my postings" endpoint yet
 * (docs/backend-follow-ups.md #5): published postings are recovered from the
 * public board filtered by companyId, and drafts created this session are
 * tracked locally so they can be published. Drafts from previous sessions are
 * invisible until the backend endpoint lands.
 */
@Injectable({ providedIn: 'root' })
export class CompanyJobsStore {
  private readonly api = inject(ApiClient);
  private readonly auth = inject(AuthService);

  private readonly publishedSignal = signal<readonly JobPostingSummary[]>([]);
  private readonly sessionDrafts = signal<readonly CompanyJobRow[]>([]);
  private readonly closedIds = signal<ReadonlySet<string>>(new Set());
  private readonly counts = signal<ReadonlyMap<string, number>>(new Map());
  readonly loading = signal(false);

  readonly rows = computed<readonly CompanyJobRow[]>(() => {
    const closed = this.closedIds();
    const counts = this.counts();
    const published = this.publishedSignal().map((job) => ({
      id: job.id,
      title: job.title,
      location: job.location,
      status: (closed.has(job.id) ? 'Closed' : 'Published') as JobPostingStatus,
      applicationCount: counts.get(job.id) ?? null,
    }));
    return [...this.sessionDrafts(), ...published];
  });

  async load(): Promise<void> {
    const companyId = this.auth.user()?.companyId;
    if (!companyId) {
      return;
    }
    this.loading.set(true);
    try {
      const page = await firstValueFrom(this.api.getOpenJobs(1, 100));
      const mine = page.items.filter((job) => job.companyId === companyId);
      this.publishedSignal.set(mine);
      // Application counts, one call per posting (flagged as N+1 in the docs).
      const counts = new Map<string, number>();
      await Promise.all(
        mine.map(async (job) => {
          try {
            const applications = await firstValueFrom(this.api.getApplicationsForJob(job.id));
            counts.set(job.id, applications.length);
          } catch {
            // Count stays unknown (rendered as —).
          }
        }),
      );
      this.counts.set(counts);
    } finally {
      this.loading.set(false);
    }
  }

  async createDraft(title: string, description: string, location: string | null): Promise<string> {
    const created = await firstValueFrom(this.api.createJob({ title, description, location }));
    this.sessionDrafts.update((drafts) => [
      { id: created.id, title, location, status: 'Draft', applicationCount: 0 },
      ...drafts,
    ]);
    return created.id;
  }

  async publish(id: string): Promise<void> {
    await firstValueFrom(this.api.publishJob(id));
    this.sessionDrafts.update((drafts) =>
      drafts.map((draft) =>
        draft.id === id ? { ...draft, status: 'Published' as JobPostingStatus } : draft,
      ),
    );
    await this.load();
    // A just-published draft now comes back from the public board; drop the local copy.
    this.sessionDrafts.update((drafts) =>
      drafts.filter((draft) => !this.publishedSignal().some((job) => job.id === draft.id)),
    );
  }

  async close(id: string): Promise<void> {
    await firstValueFrom(this.api.closeJob(id));
    this.closedIds.update((ids) => new Set([...ids, id]));
  }
}
