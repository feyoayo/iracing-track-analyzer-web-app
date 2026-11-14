-- Application baseline. Supabase Auth and roles must already exist.
-- Existing databases: verify equivalence, then resolve as applied; do not replay.

-- Source: 20260618_create_profiles.sql
create extension if not exists "pgcrypto";

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

insert into public.profiles (
  id,
  email,
  full_name,
  avatar_url
)
select
  users.id,
  users.email,
  users.raw_user_meta_data ->> 'full_name',
  users.raw_user_meta_data ->> 'avatar_url'
from auth.users as users
on conflict (id) do update
set
  email = excluded.email,
  full_name = coalesce(excluded.full_name, public.profiles.full_name),
  avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
  updated_at = timezone('utc', now());

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

comment on table public.profiles is
'Application profile rows synced from auth.users and extended with app-specific fields.';

-- Source: 20260618_create_feedback.sql
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  name text,
  message text not null,
  page_path text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint feedback_message_length check (char_length(trim(message)) between 5 and 1000),
  constraint feedback_name_length check (name is null or char_length(trim(name)) between 1 and 120)
);

alter table public.feedback enable row level security;

drop policy if exists "feedback_insert_anon" on public.feedback;
create policy "feedback_insert_anon"
on public.feedback
for insert
to anon
with check (true);

drop policy if exists "feedback_insert_authenticated" on public.feedback;
create policy "feedback_insert_authenticated"
on public.feedback
for insert
to authenticated
with check (auth.uid() = user_id or user_id is null);

comment on table public.feedback is
'User-submitted product feedback collected from the web application.';

-- Source: 20260623_create_user_owned_tracks.sql
create table if not exists public.user_owned_tracks (
  user_id uuid not null references auth.users (id) on delete cascade,
  track_id integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, track_id)
);

alter table public.user_owned_tracks enable row level security;

drop policy if exists "user_owned_tracks_select_own" on public.user_owned_tracks;
create policy "user_owned_tracks_select_own"
on public.user_owned_tracks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_owned_tracks_insert_own" on public.user_owned_tracks;
create policy "user_owned_tracks_insert_own"
on public.user_owned_tracks
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_owned_tracks_delete_own" on public.user_owned_tracks;
create policy "user_owned_tracks_delete_own"
on public.user_owned_tracks
for delete
to authenticated
using (auth.uid() = user_id);

comment on table public.user_owned_tracks is
'Tracks marked as owned by a specific authenticated user.';

-- Source: 20260623_create_user_favorite_series.sql
create table if not exists public.user_favorite_series (
  user_id uuid not null references auth.users (id) on delete cascade,
  series_name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, series_name)
);

alter table public.user_favorite_series enable row level security;

drop policy if exists "user_favorite_series_select_own" on public.user_favorite_series;
create policy "user_favorite_series_select_own"
on public.user_favorite_series
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_favorite_series_insert_own" on public.user_favorite_series;
create policy "user_favorite_series_insert_own"
on public.user_favorite_series
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_favorite_series_delete_own" on public.user_favorite_series;
create policy "user_favorite_series_delete_own"
on public.user_favorite_series
for delete
to authenticated
using (auth.uid() = user_id);

comment on table public.user_favorite_series is
'Series marked as favorite by a specific authenticated user.';

-- Explicit minimum privileges; RLS still controls rows.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.user_owned_tracks, public.user_favorite_series TO authenticated;
GRANT INSERT ON public.feedback TO anon, authenticated;
