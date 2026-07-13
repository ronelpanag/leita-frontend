import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { ApiClient, AuthService, type JobPostingDetail } from '@core';
import { JobDetailPage } from './job-detail-page';

const JOB: JobPostingDetail = {
  id: 'job-1',
  companyId: 'co-1',
  title: 'Frontend Engineer',
  description: 'Build the hiring trail.\n\nAngular 22, zoneless, signals.',
  location: 'Oslo',
  status: 'Published',
  createdAtUtc: '2026-06-20T09:00:00Z',
  publishedAtUtc: '2026-07-01T09:00:00Z',
  closedAtUtc: null,
};

async function renderDetail(job: JobPostingDetail = JOB, authOverrides: object = {}) {
  const api = { getJob: vi.fn().mockReturnValue(of(job)) };
  const auth = {
    isAuthenticated: () => false,
    user: () => null,
    ...authOverrides,
  };
  const view = await render(JobDetailPage, {
    inputs: { id: job.id },
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: ApiClient, useValue: api },
      { provide: AuthService, useValue: auth },
    ],
  });
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: job.title })).toBeTruthy();
  });
  return view;
}

describe('JobDetailPage', () => {
  it('renders the posting and sets a meaningful page title', async () => {
    await renderDetail();
    expect(screen.getByText('Build the hiring trail.')).toBeTruthy();
    expect(TestBed.inject(Title).getTitle()).toBe('Frontend Engineer — Leita');
  });

  it('redirects anonymous visitors through login with a returnTo back to the job', async () => {
    const user = userEvent.setup();
    await renderDetail();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await user.click(screen.getByRole('button', { name: 'Apply for this role' }));

    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnTo: '/jobs/job-1' },
    });
  });

  it('sends authenticated candidates straight into the application flow', async () => {
    const user = userEvent.setup();
    await renderDetail(JOB, {
      isAuthenticated: () => true,
      user: () => ({
        email: 'nora@example.no',
        role: 'Candidate',
        candidateId: 'c1',
        companyId: null,
      }),
    });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await user.click(screen.getByRole('button', { name: 'Apply for this role' }));

    expect(navigate).toHaveBeenCalledWith(['/candidate/apply', 'job-1']);
  });

  it('offers no application CTA to company accounts', async () => {
    await renderDetail(JOB, {
      isAuthenticated: () => true,
      user: () => ({ email: 'b@f.no', role: 'CompanyAdmin', candidateId: null, companyId: 'co-9' }),
    });
    expect(screen.queryByRole('button', { name: 'Apply for this role' })).toBeNull();
    expect(screen.getByText(/company account/)).toBeTruthy();
  });

  it('closes applications for non-published postings', async () => {
    await renderDetail({ ...JOB, status: 'Closed', closedAtUtc: '2026-07-10T09:00:00Z' });
    expect(screen.queryByRole('button', { name: 'Apply for this role' })).toBeNull();
    expect(screen.getByText('This role is no longer accepting applications.')).toBeTruthy();
  });
});
