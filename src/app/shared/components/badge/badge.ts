import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/**
 * Label chip set in mono — the “instrument panel” voice. With `waymark`
 * enabled it carries the leading trail tick used for pipeline stages.
 */
@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="classes()">
      @if (waymark()) {
        <svg viewBox="0 0 8 8" aria-hidden="true" class="size-2 shrink-0 fill-current">
          <path d="M1 0l6 4-6 4z" />
        </svg>
      }
      <ng-content />
    </span>
  `,
})
export class Badge {
  readonly tone = input<BadgeTone>('neutral');
  readonly waymark = input(false);

  protected readonly classes = computed(() => {
    const base =
      'inline-flex items-center gap-1.5 rounded-control border px-2 py-0.5 font-mono text-caption';
    const tones: Record<BadgeTone, string> = {
      neutral: 'border-line bg-birch text-ink-muted',
      info: 'border-fjord-100 bg-fjord-100 text-fjord-700',
      success: 'border-spruce-100 bg-spruce-100 text-spruce-700',
      warning: 'border-cloudberry-100 bg-cloudberry-100 text-cloudberry-700',
      danger: 'border-rowan-100 bg-rowan-100 text-rowan-700',
    };
    return `${base} ${tones[this.tone()]}`;
  });
}
