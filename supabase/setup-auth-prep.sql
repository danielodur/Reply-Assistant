-- Reply Assistant: Auth-prep extension (desktop local-first)
-- Run AFTER supabase/setup.sql in the Supabase SQL Editor. Safe to run multiple times.

begin;

-- 9) Desktop user profile (1:1 with Supabase Auth user)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'New User',
  referral_code text unique,
  -- Optional bridge to local-only app user id (replyAssistantProfile.userId)
  local_app_user_id text,
  -- Explicit opt-in flags for any future cloud features (default: off)
  telemetry_opt_in boolean not null default true,
  cloud_backup_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists phone_number text;

create index if not exists idx_profiles_referral_code
  on public.profiles (referral_code)
  where referral_code is not null;

create index if not exists idx_profiles_local_app_user_id
  on public.profiles (local_app_user_id)
  where local_app_user_id is not null;

-- 10) Desktop installation registry (optional device binding)
create table if not exists public.desktop_installations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  installation_key text not null unique,
  platform text,
  app_version text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_desktop_installations_user_id
  on public.desktop_installations (user_id, last_seen_at desc);

-- 11) Scope telemetry to authenticated users (nullable until login)
alter table public.ai_generation_logs
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.ai_generation_logs
  add column if not exists installation_id uuid references public.desktop_installations(id) on delete set null;

alter table public.reply_generation_logs
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.reply_generation_logs
  add column if not exists installation_id uuid references public.desktop_installations(id) on delete set null;

alter table public.email_sync_runs
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.email_sync_runs
  add column if not exists installation_id uuid references public.desktop_installations(id) on delete set null;

alter table public.social_sync_inbox
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.social_sync_inbox
  add column if not exists installation_id uuid references public.desktop_installations(id) on delete set null;

-- Optional analytics for Phase 9 cross-language (jsonb, no PII requirement)
alter table public.ai_generation_logs
  add column if not exists cross_language jsonb;

alter table public.reply_generation_logs
  add column if not exists cross_language jsonb;

create index if not exists idx_ai_generation_logs_user_created
  on public.ai_generation_logs (user_id, created_at desc)
  where user_id is not null;

create index if not exists idx_email_sync_runs_user_created
  on public.email_sync_runs (user_id, created_at desc)
  where user_id is not null;

-- 12) Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, referral_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', 'New User'),
    coalesce(new.raw_user_meta_data->>'referral_code', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 13) updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 14) RLS: profiles (user-owned); telemetry tables stay service-role-only
alter table public.profiles enable row level security;
alter table public.desktop_installations enable row level security;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;

create policy profiles_select_own
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy profiles_update_own
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy profiles_insert_own
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists desktop_installations_select_own on public.desktop_installations;
drop policy if exists desktop_installations_insert_own on public.desktop_installations;
drop policy if exists desktop_installations_update_own on public.desktop_installations;

create policy desktop_installations_select_own
  on public.desktop_installations for select to authenticated
  using (auth.uid() = user_id);

create policy desktop_installations_insert_own
  on public.desktop_installations for insert to authenticated
  with check (auth.uid() = user_id);

create policy desktop_installations_update_own
  on public.desktop_installations for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Telemetry tables: keep denying anon/authenticated direct access (API uses service role)
-- No policy changes on ai_generation_logs, reply_generation_logs, email_sync_runs, social_sync_inbox

commit;
