# API Integration Contracts

Purpose: this file documents the exact API and external integration behavior that exists today. Do not invent unauthorized platform APIs or scraping methods. If a platform requires official app review, OAuth scope approval, bot permissions, webhook verification, or business account setup, implement that explicitly instead of pretending messages can be read directly.

## Runtime Hosts

Frontend clients use endpoint fallbacks:

- Electron dev: `http://localhost:4011`, then `http://localhost:4000`, then relative path.
- Browser dev/prod preview: relative path, then `http://localhost:4000`.

Backend server:

- Source: `apps/api/src/server.js`.
- Default port: `4000`.
- Desktop dev port: `4011`.
- Body parser: JSON, `1mb` limit.
- CORS: enabled globally.

## Health And Diagnostics

### `GET /health`

Returns basic server health.

Response:

```json
{
  "status": "ok",
  "preferredProvider": "deepseek",
  "configuredProviders": ["deepseek"],
  "supabaseLogging": false
}
```

### `GET /api/status`

Returns provider configuration snapshot. Does not call live AI providers.

Response fields:

- `preferredProvider`
- `configuredProviders`
- `supabaseLogging`
- `checkedAt`

### `GET /api/diagnostics/providers?input=...`

Runs a small live provider generation test against configured providers.

Use carefully because it makes real AI provider calls.

## AI Generation

### `POST /api/generate`

Frontend caller:

- `apps/web/src/components/workbench/generateApiClient.ts`

Backend normalizer:

- `apps/api/src/generateContract.js`

Prompt builder:

- `apps/api/src/server.js`
- `apps/api/src/contactThreadPrompt.js`
- `apps/api/src/memoryPrompt.js`
- `apps/api/src/crossLanguageFragment.js` (Phase 9.1 — system-prompt bias from `crossLanguage` block)
- `apps/api/src/voiceProfileFragment.js` (Phase 21a — system-prompt bias from `voiceProfile` block: openers, sign-offs, cadence, emoji)

Request body:

```json
{
  "mode": "reply",
  "recipient": "existing-client",
  "textType": "balanced",
  "language": "English",
  "tone": {
    "formality": 3,
    "warmth": 3,
    "urgency": 2,
    "confidence": 3
  },
  "businessContext": null,
  "rawInput": "Message to reply to",
  "mirrorMode": false,
  "snippetMemory": [],
  "recentReplies": [],
  "generationContext": {
    "source": "composer"
  },
  "contactThread": null,
  "preferredProvider": "deepseek",
  "crossLanguage": {
    "inboundLanguage": "zh",
    "replyInLanguage": "en",
    "register": "western-business",
    "preserveMeaningOnly": false
  },
  "voiceProfile": {
    "openers": ["Hi Sarah,", "Hey team,"],
    "signoffs": ["Best,", "Thanks!"],
    "medianSentenceLength": 95,
    "usesEmoji": false,
    "sampleSize": 2
  }
}
```

Required:

- `rawInput` must be non-empty after trimming.

Backend normalization:

- Tone values are clamped to integers `1..5`.
- `snippetMemory` is capped at 5.
- `recentReplies` is capped at 5.
- `contactThread.recentReplies` is capped at 5.
- `crossLanguage` is optional. Omitting it preserves pre-Phase-9.1 behavior.
  - `inboundLanguage` ∈ `'en' | 'zh' | 'mixed' | 'unknown'` (renderer-detected, not user-set).
  - `replyInLanguage` ∈ `'en' | 'zh'`.
  - `register` ∈ `'western-business' | 'chinese-business' | 'cross-cultural' | 'polish-english' | 'neutral'`. `neutral` is a no-op directive.
  - `preserveMeaningOnly: true` adds a "polish wording only — do not add facts" system fragment (paired with `polish-english` text type by default).
  - Fragment construction lives in `apps/api/src/crossLanguageFragment.js`. Guard: `apps/api/scripts/verify-cross-language-fragment.mjs`.
- `voiceProfile` is optional (Phase 21a — "Write like me"). Omitting it preserves pre-21a behavior.
  - `openers[]`, `signoffs[]` — each capped at 3 short strings the renderer derived from `contactStyleMemory` / recent accepted replies.
  - `medianSentenceLength: number` — character count; backend maps to "short / medium / long" cadence directive.
  - `usesEmoji: boolean` — emoji directive is a *modifier* and is omitted entirely when no other voice signal is present (so an empty profile is a true no-op).
  - `sampleSize: number` — included for telemetry / debug; not used in prompt construction.
  - Fragment construction lives in `apps/api/src/voiceProfileFragment.js`. Guard: `apps/api/scripts/verify-voice-profile-fragment.mjs`.

