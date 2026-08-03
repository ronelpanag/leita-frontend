import { provideRouter } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import { PrivacyPage } from './privacy-page';
import { TermsPage } from './terms-page';

describe('Legal pages', () => {
  it('marks the terms as an unreviewed template rather than passing them off as vetted', async () => {
    await render(TermsPage, { providers: [provideRouter([])] });
    expect(screen.getByRole('heading', { name: 'Terms and conditions' })).toBeTruthy();
    expect(screen.getByRole('note').textContent).toContain('Template — not legal advice');
  });

  it('states plainly that Leita is not the employer', async () => {
    await render(TermsPage, { providers: [provideRouter([])] });
    expect(screen.getByText(/not the employer/)).toBeTruthy();
  });

  it('discloses every piece of browser storage the app actually uses', async () => {
    await render(PrivacyPage, { providers: [provideRouter([])] });
    const table = screen.getByRole('table', { name: /Cookies and browser storage/ });

    // These two names are the whole inventory — see AuthService and the API's
    // RefreshTokenCookie. If a third one ever appears, this test should fail.
    expect(within(table).getByText('leita_refresh')).toBeTruthy();
    expect(within(table).getByText('leita.hasSession')).toBeTruthy();
    expect(within(table).getAllByRole('row').length).toBe(3); // header + 2
  });

  it('explains why no consent banner is shown, and when that would change', async () => {
    await render(PrivacyPage, { providers: [provideRouter([])] });
    expect(screen.getAllByText(/strictly necessary/).length).toBeGreaterThan(0);
    expect(screen.getByText(/does not interrupt you with a consent banner/)).toBeTruthy();
    expect(screen.getByText(/we would need your consent first/)).toBeTruthy();
  });
});
