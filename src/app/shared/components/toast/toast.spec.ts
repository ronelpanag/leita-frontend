import { TestBed } from '@angular/core/testing';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ToastOutlet } from './toast-outlet';
import { ToastService } from './toast-service';

describe('Toast', () => {
  it('shows toasts from the service inside a polite live region', async () => {
    const { fixture } = await render(ToastOutlet);
    const service = TestBed.inject(ToastService);

    service.show('Application submitted');
    fixture.detectChanges();

    const toast = screen.getByRole('status');
    expect(toast.textContent).toContain('Application submitted');
    expect(toast.closest('[aria-live="polite"]')).toBeTruthy();
    service.dismiss(0);
  });

  it('dismisses a toast from its close button', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(ToastOutlet);
    const service = TestBed.inject(ToastService);

    service.show('Job published');
    fixture.detectChanges();

    await user.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    await waitFor(() => {
      expect(screen.queryByRole('status')).toBeNull();
    });
    expect(service.toasts().length).toBe(0);
  });

  it('auto-dismisses after the configured duration', async () => {
    vi.useFakeTimers();
    try {
      const service = new ToastService();
      service.show('Stage updated', 'success', 1000);
      expect(service.toasts().length).toBe(1);
      vi.advanceTimersByTime(1001);
      expect(service.toasts().length).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
