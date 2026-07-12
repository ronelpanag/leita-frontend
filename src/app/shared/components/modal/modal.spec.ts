import { Component, signal } from '@angular/core';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { Modal } from './modal';

@Component({
  imports: [Modal],
  template: `
    <app-modal title="Schedule interview" [(open)]="open" (closed)="closedCount = closedCount + 1">
      <p>Pick a time that works for the candidate.</p>
    </app-modal>
  `,
})
class Host {
  readonly open = signal(false);
  closedCount = 0;
}

describe('Modal', () => {
  it('opens via the model and labels the dialog with its title', async () => {
    const { fixture } = await render(Host);
    fixture.componentInstance.open.set(true);
    await fixture.whenStable();

    const dialog = screen.getByRole('dialog');
    expect((dialog as HTMLDialogElement).open).toBe(true);
    const labelId = dialog.getAttribute('aria-labelledby');
    expect(document.getElementById(labelId as string)?.textContent).toContain('Schedule interview');
  });

  it('closes from the close button and syncs the model back', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(Host);
    fixture.componentInstance.open.set(true);
    await fixture.whenStable();

    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    await waitFor(() => {
      expect(fixture.componentInstance.open()).toBe(false);
    });
    expect(fixture.componentInstance.closedCount).toBe(1);
  });

  it('syncs the model when the dialog closes natively (Escape path)', async () => {
    // jsdom cannot simulate the browser's Escape → cancel → close sequence,
    // so drive the same code path by closing the native dialog directly.
    const { fixture } = await render(Host);
    fixture.componentInstance.open.set(true);
    await fixture.whenStable();

    (screen.getByRole('dialog') as HTMLDialogElement).close();
    await waitFor(() => {
      expect(fixture.componentInstance.open()).toBe(false);
    });
  });
});
