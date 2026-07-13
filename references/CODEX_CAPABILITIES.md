# Codex Capabilities In This App

Codex handles:

- Product and implementation planning.
- React/Vite workbench changes.
- Express API and prompt-contract changes.
- Local-first data model changes.
- Verification script creation and execution.
- Codex-side agent profile and skill updates.
- Master coordination file updates.

Codex must not:

- Fabricate platform integrations.
- Move canonical contacts/messages to cloud storage without approval.
- Bypass `buildStructuredRequest` or `normalizeGenerateRequest`.
- Update `.claude/*` for routine app changes after the master coordination layer is in place.
