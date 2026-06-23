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
