import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core';
import { Button, Card, TextInput } from '@shared';

type AccountKind = 'candidate' | 'company';

@Component({
  selector: 'app-register-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card, ReactiveFormsModule, RouterLink, TextInput],
  template: `
    <div class="mx-auto w-full max-w-md px-gutter py-section">
      <app-card>
        <h1 class="text-heading-2">Create an account</h1>
        <p class="mt-1 text-body-sm text-ink-muted">
          Already registered?
          <a routerLink="/login" class="font-medium text-spruce-700 hover:underline">Log in</a>
        </p>

        <fieldset class="mt-6">
          <legend class="text-body-sm font-medium text-ink">I am…</legend>
          <div class="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Account type">
            @for (option of kindOptions; track option.value) {
              <label
                class="flex cursor-pointer items-center justify-center gap-2 rounded-control
                       border px-3 py-2 text-body-sm font-medium transition-colors
                       focus-within:outline-2 focus-within:outline-spruce-500"
                [class.border-spruce-700]="kind() === option.value"
                [class.bg-spruce-50]="kind() === option.value"
                [class.text-spruce-900]="kind() === option.value"
                [class.border-line]="kind() !== option.value"
                [class.text-ink-muted]="kind() !== option.value"
              >
                <input
                  type="radio"
                  name="account-kind"
                  class="sr-only"
                  [value]="option.value"
                  [checked]="kind() === option.value"
                  (change)="kind.set(option.value)"
                />
                {{ option.label }}
              </label>
            }
          </div>
        </fieldset>

        <form class="mt-6 flex flex-col gap-4" (submit)="onSubmit($event)">
          @if (kind() === 'company') {
            <app-text-input
              label="Company name"
              name="organization"
              autocomplete="organization"
              placeholder="Fjellheim AS…"
              [required]="true"
              [formControl]="companyName"
              [error]="fieldErrors()['companyName'] ?? ''"
            />
          }
          <app-text-input
            [label]="kind() === 'company' ? 'Your name' : 'Full name'"
            name="name"
            autocomplete="name"
            placeholder="Nora Berg…"
            [required]="true"
            [formControl]="displayName"
            [error]="fieldErrors()['displayName'] ?? ''"
          />
          <app-text-input
            label="Email"
            type="email"
            name="email"
            autocomplete="email"
            placeholder="nora@example.no…"
            [required]="true"
            [spellcheckOff]="true"
            [formControl]="email"
            [error]="fieldErrors()['email'] ?? ''"
          />
          <app-text-input
            label="Password"
            type="password"
            name="new-password"
            autocomplete="new-password"
            hint="At least 8 characters, with an uppercase letter, a digit and a symbol."
            [required]="true"
            [formControl]="password"
            [error]="fieldErrors()['password'] ?? ''"
          />
          @if (formError()) {
            <p
              aria-live="polite"
              class="rounded-control bg-rowan-100 px-3 py-2 text-body-sm text-rowan-700"
            >
              {{ formError() }}
            </p>
          }
          <app-button type="submit" [loading]="submitting()">
            {{ kind() === 'company' ? 'Register company' : 'Create account' }}
          </app-button>
        </form>
      </app-card>
    </div>
  `,
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly kindOptions = [
    { value: 'candidate' as AccountKind, label: 'Looking for work' },
    { value: 'company' as AccountKind, label: 'Hiring' },
  ];
  protected readonly kind = signal<AccountKind>('candidate');

  protected readonly companyName = new FormControl('', { nonNullable: true });
  protected readonly displayName = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  protected readonly email = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });
  protected readonly password = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(8)],
  });

  protected readonly submitting = signal(false);
  protected readonly formError = signal('');
  protected readonly fieldErrors = signal<Record<string, string>>({});

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (this.kind() === 'company' && !this.companyName.value.trim()) {
      errors['companyName'] = 'Enter your company name.';
    }
    if (this.displayName.invalid) {
      errors['displayName'] = 'Enter your name.';
    }
    if (this.email.invalid) {
      errors['email'] = 'Enter a valid email address.';
    }
    if (this.password.invalid) {
      errors['password'] = 'Use at least 8 characters.';
    }
    this.fieldErrors.set(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    this.submitting.set(true);
    this.formError.set('');
    try {
      if (this.kind() === 'company') {
        await this.auth.registerCompany({
          companyName: this.companyName.value.trim(),
          description: null,
          website: null,
          adminDisplayName: this.displayName.value.trim(),
          email: this.email.value,
          password: this.password.value,
        });
      } else {
        await this.auth.registerCandidate({
          displayName: this.displayName.value.trim(),
          email: this.email.value,
          password: this.password.value,
        });
      }
      await this.router.navigateByUrl(this.auth.homeUrl());
    } catch {
      this.formError.set(
        'Could not create the account. Check the password requirements and that the email is not already registered.',
      );
    } finally {
      this.submitting.set(false);
    }
  }
}
