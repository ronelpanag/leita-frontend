# Leita — web

Frontend for **Leita** (Old Norse for _to seek_), a recruitment platform where
candidates browse and apply to job postings and companies manage their hiring
pipeline. A single Angular 22 app with role-based, lazy-loaded route groups
consuming the Leita .NET API over HTTP.

## Tech stack

| Concern   | Choice                                                                         |
| --------- | ------------------------------------------------------------------------------ |
| Framework | Angular 22, standalone components, **zoneless** change detection               |
| State     | Signals (no NgRx)                                                              |
| Styling   | Tailwind v4 + design tokens (`src/styles/tokens.css`)                          |
| Testing   | Vitest + Angular Testing Library; Playwright for e2e                           |
| Tooling   | ESLint with feature-boundary rules, Husky + commitlint, Prettier               |
| Design    | “Waymark” direction — see [docs/design-direction.md](docs/design-direction.md) |

## Architecture

```
src/app/
├── core/       auth, guards, HTTP interceptor, typed ApiClient, shared stores
├── shared/     design-system components (Button, Modal, DataTable, …)
├── features/
│   ├── jobs/       public job board (anonymous)
│   ├── candidate/  candidate portal (guarded: Candidate)
│   └── company/    recruiter dashboard + pipeline (guarded: CompanyAdmin/Recruiter)
└── app.routes.ts   lazy route groups
```

ESLint enforces the boundaries: `features/*` cannot import from one another;
only `core` and `shared` cross feature lines, and neither may depend on a
feature. The access token lives in memory only; the rotating refresh token is
kept in `sessionStorage` — see [docs/auth-token-storage.md](docs/auth-token-storage.md).

## Scripts

```bash
npm start            # dev server on http://localhost:4200 (proxies /api → :5193)
npm run build        # production build
npm test             # unit tests (Vitest)
npm run test:coverage# unit tests with v8 coverage report
npm run e2e          # Playwright e2e (see below)
npm run lint         # ESLint (incl. boundary rules)
```

## Backend

The app talks to the Leita API at `/api`, proxied to `http://localhost:5193`
in development (`proxy.conf.json`). Start the backend (or the e2e mock) before
running against real data. Endpoint contracts are mirrored in
`src/app/core/api/api-types.ts`. Outstanding backend requests the frontend is
already prepared for are tracked in
[docs/backend-follow-ups.md](docs/backend-follow-ups.md).

## End-to-end tests (optional)

Three critical paths — public browse→apply, candidate dashboard, recruiter
pipeline move — under `e2e/`. They run against a self-contained contract mock
of the API (`e2e/support/mock-api.mjs`), so no real backend is needed:

```bash
npx playwright install chromium   # one-time
npm run e2e
```

Playwright starts both the mock API and the dev server automatically. To test
against the real backend, start it on `:5193` and remove the mock-api entry in
`playwright.config.ts`.

## Design system showcase

A dev-only gallery of the shared components is served at `/dev/components`
(compiled out of production builds).
