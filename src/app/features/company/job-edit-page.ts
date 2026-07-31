import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiClient, type HasUnsavedChanges } from '@core';
import {
  Button,
  ButtonLink,
  Card,
  EmptyState,
  Spinner,
  TextArea,
  TextInput,
  ToastService,
} from '@shared';
import { firstValueFrom } from 'rxjs';
import { CompanyJobsStore } from './company-jobs-store';

/** Edit a draft or published posting. Closed postings are immutable server-side. */
@Component({
  selector: 'app-job-edit-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Button,
    ButtonLink,
    Card,
    EmptyState,
    ReactiveFormsModule,
    RouterLink,
    Spinner,
    TextArea,
    TextInput,
  ],
  template: `
    <div class="mx-auto w-full max-w-2xl px-gutter py-section">
      <a routerLink="/company" class="font-mono text-caption text-spruce-700 hover:underline">
        ← Hiring dashboard
      </a>

      @if (loading()) {
        <div class="flex justify-center py-16">
          <app-spinner size="lg" label="Loading the posting…" />
        </div>
      } @else if (loadError()) {
        <app-empty-state
          title="This posting could not be loaded"
          description="It may have been removed. Head back to the dashboard to keep going."
        >
          <app-button variant="secondary" (click)="load()">Try again</app-button>
        </app-empty-state>
      } @else if (closed()) {
        <app-empty-state
          title="Closed postings cannot be edited"
          description="Closing a posting is final — create a new one if the role reopens."
        >
          <app-button-link to="/company" variant="secondary">Back to dashboard</app-button-link>
        </app-empty-state>
      } @else {
        <app-card class="mt-4 block">
          <h1 class="text-heading-2">Edit job posting</h1>
          <form class="mt-6 flex flex-col gap-4" (submit)="onSubmit($event)">
            <app-text-input
              label="Job title"
              name="job-title"
              [required]="true"
              [formControl]="title"
              [error]="titleError()"
            />
            <app-text-input
              label="Location"
              name="job-location"
              hint="Leave empty for location-independent roles."
              [formControl]="location"
            />
            <app-text-area
              label="Description"
              name="job-description"
              [rows]="10"
              [required]="true"
              [formControl]="description"
              [error]="descriptionError()"
            />
            @if (formError()) {
              <p
                aria-live="polite"
                class="rounded-control bg-rowan-100 px-3 py-2 text-body-sm text-rowan-700"
              >
                {{ formError() }}
              </p>
            }
            <div class="flex items-center gap-3">
              <app-button type="submit" [loading]="submitting()">Save changes</app-button>
              <app-button-link to="/company" variant="ghost">Cancel</app-button-link>
            </div>
          </form>
        </app-card>
      }
    </div>
  `,
})
export class JobEditPage implements HasUnsavedChanges {
  private readonly api = inject(ApiClient);
  private readonly store = inject(CompanyJobsStore);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  readonly id = input.required<string>();

  protected readonly title = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  protected readonly location = new FormControl('', { nonNullable: true });
  protected readonly description = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly closed = signal(false);
  protected readonly submitting = signal(false);
  protected readonly formError = signal('');
  protected readonly titleError = signal('');
  protected readonly descriptionError = signal('');

  private saved = false;

  constructor() {
    effect(() => {
      this.id();
      untracked(() => void this.load());
    });
  }

  hasUnsavedChanges(): boolean {
    return !this.saved && (this.title.dirty || this.location.dirty || this.description.dirty);
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(false);
    try {
      const job = await firstValueFrom(this.api.getJob(this.id()));
      this.closed.set(job.status === 'Closed');
      this.title.setValue(job.title);
      this.location.setValue(job.location ?? '');
      this.description.setValue(job.description);
      this.title.markAsPristine();
      this.location.markAsPristine();
      this.description.markAsPristine();
    } catch {
      this.loadError.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.titleError.set(this.title.invalid ? 'Enter a job title.' : '');
    this.descriptionError.set(this.description.invalid ? 'Describe the role.' : '');
    if (this.title.invalid || this.description.invalid) {
      return;
    }

    this.submitting.set(true);
    this.formError.set('');
    try {
      await this.store.update(
        this.id(),
        this.title.value.trim(),
        this.description.value.trim(),
        this.location.value.trim() || null,
      );
      this.saved = true;
      this.toasts.show('Changes saved', 'success');
      await this.router.navigateByUrl('/company');
    } catch {
      this.formError.set('Could not save the changes. Try again.');
    } finally {
      this.submitting.set(false);
    }
  }
}
