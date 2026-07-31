import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuthService, type JobPostingStatus } from '@core';
import {
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  Modal,
  Spinner,
  ToastService,
  type BadgeTone,
} from '@shared';
import { CompanyJobsStore } from './company-jobs-store';

const STATUS_TONES: Record<JobPostingStatus, BadgeTone> = {
  Draft: 'neutral',
  Published: 'success',
  Closed: 'danger',
};

@Component({
  selector: 'app-company-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge, Button, ButtonLink, EmptyState, Modal, Spinner],
  template: `
    <div class="mx-auto w-full max-w-4xl px-gutter py-section">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-heading-1">Hiring dashboard</h1>
          <p class="mt-1 text-body-sm text-ink-muted">
            Signed in as <span class="font-mono">{{ auth.user()?.email }}</span>
          </p>
        </div>
        <app-button-link to="/company/jobs/new">New job posting</app-button-link>
      </header>

      <div class="mt-8" aria-live="polite">
        @if (store.loading()) {
          <div class="flex justify-center py-12">
            <app-spinner size="lg" label="Loading your postings…" />
          </div>
        } @else if (store.rows().length === 0) {
          <app-empty-state
            title="No job postings yet"
            description="Create your first posting as a draft, review it, then publish it to the public board."
          >
            <app-button-link to="/company/jobs/new" variant="secondary">
              Create your first job
            </app-button-link>
          </app-empty-state>
        } @else {
          <ul class="flex flex-col gap-3">
            @for (row of store.rows(); track row.id) {
              <li
                class="flex flex-wrap items-center justify-between gap-3 rounded-card border
                       border-line bg-paper px-5 py-4"
              >
                <div class="min-w-0">
                  <p class="break-words text-body font-medium text-ink">{{ row.title }}</p>
                  <p class="mt-0.5 font-mono text-caption text-ink-muted">
                    {{ row.location || 'Location not specified' }}
                    · {{ row.applicationCount }}
                    {{ row.applicationCount === 1 ? 'application' : 'applications' }}
                  </p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <app-badge [tone]="statusTone(row.status)" [waymark]="true">
                    {{ row.status }}
                  </app-badge>
                  @if (row.status !== 'Closed') {
                    <app-button-link
                      [to]="['/company/jobs', row.id, 'edit']"
                      variant="ghost"
                      size="sm"
                    >
                      Edit
                    </app-button-link>
                  }
                  @if (row.status === 'Draft') {
                    <app-button
                      size="sm"
                      [loading]="pending() === row.id"
                      (click)="publish(row.id, row.title)"
                    >
                      Publish
                    </app-button>
                  }
                  @if (row.status === 'Published') {
                    <app-button-link
                      [to]="['/company/jobs', row.id, 'pipeline']"
                      variant="secondary"
                      size="sm"
                    >
                      View pipeline
                    </app-button-link>
                    <app-button
                      variant="danger"
                      size="sm"
                      [loading]="pending() === row.id"
                      (click)="confirmClose(row.id, row.title)"
                    >
                      Close
                    </app-button>
                  }
                  @if (row.status === 'Closed') {
                    <app-button-link
                      [to]="['/company/jobs', row.id, 'pipeline']"
                      variant="secondary"
                      size="sm"
                    >
                      View pipeline
                    </app-button-link>
                  }
                </div>
              </li>
            }
          </ul>
        }
      </div>

      <app-modal title="Close this posting?" [(open)]="closeConfirmOpen">
        <p class="text-body-sm text-ink-muted">
          Candidates can no longer apply to “{{ closeTarget()?.title }}” once it closes, and it
          leaves the public board. This cannot be undone.
        </p>
        <div class="mt-5 flex justify-end gap-3">
          <app-button variant="secondary" (click)="closeConfirmOpen.set(false)">
            Keep it open
          </app-button>
          <app-button variant="danger" [loading]="pending() !== null" (click)="close()">
            Close posting
          </app-button>
        </div>
      </app-modal>
    </div>
  `,
})
export class CompanyHomePage {
  protected readonly auth = inject(AuthService);
  protected readonly store = inject(CompanyJobsStore);
  private readonly toasts = inject(ToastService);

  protected readonly pending = signal<string | null>(null);
  protected readonly closeConfirmOpen = signal(false);
  protected readonly closeTarget = signal<{ id: string; title: string } | null>(null);

  constructor() {
    void this.store.load();
  }

  protected statusTone(status: JobPostingStatus): BadgeTone {
    return STATUS_TONES[status];
  }

  protected async publish(id: string, title: string): Promise<void> {
    this.pending.set(id);
    try {
      await this.store.publish(id);
      this.toasts.show(`Published ${title}`, 'success');
    } catch {
      this.toasts.show(`Could not publish ${title}. Try again.`, 'error');
    } finally {
      this.pending.set(null);
    }
  }

  protected confirmClose(id: string, title: string): void {
    this.closeTarget.set({ id, title });
    this.closeConfirmOpen.set(true);
  }

  protected async close(): Promise<void> {
    const target = this.closeTarget();
    if (!target) {
      return;
    }
    this.pending.set(target.id);
    try {
      await this.store.close(target.id);
      this.closeConfirmOpen.set(false);
      this.toasts.show(`Closed ${target.title}`, 'info');
    } catch {
      this.toasts.show(`Could not close ${target.title}. Try again.`, 'error');
    } finally {
      this.pending.set(null);
    }
  }
}
