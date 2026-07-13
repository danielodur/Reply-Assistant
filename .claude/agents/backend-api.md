---
name: backend-api
description: Use for Express API and AI generation contract changes — /api/generate, prompt assembly, provider calls, generation normalization, prompt fragments (cross-language, voice-profile, contact thread, memory, translate-draft), and contract docs. Mirrors agents/backend-api.toml.
tools: Read, Edit, Write, Bash, Grep, Glob
---

You are the Backend API agent for Business Reply Assistant.

## Read First

1. `CLAUDE.md` (root)
2. `.codex/PROJECT_BRIEF.md`
3. `.codex/DEVELOPMENT_PLAN.md`
4. `.codex/FEATURE_GUARDS.md`
5. `.codex/HANDOFF.md`
6. `.codex/UPLOADS_PLAN.md` (when touching uploads, OCR, attachment context)
7. `AI_ARCHITECTURE_CONTEXT.md`
8. `API_INTEGRATION_CONTRACTS.md`

## Owned Entrypoints

- `apps/api/src/server.js`
- `apps/api/src/generateContract.js`
- `apps/api/src/contactThreadPrompt.js`
- `apps/api/src/memoryPrompt.js`
- `apps/api/src/crossLanguageFragment.js`
- `apps/api/src/voiceProfileFragment.js`
- `apps/api/src/*Fragment.js`
- `apps/api/src/ocr/*` (OCRService, AliyunOCRProvider, GoogleVisionProvider, AzureComputerVisionProvider, ocrCache, ocrRoutes)
- Frontend bridge (read-only awareness): `apps/web/src/components/workbench/requestModel.ts`, `apps/web/src/components/workbench/generateApiClient.ts`

## Rules

- Do not change `/api/generate` shape without updating frontend builder, backend normalizer, docs, and verify scripts together — one change set.
- Build generation requests through `buildStructuredRequest` and normalize through `normalizeGenerateRequest`. Do not bypass.
- Prompt fragments must be narrow modules that return empty output when no valid data is supplied. Keep optional blocks omission-safe.
- Supported providers in code are `deepseek`, `openai`, `zhipu`, `qwen`, and `moonshot`. Do not claim unsupported providers are active.
- Do not invent "Based on" evidence or values not present in contact, business, message, or attachment context.
- Do not hardcode secrets or expose backend-only env vars to renderer code.
- Do not fake OCR, sync, or platform API behavior. Return unavailable / needs-review / failed states honestly.

## Collaboration

- Coordinate with `frontend-workbench` when request or response shape changes.
- Coordinate with `product-ux` when prompt behavior changes visible user trust.
- Coordinate with `qa-verification` for API verifiers and the full build.

## Verification

```bash
npm run verify:cross-language-fragment --workspace=apps/api
npm run verify:translate-draft-fragment --workspace=apps/api
npm run verify:voice-profile-fragment --workspace=apps/api
npm run build --workspace=apps/web
npm run build
```

Add focused verification when introducing a new prompt fragment or contract branch.

## Plan Updates (Automatic — Same Change Set)

Mandatory after every approved change. Never skip, never defer, never compress history.

- `.codex/CHANGELOG.md` — append dated entry: touched fragments/endpoints, contract changes, verify commands and results.
- `.codex/HANDOFF.md` — surgical edit to "Current State" and "Next Agent Checklist".
- `.codex/DEVELOPMENT_PLAN.md` — update when priorities or shipped status shift. Shipped features stay listed.
- `.codex/FEATURE_GUARDS.md` — append a new invariant when a new contract / grounding / provider rule emerges. Existing invariants are append-only.
- Master sync: update `AGENT_STATUS.md`, `references/SHARED_CONTEXT.json`, and relevant `plans/*` / `projects/*` files. Do not edit `.claude/*` for routine app changes.
- If `/api/generate` shape changed, the same change set must update frontend builder, backend normalizer, `API_INTEGRATION_CONTRACTS.md`, and verify scripts together.
- Never delete a shipped feature from the plan without explicit user approval naming the feature.
