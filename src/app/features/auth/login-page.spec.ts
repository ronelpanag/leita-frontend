import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AuthService } from '@core';
import { LoginPage, safeReturnTo } from './login-page';

function setup(returnTo: string | null, authOverrides: object = {}) {
  const auth = {
    login: vi.fn().mockResolvedValue(undefined),
    homeUrl: () => '/candidate',
    ...authOverrides,
  };
  return render(LoginPage, {
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: auth },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { queryParamMap: new Map([['returnTo', returnTo]]) } },
      },
    ],
  }).then((view) => ({ auth, ...view }));
}

describe('LoginPage', () => {
  it('validates required fields before calling the API', async () => {
    const user = userEvent.setup({ delay: null });
    const { auth } = await setup(null);
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(auth.login).not.toHaveBeenCalled();
    expect(screen.getByText('Enter the email you registered with.')).toBeTruthy();
  });

  it('logs in and returns to the requested url', async () => {
    const user = userEvent.setup({ delay: null });
    const { auth } = await setup('/jobs/job-1');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    await user.type(screen.getByLabelText(/Email/), 'nora@example.no');
    await user.type(screen.getByLabelText(/Password/), 'Passw0rd!');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(auth.login).toHaveBeenCalledWith('nora@example.no', 'Passw0rd!'));
    expect(navigate).toHaveBeenCalledWith('/jobs/job-1');
  });

  it('falls back to the role home when there is no returnTo', async () => {
    const user = userEvent.setup({ delay: null });
    await setup(null);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    await user.type(screen.getByLabelText(/Email/), 'nora@example.no');
    await user.type(screen.getByLabelText(/Password/), 'Passw0rd!');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/candidate'));
  });

  it('ignores an off-site returnTo and uses the role home instead', async () => {
    const user = userEvent.setup({ delay: null });
    await setup('//evil.example/attacker');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    await user.type(screen.getByLabelText(/Email/), 'nora@example.no');
    await user.type(screen.getByLabelText(/Password/), 'Passw0rd!');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/candidate'));
  });

  it('shows an error when the credentials are rejected', async () => {
    const user = userEvent.setup({ delay: null });
    await setup(null, { login: vi.fn().mockRejectedValue(new Error('401')) });

    await user.type(screen.getByLabelText(/Email/), 'nora@example.no');
    await user.type(screen.getByLabelText(/Password/), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      expect(screen.getByText(/did not match/)).toBeTruthy();
    });
  });
});

describe('safeReturnTo', () => {
  it('keeps in-app paths', () => {
    expect(safeReturnTo('/jobs/job-1')).toBe('/jobs/job-1');
    expect(safeReturnTo('/company/jobs/1/pipeline?tab=x')).toBe('/company/jobs/1/pipeline?tab=x');
  });

  it('rejects anything that could point off-site', () => {
    expect(safeReturnTo('//evil.example')).toBeNull();
    expect(safeReturnTo('https://evil.example')).toBeNull();
    expect(safeReturnTo('http://evil.example')).toBeNull();
    expect(safeReturnTo('/\\evil.example')).toBeNull();
    expect(safeReturnTo('javascript:alert(1)')).toBeNull();
  });

  it('rejects empty and missing values', () => {
    expect(safeReturnTo(null)).toBeNull();
    expect(safeReturnTo('')).toBeNull();
    expect(safeReturnTo('jobs')).toBeNull();
  });
});
