-- Existing projects only: preserves existing rows as the cooking workspace.
-- Run in Supabase SQL Editor before using the updated workspace sync UI.
begin;
alter table public.journals add column if not exists workspace text not null default 'cooking' check (workspace in ('cooking','toddler'));
alter table public.journals drop constraint journals_pkey;
alter table public.journals add primary key (user_id,workspace);
commit;
