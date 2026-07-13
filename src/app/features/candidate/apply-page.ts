import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EmptyState } from '@shared';

/** Stub target for the job board's Apply CTA. Phase 5 replaces this with the real submission flow. */
@Component({
  selector: 'app-apply-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState],
  template: `
    <div class="mx-auto w-full max-w-3xl px-gutter py-section">
      <h1 class="text-heading-1">Apply</h1>
      <div class="mt-6">
        <app-empty-state
          title="The application form is being built"
          description="Submitting applications arrives with Phase 5. Your place on the trail is saved — this role is ready and waiting."
        />
      </div>
      <p class="mt-4 font-mono text-caption text-ink-muted">Role: {{ jobId() }}</p>
    </div>
  `,
})
export class ApplyPage {
  readonly jobId = input.required<string>();
}
