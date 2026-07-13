# Netlify auth callback pages

Static HTML for Supabase email verification and password reset. Deployed separately from the Electron desktop app.

## URLs (after deploy)

| Page | URL |
|------|-----|
| Email verify success | `https://reply-assistant.netlify.app/auth/callback.html` |
| Password reset | `https://reply-assistant.netlify.app/auth/reset-password.html` |
| Error fallback | `https://reply-assistant.netlify.app/auth/error.html` |

Local dev (Netlify CLI): `http://localhost:8888/auth/callback.html`

## Deploy to Netlify

### Drag-and-drop (no GitHub yet)

```bash
npm run netlify-auth:config
```

Drag the **`netlify-auth`** folder onto [Netlify Drop](https://app.netlify.com/drop).  
Rename the site under **Project configuration → General → Project details** so the URL matches Supabase (e.g. `reply-assistant.netlify.app`).

### Git-connected deploy

1. Import this repo in Netlify.
2. Build command: `node scripts/generate-netlify-auth-config.mjs`
3. Publish directory: `netlify-auth`
4. Environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy, then rename site if needed.

## Auth flows (after deploy)

| User action | Page | Result |
|-------------|------|--------|
| Opens site with no link | `/` | Landing + **Open Reply Assistant** |
| Sign-up verification email | `/auth/callback.html` | Fireworks + **Open app and sign in** |
| Forgot-password email | `/auth/reset-password.html` | New password form → success + open app |
| Expired link | `/auth/error.html` | Error + return to app |
| Email link hits `/` with tokens | `/` → auto-redirect | Routes to callback or reset above |

Set the same base URL in `apps/web/.env` as `VITE_AUTH_SITE_URL` and in Supabase redirect URLs.

## Supabase dashboard (required)

Authentication → URL configuration:

- **Site URL:** `https://reply-assistant.netlify.app`
- **Redirect URLs:**
  - `https://reply-assistant.netlify.app/auth/callback.html`
  - `https://reply-assistant.netlify.app/auth/reset-password.html`
  - `http://localhost:8888/auth/callback.html` (local)

Authentication → Providers → Email: **ON**, **Confirm email** **ON**.

## Open app deep link

Success pages use `reply-assistant://auth/callback#access_token=...&refresh_token=...` so the Electron desktop app can restore the session.

Do not commit `auth/config.js` if the repository is public — use Netlify env vars at build time.
