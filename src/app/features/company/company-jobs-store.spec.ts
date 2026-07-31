import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiClient, type CompanyJobPosting } from '@core';
import { CompanyJobsStore } from './company-jobs-store';

const DRAFT: CompanyJobPosting = {
  id: 'job-1',
  title: 'Trail Guide Engineer',
  location: 'Tromsø',
  status: 'Draft',
  createdAtUtc: '2026-07-01T09:00:00Z',
  publishedAtUtc: null,
  closedAtUtc: null,
  applicationCount: 0,
};

function setup(apiOverrides: object = {}) {
  const api = {
    getCompanyJobs: vi.fn().mockReturnValue(of([DRAFT])),
    createJob: vi.fn().mockReturnValue(of({ id: 'job-2' })),
    updateJob: vi.fn().mockReturnValue(of(undefined)),
    publishJob: vi.fn().mockReturnValue(of(undefined)),
    closeJob: vi.fn().mockReturnValue(of(undefined)),
    ...apiOverrides,
  };
  TestBed.configureTestingModule({ providers: [{ provide: ApiClient, useValue: api }] });
  return { api, store: TestBed.inject(CompanyJobsStore) };
}

describe('CompanyJobsStore', () => {
  it('lists the company postings straight from the API, counts included', async () => {
    const { api, store } = setup();
    await store.load();
    expect(api.getCompanyJobs).toHaveBeenCalledTimes(1);
    expect(store.rows()).toEqual([DRAFT]);
    // Drafts come from the API now — no public-board reconstruction.
    expect(api).not.toHaveProperty('getOpenJobs');
  });

  it('creates a draft and reloads so it appears with server state', async () => {
    const { api, store } = setup();
    const id = await store.createDraft('New role', 'Desc', 'Bergen');
    expect(id).toBe('job-2');
    expect(api.createJob).toHaveBeenCalledWith({
      title: 'New role',
      description: 'Desc',
      location: 'Bergen',
    });
    expect(api.getCompanyJobs).toHaveBeenCalled();
  });

  it('edits a posting through the update endpoint', async () => {
    const { api, store } = setup();
    await store.update('job-1', 'Edited', 'New description', null);
    expect(api.updateJob).toHaveBeenCalledWith('job-1', {
      title: 'Edited',
      description: 'New description',
      location: null,
    });
    expect(api.getCompanyJobs).toHaveBeenCalled();
  });

  it('publishes and closes, refreshing the list each time', async () => {
    const { api, store } = setup({
      getCompanyJobs: vi
        .fn()
        .mockReturnValueOnce(of([DRAFT]))
        .mockReturnValue(of([{ ...DRAFT, status: 'Published' as const }])),
    });
    await store.load();
    await store.publish('job-1');
    expect(api.publishJob).toHaveBeenCalledWith('job-1');
    expect(store.rows()[0].status).toBe('Published');

    await store.close('job-1');
    expect(api.closeJob).toHaveBeenCalledWith('job-1');
  });

  it('clears the loading flag even when the request fails', async () => {
    const { store } = setup({
      getCompanyJobs: vi.fn().mockReturnValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { subscribe: (obs: any) => obs.error(new Error('boom')) } as any,
      ),
    });
    await expect(store.load()).rejects.toBeTruthy();
    expect(store.loading()).toBe(false);
  });
});
