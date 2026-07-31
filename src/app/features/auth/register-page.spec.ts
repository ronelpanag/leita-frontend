import { Router, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AuthService } from '@core';
import { RegisterPage } from './register-page';

function setup(authOverrides: object = {}) {
  const auth = {
    registerCandidate: vi.fn().mockResolvedValue(undefined),
    registerCompany: vi.fn().mockResolvedValue(undefined),
    homeUrl: () => '/candidate',
    ...authOverrides,
  };
  return render(RegisterPage, {
    providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
  }).then((view) => ({ auth, ...view }));
}

describe('RegisterPage', () => {
  it('registers a candidate by default', async () => {
    const user = userEvent.setup({ delay: null });
    const { auth } = await setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    await user.type(screen.getByLabelText(/Full name/), 'Nora Berg');
    await user.type(screen.getByLabelText(/Email/), 'nora@example.no');
    await user.type(screen.getByLabelText(/Password/), 'Passw0rd!x');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(auth.registerCandidate).toHaveBeenCalledWith({
        displayName: 'Nora Berg',
        email: 'nora@example.no',
        password: 'Passw0rd!x',
      });
    });
    expect(navigate).toHaveBeenCalledWith('/candidate');
  });

  it('switches to the company form and requires a company name', async () => {
    const user = userEvent.setup({ delay: null });
    const { auth } = await setup();
    await user.click(screen.getByRole('radio', { name: 'Hiring' }));

    // Company name required — submitting empty blocks the call.
    await user.type(screen.getByLabelText(/Your name/), 'Bjørn Aas');
    await user.type(screen.getByLabelText(/Email/), 'b@fjellheim.no');
    await user.type(screen.getByLabelText(/Password/), 'Passw0rd!x');
    await user.click(screen.getByRole('button', { name: 'Register company' }));
    expect(auth.registerCompany).not.toHaveBeenCalled();
    expect(screen.getByText('Enter your company name.')).toBeTruthy();

    await user.type(screen.getByLabelText(/Company name/), 'Fjellheim AS');
    await user.click(screen.getByRole('button', { name: 'Register company' }));
    await waitFor(() => {
      expect(auth.registerCompany).toHaveBeenCalledWith(
        expect.objectContaining({ companyName: 'Fjellheim AS', adminDisplayName: 'Bjørn Aas' }),
      );
    });
  });

  it('surfaces a friendly error when registration fails', async () => {
    const user = userEvent.setup({ delay: null });
    await setup({ registerCandidate: vi.fn().mockRejectedValue(new Error('422')) });

    await user.type(screen.getByLabelText(/Full name/), 'Nora');
    await user.type(screen.getByLabelText(/Email/), 'nora@example.no');
    await user.type(screen.getByLabelText(/Password/), 'Passw0rd!x');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByText(/Could not create the account/)).toBeTruthy();
    });
  });
});
