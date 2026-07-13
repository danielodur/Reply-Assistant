# Reply Assistant Workbench

Use this skill when changing the main Floating Assistant, command center, More Features drawer, generated reply modal, composer, contact selection, smart suggestions, guidance ring, compose coach, target recipient chip row, or workbench UI.

## Read First

1. `AGENTS.md`
2. `AGENT_STATUS.md`
3. `INTEGRATION_GUIDE.md`
4. `references/SHARED_CONTEXT.json`
5. `.codex/PROJECT_BRIEF.md`
6. `.codex/DEVELOPMENT_PLAN.md`
7. `.codex/FEATURE_GUARDS.md`
8. `.codex/HANDOFF.md`
9. `AI_ARCHITECTURE_CONTEXT.md`
10. Relevant source files:
   - `apps/web/src/components/FloatingAssistant.tsx`
   - `apps/web/src/components/floating-assistant/state/*`
   - `apps/web/src/components/command-center/focusPlan.ts`
   - `apps/web/src/components/command-center/FocusPlanModal.tsx`
   - `apps/web/src/components/workbench/*`
   - `apps/web/src/components/workbench/ComposerPanel.tsx`
   - `apps/web/src/components/workbench/RememberedContextDock.tsx`
   - `apps/web/src/components/quality-guard/ComposeCoachStrip.tsx`
   - `apps/web/src/components/more-features.tsx`
   - `apps/web/src/components/more-features/*`

## Workflow

1. Identify the current feature folder that owns the behavior.
2. Keep `FloatingAssistant.tsx` as orchestration; avoid adding broad inline state.
3. Preserve selected-contact invariants:
   - no default auto-selected contact on startup;
   - medium-confidence paste matches require confirmation;
   - child windows sync through existing selected-contact persistence and IPC.
4. Before touching the target recipient chip row, read the Workbench Guards. The active shipped row is in `FloatingAssistant.tsx` under `copy.floating.targetLabel`; it uses two fixed half-lanes, `relative min-w-0 overflow-hidden` wrappers, active-mode horizontal scrolling/fades, `flex-nowrap`, inline `width: 'max-content'` for the scrolling track, and `shrink-0 whitespace-nowrap` chips. `ComposerPanel.tsx` keeps the inactive reference implementation with inline `gridTemplateColumns` / `gridColumnStart`; preserve it if re-enabled.
5. Before touching `ComposeCoachStrip.tsx`, read the Workbench Guards for the compose coach toast. Preserve the bright white surface, one-warning anti-clutter rule, `bottom-[5rem]` overlay position, animation thresholds, and `key={activeWarning.id}` remount pattern unless the user explicitly approves changing that contract.
6. Before touching More Features drawer open/close behavior, preserve the shipped drawer/Electron close contract: `more-features.tsx` exports `MORE_FEATURES_DRAWER_TRANSITION_MS = 300` and `MORE_FEATURES_DRAWER_WIDTH = 184`, the drawer is fixed at `left-[390px]`, closes with `-translate-x-full`, uses `visible ? 'visible' : 'invisible'` after the close hold, and `FloatingAssistant.tsx` keeps `isMoreFeaturesVisible = isMoreFeaturesOpen || isMoreFeaturesClosing` for visual state while excluding `isMoreFeaturesClosing` from the `setPanelOpen(true)` expression. `electron/main.ts` owns the matching cancellable 300ms non-native close tween from 574px to 390px. Do not reintroduce `-translate-x-[390px]`, a right-anchored drawer, native animated close bounds, or a fully expanded transparent shell during drawer close.
7. Before touching Focus Plan, preserve the anti-clutter contract: no permanent main-screen block, derive from existing local signals only, cap visible plan items at three, route actions through existing handlers instead of adding chatbot-like prompts or a new data store, keep the popover free of blur/dim overlays, and keep the expanded Electron placement area transparent rather than app-colored.
8. Before touching remembered context, preserve the header-anchored right-side popover contract: bell in `WorkbenchHeader.tsx` beside Focus Plan, no left-edge trigger, no blur/dim/frosted overlay, no blank in-panel side surface, transparent expanded placement via `isRememberedContextOpen`, and a large enough thread-summary editor for real edits.
9. Keep UI compact and operational. Avoid landing-page, decorative, or marketing-style additions.
10. Add or update EN + ZH i18n keys together.
11. Run targeted checks.
12. Update `.codex/CHANGELOG.md`, `.codex/HANDOFF.md`, and master coordination files. Update `.codex/DEVELOPMENT_PLAN.md` or `.codex/FEATURE_GUARDS.md` if behavior, status, or invariants changed.

## Verification

Use the checks that match the touched surface:

```bash
npm run verify:contact-selection --workspace=apps/web
npm run verify:next-step --workspace=apps/web
npm run verify:smart-suggestions --workspace=apps/web
npm run verify:smart-reply --workspace=apps/web
npm run verify:quality-guard --workspace=apps/web
npm run verify:cmd-k --workspace=apps/web
npm run verify:contact-continuity --workspace=apps/web
npm run verify:compose-coach --workspace=apps/web
npm run verify:focus-plan --workspace=apps/web
npm run build --workspace=apps/web
```

Run `npm run electron:build` if Electron IPC, preload, or detached windows are touched.
