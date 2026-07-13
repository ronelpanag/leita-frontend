import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiClient, type JobPostingDetail } from '@core';
import { Button, Card, EmptyState, Spinner, TextArea, ToastService } from '@shared';
import { firstValueFrom } from 'rxjs';

/** Application submission flow, reached from a job detail page's Apply button. */
@Component({
  selector: 'app-apply-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card, EmptyState, ReactiveFormsModule, RouterLink, Spinner, TextArea],
  template: `
    <div class="mx-auto w-full max-w-2xl px-gutter py-section">
      @if (loading()) {
        <div class="flex justify-center py-16">
          <app-spinner size="lg" label="Loading role…" />
        </div>
      } @else if (loadError() || !job()) {
        <app-empty-state
          title="This role could not be loaded"
          description="It may have been removed. Head back to the board to keep looking."
        >
          <app-button variant="secondary" (click)="loadJob()">Try again</app-button>
        </app-empty-state>
      } @else if (job()!.status !== 'Published') {
        <app-empty-state
          title="This role is no longer open"
          description="The posting closed before you could apply. More roles are waiting on the board."
        >
          <a routerLink="/jobs"><app-button variant="secondary">Browse open roles</app-button></a>
        </app-empty-state>
      } @else {
        <a
          [routerLink]="['/jobs', jobId()]"
          class="font-mono text-caption text-spruce-700 hover:underline"
        >
          ← Back to the role
        </a>
        <app-card class="mt-4 block">
          <p class="font-mono text-caption text-spruce-500">Apply</p>
          <h1 class="mt-1 text-heading-2">{{ job()!.title }}</h1>
          <p class="mt-1 text-body-sm text-ink-muted">
            {{ job()!.location || 'Location not specified' }}
          </p>

          <form class="mt-6 flex flex-col gap-4" (submit)="onSubmit($event)">
            <app-text-area
              label="Cover letter"
              name="cover-letter"
              [optionalHint]="true"
              [rows]="8"
              placeholder="Tell them why this role is your next waymark…"
              hint="A few sentences go a long way. You can also leave it empty."
              [formControl]="coverLetter"
            />
            @if (submitError()) {
              <p
                aria-live="polite"
                class="rounded-control bg-rowan-100 px-3 py-2 text-body-sm text-rowan-700"
              >
                {{ submitError() }}
              </p>
            }
            <div class="flex items-center gap-3">
              <app-button type="submit" [loading]="submitting()">Submit application</app-button>
              <a [routerLink]="['/jobs', jobId()]">
                <app-button variant="ghost">Cancel</app-button>
              </a>
            </div>
          </form>
        </app-card>
      }
    </div>
  `,
})
export class ApplyPage {
  private readonly api = inject(ApiClient);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  readonly jobId = input.required<string>();

  protected readonly job = signal<JobPostingDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly submitting = signal(false);
  protected readonly submitError = signal('');

  protected readonly coverLetter = new FormControl('', { nonNullable: true });

  constructor() {
    effect(() => {
      this.jobId();
      untracked(() => void this.loadJob());
    });
  }

  protected async loadJob(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(false);
    try {
      this.job.set(await firstValueFrom(this.api.getJob(this.jobId())));
    } catch {
      this.loadError.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.submitting.set(true);
    this.submitError.set('');
    try {
      await firstValueFrom(
        this.api.submitApplication({
          jobPostingId: this.jobId(),
          coverLetter: this.coverLetter.value.trim() || null,
        }),
      );
      this.toasts.show('Application submitted', 'success');
      await this.router.navigateByUrl('/candidate');
    } catch {
      this.submitError.set(
        'Could not submit the application. You may have already applied to this role — check your dashboard.',
      );
    } finally {
      this.submitting.set(false);
    }
  }
}
