-- Reply Assistant: product_announcements (server-managed inbox alerts)
-- Run AFTER setup.sql. Safe to re-run.
-- Inserts are admin/service_role only; apps/api reads for GET /api/product-announcements.

begin;

create table if not exists public.product_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  locale text not null default 'en' check (locale in ('en', 'zh')),
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists product_announcements_active_locale_idx
  on public.product_announcements (locale, is_active, published_at desc);

alter table public.product_announcements enable row level security;

drop policy if exists product_announcements_deny_all on public.product_announcements;
create policy product_announcements_deny_all
  on public.product_announcements
  for all
  using (false)
  with check (false);

commit;
