import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core';
import { Button, Card, TextInput } from '@shared';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card, ReactiveFormsModule, RouterLink, TextInput],
  template: `
    <div class="mx-auto w-full max-w-md px-gutter py-section">
      <app-card>
        <h1 class="text-heading-2">Log in</h1>
        <p class="mt-1 text-body-sm text-ink-muted">
          Welcome back to the trail. New here?
          <a routerLink="/register" class="font-medium text-spruce-700 hover:underline"
            >Create an account</a
          >
        </p>
        <form class="mt-6 flex flex-col gap-4" (submit)="onSubmit($event)">
          <app-text-input
            label="Email"
            type="email"
            name="email"
            autocomplete="email"
            placeholder="nora@example.no…"
            [required]="true"
            [spellcheckOff]="true"
            [formControl]="email"
            [error]="emailError()"
          />
          <app-text-input
            label="Password"
            type="password"
            name="password"
            autocomplete="current-password"
            [required]="true"
            [formControl]="password"
            [error]="passwordError()"
          />
          @if (formError()) {
            <p
              aria-live="polite"
              class="rounded-control bg-rowan-100 px-3 py-2 text-body-sm text-rowan-700"
            >
              {{ formError() }}
            </p>
          }
          <app-button type="submit" [loading]="submitting()">Log in</app-button>
        </form>
      </app-card>
    </div>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly email = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });
  protected readonly password = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  protected readonly submitting = signal(false);
  protected readonly formError = signal('');
  protected readonly emailError = signal('');
  protected readonly passwordError = signal('');

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.emailError.set(this.email.invalid ? 'Enter the email you registered with.' : '');
    this.passwordError.set(this.password.invalid ? 'Enter your password.' : '');
    if (this.email.invalid || this.password.invalid) {
      return;
    }

    this.submitting.set(true);
    this.formError.set('');
    try {
      await this.auth.login(this.email.value, this.password.value);
      const returnTo = safeReturnTo(this.route.snapshot.queryParamMap.get('returnTo'));
      await this.router.navigateByUrl(returnTo ?? this.auth.homeUrl());
    } catch {
      this.formError.set('That email and password combination did not match. Try again.');
    } finally {
      this.submitting.set(false);
    }
  }
}

/**
 * Accepts only in-app paths, so a crafted `?returnTo=` cannot send someone
 * somewhere else after they hand over their password. Angular's Router already
 * refuses to leave the origin (an absolute or protocol-relative value simply
 * fails to match a route and falls through to the wildcard), so this is
 * defence in depth against a later refactor that reaches for
 * `window.location` — and it fixes the user-visible half too: a bogus value
 * used to dump you on the public board instead of your own home.
 */
export function safeReturnTo(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return null;
  }
  // Backslashes are normalised to slashes by some browsers, so "/\evil.com"
  // is another way of writing a protocol-relative URL.
  return value.includes('\\') ? null : value;
}
