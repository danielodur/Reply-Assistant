---
name: reply-assistant-generation-contract
description: Use when changing /api/generate, generation request building, backend normalization, prompt fragments, AI provider behavior, reply intelligence, voice profile, cross-language behavior, or upload/attachment context. Mirrors .agents/skills/reply-assistant-generation-contract/SKILL.md.
---

# Reply Assistant Generation Contract

Use this skill when changing `/api/generate`, generation request building, backend normalization, prompt fragments, AI provider behavior, reply intelligence, voice profile, cross-language behavior, or upload/attachment context.

## Read First

1. `CLAUDE.md`
2. `AGENT_STATUS.md`
3. `INTEGRATION_GUIDE.md`
4. `references/SHARED_CONTEXT.json`
5. `.codex/PROJECT_BRIEF.md`
6. `.codex/DEVELOPMENT_PLAN.md`
7. `.codex/FEATURE_GUARDS.md`
8. `.codex/HANDOFF.md`
9. `.codex/UPLOADS_PLAN.md` (when touching uploads, OCR, attachment context, `attachmentContext` on `/api/generate`)
10. `AI_ARCHITECTURE_CONTEXT.md`
11. `API_INTEGRATION_CONTRACTS.md`
12. Source files:
   - `apps/web/src/components/workbench/requestModel.ts`
   - `apps/web/src/components/workbench/generateApiClient.ts`
   - `apps/api/src/generateContract.js`
   - `apps/api/src/server.js`
   - prompt fragments under `apps/api/src/*Fragment.js`
   - `apps/api/src/ocr/*` (when touching upload extraction / providers / cache)
   - `apps/web/src/uploads/*` and `apps/web/src/components/uploads/*` (when touching the renderer-side upload contract)

## Rules

- Keep request additions optional and omission-safe unless the user explicitly approves a breaking contract.
- Update frontend request builder, backend normalizer, docs, and verify scripts together.
- Prompt fragments should be narrow modules that return empty output when no valid data is supplied.
- Do not invent "Based on" evidence or values from attachment summaries.
- For attachment context, preserve the shipped upload/OCR guardrails: summaries only in generation, no raw binaries in localStorage, no fake OCR, provider status must be honest, and low-confidence extraction must stay visible as uncertain.
- Do not claim unsupported AI providers or platform integrations.
- Do not hardcode secrets or expose backend-only env vars to renderer code.

## Planning Updates (Automatic — Same Change Set)

Mandatory after every approved change. See `/CLAUDE.md` → "Planning Protocol" for the full rules.

- Append a dated entry to `.codex/CHANGELOG.md`: touched fragments/endpoints, contract changes, exact verify commands run and results.
- Surgically edit `.codex/HANDOFF.md` "Current State" and "Next Agent Checklist".
- Update `.codex/DEVELOPMENT_PLAN.md` if priorities or shipped status shifted.
- Append to `.codex/FEATURE_GUARDS.md` if a new contract / grounding / provider rule emerged.
- If `/api/generate` shape changed, the same change set must also update the frontend builder, backend normalizer, `API_INTEGRATION_CONTRACTS.md`, and verify scripts.
- Master sync: update `AGENT_STATUS.md`, `references/SHARED_CONTEXT.json`, and relevant `plans/*` / `projects/*` files. Run `npm run agents:validate` and `npm run agents:status` after coordination edits.
- Do not edit `.claude/*` for routine app changes — edit Claude Code runtime files only when runtime instructions, permissions, agents, or skills themselves change.
- Update Codex peer (`agents/backend-api.toml`, `.agents/skills/reply-assistant-generation-contract/SKILL.md`) only when Codex workflow itself changed.
- Never truncate history. Never delete shipped features or invariants without explicit user approval.

## Verification

```bash
npm run verify:cross-language-fragment --workspace=apps/api
npm run verify:translate-draft-fragment --workspace=apps/api
npm run verify:voice-profile-fragment --workspace=apps/api
npm run build --workspace=apps/web
npm run build
```

Add focused verification when adding a new prompt fragment or contract branch.
