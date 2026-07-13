# Business Reply Assistant Agent Guide

This repository is a late-stage, local-first desktop communication assistant. Before changing code, read this file plus the master coordination files and Codex-owned planning files.

## Master Coordination Files

Read these before non-trivial work:

- `AGENT_STATUS.md`
- `INTEGRATION_GUIDE.md`
- `references/SHARED_CONTEXT.json`
- `plans/codex-current-plan.md`
- `projects/active-features.md`
- `projects/blockers.md`
- `projects/next-priorities.md`

Codex and Claude Code share these master files. Routine app changes update master files and `.codex/*`; routine app changes do **not** require editing `.claude/*`.

## Product Shape

Business Reply Assistant is not a generic chatbot. It is a compact Electron workbench for business communication:

1. Select or create a contact.
2. Paste, sync, or write an inbound message.
3. Build one structured generation request from contact memory, thread history, business context, attachments, language, and tone.
4. Generate a grounded reply with variants, insight, quality signals, and "Based on" evidence.
5. Let the user copy or edit the reply outside the app.
6. Save useful outcomes locally so the next interaction is easier.

Keep the main screen answering: what should the user handle next?

## Architecture

- Frontend: React 18 + TypeScript + Vite + Tailwind in `apps/web`.
- Backend: Express ESM API in `apps/api`.
- Desktop shell: Electron TypeScript in `electron`.
- Shared packages: `packages/*`.
- Build output: `apps/web/dist`, `dist-electron`, `release`; do not edit generated output.
- Dev desktop ports: web `5190`, API `4011`.
- Browser dev API: `http://localhost:4000`.

Do not create parallel app roots, a new backend folder, or a new central store. Use the existing modules.

## Required Context By Area

- Shared agent status and integration flow: `AGENT_STATUS.md`, `INTEGRATION_GUIDE.md`, `references/SHARED_CONTEXT.json`.
- Current project brief and product loop: `.codex/PROJECT_BRIEF.md`.
- Active development plan and next work: `.codex/DEVELOPMENT_PLAN.md`.
- Feature preservation rules and invariants: `.codex/FEATURE_GUARDS.md`.
- Recent approved changes: `.codex/CHANGELOG.md`.
- Current agent handoff state: `.codex/HANDOFF.md`.
- Overall AI/code architecture: `AI_ARCHITECTURE_CONTEXT.md`.
- API payloads and provider behavior: `API_INTEGRATION_CONTRACTS.md`.
- Auth, Supabase identity, deep links, Netlify callbacks: `AUTH.md`.
- Uploads and OCR plan: `.codex/DEVELOPMENT_PLAN.md` and `.codex/FEATURE_GUARDS.md`.
- Supabase setup and grants: `supabase/FRESH_PROJECT_SETUP.md` and `.codex/FEATURE_GUARDS.md`.
- Floating workbench orchestration: `apps/web/src/components/FloatingAssistant.tsx`.
- Floating assistant state hooks: `apps/web/src/components/floating-assistant/state/*`.
- More Features drawer: `apps/web/src/components/more-features.tsx` and `apps/web/src/components/more-features/*`.

## Codex Planning Protocol

After every approved code, config, prompt, schema, or product change, update the Codex-owned planning files and master coordination files in the same change set:

1. Update `.codex/CHANGELOG.md` with a dated entry, touched areas, verification, and any follow-up.
2. Update `.codex/HANDOFF.md` so the next agent can resume without re-reading stale context.
3. Update `.codex/DEVELOPMENT_PLAN.md` when priorities, shipped status, or next steps change.
4. Update `.codex/FEATURE_GUARDS.md` when a new invariant, protected behavior, or risky integration rule is added.
5. Keep `agents/*.toml` and `.agents/skills/*/SKILL.md` synchronized when the workflow itself changes.
6. Update master files: `AGENT_STATUS.md`, `references/SHARED_CONTEXT.json`, and relevant `plans/*`, `projects/*`, `docs/*`, or `references/*`.
7. Run `npm run agents:validate` after coordination-file changes; run `npm run agents:status` or `npm run agents:sync` when status should be regenerated.

Do not truncate these files to a vague summary. Append or surgically edit the relevant section. Do not delete shipped features from the plan unless the user explicitly approves removing that feature.

