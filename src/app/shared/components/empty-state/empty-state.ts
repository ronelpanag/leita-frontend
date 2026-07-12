import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The trail is there, nothing is on it yet. An empty screen is an
 * invitation to act: pass the next action as projected content.
 */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex flex-col items-center gap-3 rounded-card border border-dashed
                border-line-strong px-6 py-12 text-center"
    >
      <svg viewBox="0 0 120 24" aria-hidden="true" class="h-6 w-30 text-line-strong">
        <g fill="currentColor">
          <circle cx="8" cy="12" r="3" />
          <circle cx="34" cy="12" r="1.5" />
          <circle cx="48" cy="12" r="1.5" />
          <circle cx="62" cy="12" r="1.5" />
          <circle cx="76" cy="12" r="1.5" />
          <circle cx="90" cy="12" r="1.5" />
          <path d="M106 4l10 8-10 8z" class="text-spruce-300" fill="currentColor" />
        </g>
      </svg>
      <p class="font-display text-heading-3 font-semibold text-ink">{{ title() }}</p>
      @if (description()) {
        <p class="max-w-sm text-body-sm text-ink-muted">{{ description() }}</p>
      }
      <div class="mt-2 empty:hidden">
        <ng-content />
      </div>
    </div>
  `,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly description = input('');
}
