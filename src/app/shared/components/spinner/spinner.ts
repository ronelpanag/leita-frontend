import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type SpinnerSize = 'sm' | 'md' | 'lg';

/**
 * Rotating dashed ring — the Waymark “compass seeking north”.
 * With a `label`, announces as a status region; with an empty label it is
 * purely decorative (e.g. inside a button that already carries aria-busy).
 */
@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex"
      [attr.role]="label() ? 'status' : null"
      [attr.aria-hidden]="label() ? null : 'true'"
    >
      <svg [class]="svgClasses()" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-dasharray="4.7 4.7"
          stroke-linecap="round"
        />
      </svg>
      @if (label()) {
        <span class="sr-only">{{ label() }}</span>
      }
    </span>
  `,
})
export class Spinner {
  readonly size = input<SpinnerSize>('md');
  readonly label = input('Loading…');

  protected readonly svgClasses = computed(() => {
    const sizes: Record<SpinnerSize, string> = {
      sm: 'size-4',
      md: 'size-6',
      lg: 'size-8',
    };
    return `animate-spin motion-reduce:animate-none ${sizes[this.size()]}`;
  });
}
