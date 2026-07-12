import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { App } from './app';

describe('App', () => {
  it('renders the shell with wordmark, skip link and auth actions', async () => {
    await render(App, {
      providers: [provideRouter([]), provideHttpClient()],
    });
    expect(screen.getByRole('link', { name: 'Leita' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Log in' })).toBeTruthy();
    expect(screen.getByRole('main')).toBeTruthy();
  });
});
