# AI Architecture Context

Purpose: this file is the first-stop map for any AI coding assistant working on Business Reply Assistant. Read it before changing code. The app is already late-stage and local-first; do not invent new folders, stores, databases, or platform APIs unless the user explicitly approves an architecture change.

## Product

Business Reply Assistant is a multilingual, workflow-driven desktop communication assistant. It is not a general chatbot. The core loop is:

1. User selects or creates a contact thread.
2. User pastes or writes an inbound business message.
3. Frontend builds one structured generation request.
4. Backend generates a ready-to-send reply with variants, insight, and quick actions.
5. Frontend saves the generated reply into local contact history and timeline.
6. User copies, edits, or sends the reply outside the app.

## Monorepo Layout

Do not create parallel app roots. Use the existing structure:

```text
.
├── apps
│   ├── api        # Express API server, AI provider calls, sync services
│   └── web        # React + TypeScript + Vite + Tailwind renderer
├── electron       # Electron main/preload TypeScript source
├── dist-electron  # Compiled Electron output
├── packages
│   ├── prompt-engine
│   └── types
├── supabase       # Optional telemetry/social inbox SQL setup
└── release        # Packaged app output; do not edit manually
```

## Runtime Architecture

- Frontend: React 18 + TypeScript + Vite + Tailwind in `apps/web`.
- Backend: Express ESM server in `apps/api/src/server.js`.
- Desktop shell: Electron in `electron/main.ts` and `electron/preload.ts`.
- Dev desktop ports: web `5190`, API `4011`.
- Browser dev API default: `http://localhost:4000`.
- Production renderer: `apps/web/dist/index.html`.

## State Ownership

This app does not use Redux, Zustand, MobX, React Query, Prisma, or a central SQL contact database.

Canonical state is local-first in React hooks plus `localStorage`.

- Contact threads: `apps/web/src/config/contactThreads.ts`.
- Contact state hook: `apps/web/src/hooks/useContactThreads.ts`.
- Business context: `apps/web/src/config/businessContext.ts`.
- App settings: `apps/web/src/hooks/useAppSettings.ts`.
- AI provider preference: `apps/web/src/hooks/useAiProviderSettings.ts`.
- Recent reply history: `apps/web/src/components/FloatingAssistant.tsx`.
- Sync connection drafts/credentials UI state: contact sync panels under `apps/web/src/components/contacts`.

Do not introduce a new state-management library without explicit user approval. If adding state, first check whether it belongs in an existing hook or localStorage-backed config module.

## Canonical Frontend Flow

Root render path:

- `apps/web/src/App.tsx` renders `FloatingAssistant`.
- `apps/web/src/components/FloatingAssistant.tsx` owns the main workbench state, selected contact, generated reply modal, recent replies, tone settings, and mini screens.

Generation flow:

- Build request in `buildStructuredRequest` from `apps/web/src/components/workbench/requestModel.ts`.
- Add contact context with `buildContactThreadContext` from `apps/web/src/config/contactThreads.ts`.
- Call `requestGeneratedOutput` from `apps/web/src/components/workbench/generateApiClient.ts`.
- API endpoint is `POST /api/generate`.
- Save successful reply into recent history and selected contact via `useContactThreads.addReplyToContact`.

Contact timeline flow:

- Inbound composer/paste messages are saved as `ContactMessageEntry`.
- Generated replies are saved as outbound `ContactMessageEntry` with source `generated-reply`.
- Email/social sync updates merge into existing contact messages through `mergeSyncedMessages` and `applyChatContextUpdates`.

## Canonical Backend Flow

Main API server:

- `apps/api/src/server.js`.

Generation contract:

- Normalization and validation: `apps/api/src/generateContract.js`.
- Prompt sections: `apps/api/src/contactThreadPrompt.js`, `apps/api/src/memoryPrompt.js`.
- Provider call: `callProvider` in `apps/api/src/server.js`.
- Post-processing: signature placeholder replacement and signature enforcement in `apps/api/src/server.js`.
- Reply intelligence: `apps/api/src/replyIntelligence.js`.

AI providers currently supported in code:

- `deepseek`
- `openai`
- `zhipu`
- `qwen`
- `moonshot`

The `.env.example` mentions additional providers, but the running server only supports the five providers above unless `apps/api/src/server.js` is extended.

## Persistence

Local app data:

- Stored in browser/Electron renderer `localStorage`.
- Contact storage key: `replyAssistantContactThreads`.
- Business context key: `replyAssistantBusinessContext`.
- AI provider key: `replyAssistantAiProvider`.
- Settings key: `replyAssistantSettings`.

Optional Supabase telemetry:

- `ai_generation_logs`
- `reply_generation_logs`
- `email_sync_runs`
- `social_sync_inbox`

Supabase is currently used for backend logging and webhook/social inbox durability, not as the canonical contact database.

## Integrations

Email:

- IMAP via `imapflow`.
- Gmail OAuth read sync via Gmail API.
- Microsoft OAuth read sync via Microsoft Graph.

Social/chat:

- Telegram sync uses Bot API `getUpdates`.
- WhatsApp uses webhook ingest and local/Supabase social inbox. There is no client-side WhatsApp message scraping.
- DingTalk and WeChat currently use generic webhook ingest plus sync from the stored social inbox. They do not call official DingTalk/WeChat message-history APIs yet.

## Safety Rules For AI Coding

- Do not invent folders like `src/store`, `src/api`, `server/routes`, or `backend` unless migrating intentionally.
- Do not replace localStorage contact persistence with Supabase or another database unless asked.
- Do not add unauthorized WhatsApp, DingTalk, WeChat, Gmail, or Microsoft APIs.
- Do not treat generated files in `apps/web/dist`, `dist-electron`, or `release` as source.
- Do not change the generation payload shape without updating `APP_DATA_SCHEMAS.json` and frontend/backend normalizers together.
- Do not bypass `buildStructuredRequest` or `normalizeGenerateRequest`.
- Do not hardcode secrets in source.
- Before changing behavior, inspect the relevant hook/component/service and run at least a build or targeted verification script.

## Verification Commands

Use these before and after meaningful changes:

```bash
npm run build --workspace=apps/web
npm run electron:build
```

For full production build:

```bash
npm run build
```

