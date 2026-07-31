# Backend follow-ups (flagged from the frontend brief)

**Status (2026-07-14): all resolved items are now consumed by the frontend.**
The workarounds this file used to describe have been deleted, not just
documented. What remains below is the one deferred item and the one
frontend-side note.

## 1. Server-side search for the public job board — ✅ done, integrated

`GET /api/public/jobs?page=&pageSize=&q=&location=`. `q` is a
case-insensitive contains-match on title **and description**, `location` on
location. `JobBoardPage` sends both straight to the API (debounced, resetting
to page 1); the old client-side filter over the loaded page is gone, so a
match on page 3 is now findable from page 1 — and a keyword that only appears
in a description matches, which the title-only filter could never do.

## 2. `promoted` flag on job postings — ⏳ deferred by design

No promotion concept exists in the domain yet (`PromotionOrder` is a Phase-10
shell), and sending a hardcoded `false` would be a lie in the contract. The
wire types keep the optional `promoted?: boolean`; the job card and detail
page already render the cloudberry "Featured" treatment the moment the API
starts sending it. No frontend change will be needed.

## 3. Names on `ApplicationDto` — ✅ done, integrated

`jobTitle`, `companyName`, `candidateDisplayName` and `coverLetter` now ship
on every application row. The candidate dashboard reads them directly (the
per-posting `GET /api/public/jobs/{id}` fan-out is deleted), and pipeline
cards show the real candidate name plus a cover-letter excerpt instead of a
truncated GUID. Rows whose posting was deleted render "Role no longer
available" rather than breaking.

## 4. Company postings list + edit endpoint — ✅ done, integrated

`GET /api/company/jobs` returns every posting with `status` and
`applicationCount`, so `CompanyJobsStore` no longer reconstructs the list from
the public board, no longer tracks session-local drafts, and no longer fans
out one call per posting for counts. Drafts from earlier sessions are visible
again. `PUT /api/company/jobs/{id}` backs the new edit page
(`/company/jobs/:id/edit`), which is hidden for closed postings — the API
answers 400 for those.

## 5. Auth: httpOnly refresh cookie + CORS — ✅ done, integrated

See [auth-token-storage.md](auth-token-storage.md). No token material reaches
JavaScript storage any more.

## 6. SSR / prerendering for job detail SEO — frontend-side, not urgent

Job detail pages set `<title>` and `meta description` at runtime. Crawlers
that execute JS see them; plain-HTML crawlers do not. If organic search
matters for the demo, enable Angular SSR (`ng add @angular/ssr`) and render
`/jobs/:id` server-side — those pages are router-input driven and side-effect
free, so they are SSR-compatible as written.
