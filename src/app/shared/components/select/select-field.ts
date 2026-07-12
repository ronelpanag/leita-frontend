import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

let nextId = 0;

/**
 * Labelled native select implementing ControlValueAccessor. Native for full
 * keyboard and screen-reader support; background and text color are set
 * explicitly so Windows dark mode cannot invert it illegibly.
 */
@Component({
  selector: 'app-select-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectField), multi: true },
  ],
  template: `
    <div class="flex flex-col gap-1.5">
      <label [for]="id" class="text-body-sm font-medium text-ink">
        {{ label() }}
        @if (required()) {
          <span aria-hidden="true" class="text-rowan-500">*</span>
        }
      </label>
      <select
        [id]="id"
        [disabled]="disabled()"
        [required]="required()"
        [attr.name]="name() || null"
        [attr.aria-invalid]="error() ? true : null"
        [attr.aria-describedby]="error() ? errorId : null"
        (change)="onSelect($event)"
        (blur)="onTouched()"
        class="min-h-10 rounded-control border bg-paper px-3 text-body text-ink
               transition-colors hover:border-line-strong
               disabled:cursor-not-allowed disabled:bg-birch disabled:text-ink-muted"
        [class.border-line]="!error()"
        [class.border-rowan-500]="error()"
        [class.text-ink-muted]="!value()"
      >
        @if (placeholder()) {
          <option value="" disabled [selected]="!value()">{{ placeholder() }}</option>
        }
        @for (option of options(); track option.value) {
          <option
            [value]="option.value"
            [disabled]="option.disabled ?? false"
            [selected]="option.value === value()"
          >
            {{ option.label }}
          </option>
        }
      </select>
      <p [id]="errorId" aria-live="polite" class="text-caption text-rowan-700">
        @if (error()) {
          {{ error() }}
        }
      </p>
    </div>
  `,
})
export class SelectField implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly options = input.required<readonly SelectOption[]>();
  readonly placeholder = input('');
  readonly error = input('');
  readonly name = input('');
  readonly required = input(false);

  protected readonly id = `leita-select-${nextId++}`;
  protected readonly errorId = `${this.id}-error`;

  protected readonly value = signal('');
  protected readonly disabled = signal(false);

  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  protected onSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.value.set(value);
    this.onChange(value);
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
