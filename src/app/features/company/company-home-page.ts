import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '@core';
import { EmptyState } from '@shared';

/** Placeholder until Phase 6 delivers the recruiter dashboard. */
@Component({
  selector: 'app-company-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState],
  template: `
    <div class="mx-auto w-full max-w-3xl px-gutter py-section">
      <h1 class="text-heading-1">Hiring dashboard</h1>
      <p class="mt-1 text-body-sm text-ink-muted">
        Signed in as <span class="font-mono">{{ auth.user()?.email }}</span>
      </p>
      <div class="mt-6">
        <app-empty-state
          title="Your hiring dashboard is being built"
          description="Manage job postings and the candidate pipeline here once Phase 6 lands."
        />
      </div>
    </div>
  `,
})
export class CompanyHomePage {
  protected readonly auth = inject(AuthService);
}
