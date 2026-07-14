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

/**
 * Labelled text input implementing ControlValueAccessor for template-driven
 * and reactive forms. Errors render inline next to the field and are
 * announced politely; the hint and error are wired via aria-describedby.
 */
@Component({
  selector: 'app-text-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextInput), multi: true },
  ],
  template: `
    <div class="flex flex-col gap-1.5">
      <label [for]="id" class="text-body-sm font-medium text-ink">
        {{ label() }}
        @if (required()) {
          <span aria-hidden="true" class="text-rowan-500">*</span>
        }
      </label>
      @if (hint()) {
        <p [id]="hintId" class="text-caption text-ink-muted">{{ hint() }}</p>
      }
      <input
        [id]="id"
        [type]="type()"
        [value]="value()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [required]="required()"
        [attr.name]="name() || null"
        [attr.autocomplete]="autocomplete() || null"
        [attr.inputmode]="inputmode() || null"
        [attr.spellcheck]="spellcheckOff() ? false : null"
        [attr.aria-invalid]="error() ? true : null"
        [attr.aria-describedby]="describedBy()"
        (input)="onInput($event)"
        (blur)="onTouched()"
        class="min-h-10 rounded-control border bg-paper px-3 text-body text-ink
               placeholder:text-ink-muted/70 transition-colors
               hover:border-line-strong disabled:cursor-not-allowed disabled:bg-birch
               disabled:text-ink-muted aria-invalid:border-rowan-500"
        [class.border-line]="!error()"
        [class.border-rowan-500]="error()"
      />
      <p [id]="errorId" aria-live="polite" class="text-caption text-rowan-700">
        @if (error()) {
          {{ error() }}
        }
      </p>
    </div>
  `,
})
export class TextInput implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly type = input<
    'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'datetime-local'
  >('text');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly name = input('');
  readonly autocomplete = input('');
  readonly inputmode = input('');
  readonly required = input(false);
  /** Set for emails, usernames, codes — content that spellcheck would mangle. */
  readonly spellcheckOff = input(false);

  protected readonly id = `leita-input-${nextId++}`;
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
    const value = (event.target as HTMLInputElement).value;
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