Response:

```json
{
  "output": "Final reply body",
  "variants": [
    {
      "id": "safe",
      "title": "Safe",
      "message": "Final reply body",
      "rationale": "Minimizes friction while staying professional and clear."
    }
  ],
  "insight": {
    "intent": "general_reply",
    "intentLabel": "General business reply",
    "riskLevel": "low",
    "nextAction": "Keep it concise and include one clear call-to-action.",
    "followUp": "Follow up within 2-3 business days",
    "subjectLine": "Next steps"
  },
  "quickActions": [
    { "id": "send-now", "label": "Send now" },
    { "id": "save-reply", "label": "Save reply" },
    { "id": "add-task", "label": "Add task" }
  ],
  "providerUsed": "deepseek",
  "modelUsed": "deepseek-chat",
  "attempts": [
    { "provider": "deepseek", "status": "ok" }
  ]
}
```

Supported AI providers in server code:

- `deepseek`
- `openai`
- `zhipu`
- `qwen`
- `moonshot`

Provider environment variables:

- `AI_PROVIDER`
- `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, `DEEPSEEK_BASE_URL`
- `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`
- `ZHIPU_API_KEY`, `ZHIPU_MODEL`, `ZHIPU_BASE_URL`
- `QWEN_API_KEY`, `QWEN_MODEL`, `QWEN_BASE_URL`
- `MOONSHOT_API_KEY`, `MOONSHOT_MODEL`, `MOONSHOT_BASE_URL`

Do not claim Azure OpenAI, ERNIE, Doubao, MiniMax, or Yi are active runtime providers until `apps/api/src/server.js` supports them. They appear in `.env.example` only.

## Email OAuth

### `POST /api/email/oauth/url`

Builds an OAuth authorization URL.

Source:

- `apps/api/src/email/oauthFlow.js`

Request:

```json
{
  "provider": "gmail-oauth",
  "clientId": "client-id",
  "redirectUri": "http://localhost:5190/oauth/callback",
  "tenantId": "",
  "state": "optional-state",
  "codeChallenge": "optional-pkce-challenge"
}
```

Supported providers:

- `gmail-oauth`
- `microsoft-oauth`

Scopes:

- Gmail: `https://www.googleapis.com/auth/gmail.readonly`
- Microsoft: `offline_access User.Read Mail.Read`

### `POST /api/email/oauth/token`

Exchanges OAuth code for access token.

Request:

```json
{
  "provider": "gmail-oauth",
  "clientId": "client-id",
  "clientSecret": "optional-secret",
  "redirectUri": "http://localhost:5190/oauth/callback",
  "code": "authorization-code",
  "tenantId": "common",
  "codeVerifier": "optional-pkce-verifier"
}
```

Behavior:

- Calls provider token endpoint.
- Requires `access_token` in response.
- Stores token in OS keychain with `keytar` when account is provided.

Electron OAuth callback interception:

- `electron/main.ts` watches `http://localhost:*/oauth/callback*` and `https://business-reply-assistant.com/oauth/callback*`.
- It sends `oauth-callback` to renderer with `{ code, state }`.
- The preload bridge does not currently expose an OAuth listener helper; check implementation before relying on renderer IPC.

## Email Sync

### `POST /api/email/sync`

Frontend caller:

- `apps/web/src/components/contacts/emailSyncApi.ts`

Backend service:

- `apps/api/src/email/emailSyncService.js`

Request:

```json
{
  "syncConfig": {
    "provider": "imap",
    "host": "imap.example.com",
    "port": 993,
    "secure": true,
    "username": "user@example.com",
    "password": "app-password",
    "accessToken": "",
    "oauthUserEmail": "",
    "mailbox": "INBOX",
    "sinceDays": 14,
    "maxMessages": 120
  },
  "contacts": []
}
```

Supported providers:

- `imap`
- `gmail-oauth`
- `microsoft-oauth`

Limits:

- `sinceDays`: clamped `1..90`, default `14`.
- `maxMessages`: clamped `20..300`, default `120`.
- IMAP port: clamped `1..65535`, default `993` when secure, otherwise `143`.

