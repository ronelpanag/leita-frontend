import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { type HasUnsavedChanges } from '@core';
import { Button, ButtonLink, Card, TextArea, TextInput, ToastService } from '@shared';
import { CompanyJobsStore } from './company-jobs-store';

@Component({
  selector: 'app-job-create-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, ButtonLink, Card, ReactiveFormsModule, RouterLink, TextArea, TextInput],
  template: `
    <div class="mx-auto w-full max-w-2xl px-gutter py-section">
      <a routerLink="/company" class="font-mono text-caption text-spruce-700 hover:underline">
        ← Hiring dashboard
      </a>
      <app-card class="mt-4 block">
        <h1 class="text-heading-2">New job posting</h1>
        <p class="mt-1 text-body-sm text-ink-muted">
          Postings start as drafts — publish when the wording is right.
        </p>

        <form class="mt-6 flex flex-col gap-4" (submit)="onSubmit($event)">
          <app-text-input
            label="Job title"
            name="job-title"
            placeholder="Frontend Engineer…"
            [required]="true"
            [formControl]="title"
            [error]="titleError()"
          />
          <app-text-input
            label="Location"
            name="job-location"
            placeholder="Oslo, hybrid…"
            hint="Leave empty for location-independent roles."
            [formControl]="location"
          />
          <app-text-area
            label="Description"
            name="job-description"
            [rows]="10"
            placeholder="What the role is, what the trail ahead looks like…"
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
            <app-button type="submit" [loading]="submitting()">Save draft</app-button>
            <app-button-link to="/company" variant="ghost">Cancel</app-button-link>
          </div>
        </form>
      </app-card>
    </div>
  `,
})
export class JobCreatePage implements HasUnsavedChanges {
  private saved = false;

  private readonly store = inject(CompanyJobsStore);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  protected readonly title = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  protected readonly location = new FormControl('', { nonNullable: true });
  protected readonly description = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  protected readonly submitting = signal(false);
  protected readonly formError = signal('');
  protected readonly titleError = signal('');
  protected readonly descriptionError = signal('');

  hasUnsavedChanges(): boolean {
    return !this.saved && (this.title.dirty || this.location.dirty || this.description.dirty);
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
      await this.store.createDraft(
        this.title.value.trim(),
        this.description.value.trim(),
        this.location.value.trim() || null,
      );
      this.saved = true;
      this.toasts.show('Draft saved', 'success');
      await this.router.navigateByUrl('/company');
    } catch {
      this.formError.set('Could not save the draft. Try again.');
    } finally {
      this.submitting.set(false);
    }
  }
}
