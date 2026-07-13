-- Reply Assistant: Explicit GRANTs for Supabase Data API (May 30, 2026+ policy)
-- Run AFTER setup.sql and setup-auth-prep.sql. Safe to re-run.
--
-- Policy: new projects require explicit GRANT before PostgREST / supabase-js can access tables.
-- This app uses:
--   - service_role  → apps/api telemetry + social inbox (server-side only)
--   - authenticated → future Electron Auth UI (profiles, desktop_installations)
--   - anon          → NO grants on app tables (telemetry stays server-side)

begin;

-- Schema usage (required for all roles that touch public tables)
grant usage on schema public to service_role;
grant usage on schema public to authenticated;

-- Sequences (bigserial primary keys on telemetry tables)
grant usage, select on all sequences in schema public to service_role;

-- ---------------------------------------------------------------------------
-- Telemetry tables — service_role ONLY (no anon/authenticated Data API access)
-- RLS policies already deny anon/authenticated; omitting grants blocks PostgREST too.
-- ---------------------------------------------------------------------------
grant select, insert on public.ai_generation_logs to service_role;
grant select, insert on public.reply_generation_logs to service_role;
grant select, insert on public.email_sync_runs to service_role;
grant select, insert, update on public.social_sync_inbox to service_role;

grant select, insert on public.support_requests to service_role;

-- ---------------------------------------------------------------------------
-- Auth-prep tables — authenticated users (future supabase-js in Electron renderer)
-- ---------------------------------------------------------------------------
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.desktop_installations to authenticated;

-- service_role full access for API-side profile/installation management
grant all on public.profiles to service_role;
grant all on public.desktop_installations to service_role;

-- ---------------------------------------------------------------------------
-- Analytics views — service_role only (dashboard / ops; not exposed to clients)
-- ---------------------------------------------------------------------------
grant select on public.ai_generation_metrics_daily to service_role;
grant select on public.ai_generation_metrics_by_provider to service_role;
grant select on public.email_sync_metrics_daily to service_role;

-- ---------------------------------------------------------------------------
-- Retention helpers — service_role only
-- ---------------------------------------------------------------------------
grant execute on function public.cleanup_ai_generation_logs(integer) to service_role;
grant execute on function public.cleanup_email_sync_runs(integer) to service_role;

commit;
