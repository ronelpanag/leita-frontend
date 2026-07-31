import { Router, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of, throwError } from 'rxjs';
import { ApiClient, type JobPostingDetail } from '@core';
import { ToastService } from '@shared';
import { ApplyPage } from './apply-page';

const JOB: JobPostingDetail = {
  id: 'job-1',
  companyId: 'co-1',
  title: 'Frontend Engineer',
  description: 'Build the trail.',
  location: 'Oslo',
  status: 'Published',
  createdAtUtc: '2026-06-20T09:00:00Z',
  publishedAtUtc: '2026-07-01T09:00:00Z',
  closedAtUtc: null,
};

async function renderApply(
  overrides: Partial<Record<'getJob' | 'submitApplication', unknown>> = {},
) {
  const api = {
    getJob: vi.fn().mockReturnValue(of(JOB)),
    submitApplication: vi.fn().mockReturnValue(of({ id: 'app-1' })),
    ...overrides,
  };
  const view = await render(ApplyPage, {
    inputs: { jobId: 'job-1' },
    providers: [provideRouter([]), { provide: ApiClient, useValue: api }],
  });
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'Frontend Engineer' })).toBeTruthy();
  });
  return { api, ...view };
}

describe('ApplyPage', () => {
  it('shows the role being applied to', async () => {
    await renderApply();
    expect(screen.getByText('Oslo')).toBeTruthy();
    expect(screen.getByLabelText(/Cover letter/)).toBeTruthy();
  });

  it('submits the application with the cover letter and redirects to the dashboard', async () => {
    const user = userEvent.setup({ delay: null });
    const { api } = await renderApply();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const toasts = TestBed.inject(ToastService);
    const show = vi.spyOn(toasts, 'show');

    await user.type(screen.getByLabelText(/Cover letter/), 'I know the trail.');
    await user.click(screen.getByRole('button', { name: 'Submit application' }));

    await waitFor(() => {
      expect(api.submitApplication).toHaveBeenCalledWith({
        jobPostingId: 'job-1',
        coverLetter: 'I know the trail.',
      });
    });
    expect(show).toHaveBeenCalledWith('Application submitted', 'success');
    expect(navigate).toHaveBeenCalledWith('/candidate');
  });

  it('sends null when the cover letter is left empty', async () => {
    const user = userEvent.setup({ delay: null });
    const { api } = await renderApply();
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    await user.click(screen.getByRole('button', { name: 'Submit application' }));

    await waitFor(() => {
      expect(api.submitApplication).toHaveBeenCalledWith({
        jobPostingId: 'job-1',
        coverLetter: null,
      });
    });
  });

  it('surfaces a useful error when the submission fails (e.g. duplicate)', async () => {
    const user = userEvent.setup({ delay: null });
    await renderApply({
      submitApplication: vi.fn().mockReturnValue(throwError(() => new Error('409'))),
    });

    await user.click(screen.getByRole('button', { name: 'Submit application' }));

    await waitFor(() => {
      expect(screen.getByText(/already applied/)).toBeTruthy();
    });
  });
});
