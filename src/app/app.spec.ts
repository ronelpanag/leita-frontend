import { render, screen } from '@testing-library/angular';
import { App } from './app';

describe('App', () => {
  it('renders the app shell heading', async () => {
    await render(App);
    expect(screen.getByRole('heading', { name: 'Leita' })).toBeTruthy();
  });
});
