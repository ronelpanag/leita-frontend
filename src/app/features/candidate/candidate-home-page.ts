import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiClient, AuthService, type Application, type PipelineStage } from '@core';
import { Badge, Button, ButtonLink, EmptyState, Spinner, type BadgeTone } from '@shared';
import { firstValueFrom } from 'rxjs';

const STAGE_TONES: Record<PipelineStage, BadgeTone> = {
  Applied: 'neutral',
  Screening: 'info',
  Interview: 'warning',
  Offer: 'success',
  Hired: 'success',
  Rejected: 'danger',
};

const submittedFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const interviewFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

@Component({
  selector: 'app-candidate-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge, Button, ButtonLink, EmptyState, RouterLink, Spinner],
  template: `
    <div class="mx-auto w-full max-w-3xl px-gutter py-section">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-heading-1">Your applications</h1>
          <p class="mt-1 text-body-sm text-ink-muted">
            Signed in as <span class="font-mono">{{ auth.user()?.email }}</span>
          </p>
        </div>
        <a
          routerLink="/candidate/following"
          class="rounded-control px-3 py-1.5 text-body-sm font-medium text-spruce-700
                 transition-colors hover:bg-spruce-50"
        >
          Companies you follow
        </a>
      </header>

      <div class="mt-8" aria-live="polite">
        @if (loading()) {
          <div class="flex justify-center py-12">
            <app-spinner size="lg" label="Loading your applications…" />
          </div>
        } @else if (error()) {
          <app-empty-state
            title="Could not load your applications"
            description="Something went wrong. Try again in a moment."
          >
            <app-button variant="secondary" (click)="load()">Try again</app-button>
          </app-empty-state>
        } @else if (rows().length === 0) {
          <app-empty-state
            title="No applications yet"
            description="Roles you apply to appear here with their place on the hiring trail."
          >
            <app-button-link to="/jobs" variant="secondary">Browse open roles</app-button-link>
          </app-empty-state>
        } @else {
          <p class="text-body-sm text-ink-muted">
            {{ rows().length }} {{ rows().length === 1 ? 'application' : 'applications' }}
          </p>
          <ul class="mt-4 flex flex-col gap-3">
            @for (row of rows(); track row.id) {
              <li
                class="flex flex-wrap items-center justify-between gap-3 rounded-card border
                       border-line bg-paper px-5 py-4"
              >
                <div class="min-w-0">
                  <a
                    [routerLink]="['/jobs', row.jobPostingId]"
                    class="break-words text-body font-medium text-ink hover:text-spruce-700 hover:underline"
                  >
                    {{ row.jobTitle ?? 'Role no longer available' }}
                  </a>
                  <p class="mt-0.5 font-mono text-caption text-ink-muted">
                    @if (row.companyName) {
                      {{ row.companyName }} ·
                    }
                    Applied {{ submittedLabel(row) }}
                    @if (nextInterviewLabel(row); as interview) {
                      · Interview {{ interview }}
                    }
                  </p>
                </div>
                <app-badge [tone]="stageTone(row.currentStage)" [waymark]="true">
                  {{ row.currentStage }}
                </app-badge>
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
})
export class CandidateHomePage {
  private readonly api = inject(ApiClient);
  protected readonly auth = inject(AuthService);

  protected readonly rows = signal<readonly Application[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      // The API denormalizes jobTitle/companyName onto each row — no fan-out.
      this.rows.set(await firstValueFrom(this.api.getMyApplications()));
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected stageTone(stage: PipelineStage): BadgeTone {
    return STAGE_TONES[stage];
  }

  protected submittedLabel(application: Application): string {
    return submittedFormat.format(new Date(application.submittedAtUtc));
  }

  protected nextInterviewLabel(application: Application): string | null {
    const upcoming = application.interviews
      .map((interview) => new Date(interview.scheduledAtUtc))
      .filter((date) => date.getTime() > Date.now())
      .sort((a, b) => a.getTime() - b.getTime())[0];
    return upcoming ? interviewFormat.format(upcoming) : null;
  }
}
