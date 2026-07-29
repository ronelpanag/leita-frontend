import { Router, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AuthService } from '@core';
import { App } from './app';

function renderShell(authOverrides: object = {}) {
  const auth = {
    isAuthenticated: () => false,
    user: () => null,
    homeUrl: () => '/candidate',
    logout: vi.fn(),
    ...authOverrides,
  };
  return render(App, {
    providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
  }).then((view) => ({ auth, ...view }));
}

describe('App', () => {
  it('renders the anonymous shell with wordmark, skip link and login actions', async () => {
    await renderShell();
    expect(screen.getByRole('link', { name: 'Leita' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Log in' })).toBeTruthy();
    expect(screen.getByRole('main')).toBeTruthy();
  });

  it('shows the candidate home link when authenticated', async () => {
    await renderShell({
      isAuthenticated: () => true,
      user: () => ({
        email: 'nora@example.no',
        role: 'Candidate',
        candidateId: 'c1',
        companyId: null,
      }),
    });
    expect(screen.getByRole('link', { name: 'Your applications' })).toBeTruthy();
  });

  it('logs out and returns to the public board', async () => {
    const user = userEvent.setup();
    const { auth } = await renderShell({
      isAuthenticated: () => true,
      user: () => ({ email: 'b@f.no', role: 'CompanyAdmin', candidateId: null, companyId: 'co1' }),
      homeUrl: () => '/company',
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(auth.logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/jobs');
  });
});
