import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FollowsStore } from '@core';
import { Button, ButtonLink, EmptyState, Spinner, ToastService } from '@shared';

@Component({
  selector: 'app-following-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, ButtonLink, EmptyState, RouterLink, Spinner],
  template: `
    <div class="mx-auto w-full max-w-3xl px-gutter py-section">
      <a routerLink="/candidate" class="font-mono text-caption text-spruce-700 hover:underline">
        ← Your applications
      </a>
      <h1 class="mt-2 text-heading-1">Companies you follow</h1>

      <div class="mt-8" aria-live="polite">
        @if (loading()) {
          <div class="flex justify-center py-12">
            <app-spinner size="lg" label="Loading followed companies…" />
          </div>
        } @else if (error()) {
          <app-empty-state
            title="Could not load followed companies"
            description="Something went wrong. Try again in a moment."
          >
            <app-button variant="secondary" (click)="load()">Try again</app-button>
          </app-empty-state>
        } @else if ((follows.companies() ?? []).length === 0) {
          <app-empty-state
            title="You're not following anyone yet"
            description="Follow companies from their job postings to keep an eye on who's hiring."
          >
            <app-button-link to="/jobs" variant="secondary">Browse open roles</app-button-link>
          </app-empty-state>
        } @else {
          <ul class="flex flex-col gap-3">
            @for (company of follows.companies(); track company.id) {
              <li
                class="flex flex-wrap items-center justify-between gap-3 rounded-card border
                       border-line bg-paper px-5 py-4"
              >
                <div class="min-w-0">
                  <p class="break-words text-body font-medium text-ink">{{ company.name }}</p>
                  @if (company.description) {
                    <p class="mt-0.5 line-clamp-2 text-body-sm text-ink-muted">
                      {{ company.description }}
                    </p>
                  }
                </div>
                <app-button
                  variant="secondary"
                  size="sm"
                  [loading]="follows.isPending(company.id)"
                  (click)="unfollow(company.id, company.name)"
                >
                  Unfollow
                </app-button>
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
})
export class FollowingPage {
  protected readonly follows = inject(FollowsStore);
  private readonly toasts = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      await this.follows.load();
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected async unfollow(companyId: string, name: string): Promise<void> {
    try {
      await this.follows.unfollow(companyId);
      this.toasts.show(`Unfollowed ${name}`, 'info');
    } catch {
      this.toasts.show(`Could not unfollow ${name}. Try again.`, 'error');
    }
  }
}