Matching:

- Only contacts with email addresses are eligible.
- Messages are matched by high-confidence email address matching.
- Updates are returned per contact and merged client-side into local contact threads.

Response:

```json
{
  "ok": true,
  "updates": [
    {
      "contactId": "contact-123",
      "chatContext": "merged context",
      "matchedMessages": 2,
      "lastSyncedAt": "2026-05-25T00:00:00.000Z",
      "syncedMessages": [
        {
          "externalId": "123",
          "direction": "inbound",
          "source": "email-sync",
          "text": "Message body",
          "summary": "Message summary",
          "sentAt": "2026-05-25T00:00:00.000Z",
          "sender": "sender@example.com",
          "receiver": "user@example.com"
        }
      ]
    }
  ],
  "summary": {
    "fetchedMessages": 20,
    "matchedMessages": 2,
    "updatedContacts": 1
  }
}
```

External APIs used:

- IMAP server through `imapflow`.
- Gmail API:
  - `GET https://gmail.googleapis.com/gmail/v1/users/me/messages`
  - `GET https://gmail.googleapis.com/gmail/v1/users/me/messages/{id}?format=metadata...`
- Microsoft Graph:
  - `GET https://graph.microsoft.com/v1.0/me/messages`

## Telegram Sync

### `POST /api/telegram/sync`

Frontend caller:

- `apps/web/src/components/contacts/telegramSyncApi.ts`

Backend service:

- `apps/api/src/telegram/telegramSyncService.js`

Request:

```json
{
  "syncConfig": {
    "botToken": "telegram-bot-token",
    "chatId": "optional-chat-id",
    "maxMessages": 40
  },
  "contacts": [],
  "targetContactId": "contact-123"
}
```

External API used:

- `GET https://api.telegram.org/bot{token}/getUpdates`

Limits:

- `maxMessages`: clamped `1..100`, default `40`.

Important boundary:

- This only reads updates visible to the configured bot.
- Do not claim it can read arbitrary Telegram user chat history.

## WhatsApp Integration

### `GET /api/whatsapp/webhook`

Webhook verification endpoint.

Query params:

- `hub.mode`
- `hub.verify_token`
- `hub.challenge`

Environment variable:

- `WHATSAPP_VERIFY_TOKEN`

Behavior:

- Returns challenge only when `hub.mode === "subscribe"` and verify token matches.
- Otherwise returns `403`.

### `POST /api/whatsapp/webhook`

Ingests WhatsApp Business webhook payloads into the social inbox.

Backend service:

- `apps/api/src/whatsapp/whatsAppSyncService.js`
- `apps/api/src/social/socialSyncStore.js`

Stored provider:

- `whatsapp`

Workspace key:

- WhatsApp `metadata.phone_number_id`.

Message fields ingested:

- text message body only.
- direction is currently inbound.
- sender from webhook contact profile when present.
- chat id from WhatsApp `from`.

### `POST /api/whatsapp/sync`

Syncs already-ingested WhatsApp messages from memory/Supabase social inbox into one selected contact thread.

Request:

```json
{
  "syncConfig": {
    "phoneNumberId": "whatsapp-phone-number-id",
    "syncCode": "optional-ui-field-currently-not-used-by-backend",
    "maxMessages": 40
  },
  "contacts": [],
  "targetContactId": "contact-123"
}
```

Limits:

- `maxMessages`: clamped `1..100`, default `40`.

Important boundary:

- The app does not call a WhatsApp API to fetch arbitrary message history.
- The app does not scrape WhatsApp Web.
- The only implemented WhatsApp read path is webhook ingest into `social_sync_inbox` or in-memory inbox, then selected-contact sync.

## DingTalk Integration

### `POST /api/dingtalk/webhook`

Ingests generic DingTalk-like webhook message payloads into the social inbox.

Backend service:

- `apps/api/src/dingtalk/dingTalkSyncService.js`

Stored provider:

- `dingtalk`

Accepted payload shape:

```json
{
  "appKey": "app-key",
  "corpId": "optional-corp-id",
  "messages": [
    {
      "id": "message-id",
      "text": "Message text",
      "content": "Alternative text field",
      "direction": "inbound",
      "timestamp": 1710000000,
      "createdAt": 1710000000,
      "sender": "Sender name",
      "from": "Alternative sender",
      "chatId": "conversation-id",
      "conversationId": "alternative-conversation-id"
    }
  ]
}
```

