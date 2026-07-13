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
  {
    id: 'job-3',
    companyId: 'co-2',
    title: 'Backend Engineer',
    location: null,
    publishedAtUtc: '2026-07-03T09:00:00Z',
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
    expect(api.getOpenJobs).toHaveBeenCalledWith(1, 20);
    expect(screen.getByText('Frontend Engineer')).toBeTruthy();
    expect(screen.getByText('3 open roles')).toBeTruthy();
  });

  it('marks promoted postings as featured', async () => {
    await renderBoard();
    expect(screen.getByText('Featured')).toBeTruthy();
  });

  it('filters by keyword, case-insensitively', async () => {
    const user = userEvent.setup();
    await renderBoard();
    await user.type(screen.getByLabelText('Keyword'), 'engineer');
    await waitFor(() => {
      expect(screen.queryByText('Staff Designer')).toBeNull();
    });
    expect(screen.getByText('Frontend Engineer')).toBeTruthy();
    expect(screen.getByText('Backend Engineer')).toBeTruthy();
    expect(screen.getByText('2 of 3 open roles match')).toBeTruthy();
  });

  it('filters by location and treats missing locations as non-matching', async () => {
    const user = userEvent.setup();
    await renderBoard();
    await user.type(screen.getByLabelText('Location'), 'oslo');
    await waitFor(() => {
      expect(screen.queryByText('Backend Engineer')).toBeNull();
    });
    expect(screen.getByText('Frontend Engineer')).toBeTruthy();
  });

  it('offers to clear filters when nothing matches', async () => {
    const user = userEvent.setup();
    await renderBoard();
    await user.type(screen.getByLabelText('Keyword'), 'astronaut');
    await waitFor(() => {
      expect(screen.getByText('No roles match your search')).toBeTruthy();
    });
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
