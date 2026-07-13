# Fresh Supabase Project Setup (Reply Assistant)

Use this when starting from zero — e.g. after an old project was deleted or paused.

**Auth architecture (flows, invariants, file map):** [`AUTH.md`](../AUTH.md)

**Today’s date context:** Supabase’s May 30, 2026 policy means **new projects require explicit `GRANT`s** on every `public` table before the Data API (`supabase-js`, PostgREST) can access it. This repo handles that in [`grants.sql`](./grants.sql).

---

## Architecture reminder (desktop local-first)

| Data | Where it lives |
|------|----------------|
| Contacts, memory, drafts, queues, settings | Electron renderer `localStorage` |
| AI generate, OCR, email sync | Local `apps/api` server |
| Telemetry + social webhook inbox | Supabase (optional) |
| User identity | Supabase `profiles` + `auth.users` — see **[`AUTH.md`](../AUTH.md)** |

**Do not** create contact/message/snippet tables in Supabase unless the user explicitly opts into cloud backup later.

---

## Step 1 — Create a new Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard).
2. **+ New project** (e.g. org “Sales Assistant”).
3. Choose region (pick closest to your users — `ap-southeast-1` for China-adjacent, or your preferred region).
4. Set a **strong database password** — save it; you need it for `SUPABASE_DB_URL`.
5. Wait until the project status is **Active**.

---

## Step 2 — Copy credentials into env files

From **Project Settings → API**:

| Setting | `apps/api/.env` | `apps/web/.env` |
|---------|-----------------|-----------------|
| Project URL | `SUPABASE_URL` | `VITE_SUPABASE_URL` |
| anon public | `SUPABASE_ANON_KEY` (optional) | `VITE_SUPABASE_ANON_KEY` |
| service_role | `SUPABASE_SERVICE_ROLE_KEY` | **never** |

From **Project Settings → Database → Connection string → URI**:

| Setting | `apps/api/.env` |
|---------|-----------------|
| Postgres URI | `SUPABASE_DB_URL` |

Use the **Session pooler** or **Direct** connection string. Replace `[YOUR-PASSWORD]` with your DB password.

Example shape (do not commit real values):

```bash
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_DB_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
```

---

## Step 3 — Apply SQL (in order)

### Option A — CLI from repo root (recommended)

```bash
npm run supabase:migrate
```

Runs, in order:

1. [`setup.sql`](./setup.sql) — telemetry + social inbox + RLS deny for clients
2. [`setup-auth-prep.sql`](./setup-auth-prep.sql) — profiles, installations, auth trigger
3. [`support-requests.sql`](./support-requests.sql) — help center support form submissions
4. [`grants.sql`](./grants.sql) — explicit GRANTs for May 2026+ Data API policy

### Option B — Supabase SQL Editor

Paste and run each file **in the same order** in the SQL Editor.

---

## Step 4 — Verify

1. **Table Editor** — confirm 7 tables:
   - `ai_generation_logs`, `reply_generation_logs`, `email_sync_runs`, `social_sync_inbox`
   - `profiles`, `desktop_installations`, `support_requests`

2. **Start desktop API:**

   ```bash
   npm run dev:api:desktop
   ```

3. **Health check:**

   ```bash
   curl http://localhost:4011/health
   ```

   Expect: `"supabaseLogging": true`

4. **Generate one reply** from the desktop app (or curl `POST /api/generate` with `rawInput`).

5. **SQL Editor:**

   ```sql
   select id, created_at, success, provider_used
   from public.ai_generation_logs
   order by created_at desc
   limit 5;
   ```

   `user_id` stays `null` until the user signs in — expected before auth; after sign-in, rows include the Supabase user id. See [`AUTH.md`](../AUTH.md).

---

## Step 5 — Enable Auth (email verification)

In Supabase **Authentication → Providers → Email**:

- Enable Email provider
- Turn **Confirm email** ON

In **Authentication → URL configuration**:

| Setting | Value |
|---------|-------|
| Site URL | `https://reply-assistant.netlify.app` |
| Redirect URLs | `https://reply-assistant.netlify.app/auth/callback.html` |
| | `https://reply-assistant.netlify.app/auth/reset-password.html` |
| | `http://localhost:8888/auth/callback.html` (Netlify CLI dev) |

Deploy the static callback site from [`netlify-auth/README.md`](../netlify-auth/README.md), then run:

```bash
npm run netlify-auth:config
```

The desktop app uses deep link `reply-assistant://auth/callback` after the Netlify success page.

The signup trigger in `setup-auth-prep.sql` auto-creates a `profiles` row on `auth.users` insert.

Renderer uses `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` with `supabase-js` — grants for `authenticated` on `profiles` are already in `grants.sql`.

When signed in, the renderer sends `Authorization: Bearer <access_token>` to `POST /api/generate` so telemetry rows include `user_id`.

---

## Step 6 — Verify auth (after Netlify deploy)

```bash
npm run desktop:dev
npm run verify:auth --workspace=apps/web
```

Manual checklist:

1. Sign up → verify email → Netlify fireworks → **Open Reply Assistant** → workbench
2. Sign out → sign in
3. Forgot password → reset on Netlify → sign in with new password
4. Settings → Account settings (gear) → Change password / Sign out / Delete account
5. Toggle EN/ZH on auth screens

Full auth manual checklist also in [`AUTH.md`](../AUTH.md) § Verification.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `supabaseLogging: false` in `/health` | Check `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `apps/api/.env` |
| PostgREST `42501` permission denied | Re-run [`grants.sql`](./grants.sql) |
| `npm run supabase:migrate` DNS / connection error | Use SQL Editor (Option B) or fix `SUPABASE_DB_URL` (pooler host + password) |
| Social inbox empty after restart | Expected if Supabase was down — webhooks need Supabase for durability |
| Contacts not in Supabase | **By design** — they live in desktop `localStorage` |

---

## What we intentionally do NOT grant

- **anon** role: no grants on telemetry or profile tables (server-side service role handles telemetry; Auth uses `authenticated`).
- **authenticated** on telemetry tables: no grants (RLS deny + no grant = defense in depth).

This matches the desktop work-tool model: users own local data; cloud is telemetry + identity shell only.
