# Supabase

Historical application SQL, retained for audit and legacy-baseline tests.

**Retired migration workflow:** do not add new files here or apply this history
to a database already managed by Prisma. New migrations live in
`prisma/migrations`. Follow [Prisma adoption and setup](../prisma/README.md).
The descriptions below document the old schema; the manual procedure at the end
is historical, not the current setup workflow.

## Current migration

- `migrations/20260618_create_profiles.sql`
  - creates `public.profiles`
  - auto-creates a profile row when a user is inserted into `auth.users`
  - enables RLS so users can only read and update their own profile
- `migrations/20260618_create_feedback.sql`
  - creates `public.feedback`
  - allows anonymous and authenticated inserts from the app
  - keeps reads out of the public app so review happens in Supabase
- `migrations/20260623_create_user_owned_tracks.sql`
  - creates `public.user_owned_tracks`
  - stores authenticated users' owned track ids
  - enables per-user RLS for select/insert/delete
- `migrations/20260623_create_user_favorite_series.sql`
  - creates `public.user_favorite_series`
  - stores authenticated users' favorite series names
  - enables per-user RLS for select/insert/delete

## Historical manual procedure (retired)

If you are not using the Supabase CLI yet, open the Supabase Dashboard SQL Editor
and run the migration file contents there.

After applying it, every first-time Google login will create a row in
`public.profiles` automatically.
