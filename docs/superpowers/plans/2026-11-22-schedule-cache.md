# Schedule cache implementation plan

**Goal:** Reuse public season data across page requests with `use cache` and `cacheLife('hours')`.

**Design:** Enable Cache Components. Keep `connection()` in the public data loader so builds do not require a database; cache the database read and derived track history in a separate function. Keep authentication, preferences and locale outside the cache. Preserve the cookie-derived server-rendered HTML language by allowing the root layout to block with `instant = false`.

**Alternatives:** The user selected Cache Components over the smaller `unstable_cache` integration.

**Constraints:** No database changes, new dependencies, or caching of personal data. The default cache is per process and best effort; serverless instances need not share entries. The hours profile revalidates after an hour, rather than guaranteeing immediate schedule imports.

## Implementation

- [x] Enable `cacheComponents` and the recommended `partialPrefetching` in `next.config.ts`.
- [x] Cache the existing data loader body, leaving `connection()` outside the cached function.
- [x] Adapt root layout validation without changing server-rendered locale.
- [x] Preserve data-loader output and database-error tests; adapt framework mocks as needed.
- [x] Document freshness and runtime cache limits in README.
- [x] Run tests, lint, TypeScript, production build and HTTP checks for pages and locales.

## Verification

All 234 unit tests pass; ESLint and build-time TypeScript pass. `next build --webpack`
succeeds without reading the database during prerendering. Turbopack was blocked
by the environment's port-binding restriction, including an escalated attempt.
Production HTTP checks passed for the main pages, profile, auth error, a real
series detail, a track detail, and both cookie-derived HTML languages. Next's
cache debug log showed one generated entry followed by cross-page cache handler
hits with `revalidate: 3600`. No signed-in browser session was tested.

## Review focus

- Builds must not query the live database.
- A database error must still fail the request rather than serve bundled schedules.
- No auth cookie or account preference may enter the shared cached result.
- Ukrainian and English HTML language and content must remain consistent.
- Main pages and dynamic detail routes must still render under Cache Components.
