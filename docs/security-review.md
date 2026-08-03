# Security review — frontend

Reviewed 3 August 2026 against commit `f40bbec`. Scope: this repository (the
Angular client). The API enforces its own authorization; findings about the
backend are marked as such and belong to `leita-backend`.

Everything below was checked against the code, not assumed. Where I expected a
vulnerability and did not find one, that is recorded too — a reviewer who
repeats this work should not have to re-litigate the same suspicions.

## Summary

| Area                    | Result                                                            |
| ----------------------- | ----------------------------------------------------------------- |
| Token storage           | ✅ Strong — no token material in JavaScript-readable storage      |
| XSS                     | ✅ No unsafe sinks in the codebase                                |
| Open redirect           | ✅ Not exploitable; hardened anyway                               |
| Production dependencies | ✅ 0 known vulnerabilities                                        |
| Build/CI dependencies   | ⚠️ 10 known issues, none shipped to browsers                      |
| CSRF                    | ⚠️ Safe today; **breaks if the backend moves to `SameSite=None`** |
| Response headers / CSP  | ⚠️ Not configured (deployment-time, Phase 9)                      |

## Verified good

**Token handling.** The access token exists only as an in-memory signal. The
refresh token is an `HttpOnly` cookie that the frontend never reads and the API
no longer emits in a response body. Only `leita.hasSession` — a literal `"1"`
with no identifier — is persisted. Confirmed in a browser: `document.cookie` is
empty while signed in, and a regression test asserts that even a stray
`refreshToken` in a response body is never written to storage.

**XSS sinks.** No `innerHTML`, no `bypassSecurityTrust*`, no `DomSanitizer`, no
`eval`. All user-generated content (cover letters, job descriptions, company
names) goes through Angular interpolation, which escapes by default.

**No third-party origins.** Fonts are bundled from npm (Fontsource), not a CDN.
There is no analytics or tag manager. A page load contacts only our own origin,
which is both a privacy property and one less supply-chain surface.

**No token leakage to logs.** The only `console` call in `src/` is the bootstrap
error handler in `main.ts`.

**Client-side role checks are UX, not security.** `roleGuard` reads the role from
the unverified JWT payload. That is correct as written — the API enforces the
same rule with its own policies — but it means a tampered token buys a user
nothing beyond a differently-shaped menu.

## Checked and _not_ vulnerable

**Open redirect via `?returnTo=`.** `LoginPage` passes the query parameter to
`Router.navigateByUrl`, which looks like the classic post-login redirect bug. I
tested it in a real browser with two payloads — `https://example.com/attacker`
and the protocol-relative `//example.com/attacker` — and both stayed on-origin:
Angular's Router parses the value as an in-app URL, fails to match a route, and
the wildcard sends the user to `/jobs`. **Not exploitable.**

It is now validated anyway (`safeReturnTo` in `login-page.ts`, with unit tests).
Two reasons: the safety currently depends on an unrelated routing detail that a
future refactor could remove — especially anything that reaches for
`window.location` instead of the Router — and the old behaviour dropped users on
the public board instead of their own home, which was a real if minor bug.

## Open items

### 1. CSRF becomes real if the refresh cookie moves to `SameSite=None` — backend

Today the app is not CSRF-exposed: business endpoints authenticate with a
`Authorization: Bearer` header, which a cross-site form or image cannot set, and
the one cookie-authenticated endpoint (`POST /api/auth/refresh`) is protected by
`SameSite=Lax`, which browsers do not send on cross-site POSTs.

That safety is load-bearing, and Phase 9 threatens it. Deploying the frontend to
Static Web Apps' free tier means the site and the API sit on different registrable
domains (`*.azurestaticapps.net` vs `*.azurewebsites.net`), so the cookie must
become `SameSite=None; Secure` to work at all — and at that moment
`/api/auth/refresh` and `/api/auth/logout` become forgeable from any origin. A
forged refresh does not hand the attacker the token (the response is opaque to
them), but it rotates the victim's refresh token and can be used to log them out
repeatedly.

**If the deployment goes cross-origin, the backend needs a CSRF defence on the
cookie-authenticated auth endpoints** — an anti-forgery token, or an `Origin`
header check on `/api/auth/*`. The alternative is to keep the two same-site
(custom domain on both, or the Standard plan's linked backend), which sidesteps
this entirely. See `docs/backend-follow-ups.md`.

### 2. No security response headers or CSP — deployment-time

The app ships no `Content-Security-Policy`, `X-Content-Type-Options`,
`Referrer-Policy` or `X-Frame-Options`. For a static SPA these belong in the host
configuration rather than the bundle, which is Phase 9 work (paused). When it
resumes, `staticwebapp.config.json` should set at minimum:

- `Content-Security-Policy`: `default-src 'self'` with `connect-src` widened to
  the API origin. Angular's component styles need `style-src 'self'
'unsafe-inline'` unless CSP nonces are wired up; `script-src 'self'` works as
  the build emits no inline scripts.
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY` (or `frame-ancestors 'none'` in the CSP)

A CSP is the main defence-in-depth that this app is missing. It would not fix a
bug that exists today — it would contain one introduced tomorrow.

### 3. Build-toolchain vulnerabilities — low priority, none reach users

`npm audit --omit=dev` reports **0 vulnerabilities**: nothing that ships to a
browser is affected. The 10 advisories are all in build and test tooling
(`esbuild`, `postcss`, `@babel/core`, `tar`, `brace-expansion`, `fast-uri`, and
the CLI's MCP dependency). Their impact is on a developer machine or a CI
runner — e.g. the `esbuild` dev-server advisory needs an attacker who can already
make requests to your local dev server.

Worth clearing when upstream Angular releases pick up the fixes; not worth
forcing a breaking `npm audit fix --force` on a working toolchain today.

## Notes for future changes

- `Company.website` is user-supplied and currently never rendered. If it becomes
  a link, bind it carefully: Angular sanitizes `[href]` and neutralises
  `javascript:` URLs, but an unsanitized `[attr.href]` or a `window.open` would
  not be covered. Add `rel="noopener noreferrer"` with `target="_blank"`.
- Adding analytics or any third-party script changes the cookie-consent position
  described in `/privacy` — see that page's closing paragraph.
