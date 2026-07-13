# Supabase setup (desktop local-first)

Reply Assistant keeps **contacts, memory, drafts, and queues on the desktop** in `localStorage`. Supabase stores **telemetry, webhook inbox durability, and user identity** — not the canonical contact database.

**Auth flows and invariants:** [`AUTH.md`](../AUTH.md)  
**Fresh project walkthrough:** [`FRESH_PROJECT_SETUP.md`](./FRESH_PROJECT_SETUP.md)

## Run order (Supabase SQL Editor)

1. **[setup.sql](./setup.sql)** — telemetry tables, indexes, RLS deny for client roles, metrics views.
2. **[setup-auth-prep.sql](./setup-auth-prep.sql)** — profiles, desktop installations, nullable `user_id` on telemetry, auth signup trigger.
3. **[grants.sql](./grants.sql)** — explicit `GRANT`s required for Supabase projects created on/after **May 30, 2026** (Data API policy).

All scripts are idempotent and safe to re-run.

Or from the repo root (requires `SUPABASE_DB_URL` in `apps/api/.env`):

```bash
npm run supabase:migrate
```

## May 2026 Data API policy

New Supabase projects no longer auto-expose `public` tables to PostgREST / `supabase-js`. This repo:

- Grants **service_role** on telemetry tables (used by `apps/api` only).
- Grants **authenticated** on `profiles` and `desktop_installations` (Electron Auth — see [`AUTH.md`](../AUTH.md)).
- Does **not** grant **anon** on any app table (telemetry stays server-side).

## Environment

| Layer | File | Keys |
|-------|------|------|
| API (secrets) | `apps/api/.env` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` |
| Electron renderer (public) | `apps/web/.env` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

Verify after setup:

```bash
npm run dev:api:desktop   # or desktop:dev
curl http://localhost:4011/health
# expect: "supabaseLogging": true
```

## Tables

| Table | Purpose |
|-------|---------|
| `ai_generation_logs` | Primary AI generation telemetry |
| `reply_generation_logs` | Legacy fallback (same shape) |
| `email_sync_runs` | Email sync run metrics |
| `social_sync_inbox` | Webhook-ingested social messages |
| `profiles` | 1:1 with `auth.users` (identity shell) |
| `desktop_installations` | Optional device binding (schema only — not wired in app yet) |

Do **not** add `contact_threads`, `messages`, or `snippets` tables unless the user explicitly opts into cloud backup.
