import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

let nextId = 0;

/** Labelled multi-line input, CVA-compatible. Mirrors TextInput's error/hint wiring. */
@Component({
  selector: 'app-text-area',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextArea), multi: true }],
  template: `
    <div class="flex flex-col gap-1.5">
      <label [for]="id" class="text-body-sm font-medium text-ink">
        {{ label() }}
        @if (required()) {
          <span aria-hidden="true" class="text-rowan-500">*</span>
        }
        @if (optionalHint()) {
          <span class="font-normal text-ink-muted">(optional)</span>
        }
      </label>
      @if (hint()) {
        <p [id]="hintId" class="text-caption text-ink-muted">{{ hint() }}</p>
      }
      <textarea
        [id]="id"
        [rows]="rows()"
        [value]="value()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [required]="required()"
        [attr.name]="name() || null"
        [attr.aria-invalid]="error() ? true : null"
        [attr.aria-describedby]="describedBy()"
        (input)="onInput($event)"
        (blur)="onTouched()"
        class="min-h-24 resize-y rounded-control border bg-paper px-3 py-2 text-body text-ink
               placeholder:text-ink-muted/70 transition-colors hover:border-line-strong
               disabled:cursor-not-allowed disabled:bg-birch disabled:text-ink-muted"
        [class.border-line]="!error()"
        [class.border-rowan-500]="error()"
      ></textarea>
      <p [id]="errorId" aria-live="polite" class="text-caption text-rowan-700">
        @if (error()) {
          {{ error() }}
        }
      </p>
    </div>
  `,
})
export class TextArea implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly placeholder = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly name = input('');
  readonly rows = input(5);
  readonly required = input(false);
  /** Marks the field "(optional)" next to the label. */
  readonly optionalHint = input(false);

  protected readonly id = `leita-textarea-${nextId++}`;
  protected readonly hintId = `${this.id}-hint`;
  protected readonly errorId = `${this.id}-error`;

  protected readonly value = signal('');
  protected readonly disabled = signal(false);

  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.hint()) ids.push(this.hintId);
    if (this.error()) ids.push(this.errorId);
    return ids.length ? ids.join(' ') : null;
  });

  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  protected onInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
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
