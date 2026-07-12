import { render, screen } from '@testing-library/angular';
import { Card } from './card';

describe('Card', () => {
  it('renders projected content', async () => {
    await render(`<app-card><p>Frontend Engineer — Oslo</p></app-card>`, { imports: [Card] });
    expect(screen.getByText('Frontend Engineer — Oslo')).toBeTruthy();
  });

  it('applies the cloudberry accent when featured', async () => {
    const { container } = await render(`<app-card [featured]="true">Promoted</app-card>`, {
      imports: [Card],
    });
    const host = container.querySelector('app-card');
    expect(host?.className).toContain('border-cloudberry-500');
  });
});
