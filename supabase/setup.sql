-- Reply Assistant: Supabase Setup
-- Run this entire script in Supabase SQL Editor.
-- Safe to run multiple times.

begin;

-- 1) Create canonical table if missing
create table if not exists public.ai_generation_logs (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  mode text,
  recipient text,
  text_type text,
  language text,
  tone jsonb,
  business_context jsonb,
  raw_input text,
  output text,
  provider_used text,
  model_used text,
  attempts jsonb not null default '[]'::jsonb,
  success boolean not null default false,
  error_message text,
  latency_ms integer
);

-- 2) Create fallback table if missing
-- Backend insert order: ai_generation_logs -> reply_generation_logs
create table if not exists public.reply_generation_logs (
  like public.ai_generation_logs including all
);

-- 2b) Email sync telemetry table (used by /api/email/sync logging)
create table if not exists public.email_sync_runs (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  provider text not null,
  mailbox text not null default 'INBOX',
  username_domain text,
  since_days integer,
  max_messages integer,
  contacts_count integer not null default 0,
  contacts_with_email_count integer not null default 0,
  fetched_messages integer not null default 0,
  matched_messages integer not null default 0,
  updated_contacts integer not null default 0,
  success boolean not null default false,
  error_message text,
  latency_ms integer
);

-- 2c) Durable social channel inbox store (used by webhook-based social sync)
create table if not exists public.social_sync_inbox (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  provider text not null,
  workspace_key text not null,
  external_id text,
  direction text not null,
  message_text text not null,
  sender text,
  chat_id text,
  sent_at timestamptz not null,
  raw_payload jsonb not null default '{}'::jsonb
);

-- 3) Migrate existing/older tables to current schema
-- AI table columns
alter table public.ai_generation_logs add column if not exists created_at timestamptz;
alter table public.ai_generation_logs add column if not exists mode text;
alter table public.ai_generation_logs add column if not exists recipient text;
alter table public.ai_generation_logs add column if not exists text_type text;
alter table public.ai_generation_logs add column if not exists language text;
alter table public.ai_generation_logs add column if not exists tone jsonb;
alter table public.ai_generation_logs add column if not exists business_context jsonb;
alter table public.ai_generation_logs add column if not exists raw_input text;
alter table public.ai_generation_logs add column if not exists output text;
alter table public.ai_generation_logs add column if not exists provider_used text;
alter table public.ai_generation_logs add column if not exists model_used text;
alter table public.ai_generation_logs add column if not exists attempts jsonb;
alter table public.ai_generation_logs add column if not exists success boolean;
alter table public.ai_generation_logs add column if not exists error_message text;
alter table public.ai_generation_logs add column if not exists latency_ms integer;

update public.ai_generation_logs
set created_at = now()
where created_at is null;

update public.ai_generation_logs
set attempts = '[]'::jsonb
where attempts is null;

update public.ai_generation_logs
set success = false
where success is null;

alter table public.ai_generation_logs
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column attempts set default '[]'::jsonb,
  alter column attempts set not null,
  alter column success set default false,
  alter column success set not null;

-- Reply table columns
alter table public.reply_generation_logs add column if not exists created_at timestamptz;
alter table public.reply_generation_logs add column if not exists mode text;
alter table public.reply_generation_logs add column if not exists recipient text;
alter table public.reply_generation_logs add column if not exists text_type text;
alter table public.reply_generation_logs add column if not exists language text;
alter table public.reply_generation_logs add column if not exists tone jsonb;
alter table public.reply_generation_logs add column if not exists business_context jsonb;
alter table public.reply_generation_logs add column if not exists raw_input text;
alter table public.reply_generation_logs add column if not exists output text;
alter table public.reply_generation_logs add column if not exists provider_used text;
alter table public.reply_generation_logs add column if not exists model_used text;
alter table public.reply_generation_logs add column if not exists attempts jsonb;
alter table public.reply_generation_logs add column if not exists success boolean;
alter table public.reply_generation_logs add column if not exists error_message text;
alter table public.reply_generation_logs add column if not exists latency_ms integer;

update public.reply_generation_logs
set created_at = now()
where created_at is null;

update public.reply_generation_logs
set attempts = '[]'::jsonb
where attempts is null;

update public.reply_generation_logs
set success = false
where success is null;

alter table public.reply_generation_logs
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column attempts set default '[]'::jsonb,
  alter column attempts set not null,
  alter column success set default false,
  alter column success set not null;

