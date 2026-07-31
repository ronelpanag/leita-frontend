import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiClient, type JobPostingSummary, type PagedResult } from '@core';
import { Button, EmptyState, Spinner, TextInput } from '@shared';
import { firstValueFrom } from 'rxjs';
import { JobCard } from './job-card';

const PAGE_SIZE = 20;

/**
 * Public job board. Pagination and search are both server-side: `q` matches
 * title and description, `location` matches location. Filters and page live in
 * the URL so results are shareable and survive reload.
 */
@Component({
  selector: 'app-job-board-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, EmptyState, JobCard, ReactiveFormsModule, Spinner, TextInput],
  template: `
    <div class="mx-auto w-full max-w-3xl px-gutter py-section">
      <header>
        <p class="font-mono text-caption text-spruce-500">leita — to seek</p>
        <h1 class="mt-1 text-display">Open roles</h1>
        <p class="mt-2 max-w-xl text-body text-ink-muted">
          Every published posting, straight from the companies hiring. No account needed to look
          around.
        </p>
      </header>

      <form class="mt-8 grid gap-4 sm:grid-cols-2" role="search" (submit)="$event.preventDefault()">
        <app-text-input
          label="Keyword"
          type="search"
          name="q"
          autocomplete="off"
          placeholder="Engineer, designer…"
          [formControl]="keyword"
        />
        <app-text-input
          label="Location"
          type="search"
          name="location"
          autocomplete="off"
          placeholder="Oslo, remote…"
          [formControl]="place"
        />
      </form>

      <div class="mt-8" aria-live="polite">
        @if (loading()) {
          <div class="flex justify-center py-12">
            <app-spinner size="lg" label="Loading open roles…" />
          </div>
        } @else if (error()) {
          <app-empty-state
            title="Could not load the job board"
            description="Something went wrong while fetching open roles. Check your connection and try again."
          >
            <app-button variant="secondary" (click)="load()">Try again</app-button>
          </app-empty-state>
        } @else if (jobs().length === 0) {
          @if (hasFilters()) {
            <app-empty-state
              title="No roles match your search"
              description="Try a broader keyword, or clear the filters to see every open role."
            >
              <app-button variant="secondary" (click)="clearFilters()">Clear filters</app-button>
            </app-empty-state>
          } @else {
            <app-empty-state
              title="No open roles right now"
              description="Companies publish new postings all the time — check back soon."
            />
          }
        } @else {
          <p class="text-body-sm text-ink-muted">
            {{ resultSummary() }}
          </p>
          <ul class="mt-4 flex flex-col gap-4">
            @for (job of jobs(); track job.id) {
              <li>
                <app-job-card [job]="job" />
              </li>
            }
          </ul>

          @if (totalPages() > 1) {
            <nav class="mt-8 flex items-center justify-between" aria-label="Pagination">
              <app-button
                variant="secondary"
                size="sm"
                [disabled]="currentPage() <= 1"
                (click)="goToPage(currentPage() - 1)"
              >
                Previous
              </app-button>
              <span class="font-mono text-caption text-ink-muted">
                Page {{ currentPage() }} of {{ totalPages() }}
              </span>
              <app-button
                variant="secondary"
                size="sm"
                [disabled]="currentPage() >= totalPages()"
                (click)="goToPage(currentPage() + 1)"
              >
                Next
              </app-button>
            </nav>
          }
        }
      </div>
    </div>
  `,
})
export class JobBoardPage {
  private readonly api = inject(ApiClient);
  private readonly router = inject(Router);

  /**
   * Bound from query params via withComponentInputBinding. The router sets
   * these to undefined when the param is absent (the default only applies
   * before the first binding), so every read must coerce.
   */
  readonly page = input<string | undefined>('1');
  readonly q = input<string | undefined>('');
  readonly loc = input<string | undefined>('');

  protected readonly keyword = new FormControl('', { nonNullable: true });
  protected readonly place = new FormControl('', { nonNullable: true });

  private readonly keywordValue = toSignal(this.keyword.valueChanges, { initialValue: '' });
  private readonly placeValue = toSignal(this.place.valueChanges, { initialValue: '' });

  protected readonly result = signal<PagedResult<JobPostingSummary> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly currentPage = computed(() => Math.max(1, Number(this.page()) || 1));
  protected readonly totalPages = computed(() => this.result()?.totalPages ?? 0);

  protected readonly jobs = computed(() => this.result()?.items ?? []);

  protected readonly hasFilters = computed(
    () => this.keywordValue().trim() !== '' || this.placeValue().trim() !== '',
  );

  protected readonly resultSummary = computed(() => {
    const total = this.result()?.totalCount ?? 0;
    const noun = total === 1 ? 'open role' : 'open roles';
    return this.hasFilters() ? `${total} ${noun} match` : `${total} ${noun}`;
  });

  private urlSyncTimer: ReturnType<typeof setTimeout> | undefined;
  /** Last search terms actually sent to the API, so we don't refetch on echo. */
  private appliedQuery = { q: '', loc: '' };

  constructor() {
    // Seed the filter fields from the URL once.
    effect(() => {
      const q = this.q() ?? '';
      const loc = this.loc() ?? '';
      untracked(() => {
        if (q !== this.keyword.value) this.keyword.setValue(q, { emitEvent: true });
        if (loc !== this.place.value) this.place.setValue(loc, { emitEvent: true });
      });
    });

    // Reload whenever the page changes.
    effect(() => {
      this.currentPage();
      untracked(() => void this.load());
    });

    // Search is server-side, so a filter change both rewrites the URL and
    // refetches — debounced, and back to page 1 since the result set changed.
    effect(() => {
      const q = this.keywordValue().trim();
      const loc = this.placeValue().trim();
      untracked(() => {
        if (q === this.appliedQuery.q && loc === this.appliedQuery.loc) {
          return;
        }
        clearTimeout(this.urlSyncTimer);
        this.urlSyncTimer = setTimeout(() => {
          this.appliedQuery = { q, loc };
          void this.router.navigate([], {
            queryParams: { q: q || null, loc: loc || null, page: null },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
          void this.load();
        }, 300);
      });
    });
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      this.result.set(
        await firstValueFrom(
          this.api.getOpenJobs(
            this.currentPage(),
            PAGE_SIZE,
            this.keywordValue().trim(),
            this.placeValue().trim(),
          ),
        ),
      );
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected goToPage(page: number): void {
    void this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }

  protected clearFilters(): void {
    this.keyword.setValue('');
    this.place.setValue('');
  }
}
