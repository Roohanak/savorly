-- Run once in a new Supabase project's SQL Editor.
-- Each authenticated account can access only its own journal.
create table public.journals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  revision bigint not null default 1 check (revision > 0),
  constraint journal_size_limit check (octet_length(payload::text) <= 16777216)
);

alter table public.journals enable row level security;
revoke all on public.journals from anon;
grant select, insert, update on public.journals to authenticated;

create policy "Read own journal" on public.journals
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own journal" on public.journals
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own journal" on public.journals
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
