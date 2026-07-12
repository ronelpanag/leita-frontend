import { render, screen } from '@testing-library/angular';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders projected label text', async () => {
    await render(`<app-badge>Interview</app-badge>`, { imports: [Badge] });
    expect(screen.getByText('Interview')).toBeTruthy();
  });

  it('shows the waymark tick only when requested, hidden from screen readers', async () => {
    const { container } = await render(`<app-badge [waymark]="true">Screening</app-badge>`, {
      imports: [Badge],
    });
    const tick = container.querySelector('svg');
    expect(tick).toBeTruthy();
    expect(tick?.getAttribute('aria-hidden')).toBe('true');
  });

  it('omits the tick by default', async () => {
    const { container } = await render(`<app-badge>Open</app-badge>`, { imports: [Badge] });
    expect(container.querySelector('svg')).toBeNull();
  });
});