Workspace key:

- `appKey` or `corpId`.

### `POST /api/dingtalk/sync`

Syncs already-ingested DingTalk messages from memory/Supabase social inbox into one selected contact thread.

Request:

```json
{
  "syncConfig": {
    "appKey": "dingtalk-app-key",
    "syncCode": "optional-ui-field-currently-not-used-by-backend",
    "maxMessages": 40
  },
  "contacts": [],
  "targetContactId": "contact-123"
}
```

Important boundary:

- The app does not currently call official DingTalk conversation history APIs.
- Do not invent DingTalk read endpoints or auth flows without implementing them from official docs and app permissions.

## WeChat Integration

### `POST /api/wechat/webhook`

Ingests generic WeChat-like webhook message payloads into the social inbox.

Backend service:

- `apps/api/src/wechat/weChatSyncService.js`

Stored provider:

- `wechat`

Workspace key:

- `workspaceId` or `accountId`.

### `POST /api/wechat/sync`

Syncs already-ingested WeChat messages from memory/Supabase social inbox into one selected contact thread.

Request:

```json
{
  "syncConfig": {
    "workspaceId": "wechat-workspace-id",
    "syncCode": "optional-ui-field-currently-not-used-by-backend",
    "maxMessages": 40
  },
  "contacts": [],
  "targetContactId": "contact-123"
}
```

Important boundary:

- The app does not currently call official WeChat/WeCom conversation history APIs.
- Do not invent WeChat read endpoints, scraping, or unauthorized methods.

## Social Inbox Storage

Source:

- `apps/api/src/social/socialSyncStore.js`
- `supabase/setup.sql`

Table:

- `social_sync_inbox`

Columns:

- `provider`
- `workspace_key`
- `external_id`
- `direction`
- `message_text`
- `sender`
- `chat_id`
- `sent_at`
- `raw_payload`

Fallback behavior:

- If Supabase is not configured, webhook-ingested messages are kept in process memory only.
- In-memory messages disappear when the API server restarts.

## Telemetry

Supabase is optional and server-side only.

Environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

SQL setup (run in order in Supabase SQL Editor or `npm run supabase:migrate`):

- `supabase/setup.sql` — telemetry + social inbox baseline
- `supabase/setup-auth-prep.sql` — profiles, desktop installations, auth-prep columns
- `supabase/grants.sql` — explicit GRANTs for Supabase May 2026+ Data API policy

Fresh project walkthrough: `supabase/FRESH_PROJECT_SETUP.md`

Tables:

- `ai_generation_logs`
- `reply_generation_logs`
- `email_sync_runs`
- `social_sync_inbox`
- `profiles` (1:1 with `auth.users`; created on signup trigger)
- `desktop_installations` (optional device binding after auth)

Telemetry columns added in auth-prep (nullable until login):

- `user_id` — scoped to Supabase Auth user when API receives a valid JWT (future)
- `installation_id` — optional desktop installation row
- `cross_language` — optional jsonb on generation logs (Phase 9 analytics)

Do not expose service role keys to the frontend. Renderer may use `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` only for future Auth/profile reads.

## Desktop local-first data boundary

The Electron desktop app is the source of truth for user work data:

- Contacts, timelines, memory, snippets, queues, uploads metadata, settings → `localStorage` on the renderer
- Reset Data domains in `apps/web/src/config/resetAppData.ts` clear local domains only
- Supabase must **not** mirror `replyAssistantContactThreads` unless the user explicitly opts into `profiles.cloud_backup_opt_in` (future)

Backend Supabase role today:

- AI generation telemetry (`/api/generate`)
- Email sync run metrics (`/api/email/sync`)
- Durable social webhook inbox (`social_sync_inbox`)
- User identity shell (`profiles`, `desktop_installations`) for upcoming Auth — not contact sync

## Change Policy

When adding or changing integrations:

1. Update frontend API client types under `apps/web/src/components/contacts`.
2. Update backend route in `apps/api/src/server.js`.
3. Update service implementation under `apps/api/src`.
4. Update this file.
5. Update `APP_DATA_SCHEMAS.json` if payload or persisted data shape changes.
6. Run at least `npm run build --workspace=apps/web`.

