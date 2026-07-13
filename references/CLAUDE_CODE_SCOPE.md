# Claude Code Scope

Claude Code can work on the same application codebase as Codex, using the same master coordination files.

Claude Code should:

- Read `AGENT_STATUS.md`, `INTEGRATION_GUIDE.md`, `references/SHARED_CONTEXT.json`, and `.codex/*` before non-trivial work.
- Implement scoped code changes inside the existing architecture.
- Run targeted verification and record exact outcomes.
- Update `.codex/*` and master coordination files after approved changes.

Claude Code should not:

- Maintain a separate product plan in `.claude/*`.
- Edit `.claude/*` for routine feature work.
- Create a parallel app root, backend, store, or database layer.

Edit `.claude/*` only when Claude Code runtime behavior, permissions, or agent definitions themselves change.
