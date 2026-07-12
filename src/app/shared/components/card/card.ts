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

  protected readonly classes = computed(() => {
    const base = 'block rounded-card border bg-paper p-6';
    return this.featured()
      ? `${base} border-cloudberry-500 shadow-[inset_0_2px_0_0_var(--color-cloudberry-500)]`
      : `${base} border-line`;
  });
}
