# Codex Project Brief

Last updated: 2026-06-04

## Product

Business Reply Assistant is a multilingual desktop communication workbench for business professionals. It is not a general chatbot and not a marketing site.

The user opens a compact Electron app, selects or creates a contact, pastes or syncs a message, generates a grounded reply, reviews evidence and quality signals, copies the reply, and continues in the original communication channel.

Core promise:

> Capture the message, understand the contact, draft the right reply, preserve memory, and surface the next action.

## Main Loop

1. User opens the desktop workbench.
2. Daily Brief surfaces the most important communication work.
3. User selects a contact or confirms a match.
4. User pastes, writes, or syncs the latest inbound message.
5. The app builds one structured request from message, contact memory, thread history, business context, language, tone, voice profile, and optional attachment summaries.
6. Backend returns reply output, variants, insight, and quick actions.
7. UI shows grounded "Based on" lines, cultural guidance, quality guard, voice match, outcome signals, rewrite modes, and send-timing hints when relevant.
8. User edits or copies the reply.
9. Local history, timeline, style memory, follow-ups, and next actions update.

Every use should make the next use easier without inventing context.

## Architecture Snapshot

- Frontend: React 18 + TypeScript + Vite + Tailwind in `apps/web`.
- Backend: Express ESM API in `apps/api`.
- Desktop: Electron main/preload TypeScript in `electron`.
- Main workbench: `apps/web/src/components/FloatingAssistant.tsx`.
- Workbench submodules: `apps/web/src/components/workbench/*`.
- Floating assistant state hooks: `apps/web/src/components/floating-assistant/state/*`.
- More Features drawer: `apps/web/src/components/more-features.tsx` plus `apps/web/src/components/more-features/*`.
- Generation request builder: `apps/web/src/components/workbench/requestModel.ts`.
- API request client: `apps/web/src/components/workbench/generateApiClient.ts`.
- Generation normalizer: `apps/api/src/generateContract.js`.
- API server and provider calls: `apps/api/src/server.js`.
- Prompt fragments: `apps/api/src/*Fragment.js`.

## State Ownership

The app is local-first. Contact memory, thread history, selected contact, drafts, queues, recent replies, and communication memory live in renderer state and `localStorage`.

Supabase is currently identity, telemetry, profile, support, and optional sync durability. It is not the canonical contact database.

Do not introduce a central state library, new database layer, or cloud contact migration without explicit approval.

## Runtime Commands

```bash
npm run dev
npm run desktop:dev
npm run build --workspace=apps/web
npm run electron:build
npm run build
```

## Agent Collaboration Model

- `product-ux` owns product intent, workflow fit, wording, and feature preservation.
- `frontend-workbench` owns renderer implementation and workbench module boundaries.
- `backend-api` owns generation contracts, prompt fragments, provider behavior, and API safety.
- `qa-verification` owns targeted checks, build selection, and handoff quality.

Agents should work in sequence when a task crosses boundaries: product intent, implementation, contract alignment, verification, then plan update.

