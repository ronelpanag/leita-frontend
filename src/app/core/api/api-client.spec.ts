import { HttpContext, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL, ApiClient, SKIP_AUTH_REFRESH } from './api-client';

describe('ApiClient', () => {
  let api: ApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    api = TestBed.inject(ApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function flushed<T>(call: Promise<T>, url: string) {
    const request = http.expectOne(url);
    request.flush(null);
    return request;
  }

  it('posts login and marks it skip-refresh', async () => {
    const call = firstValueFrom(api.login('nora@example.no', 'pw'));
    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'nora@example.no', password: 'pw' });
    expect(request.request.context.get(SKIP_AUTH_REFRESH)).toBe(true);
    request.flush({ accessToken: 'a', accessTokenExpiresAtUtc: 'x' });
    await call;
  });

  it('refreshes from the cookie: no body, credentials included, skip-refresh', async () => {
    const call = firstValueFrom(api.refresh());
    const request = http.expectOne('/api/auth/refresh');
    expect(request.request.body).toBeNull();
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.context.get(SKIP_AUTH_REFRESH)).toBe(true);
    request.flush({ accessToken: 'a', accessTokenExpiresAtUtc: 'x' });
    await call;
  });

  it('logs out server-side with credentials so the cookie is cleared', async () => {
    const call = firstValueFrom(api.logout());
    const request = http.expectOne('/api/auth/logout');
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    request.flush(null);
    await call;
  });

  it('gets open jobs with paging params, omitting empty search terms', async () => {
    const call = firstValueFrom(api.getOpenJobs(2, 50));
    const request = http.expectOne((r) => r.url === '/api/public/jobs');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('50');
    expect(request.request.params.has('q')).toBe(false);
    expect(request.request.params.has('location')).toBe(false);
    request.flush({ items: [], page: 2, pageSize: 50, totalCount: 0, totalPages: 0 });
    await call;
  });

  it('passes search terms through to the server', async () => {
    const call = firstValueFrom(api.getOpenJobs(1, 20, 'engineer', 'oslo'));
    const request = http.expectOne((r) => r.url === '/api/public/jobs');
    expect(request.request.params.get('q')).toBe('engineer');
    expect(request.request.params.get('location')).toBe('oslo');
    request.flush({ items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 });
    await call;
  });

  it('gets a single job by id', async () => {
    const call = firstValueFrom(api.getJob('job-1'));
    http.expectOne('/api/public/jobs/job-1').flush({ id: 'job-1' });
    await call;
  });

  it('registers a candidate without triggering refresh', async () => {
    const call = firstValueFrom(
      api.registerCandidate({ displayName: 'Nora', email: 'n@x.no', password: 'pw' }),
    );
    const request = http.expectOne('/api/candidate/register');
    expect(request.request.context.get(SKIP_AUTH_REFRESH)).toBe(true);
    request.flush({ candidateId: 'c1', tokens: {} });
    await call;
  });

  it('submits an application, lists applications, and manages follows', async () => {
    const submit = firstValueFrom(
      api.submitApplication({ jobPostingId: 'job-1', coverLetter: null }),
    );
    const submitReq = http.expectOne('/api/candidate/applications');
    expect(submitReq.request.method).toBe('POST');
    expect(submitReq.request.body).toEqual({ jobPostingId: 'job-1', coverLetter: null });
    submitReq.flush({ id: 'app-1' });
    await submit;

    const list = firstValueFrom(api.getMyApplications());
    http.expectOne((r) => r.url === '/api/candidate/applications' && r.method === 'GET').flush([]);
    await list;

    const follow = firstValueFrom(api.followCompany('co-1'));
    const followReq = http.expectOne('/api/candidate/follows/co-1');
    expect(followReq.request.method).toBe('POST');
    followReq.flush(null);
    await follow;

    const unfollow = firstValueFrom(api.unfollowCompany('co-1'));
    const unfollowReq = http.expectOne('/api/candidate/follows/co-1');
    expect(unfollowReq.request.method).toBe('DELETE');
    unfollowReq.flush(null);
    await unfollow;

    const followed = firstValueFrom(api.getFollowedCompanies());
    http.expectOne((r) => r.url === '/api/candidate/follows' && r.method === 'GET').flush([]);
    await followed;
  });

  it('lists and edits company jobs', async () => {
    const list = firstValueFrom(api.getCompanyJobs());
    http.expectOne((r) => r.url === '/api/company/jobs' && r.method === 'GET').flush([]);
    await list;

    const update = firstValueFrom(
      api.updateJob('job-1', { title: 'T2', description: 'D2', location: 'Bergen' }),
    );
    const updateReq = http.expectOne('/api/company/jobs/job-1');
    expect(updateReq.request.method).toBe('PUT');
    expect(updateReq.request.body).toEqual({ title: 'T2', description: 'D2', location: 'Bergen' });
    updateReq.flush(null);
    await update;
  });

  it('creates, publishes and closes company jobs', async () => {
    const create = firstValueFrom(api.createJob({ title: 'T', description: 'D', location: null }));
    const createReq = http.expectOne('/api/company/jobs');
    expect(createReq.request.body).toEqual({ title: 'T', description: 'D', location: null });
    createReq.flush({ id: 'job-1' });
    await create;

    await flushedVoid(firstValueFrom(api.publishJob('job-1')), '/api/company/jobs/job-1/publish');
    await flushedVoid(firstValueFrom(api.closeJob('job-1')), '/api/company/jobs/job-1/close');
  });

  it('moves an application stage and schedules interviews', async () => {
    const move = firstValueFrom(api.moveApplicationStage('app-1', 'Screening'));
    const moveReq = http.expectOne('/api/company/applications/app-1/stage');
    expect(moveReq.request.body).toEqual({ nextStage: 'Screening' });
    moveReq.flush(null);
    await move;

    const schedule = firstValueFrom(
      api.scheduleInterview('app-1', { scheduledAtUtc: '2027-01-05T13:00:00Z', location: 'Teams' }),
    );
    const scheduleReq = http.expectOne('/api/company/applications/app-1/interviews');
    expect(scheduleReq.request.body).toEqual({
      scheduledAtUtc: '2027-01-05T13:00:00Z',
      location: 'Teams',
    });
    scheduleReq.flush({ id: 'i-1' });
    await schedule;
  });

  it('defaults the base URL to /api when the token is not overridden', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const client = TestBed.inject(ApiClient);
    const controller = TestBed.inject(HttpTestingController);
    void firstValueFrom(client.getJob('job-9'));
    controller.expectOne('/api/public/jobs/job-9').flush({ id: 'job-9' });
    controller.verify();
  });

  async function flushedVoid(call: Promise<unknown>, url: string) {
    flushed(call, url);
    await call;
  }

  it('exposes a false skip-refresh default on a fresh context', () => {
    expect(new HttpContext().get(SKIP_AUTH_REFRESH)).toBe(false);
  });
});
