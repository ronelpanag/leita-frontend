import { provideRouter } from '@angular/router';
import { render, screen, waitFor } from '@testing-library/angular';
import { of } from 'rxjs';
import { ApiClient, AuthService, type Application } from '@core';
import { CandidateHomePage } from './candidate-home-page';

const APPLICATIONS: readonly Application[] = [
  {
    id: 'app-1',
    jobPostingId: 'job-1',
    candidateId: 'c-1',
    currentStage: 'Interview',
    submittedAtUtc: '2026-07-01T09:00:00Z',
    interviews: [{ id: 'i-1', scheduledAtUtc: '2027-01-05T13:00:00Z', location: 'Teams' }],
  },
  {
    id: 'app-2',
    jobPostingId: 'job-2',
    candidateId: 'c-1',
    currentStage: 'Applied',
    submittedAtUtc: '2026-07-03T09:00:00Z',
    interviews: [],
  },
];

const auth = {
  user: () => ({
    email: 'nora@example.no',
    role: 'Candidate',
    candidateId: 'c-1',
    companyId: null,
  }),
};

async function renderHome(applications: readonly Application[] = APPLICATIONS) {
  const api = {
    getMyApplications: vi.fn().mockReturnValue(of(applications)),
    getJob: vi
      .fn()
      .mockImplementation((id: string) =>
        of({ id, title: id === 'job-1' ? 'Frontend Engineer' : 'Staff Designer' }),
      ),
  };
  const view = await render(CandidateHomePage, {
    providers: [
      provideRouter([]),
      { provide: ApiClient, useValue: api },
      { provide: AuthService, useValue: auth },
    ],
  });
  await waitFor(() => {
    expect(screen.queryByRole('status')).toBeNull();
  });
  return { api, ...view };
}

describe('CandidateHomePage', () => {
  it('lists applications with resolved job titles and stage badges', async () => {
    await renderHome();
    expect(screen.getByText('Frontend Engineer')).toBeTruthy();
    expect(screen.getByText('Staff Designer')).toBeTruthy();
    expect(screen.getByText('Interview')).toBeTruthy();
    expect(screen.getByText('Applied')).toBeTruthy();
    expect(screen.getByText('2 applications')).toBeTruthy();
  });

  it('shows the upcoming interview time inline', async () => {
    await renderHome();
    expect(screen.getByText(/Interview .*2027/)).toBeTruthy();
  });

  it('resolves each distinct job only once', async () => {
    const { api } = await renderHome([
      ...APPLICATIONS,
      { ...APPLICATIONS[1], id: 'app-3', jobPostingId: 'job-1' },
    ]);
    expect(api.getJob).toHaveBeenCalledTimes(2);
  });

  it('invites the candidate to browse roles when there are no applications', async () => {
    await renderHome([]);
    expect(screen.getByText('No applications yet')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Browse open roles' })).toBeTruthy();
  });
});
