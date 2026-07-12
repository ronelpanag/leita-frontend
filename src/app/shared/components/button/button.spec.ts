import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  it('renders projected content in a native button', async () => {
    await render(`<app-button>Save changes</app-button>`, { imports: [Button] });
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeTruthy();
  });

  it('defaults to type="button" and honors type="submit"', async () => {
    await render(`<app-button type="submit">Publish job</app-button>`, { imports: [Button] });
    expect(screen.getByRole('button').getAttribute('type')).toBe('submit');
  });

  it('emits click when enabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    await render(`<app-button (click)="onClick()">Apply</app-button>`, {
      imports: [Button],
      componentProperties: { onClick },
    });
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables the native button when disabled', async () => {
    await render(`<app-button [disabled]="true">Apply</app-button>`, { imports: [Button] });
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('marks the button busy and disabled while loading', async () => {
    await render(`<app-button [loading]="true">Saving…</app-button>`, { imports: [Button] });
    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.disabled).toBe(true);
  });
});
