import { HttpClient, HttpContext, HttpContextToken } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  Application,
  AuthResponse,
  Company,
  CompanyJobPosting,
  CreateJobPostingRequest,
  CreatedId,
  JobPostingDetail,
  JobPostingSummary,
  PagedResult,
  PipelineStage,
  RegisterCandidateRequest,
  RegisterCandidateResponse,
  RegisterCompanyRequest,
  RegisterCompanyResponse,
  ScheduleInterviewRequest,
  SubmitApplicationRequest,
  UpdateJobPostingRequest,
} from './api-types';

/** Base URL for the Leita API. Dev serves through the Angular proxy (see proxy.conf.json). */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  factory: () => '/api',
});

/**
 * Marks requests that must never trigger the interceptor's silent-refresh
 * (the auth endpoints themselves: a 401 there is a real answer, not a stale token).
 */
export const SKIP_AUTH_REFRESH = new HttpContextToken<boolean>(() => false);

const skipRefresh = () => new HttpContext().set(SKIP_AUTH_REFRESH, true);

/** Typed client mirroring Leita.Api's endpoint groups. */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  // --- Auth (/api/auth) ---

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.baseUrl}/auth/login`,
      { email, password },
      { context: skipRefresh(), withCredentials: true },
    );
  }

  /**
   * Exchanges the httpOnly refresh cookie for a new token pair. Sends no body:
   * the API reads the cookie, and rotates it on every call.
   */
  refresh(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/refresh`, null, {
      context: skipRefresh(),
      withCredentials: true,
    });
  }

  /** Revokes the refresh token server-side and clears the cookie. */
  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/logout`, null, {
      context: skipRefresh(),
      withCredentials: true,
    });
  }

  // --- Public (/api/public) ---

  /** `q` matches title and description, `location` matches location; both optional. */
  getOpenJobs(
    page = 1,
    pageSize = 20,
    q = '',
    location = '',
  ): Observable<PagedResult<JobPostingSummary>> {
    let params: Record<string, string | number> = { page, pageSize };
    if (q) params = { ...params, q };
    if (location) params = { ...params, location };
    return this.http.get<PagedResult<JobPostingSummary>>(`${this.baseUrl}/public/jobs`, { params });
  }

  getJob(id: string): Observable<JobPostingDetail> {
    return this.http.get<JobPostingDetail>(`${this.baseUrl}/public/jobs/${id}`);
  }

  // --- Candidate (/api/candidate) ---

  registerCandidate(request: RegisterCandidateRequest): Observable<RegisterCandidateResponse> {
    return this.http.post<RegisterCandidateResponse>(
      `${this.baseUrl}/candidate/register`,
      request,
      { context: skipRefresh(), withCredentials: true },
    );
  }

  submitApplication(request: SubmitApplicationRequest): Observable<CreatedId> {
    return this.http.post<CreatedId>(`${this.baseUrl}/candidate/applications`, request);
  }

  getMyApplications(): Observable<readonly Application[]> {
    return this.http.get<readonly Application[]>(`${this.baseUrl}/candidate/applications`);
  }

  followCompany(companyId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/candidate/follows/${companyId}`, null);
  }

  unfollowCompany(companyId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/candidate/follows/${companyId}`);
  }

  getFollowedCompanies(): Observable<readonly Company[]> {
    return this.http.get<readonly Company[]>(`${this.baseUrl}/candidate/follows`);
  }

  // --- Company (/api/company) ---

  registerCompany(request: RegisterCompanyRequest): Observable<RegisterCompanyResponse> {
    return this.http.post<RegisterCompanyResponse>(`${this.baseUrl}/company/register`, request, {
      context: skipRefresh(),
      withCredentials: true,
    });
  }

  /** Every posting of the caller's company — drafts and closed included. */
  getCompanyJobs(): Observable<readonly CompanyJobPosting[]> {
    return this.http.get<readonly CompanyJobPosting[]>(`${this.baseUrl}/company/jobs`);
  }

  createJob(request: CreateJobPostingRequest): Observable<CreatedId> {
    return this.http.post<CreatedId>(`${this.baseUrl}/company/jobs`, request);
  }

  updateJob(id: string, request: UpdateJobPostingRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/company/jobs/${id}`, request);
  }

  publishJob(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/company/jobs/${id}/publish`, null);
  }

  closeJob(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/company/jobs/${id}/close`, null);
  }

  getApplicationsForJob(jobId: string): Observable<readonly Application[]> {
    return this.http.get<readonly Application[]>(
      `${this.baseUrl}/company/jobs/${jobId}/applications`,
    );
  }

  moveApplicationStage(applicationId: string, nextStage: PipelineStage): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/company/applications/${applicationId}/stage`, {
      nextStage,
    });
  }

  scheduleInterview(
    applicationId: string,
    request: ScheduleInterviewRequest,
  ): Observable<CreatedId> {
    return this.http.post<CreatedId>(
      `${this.baseUrl}/company/applications/${applicationId}/interviews`,
      request,
    );
  }
}
