# Sync Behavior

Master files are the shared coordination layer between Codex and Claude Code.

Routine app changes update:

- `.codex/CHANGELOG.md`
- `.codex/HANDOFF.md`
- `.codex/DEVELOPMENT_PLAN.md` when priorities or shipped status changed
- `.codex/FEATURE_GUARDS.md` when invariants changed
- `AGENT_STATUS.md`
- `references/SHARED_CONTEXT.json`
- `plans/*` and `projects/*` as appropriate

Routine app changes do not update:

- `.claude/agents/*`
- `.claude/skills/*`
- `.claude/settings.json`

Exception: update `.claude/*` when Claude Code runtime behavior, permissions, agent definitions, or skill definitions changed.
