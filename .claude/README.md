# Claude Code Project Configuration

This directory holds Claude Code's project-local configuration for Business Reply Assistant. It is the Claude Code peer to `.codex/` (Codex) and `.agents/` (local skills).

## Layout

- `settings.json` — project-level permissions, env, and hook config (committed).
- `settings.local.json` — personal overrides (gitignored; create as needed).
- `agents/*.md` — specialized agent definitions invokable via the Agent tool.
- `skills/*/SKILL.md` — repeatable task workflows.

## Read Order

1. `/CLAUDE.md` (root) — primary instruction file.
2. `AGENT_STATUS.md`, `INTEGRATION_GUIDE.md`, and `references/SHARED_CONTEXT.json`.
3. `.codex/PROJECT_BRIEF.md`, `.codex/DEVELOPMENT_PLAN.md`, `.codex/FEATURE_GUARDS.md`, `.codex/HANDOFF.md`, `.codex/CHANGELOG.md`.
4. Matching `.claude/agents/<role>.md` or `.claude/skills/<workflow>/SKILL.md`.
5. Source files for the area under change.

## Relationship To Codex Assets

- Master files plus `.codex/` are the shared source of truth for product/plan/guards/changelog/handoff.
- `agents/*.toml` and `.agents/skills/*/SKILL.md` are Codex-specific workflow files.
- `.claude/agents/*.md`, `.claude/skills/*/SKILL.md`, and `.claude/settings.json` are Claude Code runtime configuration.
- Routine app changes update `.codex/*` and master files, not `.claude/*`.
- Edit `.claude/*` only when Claude Code runtime instructions, permissions, agents, or skills changed.

## Planning Files

Claude Code reads from and writes to master files plus `.codex/*.md`:

- `AGENT_STATUS.md`
- `INTEGRATION_GUIDE.md`
- `references/SHARED_CONTEXT.json`
- `.codex/PROJECT_BRIEF.md`
- `.codex/DEVELOPMENT_PLAN.md`
- `.codex/FEATURE_GUARDS.md`
- `.codex/UPLOADS_PLAN.md`
- `.codex/CHANGELOG.md`
- `.codex/HANDOFF.md`

See `/CLAUDE.md` → "Planning Protocol" for the mandatory update rules after every approved change.
