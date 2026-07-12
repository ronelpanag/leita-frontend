import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '@core';
import { EmptyState } from '@shared';

/** Placeholder until Phase 5 delivers the candidate portal. */
@Component({
  selector: 'app-candidate-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState],
  template: `
    <div class="mx-auto w-full max-w-3xl px-gutter py-section">
      <h1 class="text-heading-1">Your applications</h1>
      <p class="mt-1 text-body-sm text-ink-muted">
        Signed in as <span class="font-mono">{{ auth.user()?.email }}</span>
      </p>
      <div class="mt-6">
        <app-empty-state
          title="Your candidate dashboard is being built"
          description="Track applications and followed companies here once Phase 5 lands."
        />
      </div>
    </div>
  `,
})
export class CandidateHomePage {
  protected readonly auth = inject(AuthService);
}