Do not edit `.claude/*` for routine app changes. Edit `.claude/*` only when Claude Code runtime instructions, permissions, agents, or skills changed.

## Non-Negotiable Invariants

- Contacts, contact memory, drafts, selected contact, timelines, recent replies, and queues stay local-first in renderer `localStorage`.
- Supabase is identity plus telemetry/support shell unless the user explicitly approves cloud contact backup.
- Do not add Redux, Zustand, MobX, React Query, Prisma, or a new database layer without explicit approval.
- Do not change `/api/generate` payload shape without updating frontend builder, backend normalizer, docs, and verification together.
- Do not bypass `buildStructuredRequest` or `normalizeGenerateRequest`.
- Do not fabricate platform integrations. Email sync is real; WhatsApp, WeChat, DingTalk, and Telegram paths are webhook/import/bot scaffolds unless official APIs are implemented.
- Do not invent "Based on" evidence. If context is thin, be honest and keep evidence sparse.
- Never silently attach pasted text to a risky or medium-confidence contact match.
- Preserve explicit selected-contact behavior; no default auto-selected contact on app load.
- Do not bypass `AuthGate`, email verification, account delete auth, or Supabase/Netlify deep-link alignment.
- Never expose service-role keys or provider secrets to renderer code.

## Frontend Working Rules

- `FloatingAssistant.tsx` is orchestration. Add new state to existing hooks under `floating-assistant/state/` or a focused sibling hook instead of adding broad inline state.
- Extend existing feature folders before creating new screens: `guidance`, `smart-reply`, `cross-language`, `quality-guard`, `relationship-memory`, `rewrite-modes`, `follow-ups`, `timing-intelligence`, `voice-profile`, `uploads`.
- Keep UI compact, calm, and work-focused. Do not add marketing-style pages or decorative surfaces.
- Keep the single header status pill pattern in `WorkbenchHeader`; do not reintroduce floating duplicate toasts over Daily Brief.
- More Features is navigation and utility access. New major work should improve the main workbench loop first.
- Keep all new user-facing strings in both English and Chinese translations.

## Backend Working Rules

- `apps/api/src/server.js` owns routes, provider calls, and prompt assembly.
- `apps/api/src/generateContract.js` normalizes generation payloads.
- Prompt fragments should be focused modules like `crossLanguageFragment.js` and `voiceProfileFragment.js`.
- Supported providers in code are `deepseek`, `openai`, `zhipu`, `qwen`, and `moonshot`.
- If adding OCR/upload processing, do not fake extraction. Return a clear unavailable, needs-review, or failed state when providers or parsers are missing.

## Verification

Run the narrowest useful checks after changes, then a broader build for shared behavior.

Common commands:

```bash
npm run build --workspace=apps/web
npm run electron:build
npm run build
```

Targeted web checks:

```bash
npm run verify:contact-selection --workspace=apps/web
npm run verify:cmd-k --workspace=apps/web
npm run verify:smart-suggestions --workspace=apps/web
npm run verify:next-step --workspace=apps/web
npm run verify:smart-reply --workspace=apps/web
npm run verify:cross-language --workspace=apps/web
npm run verify:quality-guard --workspace=apps/web
npm run verify:auth --workspace=apps/web
npm run verify:relationship-memory --workspace=apps/web
npm run verify:compose-coach --workspace=apps/web
npm run verify:intent --workspace=apps/web
npm run verify:rewrite-modes --workspace=apps/web
npm run verify:follow-ups --workspace=apps/web
npm run verify:voice-profile --workspace=apps/web
npm run verify:contact-continuity --workspace=apps/web
```

Targeted API checks:

```bash
npm run verify:cross-language-fragment --workspace=apps/api
npm run verify:translate-draft-fragment --workspace=apps/api
npm run verify:voice-profile-fragment --workspace=apps/api
```

Use `npm run desktop:dev` for full desktop dev and `npm run dev` for browser plus API dev.

## Local Agent Assets

- Master coordination files live at `AGENT_STATUS.md`, `INTEGRATION_GUIDE.md`, `docs/`, `references/`, `plans/`, `projects/`, and `templates/`.
- Project-local Codex notes live in `.codex/`.
- Reusable agent profiles live in `agents/*.toml`.
- Local task skills live in `.agents/skills/*/SKILL.md`.

These files are guidance assets only. They must not change runtime behavior by themselves.
