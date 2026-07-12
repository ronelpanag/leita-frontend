import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  afterRenderEffect,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';

let nextId = 0;

/**
 * Modal dialog built on the native <dialog> element: focus trapping, Escape
 * handling, focus restore and the backdrop come from the platform. Control it
 * via the two-way `open` model.
 */
@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!--
      Backdrop click-to-dismiss: the keyboard equivalent is the native
      Escape handling of <dialog>, so no key handler is needed here.
    -->
    <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
    <dialog
      #dialog
      [attr.aria-labelledby]="titleId"
      (close)="onNativeClose()"
      (click)="onBackdropClick($event)"
      class="m-auto max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-card border
             border-line bg-paper p-0 text-ink shadow-overlay backdrop:bg-ink/40"
      style="overscroll-behavior: contain"
    >
      <div class="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
        <h2 [id]="titleId" class="text-heading-3">{{ title() }}</h2>
        @if (dismissible()) {
          <button
            type="button"
            aria-label="Close dialog"
            (click)="close()"
            class="grid size-8 shrink-0 place-items-center rounded-control text-ink-muted
                   transition-colors hover:bg-birch hover:text-ink"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" class="size-4 fill-none stroke-current">
              <path d="M3 3l10 10M13 3L3 13" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </button>
        }
      </div>
      <div class="px-6 py-5">
        <ng-content />
      </div>
    </dialog>
  `,
})
export class Modal {
  readonly title = input.required<string>();
  /** When false, Escape, backdrop clicks and the close button are disabled. */
  readonly dismissible = input(true);
  readonly open = model(false);
  readonly closed = output<void>();

  protected readonly titleId = `leita-modal-title-${nextId++}`;

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    afterRenderEffect(() => {
      const dialog = this.dialogRef().nativeElement;
      if (this.open() && !dialog.open) {
        dialog.showModal();
      } else if (!this.open() && dialog.open) {
        dialog.close();
      }
    });
  }

  close(): void {
    this.open.set(false);
  }

  protected onNativeClose(): void {
    // Fired for Escape and programmatic close; keep the model in sync.
    if (this.open()) {
      if (!this.dismissible()) {
        // Native close already happened; reopen to honor non-dismissible.
        this.dialogRef().nativeElement.showModal();
        return;
      }
      this.open.set(false);
    }
    this.closed.emit();
  }

  protected onBackdropClick(event: MouseEvent): void {
    // Clicks on the backdrop target the <dialog> element itself.
    if (this.dismissible() && event.target === this.dialogRef().nativeElement) {
      this.close();
    }
  }
}
