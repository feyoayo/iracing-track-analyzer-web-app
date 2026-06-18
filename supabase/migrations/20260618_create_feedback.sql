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
