# Supabase

This directory stores SQL migrations for Supabase-backed application data.

## Current migration

- `migrations/20260618_create_profiles.sql`
  - creates `public.profiles`
  - auto-creates a profile row when a user is inserted into `auth.users`
  - enables RLS so users can only read and update their own profile

## Apply manually

If you are not using the Supabase CLI yet, open the Supabase Dashboard SQL Editor
and run the migration file contents there.

After applying it, every first-time Google login will create a row in
`public.profiles` automatically.
