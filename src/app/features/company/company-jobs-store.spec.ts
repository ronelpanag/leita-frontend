import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiClient, AuthService, type JobPostingSummary } from '@core';
import { CompanyJobsStore } from './company-jobs-store';

const MY_COMPANY = 'co-1';

function summary(id: string, companyId = MY_COMPANY): JobPostingSummary {
  return { id, companyId, title: `Job ${id}`, location: 'Oslo', publishedAtUtc: null };
}

function setup(apiOverrides: object = {}) {
  const api = {
    getOpenJobs: vi
      .fn()
      .mockReturnValue(
        of({
          items: [summary('1'), summary('x', 'other-co')],
          page: 1,
          pageSize: 100,
          totalCount: 2,
          totalPages: 1,
        }),
      ),
    getApplicationsForJob: vi.fn().mockReturnValue(of([{ id: 'a1' }, { id: 'a2' }])),
    createJob: vi.fn().mockReturnValue(of({ id: 'draft-1' })),
    publishJob: vi.fn().mockReturnValue(of(undefined)),
    closeJob: vi.fn().mockReturnValue(of(undefined)),
    ...apiOverrides,
  };
  const auth = { user: () => ({ companyId: MY_COMPANY, role: 'CompanyAdmin' }) };
  TestBed.configureTestingModule({
    providers: [
      { provide: ApiClient, useValue: api },
      { provide: AuthService, useValue: auth },
    ],
  });
  return { api, store: TestBed.inject(CompanyJobsStore) };
}

describe('CompanyJobsStore', () => {
  it('lists only the caller company postings with application counts', async () => {
    const { api, store } = setup();
    await store.load();
    const rows = store.rows();
    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe('1');
    expect(rows[0].status).toBe('Published');
    expect(rows[0].applicationCount).toBe(2);
    expect(api.getApplicationsForJob).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the user has no company', async () => {
    const { api } = setup();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: ApiClient, useValue: api },
        { provide: AuthService, useValue: { user: () => null } },
      ],
    });
    const store = TestBed.inject(CompanyJobsStore);
    await store.load();
    expect(store.rows()).toEqual([]);
    expect(api.getOpenJobs).not.toHaveBeenCalled();
  });

  it('leaves the count unknown when the applications call fails', async () => {
    const { store } = setup({
      getApplicationsForJob: vi.fn().mockReturnValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { subscribe: (obs: any) => obs.error(new Error('boom')) } as any,
      ),
    });
    await store.load();
    expect(store.rows()[0].applicationCount).toBeNull();
  });

  it('adds a created draft to the top of the list', async () => {
    const { api, store } = setup();
    await store.load();
    const id = await store.createDraft('New role', 'Desc', 'Bergen');
    expect(id).toBe('draft-1');
    expect(api.createJob).toHaveBeenCalledWith({
      title: 'New role',
      description: 'Desc',
      location: 'Bergen',
    });
    const rows = store.rows();
    expect(rows[0]).toMatchObject({ id: 'draft-1', status: 'Draft', title: 'New role' });
  });

  it('reloads after publishing so the posting is not duplicated', async () => {
    const published = summary('draft-1');
    const api = {
      getOpenJobs: vi
        .fn()
        .mockReturnValueOnce(
          of({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0 }),
        )
        .mockReturnValue(
          of({ items: [published], page: 1, pageSize: 100, totalCount: 1, totalPages: 1 }),
        ),
      getApplicationsForJob: vi.fn().mockReturnValue(of([])),
      createJob: vi.fn().mockReturnValue(of({ id: 'draft-1' })),
      publishJob: vi.fn().mockReturnValue(of(undefined)),
      closeJob: vi.fn().mockReturnValue(of(undefined)),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: ApiClient, useValue: api },
        { provide: AuthService, useValue: { user: () => ({ companyId: MY_COMPANY }) } },
      ],
    });
    const store = TestBed.inject(CompanyJobsStore);
    await store.load();
    await store.createDraft('New role', 'Desc', null);
    await store.publish('draft-1');
    expect(api.publishJob).toHaveBeenCalledWith('draft-1');
    const matching = store.rows().filter((row) => row.id === 'draft-1');
    expect(matching.length).toBe(1);
    expect(matching[0].status).toBe('Published');
  });

  it('marks a posting closed after closing it', async () => {
    const { api, store } = setup();
    await store.load();
    await store.close('1');
    expect(api.closeJob).toHaveBeenCalledWith('1');
    expect(store.rows()[0].status).toBe('Closed');
  });
});
