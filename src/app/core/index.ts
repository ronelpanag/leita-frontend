// Core barrel: auth, guards, interceptor, typed API layer.
export { API_BASE_URL, ApiClient, SKIP_AUTH_REFRESH } from './api/api-client';
export * from './api/api-types';
export { authGuard } from './auth/auth-guard';
export { authInterceptor } from './auth/auth-interceptor';
export { AuthService, type AuthUser } from './auth/auth-service';
export { FollowsStore } from './candidate/follows-store';
export { roleGuard } from './auth/role-guard';
export { unsavedChangesGuard, type HasUnsavedChanges } from './routing/unsaved-changes-guard';
