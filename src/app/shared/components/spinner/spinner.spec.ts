import { render, screen } from '@testing-library/angular';
import { Spinner } from './spinner';

describe('Spinner', () => {
  it('announces as a status region with its label', async () => {
    await render(`<app-spinner label="Loading applications…" />`, { imports: [Spinner] });
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('Loading applications…');
  });

  it('is decorative when the label is empty', async () => {
    const { container } = await render(`<app-spinner label="" />`, { imports: [Spinner] });
    expect(screen.queryByRole('status')).toBeNull();
    expect(container.querySelector('span')?.getAttribute('aria-hidden')).toBe('true');
  });
});
