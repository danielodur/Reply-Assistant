# Codex / Claude Code Integration Guide

Business Reply Assistant is maintained by both Codex and Claude Code. The goal of this guide is to stop duplicated planning edits across two harness-specific directories.

## Source Of Truth

Read in this order before non-trivial work:

1. `AGENT_STATUS.md` — current agent status and blockers.
2. `references/SHARED_CONTEXT.json` — machine-readable shared state.
3. `.codex/PROJECT_BRIEF.md`, `.codex/DEVELOPMENT_PLAN.md`, `.codex/FEATURE_GUARDS.md`, `.codex/UPLOADS_PLAN.md`, `.codex/HANDOFF.md`.
4. The relevant domain docs under `docs/` and root docs such as `AI_ARCHITECTURE_CONTEXT.md`, `API_INTEGRATION_CONTRACTS.md`, and `AUTH.md`.

## Update Rule

After an approved code, config, prompt, schema, product, or workflow change:

1. Update code and run targeted verification.
2. Update `.codex/CHANGELOG.md` and `.codex/HANDOFF.md`.
3. Update `.codex/DEVELOPMENT_PLAN.md` or `.codex/FEATURE_GUARDS.md` only when priorities or invariants changed.
4. Update Codex-side profiles or skills only when Codex workflow changed: `AGENTS.md`, `agents/*.toml`, `.agents/skills/*/SKILL.md`.
5. Update master files: `AGENT_STATUS.md`, `references/SHARED_CONTEXT.json`, and the relevant files under `plans/`, `projects/`, `docs/`, or `references/`.
6. Do not edit `.claude/*` for routine app changes. Edit `.claude/*` only when Claude Code runtime instructions or permissions themselves changed.

## Division Of Labor

- Codex: product implementation, prompt/API contracts, frontend/backend changes, Codex plan/skill updates, and final master-file sync.
- Claude Code: codebase implementation and verification when explicitly used, while reading the same master files and `.codex/` planning source.
- Both agents: protect local-first contact memory, grounded generation, honest integration status, and explicit selected-contact behavior.

## Validation

Use these commands after coordination-file changes:

```bash
npm run agents:validate
npm run agents:status
```

Use app checks that match the touched area; `AGENTS.md` and `CLAUDE.md` list the current verification commands.
