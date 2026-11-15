# Hosted series rollout — 2026-11-15

## Result

The configured Supabase project now stores all five prepared seasons. Current
season is explicitly set to `2026-season-4`. Series have nullable same-season
`linked_to` references; all initially imported links are NULL because the source
does not provide confirmed variant mappings.

| Season | Series | Weeks | Current |
| --- | ---: | ---: | --- |
| 2025 Season 4 | 99 | 1310 | No |
| 2026 Season 1 | 110 | 1296 | No |
| 2026 Season 2 | 108 | 1424 | No |
| 2026 Season 3 | 109 | 1442 | No |
| 2026 Season 4 | 112 | 1478 | Yes |
| Total | 538 | 6950 | |

Every series name/category and every track, week number, and date was compared
with the validated source after import. Production schedule JSON was moved into
`test/fixtures/bootstrap-schedules` after these checks; runtime code reads Postgres.

## Migration history and preservation

- `0_init`: resolved as applied after a catalog comparison; its SQL was not
  replayed against the existing database.
- `20261115101103_create_series_schedule`: applied.
- `20261115123547_protect_prisma_history`: applied. Enables RLS and revokes
  PUBLIC/anon/authenticated privileges on Prisma's metadata table, which otherwise
  inherited Supabase default grants. It safely skips an absent table in shadows.

All 110 original catalog entries matched a freshly replayed baseline. The
disposable reference used PostgreSQL 17.5 and the target is 17.11: same major,
different minor. Environmental roles, effective function ownership, default
grants, and pgcrypto placement were reproduced in the reference; no target
application object was altered to make the comparison pass.

A private local backup was taken before registering history. SHA-256 comparisons
after migration/import confirmed unchanged rows in profiles (2), feedback (3),
user_owned_tracks (7), and user_favorite_series (4). Backup/recovery artifacts
are in `.migration-backups/`, excluded from Git; they contain private data and
must not be published.

## Connections

`DATABASE_SSL_CA_FILE` configures strict CA and hostname verification for pg
runtime/imports. The local CA is `ssl-cert/prod-ca-2021.crt`, excluded from Git.
Provide the public CA separately in any deployment environment.

The native macOS Prisma engine rejected the provider CA despite explicit strict
CA options. `scripts/db/prisma-cli.mjs` runs CLI operations through a temporary
127.0.0.1-only bridge with verified remote TLS. Only the local loopback leg is
plaintext. The proxy closes with the command; no public listener is opened.
`db:migrate:deploy`, `db:migrate:status`, and `db:cli` use this wrapper. Without a
configured provider CA, the wrapper delegates to Prisma directly.

Created `iracing_app_runtime` as LOGIN, NOINHERIT, NOBYPASSRLS, NOSUPERUSER,
NOCREATEDB, NOCREATEROLE, NOREPLICATION, with membership only in anon and
authenticated. Its generated password was written only to protected local
configuration/recovery files. `DATABASE_URL` now uses this role; `DIRECT_URL`
retains the administrator connection. Anonymous schedule reads return 538
series; authenticated queries bound to a nonexistent user see zero owned tracks.

## Verification

- Full suite: 31 files, 195 tests passed.
- TypeScript and ESLint: passed.
- Production build: passed.
- Full history-to-model Prisma diff: empty, exit 0.
- Hosted source comparison: all seasons/series/weeks match.
- RLS enabled on all schedule tables; anon and authenticated have no INSERT
  privilege. Metadata history is explicitly denied to public roles.
- Production-mode local HTTP checks: `/`, `/series`, `/tracks`, and
  `/series/Dallara%20Formula%20iR` all returned 200 and rendered 2026 Season 4.
- Independent review found no important TLS blocker. URL output is buffered
  before redaction to avoid split-chunk URI leaks. Dedicated negative certificate
  and SSL-refusal tests for the bridge remain a testing limitation.

The Supabase security advisor reports no ERROR after metadata protection. The
INFO about RLS without policies on `_prisma_migrations` is intentional deny-all
for public roles. Existing unrelated warnings remain for
[set_updated_at search_path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable),
[trigger-function execute grants](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable),
and [Auth password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Hosted Auth integration and real multi-session concurrency suites still require
their separate disposable test targets; they were not run against user data.
The external PDF parser's decoding was not exercised; orchestration is tested
with fake Python scripts and real PostgreSQL/Prisma transactions. No public
website deployment, commit, or push was performed.
