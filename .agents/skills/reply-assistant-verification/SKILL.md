# Reply Assistant Verification

Use this skill when selecting checks for a change, diagnosing regressions, or preparing a final handoff.

## Read First

1. `AGENTS.md`
2. `AGENT_STATUS.md`
3. `INTEGRATION_GUIDE.md`
4. `references/SHARED_CONTEXT.json`
5. `.codex/DEVELOPMENT_PLAN.md`
6. `.codex/FEATURE_GUARDS.md`
7. `.codex/HANDOFF.md`

## Command Map

Root:

```bash
npm run dev
npm run desktop:dev
npm run build
npm run electron:build
npm run verify:child-window-layout
npm run agents:validate
npm run agents:status
npm run agents:sync
```

Web:

```bash
npm run build --workspace=apps/web
npm run verify:contact-selection --workspace=apps/web
npm run verify:cmd-k --workspace=apps/web
npm run verify:smart-suggestions --workspace=apps/web
npm run verify:next-step --workspace=apps/web
npm run verify:smart-reply --workspace=apps/web
npm run verify:cross-language --workspace=apps/web
npm run verify:draft-language-toggle --workspace=apps/web
npm run verify:contact-onboarding --workspace=apps/web
npm run verify:quality-guard --workspace=apps/web
npm run verify:notifications --workspace=apps/web
npm run verify:guided-tour --workspace=apps/web
npm run verify:sales-scenarios --workspace=apps/web
npm run verify:auth --workspace=apps/web
npm run verify:help-center --workspace=apps/web
npm run verify:relationship-memory --workspace=apps/web
npm run verify:compose-coach --workspace=apps/web
npm run verify:intent --workspace=apps/web
npm run verify:rewrite-modes --workspace=apps/web
npm run verify:follow-ups --workspace=apps/web
npm run verify:voice-profile --workspace=apps/web
npm run verify:focus-plan --workspace=apps/web
npm run verify:contact-continuity --workspace=apps/web
```

API:

```bash
npm run verify:cross-language-fragment --workspace=apps/api
npm run verify:translate-draft-fragment --workspace=apps/api
npm run verify:voice-profile-fragment --workspace=apps/api
```

## Selection Rules

- Contact selection, paste match, Daily Brief contact loading: run `verify:contact-selection`.
- Target recipient chip row changes in `FloatingAssistant.tsx` or `ComposerPanel.tsx`: run `verify:contact-selection` and `npm run build --workspace=apps/web`; add manual desktop smoke when fade/scroll feel is part of the change.
- More Features drawer, panel-open visual state, transparent expanded placement, or Electron panel close animation changes: run `verify:focus-plan`, `verify:contact-continuity`, `npm run build --workspace=apps/web`, and `npm run electron:build`; add manual desktop smoke when animation feel is part of the change.
- Focus Plan planner, modal, Action Center replacement, overflow/scroll behavior, transparent expanded placement, or header plan button changes: run `verify:focus-plan`, `verify:next-step`, and `npm run build --workspace=apps/web`; run `npm run electron:build` when Electron transparency/panel behavior is touched.
- Remembered context trigger, popover, continuity cards, or thread-summary edit changes: run `verify:contact-continuity` and `npm run build --workspace=apps/web`; add `verify:focus-plan` when the shared header action cluster or expanded side-popover placement changes.
- Compose coach toast changes in `ComposeCoachStrip.tsx` or composer placement: run `verify:compose-coach` and `npm run build --workspace=apps/web`.
- Next-step ring, SmartNextChip, CmdKHint, guided tour prompt conflicts: run `verify:next-step` and the related feature verifier.
- Auth, account settings, Netlify callback, deep links, Supabase profile sync: read `AUTH.md`, then run `verify:auth`.
- Backend prompt fragment changes: run the matching API verifier.
- Electron window, preload, notification IPC, detached windows: run `npm run electron:build` and `npm run verify:child-window-layout`.
- Shared frontend changes: finish with `npm run build --workspace=apps/web`.
- Cross-layer contract changes: finish with `npm run build`.

Always report checks that were not run and why.

## Planning Updates

After approved changes:

- Record exact verify commands run and their outcome in `.codex/CHANGELOG.md`. Name any skipped commands and why.
- Summarize the current safe handoff state in `.codex/HANDOFF.md`.
- Append to `.codex/FEATURE_GUARDS.md` if verification surfaced a fragile behavior worth protecting.
- Master sync: update `AGENT_STATUS.md`, `references/SHARED_CONTEXT.json`, and relevant `plans/*` / `projects/*` files. Run `npm run agents:validate` and `npm run agents:status` after coordination edits.
- Do not edit `.claude/*` for routine app changes.
- Never remove historical entries just because they are old.
