# Web App

## Purpose

This app provides current-season analysis, Excel export, and track lookup
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

## Profiles table

Application user data lives in `public.profiles`, not `auth.users`.

Apply the SQL migration from:

`supabase/migrations/20260618_create_profiles.sql`

and:

`supabase/migrations/20260618_create_feedback.sql`

and:

`supabase/migrations/20260623_create_user_owned_tracks.sql`

and:

`supabase/migrations/20260623_create_user_favorite_series.sql`

That migration:

- creates `public.profiles`
- creates a trigger that inserts a profile row on first auth signup
- enables RLS so users can only access their own profile
- creates `public.feedback` for in-app feedback submissions
- creates `public.user_owned_tracks` for authenticated track ownership
- creates `public.user_favorite_series` for authenticated favorite series

## Deployment

- Install Command: `npm install`
- Build Command: `npm run build`
- No Python or SQLite runtime is required on Vercel.
