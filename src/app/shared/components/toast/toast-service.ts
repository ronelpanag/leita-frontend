import { Injectable, signal } from '@angular/core';

export type ToastTone = 'info' | 'success' | 'error';

export interface Toast {
  readonly id: number;
  readonly message: string;
  readonly tone: ToastTone;
}

const AUTO_DISMISS_MS = 5000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  private readonly toastsSignal = signal<readonly Toast[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();

  show(message: string, tone: ToastTone = 'info', durationMs = AUTO_DISMISS_MS): number {
    const toast: Toast = { id: this.nextId++, message, tone };
    this.toastsSignal.update((toasts) => [...toasts, toast]);
    if (durationMs > 0) {
      this.timers.set(
        toast.id,
        setTimeout(() => this.dismiss(toast.id), durationMs),
      );
    }
    return toast.id;
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.toastsSignal.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }
}
