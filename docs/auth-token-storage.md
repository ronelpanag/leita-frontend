# Auth token storage

**Status: migrated (2026-07-14).** The frontend now uses the backend's
httpOnly refresh cookie. No token material of any kind reaches JavaScript
storage. The pre-cookie tradeoff described in earlier revisions is gone.

## How a session works today

- **Access token: memory only.** A signal in `AuthService`, never persisted.
  It dies with the tab and cannot be read from disk after an XSS.
- **Refresh token: `HttpOnly` cookie** (`leita_refresh`, `Path=/api/auth`,
  `SameSite=Lax`, `Secure` outside dev), set by the API on
  login/register/refresh and **rotated on every refresh**. JavaScript cannot
  read it — `document.cookie` is empty. Since 2026-08-02 the API does not
  emit it in a response body either, and `/api/auth/refresh` reads the cookie
  only: a token supplied in the body is rejected. `AuthResponse` therefore
  carries the access token alone.
- **`localStorage` holds one non-sensitive flag**, `leita.hasSession = "1"`.
  It is a hint, not a credential: it tells the app whether attempting a
  refresh on boot is worth a round-trip, so anonymous visitors to the public
  job board don't pay for a request that was always going to 401. The cookie
  is the only thing that actually authenticates, and the API decides.

## Flows

| Flow                | Request                                                                            | Notes                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Login / register    | `POST /api/auth/login`, `/api/{candidate,company}/register` with `withCredentials` | Response body carries the access token only; the cookie is set by the API                              |
| Restore on load     | `POST /api/auth/refresh`, **no body**, `withCredentials`                           | Only attempted when the session hint is present; blocks bootstrap via `provideAppInitializer`          |
| Silent retry on 401 | same refresh call, from `authInterceptor`                                          | One attempt, then logout + redirect to `/login`                                                        |
| Logout              | `POST /api/auth/logout`                                                            | Revokes the token server-side and clears the cookie; local state is dropped first so the UI never lags |

## Deployment note

The cookie is same-origin in development because the Angular dev server
proxies `/api` to `http://localhost:5193` (`proxy.conf.json`). The API's CORS
policy is config-driven (`Cors:AllowedOrigins`) with `AllowCredentials`, so a
cross-origin deployment works too — but Static Web Apps' linked-API proxy
keeps everything same-origin and is still the simpler choice for Phase 9.
