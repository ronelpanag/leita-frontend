# Auth token storage — current tradeoff

## What the backend provides today

`POST /api/auth/login` and `/api/auth/refresh` return **both** tokens in the
response body (`AuthResponse`): a 15-minute access token and a 7-day rotating
refresh token. There is no cookie-based refresh flow.

## What the frontend does

- **Access token: memory only** (a signal in `AuthService`). Never written to
  storage, so a script-injection attack cannot exfiltrate it from disk and it
  dies with the tab.
- **Refresh token: `sessionStorage`.** Kept so a page reload can silently
  restore the session (memory-only would log users out on every F5, which is
  not acceptable UX for a dashboard product).

## Why this is a documented tradeoff, not the end state

`sessionStorage` is readable by JavaScript, so an XSS vulnerability could steal
the refresh token. Mitigations in place: the token rotates on every use
(a stolen, already-used token is invalid), it is scoped to the tab session,
and the access token itself is never persisted.

**Flag back to the backend brief:** the clean fix is server-side — issue the
refresh token as an `HttpOnly; Secure; SameSite=Strict` cookie on
`/api/auth/*` and read it from the cookie in `/api/auth/refresh` instead of
the request body. When that lands, delete the `sessionStorage` usage in
`AuthService` and send `withCredentials: true` on the refresh call.

**Also flag:** the API currently has **no CORS configuration**. Local dev
works because the Angular dev server proxies `/api` → `http://localhost:5193`
(see `proxy.conf.json`). Deployment (Phase 9) needs either Static Web Apps'
linked-API proxy (keeps same-origin, no CORS needed — preferred) or explicit
CORS on the API.
