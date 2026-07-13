# Claude Code Instructions — Business Reply Assistant

This is the Claude Code peer to `AGENTS.md`. Product and workflow state now lives in master coordination files plus `.codex/*`; routine app changes should not edit `.claude/*`.

This is a late-stage, local-first desktop communication assistant. Before changing code, read this file plus the master coordination files and Codex-owned planning files under `.codex/`.

## Master Coordination Files

Read these before non-trivial work:

- `AGENT_STATUS.md`
- `INTEGRATION_GUIDE.md`
- `references/SHARED_CONTEXT.json`
- `plans/claude-code-current-plan.md`
- `projects/active-features.md`
- `projects/blockers.md`
- `projects/next-priorities.md`

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
- Main workbench: `apps/web/src/components/FloatingAssistant.tsx` (orchestration only).
- Workbench submodules: `apps/web/src/components/workbench/*`.
- Floating assistant state hooks: `apps/web/src/components/floating-assistant/state/*`.
- More Features drawer: `apps/web/src/components/more-features.tsx` plus `apps/web/src/components/more-features/*`.

Do not create parallel app roots, a new backend folder, or a new central store. Use the existing modules.

## Source-of-Truth Planning Docs

The master files plus `.codex/` are the source of truth for product/plan/guards/changelog/handoff. Claude Code reads from and writes to these — no parallel Claude-only product plan exists:

- Product brief & main loop: `.codex/PROJECT_BRIEF.md`
- Active priorities & near-term work: `.codex/DEVELOPMENT_PLAN.md`
- Invariants & feature preservation: `.codex/FEATURE_GUARDS.md`
- Uploads & OCR spec (limits, providers, contract): `.codex/UPLOADS_PLAN.md`
- Recent approved changes: `.codex/CHANGELOG.md`
- Current agent handoff state: `.codex/HANDOFF.md`
- Shared status: `AGENT_STATUS.md`
- Cross-agent integration: `INTEGRATION_GUIDE.md`
- Machine-readable shared context: `references/SHARED_CONTEXT.json`
- AI/code architecture: `AI_ARCHITECTURE_CONTEXT.md`
- API payloads and providers: `API_INTEGRATION_CONTRACTS.md`
- Auth, Supabase identity, deep links: `AUTH.md`
- Supabase setup and grants: `supabase/FRESH_PROJECT_SETUP.md`

## Required Context By Area

Before editing a surface, read the matching planning files and source modules:

- Floating workbench orchestration: `apps/web/src/components/FloatingAssistant.tsx`
- Floating assistant state hooks: `apps/web/src/components/floating-assistant/state/*`
- Generation request builder: `apps/web/src/components/workbench/requestModel.ts`
- API request client: `apps/web/src/components/workbench/generateApiClient.ts`
- Generation normalizer: `apps/api/src/generateContract.js`
- API server and provider calls: `apps/api/src/server.js`
- Prompt fragments: `apps/api/src/*Fragment.js`

## Planning Protocol (Automatic — After Every Approved Change)

This protocol is **mandatory** and **automatic**. The current Claude Code agent owns the update in the same change set as the code change — never as a follow-up, never skipped, never delegated to a future session. If you finish code without updating these files, you are not done.

1. **`.codex/CHANGELOG.md`** — append a dated entry with: touched areas, the user-facing change, files modified, verification commands run and their result, any follow-up. Never truncate or rewrite history; append at the bottom under today's date.
2. **`.codex/HANDOFF.md`** — surgically edit "Current State" and "Next Agent Checklist" so the next session can resume cold. Do not collapse to vague summaries.
3. **`.codex/DEVELOPMENT_PLAN.md`** — update when priorities, shipped status, or next-step ordering changes. Keep the full shipped-feature list; do not compress it.
4. **`.codex/FEATURE_GUARDS.md`** — add a new invariant when the change introduces one (a new protected behavior, a new contract rule, a new "do not regress" line). Existing invariants are append-only — never remove without explicit user approval.
5. **Master file sync** — update `AGENT_STATUS.md`, `references/SHARED_CONTEXT.json`, and the relevant `plans/*`, `projects/*`, `docs/*`, or `references/*`.
6. **Codex workflow sync** — when Codex workflow itself changes, update Codex-side files: `AGENTS.md`, `agents/*.toml`, `.agents/skills/*/SKILL.md`.
7. **Claude runtime exception** — edit `.claude/*` only when Claude Code runtime instructions, permissions, agents, or skills changed.

