import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Flat surface with an honest 1px edge. `featured` marks promoted content
 * with the cloudberry accent (used by promoted job postings).
 */
@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
  template: `<ng-content />`,
})
export class Card {
  readonly featured = input(false);
  /** Disable when the projected content manages its own padding (e.g. a full-card link). */
  readonly padded = input(true);

  protected readonly classes = computed(() => {
    const base = `block rounded-card border bg-paper${this.padded() ? ' p-6' : ''}`;
    return this.featured()
      ? `${base} border-cloudberry-500 shadow-[inset_0_2px_0_0_var(--color-cloudberry-500)]`
      : `${base} border-line`;
  });
}
