import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Spinner } from '../spinner/spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

/** Shared by Button and ButtonLink so links-that-look-like-buttons stay identical. */
export function buttonClasses(variant: ButtonVariant, size: ButtonSize): string {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-control ' +
    'transition-colors touch-manipulation select-none ' +
    'disabled:opacity-55 disabled:cursor-not-allowed';
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-spruce-700 text-paper hover:bg-spruce-900',
    secondary: 'border border-line bg-paper text-ink hover:bg-birch',
    ghost: 'text-spruce-700 hover:bg-spruce-50',
    danger: 'bg-rowan-500 text-paper hover:bg-rowan-700',
  };
  const sizes: Record<ButtonSize, string> = {
    sm: 'text-body-sm px-3 min-h-8',
    md: 'text-body-sm px-4 min-h-10',
  };
  return `${base} ${variants[variant]} ${sizes[size]}`;
}

@Component({
  selector: 'app-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Spinner],
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading() ? true : null"
      [class]="classes()"
    >
      @if (loading()) {
        <app-spinner size="sm" label="" />
      }
      <ng-content />
    </button>
  `,
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);

  protected readonly classes = computed(() => buttonClasses(this.variant(), this.size()));
}
