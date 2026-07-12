import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyState } from '@shared';

/** Placeholder until Phase 4 delivers the public job board. */
@Component({
  selector: 'app-job-board-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState],
  template: `
    <div class="mx-auto w-full max-w-3xl px-gutter py-section">
      <h1 class="text-heading-1">Open roles</h1>
      <div class="mt-6">
        <app-empty-state
          title="The job board is being built"
          description="Browse and search for open roles here once Phase 4 lands."
        />
      </div>
    </div>
  `,
})
export class JobBoardPage {}
