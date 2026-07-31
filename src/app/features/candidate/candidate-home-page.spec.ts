import { provideRouter } from '@angular/router';
import { render, screen, waitFor } from '@testing-library/angular';
import { of } from 'rxjs';
import { ApiClient, AuthService, type Application } from '@core';
import { CandidateHomePage } from './candidate-home-page';

const APPLICATIONS: readonly Application[] = [
  {
    id: 'app-1',
    jobPostingId: 'job-1',
    jobTitle: 'Frontend Engineer',
    companyName: 'Fjellheim AS',
    candidateId: 'c-1',
    candidateDisplayName: 'Nora Berg',
    coverLetter: null,
    currentStage: 'Interview',
    submittedAtUtc: '2026-07-01T09:00:00Z',
    interviews: [{ id: 'i-1', scheduledAtUtc: '2027-01-05T13:00:00Z', location: 'Teams' }],
  },
  {
    id: 'app-2',
    jobPostingId: 'job-2',
    jobTitle: 'Staff Designer',
    companyName: 'Brevik Studio',
    candidateId: 'c-1',
    candidateDisplayName: 'Nora Berg',
    coverLetter: null,
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
  const api = { getMyApplications: vi.fn().mockReturnValue(of(applications)) };
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

  it('reads titles straight off the row — no per-posting fan-out', async () => {
    const { api } = await renderHome();
    expect(api).not.toHaveProperty('getJob');
    expect(api.getMyApplications).toHaveBeenCalledTimes(1);
  });

  it('falls back gracefully when a posting was deleted', async () => {
    await renderHome([{ ...APPLICATIONS[1], jobTitle: null, companyName: null }]);
    expect(screen.getByText('Role no longer available')).toBeTruthy();
  });

  it('invites the candidate to browse roles when there are no applications', async () => {
    await renderHome([]);
    expect(screen.getByText('No applications yet')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Browse open roles' })).toBeTruthy();
  });
});
