import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { buttonClasses, type ButtonSize, type ButtonVariant } from './button';

/**
 * A router link styled exactly like a Button. Use for navigation that should
 * read as a button — never nest a <button> inside an <a>.
 */
@Component({
  selector: 'app-button-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <a [routerLink]="to()" [queryParams]="queryParams()" [class]="classes()">
      <ng-content />
    </a>
  `,
})
export class ButtonLink {
  readonly to = input.required<string | readonly (string | number)[]>();
  readonly queryParams = input<Record<string, string> | null>(null);
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');

  protected readonly classes = computed(() => buttonClasses(this.variant(), this.size()));
}
