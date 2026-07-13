-- Reply Assistant: support_requests table (authenticated API insert via service_role)
-- Run AFTER setup-auth-prep.sql. Safe to re-run.

begin;

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null,
  email text not null,
  phone_number text,
  issue_category text not null,
  message text not null check (char_length(message) <= 200),
  app_version text,
  platform text,
  created_at timestamptz not null default now()
);

alter table public.support_requests enable row level security;

-- Deny direct client access; apps/api uses service_role to insert.
drop policy if exists support_requests_deny_all on public.support_requests;
create policy support_requests_deny_all
  on public.support_requests
  for all
  using (false)
  with check (false);

commit;