-- Email sync table columns (for older projects)
alter table public.email_sync_runs add column if not exists created_at timestamptz;
alter table public.email_sync_runs add column if not exists provider text;
alter table public.email_sync_runs add column if not exists mailbox text;
alter table public.email_sync_runs add column if not exists username_domain text;
alter table public.email_sync_runs add column if not exists since_days integer;
alter table public.email_sync_runs add column if not exists max_messages integer;
alter table public.email_sync_runs add column if not exists contacts_count integer;
alter table public.email_sync_runs add column if not exists contacts_with_email_count integer;
alter table public.email_sync_runs add column if not exists fetched_messages integer;
alter table public.email_sync_runs add column if not exists matched_messages integer;
alter table public.email_sync_runs add column if not exists updated_contacts integer;
alter table public.email_sync_runs add column if not exists success boolean;
alter table public.email_sync_runs add column if not exists error_message text;
alter table public.email_sync_runs add column if not exists latency_ms integer;

-- Social sync inbox table columns (for older projects)
alter table public.social_sync_inbox add column if not exists created_at timestamptz;
alter table public.social_sync_inbox add column if not exists provider text;
alter table public.social_sync_inbox add column if not exists workspace_key text;
alter table public.social_sync_inbox add column if not exists external_id text;
alter table public.social_sync_inbox add column if not exists direction text;
alter table public.social_sync_inbox add column if not exists message_text text;
alter table public.social_sync_inbox add column if not exists sender text;
alter table public.social_sync_inbox add column if not exists chat_id text;
alter table public.social_sync_inbox add column if not exists sent_at timestamptz;
alter table public.social_sync_inbox add column if not exists raw_payload jsonb;

update public.email_sync_runs
set created_at = now()
where created_at is null;

update public.email_sync_runs
set provider = 'imap'
where provider is null or btrim(provider) = '';

update public.email_sync_runs
set mailbox = 'INBOX'
where mailbox is null or btrim(mailbox) = '';

update public.email_sync_runs
set contacts_count = 0
where contacts_count is null;

update public.email_sync_runs
set contacts_with_email_count = 0
where contacts_with_email_count is null;

update public.email_sync_runs
set fetched_messages = 0
where fetched_messages is null;

update public.email_sync_runs
set matched_messages = 0
where matched_messages is null;

update public.email_sync_runs
set updated_contacts = 0
where updated_contacts is null;

update public.email_sync_runs
set success = false
where success is null;

alter table public.email_sync_runs
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column provider set not null,
  alter column mailbox set default 'INBOX',
  alter column mailbox set not null,
  alter column contacts_count set default 0,
  alter column contacts_count set not null,
  alter column contacts_with_email_count set default 0,
  alter column contacts_with_email_count set not null,
  alter column fetched_messages set default 0,
  alter column fetched_messages set not null,
  alter column matched_messages set default 0,
  alter column matched_messages set not null,
  alter column updated_contacts set default 0,
  alter column updated_contacts set not null,
  alter column success set default false,
  alter column success set not null;

update public.social_sync_inbox
set created_at = now()
where created_at is null;

update public.social_sync_inbox
set raw_payload = '{}'::jsonb
where raw_payload is null;

alter table public.social_sync_inbox
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column provider set not null,
  alter column workspace_key set not null,
  alter column direction set not null,
  alter column message_text set not null,
  alter column sent_at set not null,
  alter column raw_payload set default '{}'::jsonb,
  alter column raw_payload set not null;

