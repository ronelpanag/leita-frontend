import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { render, screen, waitFor, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of, throwError } from 'rxjs';
import { ApiClient, type Application } from '@core';
import { ToastService } from '@shared';
import { PipelinePage } from './pipeline-page';

const APPLICATIONS: readonly Application[] = [
  {
    id: 'app-1',
    jobPostingId: 'job-1',
    jobTitle: 'Frontend Engineer',
    companyName: 'Fjellheim AS',
    candidateId: 'c0ffee00-aaaa-0000-0000-000000000001',
    candidateDisplayName: 'Nora Berg',
    coverLetter: 'I know the trail.',
    currentStage: 'Applied',
    submittedAtUtc: '2026-07-01T09:00:00Z',
    interviews: [],
  },
  {
    id: 'app-2',
    jobPostingId: 'job-1',
    jobTitle: 'Frontend Engineer',
    companyName: 'Fjellheim AS',
    candidateId: 'c0ffee00-bbbb-0000-0000-000000000002',
    candidateDisplayName: 'Bjørn Aas',
    coverLetter: null,
    currentStage: 'Interview',
    submittedAtUtc: '2026-07-02T09:00:00Z',
    interviews: [],
  },
];

async function renderPipeline(overrides: object = {}) {
  const api = {
    getApplicationsForJob: vi.fn().mockReturnValue(of(APPLICATIONS)),
    moveApplicationStage: vi.fn().mockReturnValue(of(undefined)),
    scheduleInterview: vi.fn().mockReturnValue(of({ id: 'i-1' })),
    ...overrides,
  };
  const view = await render(PipelinePage, {
    inputs: { id: 'job-1' },
    providers: [provideRouter([]), { provide: ApiClient, useValue: api }],
  });
  await waitFor(() => {
    expect(screen.getByText('Nora Berg')).toBeTruthy();
  });
  return { api, ...view };
}

function column(stage: string) {
  return screen.getByRole('listitem', { name: new RegExp(`^${stage}`) });
}

describe('PipelinePage', () => {
  it('renders one column per stage with correct counts', async () => {
    await renderPipeline();
    expect(within(column('Applied')).getByText('Nora Berg')).toBeTruthy();
    expect(within(column('Applied')).getByText('I know the trail.')).toBeTruthy();
    expect(column('Applied').getAttribute('aria-label')).toBe('Applied — 1 application');
    expect(column('Screening').getAttribute('aria-label')).toBe('Screening — 0 applications');
    expect(column('Interview').getAttribute('aria-label')).toBe('Interview — 1 application');
  });

  it('offers only legal stage moves as keyboard-accessible buttons', async () => {
    await renderPipeline();
    const appliedCard = within(column('Applied')).getByRole('article');
    const labels = within(appliedCard)
      .getAllByRole('button')
      .map((button) => button.textContent?.trim());
    expect(labels).toContain('→ Screening');
    expect(labels).toContain('Reject');
    expect(labels).not.toContain('→ Interview');
    expect(labels).not.toContain('→ Offer');
  });

  it('moves a card via the keyboard fallback and persists through the API', async () => {
    const user = userEvent.setup();
    const { api } = await renderPipeline();

    await user.click(within(column('Applied')).getByRole('button', { name: '→ Screening' }));

    await waitFor(() => {
      expect(api.moveApplicationStage).toHaveBeenCalledWith('app-1', 'Screening');
    });
    expect(column('Screening').getAttribute('aria-label')).toBe('Screening — 1 application');
    expect(column('Applied').getAttribute('aria-label')).toBe('Applied — 0 applications');
  });

  it('rolls the board back when the API rejects the move', async () => {
    const user = userEvent.setup();
    const { api } = await renderPipeline({
      moveApplicationStage: vi.fn().mockReturnValue(throwError(() => new Error('409'))),
    });

    await user.click(within(column('Applied')).getByRole('button', { name: '→ Screening' }));

    await waitFor(() => {
      expect(
        TestBed.inject(ToastService)
          .toasts()
          .some((toast) => toast.message.includes('board has been restored')),
      ).toBe(true);
    });
    expect(column('Applied').getAttribute('aria-label')).toBe('Applied — 1 application');
    expect(column('Screening').getAttribute('aria-label')).toBe('Screening — 0 applications');
    expect(api.moveApplicationStage).toHaveBeenCalledTimes(1);
  });

  it('blocks illegal drops before they reach the API', async () => {
    const { api, fixture } = await renderPipeline();
    const page = fixture.componentInstance as unknown as {
      move(application: Application, target: string): Promise<void>;
    };
    await page.move(APPLICATIONS[0], 'Offer');
    expect(api.moveApplicationStage).not.toHaveBeenCalled();
    expect(
      TestBed.inject(ToastService)
        .toasts()
        .some((toast) => toast.message.includes('not a legal step')),
    ).toBe(true);
  });

  it('routes CDK drops through the same guarded move path', async () => {
    const { api, fixture } = await renderPipeline();
    const page = fixture.componentInstance as unknown as {
      onDrop(event: { item: { data: Application }; container: { data: string } }): void;
    };

    // Legal drop: Applied -> Screening
    page.onDrop({ item: { data: APPLICATIONS[0] }, container: { data: 'Screening' } });
    await waitFor(() => {
      expect(api.moveApplicationStage).toHaveBeenCalledWith('app-1', 'Screening');
    });

    // Drop onto the same column is a no-op
    page.onDrop({ item: { data: APPLICATIONS[1] }, container: { data: 'Interview' } });
    expect(api.moveApplicationStage).toHaveBeenCalledTimes(1);
  });

  it('schedules an interview from a card', async () => {
    const user = userEvent.setup();
    const { api } = await renderPipeline();

    await user.click(within(column('Interview')).getByRole('button', { name: 'Interview…' }));
    const dialog = await screen.findByRole('dialog');
    const when = within(dialog).getByLabelText(/When/);
    (when as HTMLInputElement).value = '2027-01-05T13:00';
    when.dispatchEvent(new Event('input', { bubbles: true }));
    await user.type(within(dialog).getByLabelText(/Location/), 'Teams');
    await user.click(within(dialog).getByRole('button', { name: 'Schedule interview' }));

    await waitFor(() => {
      expect(api.scheduleInterview).toHaveBeenCalledWith('app-2', {
        scheduledAtUtc: new Date('2027-01-05T13:00').toISOString(),
        location: 'Teams',
      });
    });
  });
});
