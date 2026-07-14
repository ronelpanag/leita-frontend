# Backend follow-ups (flagged from the frontend brief)

Items the frontend is already prepared for, waiting on API support. See also
`auth-token-storage.md` for the refresh-cookie and CORS items.

## 1. Server-side search for the public job board (Phase 4)

`GetOpenJobPostingsQuery` only accepts `page` and `pageSize`. The job board
needs keyword + location search; today the frontend filters **client-side over
the current page only**, which is incorrect for any dataset larger than one
page (a match on page 3 is invisible while you sit on page 1).

Suggested contract: `GET /api/public/jobs?page=&pageSize=&q=&location=` with
case-insensitive contains-matching on title/description and location. The
frontend already keeps `q` and `loc` in the URL; switching to server-side is
a one-line change in `JobBoardPage.load()`.

## 2. `promoted` flag on job postings (Promotions roadmap)

`JobPostingSummaryDto` / `JobPostingDetailDto` have no promotion concept yet.
The frontend wire types declare an optional `promoted?: boolean` and both the
job card and the detail page render featured styling (cloudberry accent +
"Featured" badge) the moment the API starts sending it. No frontend change
will be needed.

## 3. Job title (and company name) in `ApplicationDto` (Phase 5)

`GET /api/candidate/applications` returns applications with only
`jobPostingId`. The candidate dashboard must show which role each
application belongs to, so today it resolves titles with one extra
`GET /api/public/jobs/{id}` per distinct posting — an N+1 that also
breaks for postings a company later deletes. Adding `jobTitle` (and
ideally `companyName`) to `ApplicationDto` removes the fan-out.

## 4. Company postings list + edit endpoint (Phase 6)

The company dashboard needs `GET /api/company/jobs` (all of the caller's
postings, drafts included). Today the frontend reconstructs the list from the
_public_ board filtered by `companyId` — drafts from earlier sessions are
invisible and closed postings drop off after a reload. There is also **no
edit endpoint** (`PUT /api/company/jobs/{id}`), so the brief's "edit" action
is not implemented rather than faked. Application counts also need one call
per posting (`GET /jobs/{id}/applications`) — a `applicationCount` on the
list DTO would remove that N+1.

## 5. Candidate identity in company-facing `ApplicationDto` (Phase 6)

Pipeline cards can only show `Candidate 349d15d3` — the DTO carries
`candidateId` but no display name (and no cover letter). Recruiters need
the name; add `candidateDisplayName` (and consider `coverLetter`) to the
DTO returned by `GET /api/company/jobs/{id}/applications`.

## 6. SSR / prerendering for job detail SEO (noted, not urgent)

Job detail pages set `<title>` and `meta description` at runtime. Crawlers
that execute JS see them; plain-HTML crawlers do not. If organic search
matters for the demo, enable Angular SSR (`ng add @angular/ssr`) and render
`/jobs/:id` server-side — the pages are already router-input driven and
side-effect free, so they are SSR-compatible as written.
