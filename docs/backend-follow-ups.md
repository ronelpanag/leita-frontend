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

## 3. SSR / prerendering for job detail SEO (noted, not urgent)

Job detail pages set `<title>` and `meta description` at runtime. Crawlers
that execute JS see them; plain-HTML crawlers do not. If organic search
matters for the demo, enable Angular SSR (`ng add @angular/ssr`) and render
`/jobs/:id` server-side — the pages are already router-input driven and
side-effect free, so they are SSR-compatible as written.
