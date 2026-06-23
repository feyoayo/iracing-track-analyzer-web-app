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