-- 4) Guardrail constraints (idempotent)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ai_generation_logs_latency_nonnegative'
      and conrelid = 'public.ai_generation_logs'::regclass
  ) then
    alter table public.ai_generation_logs
      add constraint ai_generation_logs_latency_nonnegative
      check (latency_ms is null or latency_ms >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'ai_generation_logs_mode_check'
      and conrelid = 'public.ai_generation_logs'::regclass
  ) then
    alter table public.ai_generation_logs
      add constraint ai_generation_logs_mode_check
      check (mode is null or mode in ('reply', 'internal'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'reply_generation_logs_latency_nonnegative'
      and conrelid = 'public.reply_generation_logs'::regclass
  ) then
    alter table public.reply_generation_logs
      add constraint reply_generation_logs_latency_nonnegative
      check (latency_ms is null or latency_ms >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'reply_generation_logs_mode_check'
      and conrelid = 'public.reply_generation_logs'::regclass
  ) then
    alter table public.reply_generation_logs
      add constraint reply_generation_logs_mode_check
      check (mode is null or mode in ('reply', 'internal'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_sync_runs_latency_nonnegative'
      and conrelid = 'public.email_sync_runs'::regclass
  ) then
    alter table public.email_sync_runs
      add constraint email_sync_runs_latency_nonnegative
      check (latency_ms is null or latency_ms >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_sync_runs_counts_nonnegative'
      and conrelid = 'public.email_sync_runs'::regclass
  ) then
    alter table public.email_sync_runs
      add constraint email_sync_runs_counts_nonnegative
      check (
        contacts_count >= 0
        and contacts_with_email_count >= 0
        and fetched_messages >= 0
        and matched_messages >= 0
        and updated_contacts >= 0
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_sync_runs_provider_check'
      and conrelid = 'public.email_sync_runs'::regclass
  ) then
    alter table public.email_sync_runs
      add constraint email_sync_runs_provider_check
      check (provider in (
        'imap',
        'gmail',
        'microsoft',
        'telegram',
        'whatsapp',
        'dingtalk',
        'wechat'
      ));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'social_sync_inbox_direction_check'
      and conrelid = 'public.social_sync_inbox'::regclass
  ) then
    alter table public.social_sync_inbox
      add constraint social_sync_inbox_direction_check
      check (direction in ('inbound', 'outbound'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'social_sync_inbox_provider_check'
      and conrelid = 'public.social_sync_inbox'::regclass
  ) then
    alter table public.social_sync_inbox
      add constraint social_sync_inbox_provider_check
      check (provider in ('whatsapp', 'dingtalk', 'wechat', 'telegram'));
  end if;
end
$$;

-- 5) Performance indexes
create index if not exists idx_ai_generation_logs_created_at
  on public.ai_generation_logs (created_at desc);

create index if not exists idx_ai_generation_logs_provider_created
  on public.ai_generation_logs (provider_used, created_at desc);

create index if not exists idx_ai_generation_logs_success_created
  on public.ai_generation_logs (success, created_at desc);

create index if not exists idx_ai_generation_logs_mode_created
  on public.ai_generation_logs (mode, created_at desc);

create index if not exists idx_ai_generation_logs_language_created
  on public.ai_generation_logs (language, created_at desc);

create index if not exists idx_reply_generation_logs_created_at
  on public.reply_generation_logs (created_at desc);

create index if not exists idx_reply_generation_logs_provider_created
  on public.reply_generation_logs (provider_used, created_at desc);

create index if not exists idx_reply_generation_logs_success_created
  on public.reply_generation_logs (success, created_at desc);

create index if not exists idx_email_sync_runs_created_at
  on public.email_sync_runs (created_at desc);

create index if not exists idx_email_sync_runs_provider_created
  on public.email_sync_runs (provider, created_at desc);

create index if not exists idx_email_sync_runs_success_created
  on public.email_sync_runs (success, created_at desc);

create index if not exists idx_social_sync_inbox_provider_workspace_sent
  on public.social_sync_inbox (provider, workspace_key, sent_at desc);

create index if not exists idx_social_sync_inbox_external_id
  on public.social_sync_inbox (provider, workspace_key, external_id)
  where external_id is not null;

drop index if exists public.idx_social_sync_unique_external;

create unique index if not exists idx_social_sync_unique_external
  on public.social_sync_inbox (provider, workspace_key, external_id);

-- 6) Row-level security and policies
alter table public.ai_generation_logs enable row level security;
alter table public.reply_generation_logs enable row level security;
alter table public.email_sync_runs enable row level security;
alter table public.social_sync_inbox enable row level security;

-- AI table policies
drop policy if exists ai_logs_no_anon_select on public.ai_generation_logs;
drop policy if exists ai_logs_no_anon_insert on public.ai_generation_logs;
drop policy if exists ai_logs_no_anon_update on public.ai_generation_logs;
drop policy if exists ai_logs_no_anon_delete on public.ai_generation_logs;

create policy ai_logs_no_anon_select
  on public.ai_generation_logs
  for select
  to anon, authenticated
  using (false);

create policy ai_logs_no_anon_insert
  on public.ai_generation_logs
  for insert
  to anon, authenticated
  with check (false);

create policy ai_logs_no_anon_update
  on public.ai_generation_logs
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy ai_logs_no_anon_delete
  on public.ai_generation_logs
  for delete
  to anon, authenticated
  using (false);

-- Reply table policies
drop policy if exists reply_logs_no_anon_select on public.reply_generation_logs;
drop policy if exists reply_logs_no_anon_insert on public.reply_generation_logs;
drop policy if exists reply_logs_no_anon_update on public.reply_generation_logs;
drop policy if exists reply_logs_no_anon_delete on public.reply_generation_logs;

