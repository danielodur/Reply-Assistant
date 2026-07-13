# Codex Project Context

This directory stores project-local Codex guidance for Business Reply Assistant.

Use the root `AGENTS.md` as the primary instruction file. Use `agents/*.toml` as reusable agent profiles for common work modes, and `.agents/skills/*/SKILL.md` for repeatable task workflows.

The app is a local-first Electron + React + Express communication workbench. Do not treat this as a new scaffold. Extend the existing architecture.

## Fast Start

1. Read `AGENTS.md`.
2. Read `.codex/PROJECT_BRIEF.md`, `.codex/DEVELOPMENT_PLAN.md`, `.codex/FEATURE_GUARDS.md`, `.codex/CHANGELOG.md`, and `.codex/HANDOFF.md`.
3. Inspect the relevant source files before editing.
4. Run targeted verification plus build where appropriate.
5. After approved changes, update the Codex planning files in the same change set.

## Important Docs

- `.codex/PROJECT_BRIEF.md`
- `.codex/DEVELOPMENT_PLAN.md`
- `.codex/FEATURE_GUARDS.md`
- `.codex/CHANGELOG.md`
- `.codex/HANDOFF.md`
- `AI_ARCHITECTURE_CONTEXT.md`
- `API_INTEGRATION_CONTRACTS.md`
- `AUTH.md`
- `supabase/FRESH_PROJECT_SETUP.md`
