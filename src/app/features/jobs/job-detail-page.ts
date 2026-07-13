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
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { ApiClient, AuthService, type JobPostingDetail } from '@core';
import { Badge, Button, Card, EmptyState, Spinner } from '@shared';
import { firstValueFrom } from 'rxjs';

const publishedFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' });

@Component({
  selector: 'app-job-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge, Button, Card, EmptyState, RouterLink, Spinner],
  template: `
    <div class="mx-auto w-full max-w-3xl px-gutter py-section">
      <a routerLink="/jobs" class="font-mono text-caption text-spruce-700 hover:underline">
        ← All open roles
      </a>

      @if (loading()) {
        <div class="flex justify-center py-16">
          <app-spinner size="lg" label="Loading role…" />
        </div>
      } @else if (error() || !job()) {
        <div class="mt-6">
          <app-empty-state
            title="This role could not be loaded"
            description="It may have been removed, or something went wrong. Head back to the board to keep looking."
          >
            <app-button variant="secondary" (click)="load()">Try again</app-button>
          </app-empty-state>
        </div>
      } @else {
        <article class="mt-6">
          <app-card [featured]="job()!.promoted ?? false">
            <header class="flex flex-col gap-3">
              <div class="flex items-start justify-between gap-3">
                <h1 class="min-w-0 break-words text-heading-1">{{ job()!.title }}</h1>
                @if (job()!.promoted) {
                  <app-badge tone="warning">Featured</app-badge>
                }
              </div>
              <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-ink-muted">
                <span>{{ job()!.location || 'Location not specified' }}</span>
                @if (publishedLabel()) {
                  <span aria-hidden="true" class="text-line-strong">·</span>
                  <span class="font-mono text-caption">Published {{ publishedLabel() }}</span>
                }
                @if (job()!.status !== 'Published') {
                  <app-badge tone="danger">{{
                    job()!.status === 'Closed' ? 'Closed' : 'Not published'
                  }}</app-badge>
                }
              </p>
            </header>

            <div class="mt-6 flex flex-col gap-4 text-body text-ink">
              @for (paragraph of paragraphs(); track $index) {
                <p class="break-words">{{ paragraph }}</p>
              }
            </div>

            <footer class="mt-8 border-t border-line pt-6">
              @if (job()!.status !== 'Published') {
                <p class="text-body-sm text-ink-muted">
                  This role is no longer accepting applications.
                </p>
              } @else if (!auth.isAuthenticated()) {
                <div class="flex flex-wrap items-center gap-4">
                  <app-button (click)="applyAnonymous()">Apply for this role</app-button>
                  <p class="text-body-sm text-ink-muted">
                    You'll be asked to log in first — we bring you right back.
                  </p>
                </div>
              } @else if (auth.user()?.role === 'Candidate') {
                <app-button (click)="applyAsCandidate()">Apply for this role</app-button>
              } @else {
                <p class="text-body-sm text-ink-muted">
                  You're signed in with a company account — applications are for candidates.
                </p>
              }
            </footer>
          </app-card>
        </article>
      }
    </div>
  `,
})
export class JobDetailPage {
  private readonly api = inject(ApiClient);
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  protected readonly auth = inject(AuthService);

  /** Route param via withComponentInputBinding. */
  readonly id = input.required<string>();

  protected readonly job = signal<JobPostingDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly paragraphs = computed(() =>
    (this.job()?.description ?? '')
      .split(/\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
  );

  protected readonly publishedLabel = computed(() => {
    const publishedAt = this.job()?.publishedAtUtc;
    return publishedAt ? publishedFormat.format(new Date(publishedAt)) : '';
  });

  constructor() {
    effect(() => {
      this.id();
      untracked(() => void this.load());
    });

    // SEO: meaningful title + description per job. Full SSR is a documented
    // future improvement (docs/backend-follow-ups.md); for now this covers
    // browser tabs, history and link previews in clients that execute JS.
    effect(() => {
      const job = this.job();
      if (job) {
        this.titleService.setTitle(`${job.title} — Leita`);
        this.meta.updateTag({
          name: 'description',
          content: `${job.title}${job.location ? ` in ${job.location}` : ''}. ${job.description.slice(0, 140)}…`,
        });
      }
    });
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      this.job.set(await firstValueFrom(this.api.getJob(this.id())));
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected applyAnonymous(): void {
    void this.router.navigate(['/login'], {
      queryParams: { returnTo: `/jobs/${this.id()}` },
    });
  }

  protected applyAsCandidate(): void {
    void this.router.navigate(['/candidate/apply', this.id()]);
  }
}