create policy reply_logs_no_anon_select
  on public.reply_generation_logs
  for select
  to anon, authenticated
  using (false);

create policy reply_logs_no_anon_insert
  on public.reply_generation_logs
  for insert
  to anon, authenticated
  with check (false);

create policy reply_logs_no_anon_update
  on public.reply_generation_logs
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy reply_logs_no_anon_delete
  on public.reply_generation_logs
  for delete
  to anon, authenticated
  using (false);

-- Email sync table policies
drop policy if exists email_sync_runs_no_anon_select on public.email_sync_runs;
drop policy if exists email_sync_runs_no_anon_insert on public.email_sync_runs;
drop policy if exists email_sync_runs_no_anon_update on public.email_sync_runs;
drop policy if exists email_sync_runs_no_anon_delete on public.email_sync_runs;

create policy email_sync_runs_no_anon_select
  on public.email_sync_runs
  for select
  to anon, authenticated
  using (false);

create policy email_sync_runs_no_anon_insert
  on public.email_sync_runs
  for insert
  to anon, authenticated
  with check (false);

create policy email_sync_runs_no_anon_update
  on public.email_sync_runs
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy email_sync_runs_no_anon_delete
  on public.email_sync_runs
  for delete
  to anon, authenticated
  using (false);

-- Social sync inbox table policies
drop policy if exists social_sync_inbox_no_anon_select on public.social_sync_inbox;
drop policy if exists social_sync_inbox_no_anon_insert on public.social_sync_inbox;
drop policy if exists social_sync_inbox_no_anon_update on public.social_sync_inbox;
drop policy if exists social_sync_inbox_no_anon_delete on public.social_sync_inbox;

create policy social_sync_inbox_no_anon_select
  on public.social_sync_inbox
  for select
  to anon, authenticated
  using (false);

create policy social_sync_inbox_no_anon_insert
  on public.social_sync_inbox
  for insert
  to anon, authenticated
  with check (false);

create policy social_sync_inbox_no_anon_update
  on public.social_sync_inbox
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy social_sync_inbox_no_anon_delete
  on public.social_sync_inbox
  for delete
  to anon, authenticated
  using (false);

-- 7) Analytics views
create or replace view public.ai_generation_metrics_daily as
select
  date_trunc('day', created_at) as day,
  count(*) as total_requests,
  count(*) filter (where success) as success_count,
  count(*) filter (where not success) as failure_count,
  round(avg(latency_ms)::numeric, 2) as avg_latency_ms,
  percentile_disc(0.95) within group (order by latency_ms) as p95_latency_ms
from public.ai_generation_logs
group by 1
order by 1 desc;

create or replace view public.ai_generation_metrics_by_provider as
select
  provider_used,
  count(*) as total_requests,
  count(*) filter (where success) as success_count,
  count(*) filter (where not success) as failure_count,
  round(avg(latency_ms)::numeric, 2) as avg_latency_ms,
  max(created_at) as last_seen_at
from public.ai_generation_logs
group by provider_used
order by total_requests desc;

create or replace view public.email_sync_metrics_daily as
select
  date_trunc('day', created_at) as day,
  count(*) as total_syncs,
  count(*) filter (where success) as success_syncs,
  count(*) filter (where not success) as failed_syncs,
  sum(fetched_messages) as fetched_messages,
  sum(matched_messages) as matched_messages,
  sum(updated_contacts) as updated_contacts,
  round(avg(latency_ms)::numeric, 2) as avg_latency_ms
from public.email_sync_runs
group by 1
order by 1 desc;

-- 8) Retention helper function
create or replace function public.cleanup_ai_generation_logs(days_to_keep integer default 90)
returns integer
language plpgsql
security definer
as $$
declare
  deleted_count integer;
begin
  delete from public.ai_generation_logs
  where created_at < now() - make_interval(days => days_to_keep);

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

create or replace function public.cleanup_email_sync_runs(days_to_keep integer default 90)
returns integer
language plpgsql
security definer
as $$
declare
  deleted_count integer;
begin
  delete from public.email_sync_runs
  where created_at < now() - make_interval(days => days_to_keep);

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- Optional: if pg_cron is enabled in your project, uncomment to schedule daily cleanup.
-- select cron.schedule(
--   'cleanup-ai-generation-logs-daily',
--   '15 3 * * *',
--   $$select public.cleanup_ai_generation_logs(90);$$
-- );

commit;
