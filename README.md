# Web App

## Purpose

This app provides current-season analysis, Excel export, and track lookup
without using the Discord bot at runtime.

## Schedule data and refresh

Seasons, series (including optional `linked_to` variant links), and weekly
schedules are read from Supabase Postgres through Prisma. Pages require the
server-only `DATABASE_URL` runtime connection; public Supabase Auth keys alone
are not sufficient. Builds do not connect to the database.

Before running this version against an existing project, follow the baseline
adoption instructions in [prisma/README.md](prisma/README.md), then explicitly
apply migrations and backfill the schedules:

```bash
npm run db:migrate:deploy
npm run db:backfill-series -- test/fixtures/bootstrap-schedules --current 2026-season-4
```

The five bootstrap fixtures contain 538 series and 6,950 scheduled weeks in total.
They have been imported and verified on the configured Supabase target. Production
schedule files were removed from `data/schedules`; the retained snapshots under
`test/fixtures/bootstrap-schedules` are test fixtures and optional bootstrap input.
The application never imports these files at runtime.
Existing `data/metadata.json` and `data/seasons.json` are also not runtime
sources for the current season. They remain available during rollout.

For a provider-specific root certificate, set the server-only
`DATABASE_SSL_CA_FILE` path. Keep the local `ssl-cert/` folder out of Git and
provide the same public CA file in the server environment when deploying.
The `db:migrate:*` commands bridge the native migration engine through a local
loopback connection with strict CA and hostname verification on the remote TLS
connection. `db:cli` exposes the same wrapper for other Prisma CLI commands.

To import one prepared schedule (without changing the current season):

```bash
npm run db:import-series -- /path/to/2027-season-1.json
```

Add `--current` to explicitly select it. Imports are transactional per season,
replace stale schedules, and preserve links on surviving series. Links are
configured explicitly by an administrator; names are not automatically paired.

## PDF refresh

Requires the analyzer repo at `../iracing-track-analyzer` (or `ANALYZER_DIR`):

```bash
npm run import-pdf -- ../iracing-track-analyzer/pdfs/2026s4.pdf
```

The season name is derived from `YYYYsN.pdf`; pass `--season "2026 Season 4"`
otherwise. Set `DIRECT_URL` for the administrator import connection. Parser
output is temporary: only the selected season is imported into Postgres.
The current season stays unchanged unless `--current` is supplied. The local
historical track index is refreshed for that season while retaining other
seasons; commit that index until tracks are migrated separately.

The external analyzer owns PDF parsing and its SQLite staging database. Its
existing insert-ignore behavior may retain old rows when re-parsing corrected
PDFs; review/correct that staging data if the importer rejects duplicate weeks.

## Local Development

```bash
npm install
npm run test
npm run lint
npm run build
npm run dev
```

## Google Auth Setup

Set these environment variables in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Then configure Google in Supabase and Google Cloud:

1. Enable the Google provider in the Supabase dashboard.
2. In Google Cloud, add your app origin under Authorized JavaScript origins.
3. In Google Cloud, add the Supabase Google callback URL from the Supabase dashboard under Authorized redirect URIs.
4. Add your app URL and `http://localhost:3000` to the Supabase redirect allow list.

The app uses the callback route `/auth/callback` for the PKCE code exchange.

## Database access and migrations

Application tables use Prisma ORM; Google login/session management stays in
Supabase Auth. Set the server-only database URLs from `.env.example` as well as
the public Auth settings above. See [the Prisma workflow](prisma/README.md) for
connection roles, baseline adoption, migration creation and integration tests.

Existing databases must be verified and baselined before using Prisma migrations.
Do not replay the baseline over existing tables or run a reset. Historical SQL
files under `supabase/migrations` are retained for reference; all new application
migrations belong in `prisma/migrations`.

Quick offline checks:

```bash
npm run db:validate
npm run db:generate
npm run test
npm run lint
npm run build
```

Database migrations run explicitly, separately from install/build/start.

## Deployment

- Install Command: `npm install`
- Build Command: `npm run build`
- No Python or SQLite runtime is required on Vercel.
