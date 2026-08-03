import { provideRouter } from '@angular/router';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { ApiClient, type JobPostingSummary, type PagedResult } from '@core';
import { JobBoardPage } from './job-board-page';

const JOBS: readonly JobPostingSummary[] = [
  {
    id: 'job-1',
    companyId: 'co-1',
    title: 'Frontend Engineer',
    location: 'Oslo',
    publishedAtUtc: '2026-07-01T09:00:00Z',
  },
  {
    id: 'job-2',
    companyId: 'co-1',
    title: 'Staff Designer',
    location: 'Bergen',
    publishedAtUtc: '2026-07-02T09:00:00Z',
    promoted: true,
  },
];

function pageOf(items: readonly JobPostingSummary[]): PagedResult<JobPostingSummary> {
  return { items, page: 1, pageSize: 20, totalCount: items.length, totalPages: 1 };
}

async function renderBoard(items: readonly JobPostingSummary[] = JOBS) {
  const api = { getOpenJobs: vi.fn().mockReturnValue(of(pageOf(items))) };
  const view = await render(JobBoardPage, {
    providers: [provideRouter([]), { provide: ApiClient, useValue: api }],
  });
  await waitFor(() => {
    expect(screen.queryByRole('status')).toBeNull(); // spinner gone
  });
  return { api, ...view };
}

describe('JobBoardPage', () => {
  it('lists open roles from the paged endpoint', async () => {
    const { api } = await renderBoard();
    expect(api.getOpenJobs).toHaveBeenCalledWith(1, 20, '', '');
    expect(screen.getByText('Frontend Engineer')).toBeTruthy();
    expect(screen.getByText('999 open roles')).toBeTruthy(); // TEMPORARY: proves the test step fails CI
  });

  it('marks promoted postings as featured', async () => {
    await renderBoard();
    expect(screen.getByText('Featured')).toBeTruthy();
  });

  it('sends the keyword to the server rather than filtering locally', async () => {
    const user = userEvent.setup({ delay: null });
    const { api } = await renderBoard();
    api.getOpenJobs.mockReturnValue(of(pageOf([JOBS[0]])));

    await user.type(screen.getByLabelText('Keyword'), 'engineer');

    await waitFor(() => {
      expect(api.getOpenJobs).toHaveBeenCalledWith(1, 20, 'engineer', '');
    });
    await waitFor(() => {
      expect(screen.queryByText('Staff Designer')).toBeNull();
    });
    expect(screen.getByText('1 open role match')).toBeTruthy();
  });

  it('sends the location filter to the server', async () => {
    const user = userEvent.setup({ delay: null });
    const { api } = await renderBoard();
    api.getOpenJobs.mockReturnValue(of(pageOf([JOBS[0]])));

    await user.type(screen.getByLabelText('Location'), 'oslo');

    await waitFor(() => {
      expect(api.getOpenJobs).toHaveBeenCalledWith(1, 20, '', 'oslo');
    });
  });

  it('offers to clear filters when the server returns nothing', async () => {
    const user = userEvent.setup({ delay: null });
    const { api } = await renderBoard();
    api.getOpenJobs.mockReturnValue(of(pageOf([])));

    await user.type(screen.getByLabelText('Keyword'), 'astronaut');

    await waitFor(() => {
      expect(screen.getByText('No roles match your search')).toBeTruthy();
    });

    api.getOpenJobs.mockReturnValue(of(pageOf(JOBS)));
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => {
      expect(screen.getByText('Frontend Engineer')).toBeTruthy();
    });
  });

  it('shows the plain empty state when the board has no postings at all', async () => {
    await renderBoard([]);
    expect(screen.getByText('No open roles right now')).toBeTruthy();
  });
});