### Hard Rules — Apply to Every Planning Edit

- **No truncation.** Append or surgically edit. Never replace a section with "see history" or compress shipped features into "various improvements."
- **No feature deletion.** Shipped features stay on the plan and in the guards list permanently. Removal requires explicit user approval naming the feature.
- **No silent breaking changes.** A contract or invariant change must land in `FEATURE_GUARDS.md` and `CHANGELOG.md` in the same commit as the code.
- **No vague verification claims.** Record the exact commands you ran and their outcome. If you skipped a verification, say which and why.
- **No duplicate planning drift.** Keep shared workflow state in master files. Do not maintain routine duplicate plan edits in `.claude/*`.

## Cross-Harness Collaboration (Codex ↔ Claude Code)

Both harnesses operate on the same codebase against the same planning files. Treat them as peers:

- Both read master files and `.codex/*.md` as the authoritative plan.
- Both read `AGENTS.md` / `CLAUDE.md` as their respective entry points.
- Routine changes update master files instead of repeatedly editing the other harness's private files.
- If Claude Code runtime behavior itself changes, update `.claude/*`. Otherwise leave `.claude/*` alone.

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
- Extend existing feature folders before creating new screens: `guidance`, `smart-reply`, `cross-language`, `quality-guard`, `relationship-memory`, `rewrite-modes`, `follow-ups`, `timing-intelligence`, `voice-profile`, `uploads`, `intent`, `scenarios`, `guided-tour`, `contacts`, `command-center`, `more-features`.
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
npm run verify:notifications --workspace=apps/web
npm run verify:guided-tour --workspace=apps/web
npm run verify:sales-scenarios --workspace=apps/web
npm run verify:contact-onboarding --workspace=apps/web
npm run verify:draft-language-toggle --workspace=apps/web
npm run verify:help-center --workspace=apps/web
```

Targeted API checks:

```bash
npm run verify:cross-language-fragment --workspace=apps/api
npm run verify:translate-draft-fragment --workspace=apps/api
npm run verify:voice-profile-fragment --workspace=apps/api
```

Use `npm run desktop:dev` for full desktop dev and `npm run dev` for browser plus API dev.

## Agent Collaboration Model

The four Claude Code agents work hand-in-hand. A non-trivial change typically flows:

1. **`product-ux`** — confirms intent fits the trust-and-flow workbench, identifies any new invariant to protect.
2. **`frontend-workbench`** and/or **`backend-api`** — implements within the existing module boundaries; updates EN+ZH copy together if user-visible.
3. **`qa-verification`** — runs the narrowest verify scripts first, then the right build, reports any skipped commands.
4. Whichever agent finishes the work also runs the **Planning Protocol** above — never hand that off.

When unsure which agent to invoke, default to `product-ux` for intent questions, `frontend-workbench` for renderer work, `backend-api` for prompt/contract work, `qa-verification` for "what should I run before handoff."

## Claude Code Assets

- Project-local agents: `.claude/agents/*.md` (mirror of `agents/*.toml`).
- Project-local skills: `.claude/skills/*/SKILL.md` (mirror of `.agents/skills/*/SKILL.md`).
- Settings & permissions: `.claude/settings.json`.
- Auto-memory: `~/.claude/projects/-Users-briandodur-Desktop-Reply-Assistant/memory/MEMORY.md` (managed automatically; persists across sessions).

These are guidance assets only. They must not change runtime behavior by themselves.
