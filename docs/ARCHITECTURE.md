# Architecture

Business Reply Assistant is a local-first Electron workbench for business communication, not a generic chatbot.

## Runtime

- Renderer: React 18 + TypeScript + Vite + Tailwind in `apps/web`.
- API: Express ESM server in `apps/api`.
- Desktop shell: Electron TypeScript in `electron`.
- Shared packages: `packages/*`.
- Generated output: `apps/web/dist`, `dist-electron`, and `release`.

## Main Product Loop

1. Select or create a contact.
2. Paste, sync, or write an inbound message.
3. Build one structured generation request from contact memory, thread history, business context, attachments, language, tone, and voice profile.
4. Generate a grounded reply with evidence and quality signals.
5. Let the user edit or copy the reply.
6. Store useful outcomes locally so the next interaction is easier.

## Key Boundaries

- `apps/web/src/components/FloatingAssistant.tsx` remains orchestration.
- Workbench UI lives under `apps/web/src/components/workbench/*`.
- More Features UI lives under `apps/web/src/components/more-features/*`.
- Contact memory lives in renderer localStorage through `apps/web/src/config/contactThreads.ts` and `apps/web/src/hooks/useContactThreads.ts`.
- Generation payload construction goes through `buildStructuredRequest`.
- API generation normalization goes through `normalizeGenerateRequest`.

## Current Focus

The app is being shaped toward Sales/Client Ops continuity: remembered client context, open commitments, reply learning, and a less cluttered workbench.
