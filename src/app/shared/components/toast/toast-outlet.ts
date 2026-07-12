import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService, type ToastTone } from './toast-service';

/**
 * Fixed region rendering active toasts. Place once in the app shell.
 * The container is a polite live region so new toasts are announced
 * without interrupting the screen reader.
 */
@Component({
  selector: 'app-toast-outlet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      aria-live="polite"
      class="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2
             p-4 sm:items-end"
      style="padding-bottom: max(1rem, env(safe-area-inset-bottom))"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          role="status"
          [class]="toastClasses(toast.tone)"
          class="pointer-events-auto flex w-full max-w-sm items-start justify-between gap-3
                 rounded-card border bg-paper px-4 py-3 shadow-overlay
                 motion-safe:animate-[leita-arrive_var(--duration-base)_var(--ease-standard)]"
        >
          <p class="min-w-0 break-words text-body-sm text-ink">{{ toast.message }}</p>
          <button
            type="button"
            aria-label="Dismiss notification"
            (click)="toastService.dismiss(toast.id)"
            class="grid size-6 shrink-0 place-items-center rounded-control text-ink-muted
                   transition-colors hover:bg-birch hover:text-ink"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" class="size-3.5 fill-none stroke-current">
              <path d="M3 3l10 10M13 3L3 13" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    @keyframes leita-arrive {
      from {
        opacity: 0;
        transform: translateY(4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
})
export class ToastOutlet {
  protected readonly toastService = inject(ToastService);

  protected toastClasses(tone: ToastTone): string {
    const tones: Record<ToastTone, string> = {
      info: 'border-fjord-500/40',
      success: 'border-spruce-500/50',
      error: 'border-rowan-500/50',
    };
    return tones[tone];
  }
}
