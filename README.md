# Web App

## Purpose

This app provides current-season analysis and track lookup
without using the Discord bot at runtime.

## Local Data Refresh

Requires the analyzer repo at `../iracing-track-analyzer` (or `ANALYZER_DIR`):

```bash
bun scripts/import-pdf.ts ../iracing-track-analyzer/pdfs/2026s4.pdf
```

The season name is derived from `YYYYsN.pdf`; pass `--season "2026 Season 4"` otherwise.
Then commit the updated JSON in `data/`.

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
