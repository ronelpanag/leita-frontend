/**
 * Wire types matching Leita.Api exactly: camelCase JSON, enums serialized
 * as strings (JsonStringEnumConverter). Source of truth:
 * leita-backend/src/Leita.Api/Contracts/Requests.cs and the Application DTOs.
 */

// --- Enums (string-serialized) ---

export type PipelineStage = 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';

export type JobPostingStatus = 'Draft' | 'Published' | 'Closed';

export type LeitaRole = 'Candidate' | 'CompanyAdmin' | 'Recruiter';

// --- Common ---

export interface PagedResult<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
}

// --- Auth ---

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

export interface AuthResponse {
  readonly accessToken: string;
  readonly accessTokenExpiresAtUtc: string;
  readonly refreshToken: string;
}

export interface RegisterCandidateRequest {
  readonly displayName: string;
  readonly email: string;
  readonly password: string;
}

export interface RegisterCandidateResponse {
  readonly candidateId: string;
  readonly tokens: AuthResponse;
}

export interface RegisterCompanyRequest {
  readonly companyName: string;
  readonly description: string | null;
  readonly website: string | null;
  readonly adminDisplayName: string;
  readonly email: string;
  readonly password: string;
}

export interface RegisterCompanyResponse {
  readonly companyId: string;
  readonly tokens: AuthResponse;
}

// --- Job postings ---

export interface JobPostingSummary {
  readonly id: string;
  readonly companyId: string;
  readonly title: string;
  readonly location: string | null;
  readonly publishedAtUtc: string | null;
  /**
   * UI hook for the Promotions roadmap feature — the backend does not send
   * this yet; featured styling activates automatically once it does.
   */
  readonly promoted?: boolean;
}

export interface JobPostingDetail {
  readonly id: string;
  readonly companyId: string;
  readonly title: string;
  readonly description: string;
  readonly location: string | null;
  readonly status: JobPostingStatus;
  readonly createdAtUtc: string;
  readonly publishedAtUtc: string | null;
  readonly closedAtUtc: string | null;
  /** UI hook for the Promotions roadmap feature (not sent by the backend yet). */
  readonly promoted?: boolean;
}

export interface CreateJobPostingRequest {
  readonly title: string;
  readonly description: string;
  readonly location: string | null;
}

// --- Applications ---

export interface Interview {
  readonly id: string;
  readonly scheduledAtUtc: string;
  readonly location: string | null;
}

export interface Application {
  readonly id: string;
  readonly jobPostingId: string;
  readonly candidateId: string;
  readonly currentStage: PipelineStage;
  readonly submittedAtUtc: string;
  readonly interviews: readonly Interview[];
}

export interface SubmitApplicationRequest {
  readonly jobPostingId: string;
  readonly coverLetter: string | null;
}

export interface ScheduleInterviewRequest {
  readonly scheduledAtUtc: string;
  readonly location: string | null;
}

// --- Companies ---

export interface Company {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly website: string | null;
}

export interface CreatedId {
  readonly id: string;
}
