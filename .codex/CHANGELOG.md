# Codex Change Log

This is the Codex-owned change log. Add a dated entry after every approved code, config, prompt, schema, product, or agent-guidance change.

Do not remove old entries during routine development. If the file becomes long, add an index at the top instead of deleting history.

## 2026-06-15

### FloatingAssistant UX & Stability Polish

- Fixed a critical React stale closure bug in `FloatingAssistant.tsx`. The `Cmd+Enter` keyboard shortcut previously closed over an old `handleGenerate` reference because `workMode`, `textType`, and other generation inputs were intentionally excluded from the `useEffect` dependencies to avoid listener churn. Resolved by introducing `handleEscapeRef` to securely proxy the current keyboard event handler without requiring re-binding on every render. `Cmd+K` escape also correctly returns focus to the composer.
- Fixed Electron IPC listener churn (`onChildAction`). The `useEffect` that bound `window.desktopApp.onChildAction` included `contactThreads` in its dependencies, causing the listener to unsubscribe and resubscribe constantly (e.g., every time a draft auto-saved). Resolved by using a stable `onChildActionRef` proxy so the IPC listener is attached exactly once but always reads the latest state.
- Polished Contact Auto-Select UX to respect `FEATURE_GUARDS.md`. Previously, pasting text that triggered a high-confidence `auto-select` match still forced the user to manually confirm the contact. The app now immediately applies the selected contact and focuses the composer, eliminating the "chatbot-like" hurdle while preserving manual confirmation for medium-confidence matches.
- Fixed layout shift during Contact Confirmation. The contact match confirmation block was rendering above the target recipient lane, abruptly pushing the composer down. It now renders immediately below the composer (`ComposerPanel`), keeping the typing area rock-solid.
- Fixed focus restoration. Closing the Generated Reply modal via child-screen IPC (`onChildScreenClosed`) now successfully requests focus back to the `inputTextareaRef`, maintaining a continuous keyboard workflow.

Files touched:

- `apps/web/src/components/FloatingAssistant.tsx`
- `.codex/CHANGELOG.md`
- `.codex/HANDOFF.md`

Verification:

- `npm run verify:contact-selection --workspace=apps/web` — passed.
- `npm run verify:cmd-k --workspace=apps/web` — passed.
- `npm run build --workspace=apps/web` — passed; pre-existing >500 kB bundle warning unchanged.

## 2026-06-09

### Coordination Audit — Current App Standing and Claude Continuation Safety

- Audited the current app standing requested by the user, with direct inspection of `FloatingAssistant.tsx`, `more-features.tsx`, `more-features/*`, `electron/main.ts`, Codex skills, Claude Code skill mirrors, and the master plan/status files.
- Confirmed the shipped More Features close behavior matches implementation and guards: shared 300ms drawer/host timing, 184px fixed drawer width, fixed `left-[390px]` anchor, `-translate-x-full` left close, post-hold `invisible`, `isMoreFeaturesVisible` retained only for React visual state, no `isMoreFeaturesClosing` in `setPanelOpen(true)`, and Electron's cancellable non-native 300ms shrink from 574px to 390px.
- Found and fixed guidance drift: `plans/claude-code-current-plan.md` still described 2026-06-08 remembered-context work as Codex's latest app work and did not name the 2026-06-09 More Features close contract. The Claude Code plan now leads with the current More Features, remembered-context, Focus Plan, active TARGET row, and compose-coach contracts.
- Tightened Codex and Claude workbench/verification guidance so both harnesses select the same files and checks for More Features, Focus Plan, remembered context, compose coach, and target recipient row work. Updated the frontend agent profiles to call out the More Features and transparent popover contracts before future renderer edits.
- Guidance-only change. No runtime app code, prompt, schema, storage, API, route, IPC shape, translation key, or UI behavior changed.

Files touched:

- `.agents/skills/reply-assistant-workbench/SKILL.md`
- `.agents/skills/reply-assistant-verification/SKILL.md`
- `.agents/skills/reply-assistant-generation-contract/SKILL.md`
- `.claude/skills/reply-assistant-workbench/SKILL.md`
- `.claude/skills/reply-assistant-verification/SKILL.md`
- `.claude/skills/reply-assistant-generation-contract/SKILL.md`
- `agents/frontend-workbench.toml`
- `.claude/agents/frontend-workbench.md`
- `.codex/CHANGELOG.md`
- `.codex/HANDOFF.md`
- `plans/codex-current-plan.md`
- `plans/claude-code-current-plan.md`
- `references/SHARED_CONTEXT.json`
- `AGENT_STATUS.md`

Verification:

- `npm run agents:validate` — passed.
- `npm run agents:status` — passed; regenerated `AGENT_STATUS.md` from `references/SHARED_CONTEXT.json`.
- Skipped app runtime verification because this was guidance/planning-only after direct source inspection; no runtime files changed.

### More Features Drawer Close Polish — Matched Timing, No Under-Panel Ghost

- Tightened the More Features close animation after reviewing the actual open/close path. The earlier close hold kept the Electron shell alive, but the main 390px workbench still switched back to its closed visual state as soon as `isMoreFeaturesOpen` became false. That meant the panel corners, hidden workbench surfaces, next-step guidance, and compose-coach suppression could update while the drawer was still sliding away, which made the close feel faster than the open and could expose a brief transparent/ghost frame after the drawer closed.
- Added `MORE_FEATURES_DRAWER_TRANSITION_MS = 300` in `more-features.tsx` and made `FloatingAssistant.tsx` use that constant for `MORE_FEATURES_EXIT_MS`, so the host close hold and drawer transform duration stay locked together.
- Added `isMoreFeaturesVisible = isMoreFeaturesOpen || isMoreFeaturesClosing` in `FloatingAssistant.tsx` and used it for the main panel corner shape plus visual gating around Daily Brief, contact confirmation, remembered context, next-step guidance, and compose-coach suppression. The drawer still receives the real `open` boolean, but the surrounding workbench now keeps the same attached/hidden visual state until the drawer exit animation finishes.
- Corrected the bad closed geometry that left a sheet under the FloatingAssistant: the drawer no longer translates 390px left under the whole main panel. It now closes left with `-translate-x-full`, which moves it by its own 184px width so it tucks under the right side of the main screen, then applies `visible ? 'visible' : 'invisible'` after the 300ms exit hold. That preserves the requested leftward close while keeping the drawer away from the top-left and bottom-left rounded corners.
- Removed the remaining transparent ghost area and shake by changing the Electron close path. `FloatingAssistant.tsx` no longer includes `isMoreFeaturesClosing` in the `setPanelOpen(true)` expression, so the expanded Electron shell does not stay fully open as an empty transparent side area while the drawer slides under the main panel. `electron/main.ts` now shrinks the window from 574px to 390px with a controlled 300ms non-native close tween (`PANEL_CLOSE_ANIMATION_MS = 300`) that matches the drawer duration/easing and avoids the native animated `setBounds(..., true)` close shake. The drawer is anchored at fixed `left-[390px]` so it does not double-shift while the Electron window width changes.
- Updated `verify:focus-plan` to protect the shared transition-duration constant, the visual-state flag, the fixed drawer anchor, the no-expanded-shell-during-close rule, and the controlled Electron close tween.

Files touched:

- `apps/web/src/components/FloatingAssistant.tsx`
- `apps/web/src/components/more-features.tsx`
- `apps/web/scripts/verify-focus-plan.ts`
- `electron/main.ts`
- `.codex/CHANGELOG.md`
- `.codex/HANDOFF.md`
- `.codex/DEVELOPMENT_PLAN.md`
- `.codex/FEATURE_GUARDS.md`
- `plans/codex-current-plan.md`
- `projects/active-features.md`
- `references/SHARED_CONTEXT.json`
- `AGENT_STATUS.md`

Verification:

- `npm run verify:focus-plan --workspace=apps/web` — passed (`node --experimental-strip-types` warning only).
- `npm run verify:contact-continuity --workspace=apps/web` — passed.
- `npm run build --workspace=apps/web` — passed; includes `verify:contact-selection`; pre-existing >500 kB bundle warning unchanged.
- `npm run electron:build` — passed; includes `verify:child-window-layout`.

### More Features Drawer Close Animation — Preserve Exit Slide

- Fixed the More Features drawer close behavior so pressing the More Features icon no longer makes the drawer disappear abruptly. The drawer already had a transform exit animation in `more-features.tsx`; the regression came from `FloatingAssistant.tsx` collapsing the Electron expanded panel immediately when `isMoreFeaturesOpen` flipped false, clipping the exit animation before it could be seen.
- Added a short host-side close hold with `MORE_FEATURES_EXIT_MS = 300` and `isMoreFeaturesClosing`, so `setPanelOpen(true)` remains active until the drawer has enough time to slide back left. Opening More Features clears the hold, and closing from either the drawer `onClose` path or the header toggle starts it.
- Superseded follow-up note: an intermediate fix moved the drawer 390px left under the main assistant, which avoided one right-side artifact but left a hidden sheet under the FloatingAssistant corners. The current corrected behavior closes left only by the drawer's own width with `-translate-x-full`, then makes the drawer invisible after the exit hold.
- Updated `verify:focus-plan` to guard the expanded-panel expression and the close-hold constant, because Focus Plan / remembered context / More Features all share the same transparent expanded-shell behavior.
- Renderer orchestration only. No `/api/generate`, backend, storage, IPC shape, route, prompt, child-screen, or translation-key behavior changed.

Files touched:

- `apps/web/src/components/FloatingAssistant.tsx`
- `apps/web/src/components/more-features.tsx`
- `apps/web/scripts/verify-focus-plan.ts`
- `.codex/CHANGELOG.md`
- `.codex/HANDOFF.md`
- `.codex/DEVELOPMENT_PLAN.md`
- `.codex/FEATURE_GUARDS.md`
- `plans/codex-current-plan.md`
- `projects/active-features.md`
- `references/SHARED_CONTEXT.json`
- `AGENT_STATUS.md`

Verification:

- `npm run verify:focus-plan --workspace=apps/web` — passed (`node --experimental-strip-types` warning only).
- `npm run verify:contact-continuity --workspace=apps/web` — passed.
- `npm run build --workspace=apps/web` — passed; includes `verify:contact-selection`; pre-existing >500 kB bundle warning unchanged.

### Remembered Context Notice Icons — Action Required Only

- Changed remembered-context notice behavior so the top bell only appears when there is action-required remembered work. Saved/locked summaries and reply-learning remain stored in contact memory, but they no longer mount a notice icon by themselves.
- `getRememberedContextCounts` still excludes saved/locked summaries from the pending count, and now `hasContext` is also action-only (`count > 0`) for the proactive notice surface.
- `FloatingAssistant.tsx` now shows the remembered-context header icon only when `rememberedContextCounts.count > 0`, matching the natural rule that notice icons should not appear when the value is zero.
- Updated `verify:contact-continuity` to protect the action-only notice behavior.

Files touched:

- `apps/web/src/components/workbench/RememberedContextDock.tsx`
- `apps/web/src/components/FloatingAssistant.tsx`
- `apps/web/scripts/verify-contact-continuity.mjs`
- `.codex/CHANGELOG.md`
- `.codex/HANDOFF.md`
- `.codex/FEATURE_GUARDS.md`
- `plans/codex-current-plan.md`
- `projects/active-features.md`
- `references/SHARED_CONTEXT.json`
- `AGENT_STATUS.md`

Verification:

- `npm run verify:contact-continuity --workspace=apps/web` — passed.
- `npm run verify:focus-plan --workspace=apps/web` — passed (`node --experimental-strip-types` warning only).
- `npm run build --workspace=apps/web` — passed; includes `verify:contact-selection`; pre-existing >500 kB bundle warning unchanged.

### Remembered Context Badge Semantics — Saved Summary Is Not Pending Work

- Fixed the top remembered-context bell count after saving a thread summary. Previously the badge counted any existing thread summary forever, so saving and closing the remembered-context screen could still leave the top icon showing a pending number.
- `getRememberedContextCounts` now separates saved context from unfinished remembered work: `hasContext` keeps the bell available when there is saved summary/learning to view, while `count` includes open commitments plus only unreviewed/unlocked summaries.
- Because `updateContactThreadSummary` already marks saved summaries with `locked: true`, a saved summary remains visible in the remembered-context screen but no longer contributes to the top badge count. This lets the user know the save task is finished without losing where the saved message lives.
- Updated `FloatingAssistant.tsx` so the remembered-context button visibility uses `hasContext`, while the badge value uses the pending `count`.
- Updated `verify:contact-continuity` to protect saved-summary badge semantics.

Files touched:

- `apps/web/src/components/workbench/RememberedContextDock.tsx`
- `apps/web/src/components/FloatingAssistant.tsx`
- `apps/web/scripts/verify-contact-continuity.mjs`
- `.codex/CHANGELOG.md`
- `.codex/HANDOFF.md`
- `.codex/FEATURE_GUARDS.md`
- `plans/codex-current-plan.md`
- `projects/active-features.md`
- `references/SHARED_CONTEXT.json`
- `AGENT_STATUS.md`

Verification:

- `npm run verify:contact-continuity --workspace=apps/web` — passed.
- `npm run verify:focus-plan --workspace=apps/web` — passed (`node --experimental-strip-types` warning only).
- `npm run build --workspace=apps/web` — passed; includes `verify:contact-selection`; pre-existing >500 kB bundle warning unchanged.

### Remembered Context Edit Mode — Editable Assisted Summary, Fixed Footer

- Fixed remembered-context thread-summary edit mode so long existing summaries remain editable instead of feeling locked. The raw textarea was replaced with the app's existing `AssistedNotesTextarea`, using the same writing-reminder / typing-assist behavior used by other office text areas.
- Removed the restrictive `maxLength={700}` cap from the summary editor so an existing long generated summary does not block further edits.
- Moved Cancel and Save into a visible fixed footer inside the summary card, outside the textarea's scroll region. The text can scroll independently while the actions stay visible.
- Follow-up footer visibility fix: the assisted textarea no longer carries its own `min-h-[420px]`, because that consumed the card height and pushed the fixed footer below the visible area. The summary card stays tall, while the editable text area now flexes above the always-visible footer.
- Follow-up input-height fix: the assisted editor wrapper is now a flex column and the textarea is `flex-1`, so the bordered input box stretches down toward the fixed Cancel/Save footer instead of leaving a large awkward blank gap.
- Preserved the generated-reply-like popover height, no-blur/no-dim/no-blank-side-surface behavior, header bell anchoring, Focus Plan switching, and all contact-continuity actions. No `/api/generate`, backend, IPC, prompt, storage, or translation-key behavior changed.
- Updated `verify:contact-continuity` to protect the assisted editor, fixed action footer, footer-space reservation, textarea stretch behavior, tall popover/editor size, and absence of the old 700-character cap.

Files touched:

- `apps/web/src/components/workbench/RememberedContextDock.tsx`
- `apps/web/scripts/verify-contact-continuity.mjs`
- `.codex/CHANGELOG.md`
- `.codex/HANDOFF.md`
- `.codex/FEATURE_GUARDS.md`
- `plans/codex-current-plan.md`
- `projects/active-features.md`
- `references/SHARED_CONTEXT.json`
- `AGENT_STATUS.md`

Verification:

- `npm run verify:contact-continuity --workspace=apps/web` — passed.
- `npm run verify:focus-plan --workspace=apps/web` — passed (`node --experimental-strip-types` warning only).
- `npm run build --workspace=apps/web` — passed; includes `verify:contact-selection`; pre-existing >500 kB bundle warning unchanged.

### Remembered Context Height Match — Generated Reply Scale

- Increased the remembered-context popover height so the "Needs reply / Thread summary · Based on N messages" screen feels closer to the generated-reply modal height instead of a cramped half panel.
- Added `POPOVER_MIN_HEIGHT = 640` with viewport clamping, so the right-side anchored popover stays tall when space allows but still fits smaller/zoomed viewports.
- Made the thread-summary card fill the available popover height in both read and edit modes. Read mode now scrolls inside a tall summary panel; edit mode now uses a much taller textarea (`rows={14}`, `min-h-[420px]`, internal scroll) so long thread text is easier to review and edit.
- Preserved the previous no-blur/no-dim/no-blank-side-surface behavior, header bell anchoring, Focus Plan switching, and all contact-continuity actions. No `/api/generate`, backend, IPC, prompt, storage, or translation-key behavior changed.
- Updated `verify:contact-continuity` to protect the taller popover/editor height instead of the older `min-h-[168px]` threshold.

Files touched:

- `apps/web/src/components/workbench/RememberedContextDock.tsx`
- `apps/web/scripts/verify-contact-continuity.mjs`
- `.codex/CHANGELOG.md`
- `.codex/HANDOFF.md`
- `.codex/FEATURE_GUARDS.md`
- `plans/codex-current-plan.md`
- `references/SHARED_CONTEXT.json`
- `AGENT_STATUS.md`

Verification:

- `npm run verify:contact-continuity --workspace=apps/web` — passed after updating the invariant to the new 640/420 height contract.
- `npm run verify:focus-plan --workspace=apps/web` — passed (`node --experimental-strip-types` warning only).
- `npm run build --workspace=apps/web` — passed; includes `verify:contact-selection`; pre-existing >500 kB bundle warning unchanged.

## 2026-06-08

### Remembered Context Right-Side Popover Fix — No Blur, Header Bell

- Moved the remembered-context bell out of the left edge of the FloatingAssistant and into the top workbench header action cluster next to the amber Focus Plan icon. The header action icons now sit in a compact partially overlapping row between the language and text-type controls, and tapping one closes the other so the surfaces switch cleanly.
- Reworked `RememberedContextDock` into a controlled right-side icon-anchored popover using the same placement model as Focus Plan: it measures `[data-remembered-context-anchor]`, renders through a transparent fixed click-away wrapper, points a notch at the bell icon, participates in the normal expanded Electron panel path, and does not add a blur/dim layer or dull blank in-panel surface.
- Removed the old left-edge trigger and the in-panel `backdrop-blur` stack overlay. The auto-dismiss peek toast remains overlay-only and still yields to `composeCoachSuppressed`.
- Enlarged the thread-summary edit mode (`rows={7}`, `min-h-[168px]`, internal textarea scroll) so editing no longer feels like a tiny cramped screen.
- Preserved local-first contact continuity logic and actions: reply/follow-up still routes to the composer via `onActNow`, mark-done still calls `dismissCommitment`, summary save still calls `updateThreadSummary`, and reply-learning cards remain read-only. No `/api/generate`, backend route, Electron child-screen IPC, localStorage schema, prompt, or translation-key change.
- Updated contact-continuity and focus-plan verifiers so future changes protect the new header anchor, no-left-edge trigger, no remembered-context blur, expanded side-popover shell, and larger summary editor.

Files touched:

- `apps/web/src/components/FloatingAssistant.tsx`
- `apps/web/src/components/floating-assistant/state/useUiOverlayState.ts`
- `apps/web/src/components/workbench/WorkbenchHeader.tsx`
- `apps/web/src/components/workbench/RememberedContextDock.tsx`
- `apps/web/scripts/verify-contact-continuity.mjs`
- `apps/web/scripts/verify-focus-plan.ts`
- `.codex/CHANGELOG.md`
- `.codex/HANDOFF.md`
- `.codex/DEVELOPMENT_PLAN.md`
- `.codex/FEATURE_GUARDS.md`
- `plans/codex-current-plan.md`
- `plans/claude-code-current-plan.md`
- `projects/active-features.md`
- `references/SHARED_CONTEXT.json`

Verification:

- `npm run verify:contact-continuity --workspace=apps/web` — passed.
- `npm run verify:focus-plan --workspace=apps/web` — passed (`node --experimental-strip-types` warning only).
- `npm run build --workspace=apps/web` — passed; includes `verify:contact-selection`; pre-existing >500 kB bundle warning unchanged.
- `npm run electron:build` — passed; includes `verify:child-window-layout`.
- `npm run agents:validate` — passed.
- `npm run agents:status` — passed; regenerated `AGENT_STATUS.md` from `references/SHARED_CONTEXT.json`.

### Focus Plan Visual Regression Fix — No Blur, No Blank Right-Side Area

- Fixed the Focus Plan / amber alert popover presentation so opening it no longer blurs or dims the workbench and no longer shows a dull app-colored side area behind the card.
- Final screenshot-driven behavior: Focus Plan uses the normal expanded 574px Electron panel path (`isMoreFeaturesOpen || activeMiniScreen !== null || isActionCenterOpen`) so the popover can sit toward the right with its notch pointing at the amber icon, matching the placement seen while More Features is open. The expanded area is transparent instead of app-colored (`body { background: transparent; }` and Electron `transparent: true` / transparent `backgroundColor`), so the card floats over the desktop rather than over a blank grey/white side panel. More Features and mini-screen behavior remain unchanged.
- Overflow hardening: `FocusPlanModal` now caps its card height to the visible viewport and scrolls the task body internally (`clean-scrollbar ... overflow-y-auto`) so any future extra tasks or longer EN/ZH copy cannot push the card off-screen, resize the anchored shell, or create a second page-like surface behind it.
- Child-screen routing fix: Today Queue `open-screen` actions triggered from Focus Plan now call `openMiniScreen(action.screenId)` instead of `setActiveMiniScreen(action.screenId)`. In Electron this routes through `desktopApp.openChildScreen(...)`, matching More Features child screens, so Business Context / Snippet Library / Messages open as the original draggable detached child windows instead of a duplicated inline mini-screen stacked over the FloatingAssistant.
- Kept planner logic, item ranking, action routing, handled-item state, copy, storage, backend routes, and `/api/generate` contracts unchanged.
- Removed the stale optional width from the renderer desktop IPC type so `setPanelOpen` is consistently treated as `(open: boolean)` across renderer typings, preload, and Electron main behavior.
- Updated Focus Plan guards and Codex workflow guidance so future Codex/Claude work does not reintroduce `backdrop-blur`, dim overlays, `FOCUS_PLAN_WIDTH`, or `setPanelOpen(open, width)` for this popover.

Files touched:

- `apps/web/src/global.d.ts`
- `apps/web/src/components/FloatingAssistant.tsx`
- `apps/web/src/components/command-center/FocusPlanModal.tsx`
- `apps/web/src/index.css`
- `electron/main.ts`
- `apps/web/scripts/verify-focus-plan.ts`
- `.codex/FEATURE_GUARDS.md`
- `.agents/skills/reply-assistant-workbench/SKILL.md`
- `.codex/HANDOFF.md`
- `.codex/DEVELOPMENT_PLAN.md`
- `projects/active-features.md`
- `plans/claude-code-current-plan.md`
- `references/SHARED_CONTEXT.json`
- `AGENT_STATUS.md`

Verification:

- `node -e "JSON.parse(require('fs').readFileSync('references/SHARED_CONTEXT.json','utf8')); console.log('json ok')"` — passed.
- `npm run verify:focus-plan --workspace=apps/web` — passed (`node --experimental-strip-types` warning only). It now protects right-side expanded placement, transparent background, matched EN/ZH Focus Plan keys, internal-scroll overflow, and detached child-window routing for Focus Plan/Today Queue open-screen actions.
- `npm run verify:next-step --workspace=apps/web` — passed.
- `npm run build --workspace=apps/web` — passed; includes `verify:contact-selection`; pre-existing >500 kB bundle warning unchanged.
- `npm run electron:build` — passed; includes `verify:child-window-layout`.
- `npm run agents:validate` — passed.
- `npm run agents:status` — passed; regenerated `AGENT_STATUS.md` from `references/SHARED_CONTEXT.json`.

### Focus Plan Overlay — Office Work Buddy Without Main-Screen Clutter

- Added an industry-neutral Focus Plan overlay that turns existing app signals into a short ordered plan: start here, next, later. It does **not** add a new permanent block to the main workbench and does **not** add a chatbot prompt surface.
- The plan is derived from existing local-first signals only: pending background drafts, Action Inbox, upload review, contacts needing reply, selected-contact missing detail, follow-ups/open loops, and Today Queue tasks. It caps visible work at three items and dedupes same-contact work so the user is not shown duplicated actions.
- Replaced the large inline Action Center overlay in `FloatingAssistant.tsx` with a focused `FocusPlanModal` component. The existing compact header action button now opens the plan with the label "Open plan"; clear-state remains accessible but does not show a pending-work badge.
- Added EN/ZH Focus Plan copy with non-technical wording: where, when, start here, next, later, draft review, composer, contact memory, Today Queue, and clear-state actions.
- Added `verify:focus-plan` to lock planner ranking, dedupe, clear state, modal wiring, header label support, old stat-grid removal, and EN/ZH copy.
- Renderer-only; no `/api/generate` shape change, backend route, Electron IPC, prompt, schema, cloud storage, or localStorage store change.

Files touched:

- `apps/web/src/components/command-center/focusPlan.ts` — new pure planner.
- `apps/web/src/components/command-center/FocusPlanModal.tsx` — new compact overlay.
- `apps/web/src/components/FloatingAssistant.tsx` — derives Focus Plan items, routes item actions through existing handlers, replaces inline Action Center overlay.
- `apps/web/src/components/workbench/WorkbenchHeader.tsx` — optional action label for the plan button.
- `apps/web/src/i18n/translations.ts` — EN/ZH `focusPlan` copy.
- `apps/web/scripts/verify-focus-plan.ts` and `apps/web/package.json` — new verifier.
- `.agents/skills/reply-assistant-workbench/SKILL.md` and `.agents/skills/reply-assistant-verification/SKILL.md` — Codex pickup guidance for the new Focus Plan surface.

Verification:

- `npm run verify:focus-plan --workspace=apps/web` — passed (`node --experimental-strip-types` warning only).
- `npm run verify:next-step --workspace=apps/web` — passed.
- `npm run verify:contact-continuity --workspace=apps/web` — passed.
- `npm run verify:smart-reply --workspace=apps/web` — passed.
- `npm run build --workspace=apps/web` — passed; pre-existing >500 kB bundle warning unchanged.
- Skipped: full root build and `npm run electron:build` — renderer-only command-center/workbench change, no backend contract or Electron surface touched.

### Focus Plan Coordination Alignment

- Audited Codex skills, Codex plans, and shared Codex/Claude master files after the Focus Plan implementation.
- `plans/claude-code-current-plan.md` now includes a cross-harness latest-app-work note so Claude Code sees Codex's Focus Plan surface, invariants, and `verify:focus-plan` requirement without treating it as Claude's own last-completed task.
- `references/SHARED_CONTEXT.json`, `.codex/DEVELOPMENT_PLAN.md`, `.codex/FEATURE_GUARDS.md`, and `projects/next-priorities.md` were tightened to use broader business-communication / office-worker positioning rather than over-narrow current-priority wording.
- Coordination-only; no runtime app behavior changed.

Verification:

- `node -e "JSON.parse(require('fs').readFileSync('references/SHARED_CONTEXT.json','utf8')); console.log('json ok')"` — passed.
- `npm run agents:validate` — passed.
- `npm run agents:status` — passed; regenerated `AGENT_STATUS.md` from `references/SHARED_CONTEXT.json`.

### Codex/Master Alignment After FloatingAssistant TARGET Row Fix

- Audited Claude Code's reported `FloatingAssistant.tsx` TARGET-row change against the active source. The runtime structure matches the described half-lane scroll contract: External uses the left clipped lane with fade gradients, active scroll ref/handler, a no-wrap max-content chip track, and no-shrink chips; Internal uses the right clipped no-wrap lane with right alignment.
- Updated Codex-facing planning and skill guidance so future Codex sessions do not confuse the active `FloatingAssistant.tsx` row with the inactive `ComposerPanel.tsx` reference implementation. The older "do not revert to `grid-cols-2`" warning is now scoped to the inactive `ComposerPanel.tsx` inline-grid implementation; the active `FloatingAssistant.tsx` `grid grid-cols-2` structure is documented as intentional because each rendered lane also has `min-w-0 overflow-hidden`.
- Synced the shared status source so `AGENT_STATUS.md` regeneration will keep Claude Code's latest completed work as the `FloatingAssistant.tsx` TARGET-row fix rather than the earlier remembered-context bell work.
- Fixed one stale master-feature line that still described the removed in-flow `ContactMemoryCue`; `projects/active-features.md` now names the active overlay-only `RememberedContextDock`.
- Coordination-only; no runtime app behavior, API contract, copy, route, IPC, prompt, or schema changed.

Files touched:

- `.agents/skills/reply-assistant-workbench/SKILL.md`
- `.agents/skills/reply-assistant-verification/SKILL.md`
- `.codex/CHANGELOG.md`
- `.codex/HANDOFF.md`
- `.codex/DEVELOPMENT_PLAN.md`
- `.codex/FEATURE_GUARDS.md`
- `AGENT_STATUS.md`
- `plans/codex-current-plan.md`
- `plans/claude-code-current-plan.md`
- `projects/active-features.md`
- `references/SHARED_CONTEXT.json`

Verification:

- `node -e "JSON.parse(require('fs').readFileSync('references/SHARED_CONTEXT.json','utf8')); console.log('json ok')"` — passed.
- `npm run agents:validate` — passed.
- `npm run agents:status` — passed; regenerated `AGENT_STATUS.md` from `references/SHARED_CONTEXT.json`.
- `npm run agents:validate` — passed after final handoff/plan wording edits.
- Skipped app runtime verification — coordination/planning-only change after auditing the already-updated renderer source.

## 2026-06-07

### Guided Work Buddy v2 — One Best Move Reasons And Micro-Asks

- Added a pure command-center recommendation model so the workbench decides one best next move without growing `FloatingAssistant.tsx` with more priority branching.
- New recommendation precedence: pending draft, Action Inbox item, upload needing review, contact needing reply, selected contact missing context, selected contact follow-up, active contact, add-contact / clear fallback.
- Daily Brief now carries a short "Why" reason line for the recommendation, including draft ready, action inbox, latest unanswered inbound, missing detail, follow-up due, upload review, selected client, empty foundation, and clear-for-now states.
- Added a compact missing-context micro-ask: only when the selected contact needs detail and the composer is empty, the card asks for one small next input and focuses the composer instead of sending the user to a broad contact-management screen.
- Added upload-review recommendation routing. Low-confidence / needs-review attachments can become the best move; composer uploads focus the composer, business uploads open Business Context, and contact uploads open Contacts with the relevant contact selected.
- Added a clear-for-now fallback for workbenches with contacts but no current client action, keeping the app calm instead of pushing another generic add-contact prompt.
- Rendered the same reason / micro-ask in both Daily Brief surfaces so the main card and Action Center copy do not drift.
- Extended local work-rhythm CTA event sources for `review-file`, `add-detail`, `follow-up`, and `clear`.
- Added EN + ZH copy for the new reasons, attachment review recommendation, missing-context micro-ask, and clear-for-now state.
- Renderer-only; no `/api/generate` shape change, no backend route change, no Electron IPC change.

Files touched:

- `apps/web/src/components/command-center/workbenchRecommendation.ts` — new pure recommendation builder and upload-review detector.
- `apps/web/src/components/command-center/useCommandCenterPrimary.ts` — consumes recommendation result and builds outcome-led Daily Brief actions.
- `apps/web/src/components/command-center/DailyBriefCard.tsx` — renders optional reason and micro-ask.
- `apps/web/src/components/FloatingAssistant.tsx` — wires review upload / micro-ask handlers and mirrors reason/micro-ask in Action Center.
- `apps/web/src/components/smart-suggestions/workRhythmStore.ts` — extends Daily Brief CTA event source union.
- `apps/web/src/i18n/translations.ts` — EN + ZH copy.

Verification:

- `npm run verify:next-step --workspace=apps/web` — passed.
- `npm run verify:smart-reply --workspace=apps/web` — passed.
- `npm run verify:contact-continuity --workspace=apps/web` — passed.
- `npm run verify:contact-selection --workspace=apps/web` — passed.
- `npm run build --workspace=apps/web` — passed; pre-existing >500 kB bundle warning unchanged.
- `npm run verify:quality-guard --workspace=apps/web` — first failed in sandbox with DNS `ENOTFOUND registry.npmmirror.com` while fetching `tsx`; rerun with approved network escalation passed.
- `npm run verify:smart-suggestions --workspace=apps/web` — first failed in sandbox with DNS `ENOTFOUND registry.npmmirror.com` while fetching `tsx`; rerun with approved network escalation passed.
- Skipped: full `npm run build`, `npm run electron:build` — renderer-only command-center/workbench change, no API contract / Electron IPC touched.

### Codex Skill Pickup Alignment After Claude Workbench Changes

- Updated Codex-side skill guidance so future Codex sessions pick up Claude Code's latest shipped workbench changes without re-deriving or accidentally weakening fragile UI contracts.
- `.agents/skills/reply-assistant-workbench/SKILL.md` now explicitly covers compose coach and the target recipient chip row. It names the relevant source files (`ComposerPanel.tsx`, `ContactMemoryCue.tsx`, `ComposeCoachStrip.tsx`) and points future edits at the Workbench Guards before touching the load-bearing inline recipient-row layout or compose-coach toast animation/positioning.
- `.agents/skills/reply-assistant-verification/SKILL.md` now maps target recipient row changes to `verify:contact-selection` + web build, and compose-coach toast / composer placement changes to `verify:compose-coach` + web build.
- `.agents/skills/reply-assistant-generation-contract/SKILL.md` now points upload/OCR and attachment-context work at `.codex/UPLOADS_PLAN.md` and repeats the attachment guardrails: summaries only in generation, no raw binaries in localStorage, no fake OCR, honest provider status, and visible uncertainty for low-confidence extraction.
- `.codex/HANDOFF.md` now records this Codex pickup alignment pass before the latest runtime app work, so the next Codex session sees the skill update and the app state together.
- No app runtime code, prompt, schema, API contract, or product invariant changed. Existing shipped invariants remain documented in this changelog and `.codex/FEATURE_GUARDS.md`; shipped capabilities remain listed in `.codex/DEVELOPMENT_PLAN.md` Current Foundation.

Files touched:

- `.agents/skills/reply-assistant-workbench/SKILL.md`
- `.agents/skills/reply-assistant-verification/SKILL.md`
- `.agents/skills/reply-assistant-generation-contract/SKILL.md`
- `.codex/HANDOFF.md`
- `.codex/CHANGELOG.md`

Verification:

- `npm run agents:validate` — passed.
- Skipped app runtime verification — guidance/planning-only change; no runtime code, prompt, schema, or API contract changed.

### Planning Hygiene Pass — Codex Pickup Readiness

- Comprehensive audit of all planning files at user request ("ensure that all claude code's skills, plan and the master files have been fully updated so that codex can pick up easily without truncating, recreating or breaking any feature that has been created already").
- `.codex/HANDOFF.md` — date header bumped from 2026-06-06 to 2026-06-07; "Verification Status" section restructured to record all four 2026-06-07 verification passes (target recipient chip row hardened, target recipient chip row first attempt, compose-coach toast final iteration, compose-coach intermediate iterations) in chronological order. No history truncated.
- `.codex/DEVELOPMENT_PLAN.md` — date header bumped to 2026-06-07. "Current Foundation" already carried both new shipped items (compose coach toast, target recipient chip row); no rewording needed.
- `.codex/FEATURE_GUARDS.md` — date header bumped to 2026-06-07. Both new Workbench invariants (compose-coach toast contract, target recipient chip row inline-grid contract) were already in place from earlier in the day; no shipped invariants removed.
- `plans/claude-code-current-plan.md` — "Last Completed" section rewritten to reflect the **bulletproof inline-style** version of the recipient row (previously still mentioned the superseded `grid grid-cols-2` + `flex-none whitespace-nowrap` + `w-max` approach). Compose-coach toast paragraph promoted to reference the final bright-white iteration explicitly. Intermediate dark-slate and warm-pearl iterations called out as superseded.
- `plans/codex-current-plan.md` — date header bumped to 2026-06-07; Current Task updated to "No active Codex task is recorded" (master coordination work is done); Next Steps expanded with a pickup checklist; Notes expanded with explicit pointers to `.codex/CHANGELOG.md`, `.codex/HANDOFF.md`, `.codex/DEVELOPMENT_PLAN.md`, `.codex/FEATURE_GUARDS.md` and named guards Codex must respect (do not revert recipient row to `grid-cols-2`, do not weaken compose-coach animation thresholds, do not remove the `key={activeWarning.id}` remount pattern).
- Confirmed no agent/skill file (`.claude/agents/*.md`, `.claude/skills/*/SKILL.md`, `agents/*.toml`, `.agents/skills/*/SKILL.md`) carries stale references to specific component layouts — they remain pure process guidance, exactly as the master-coordination model intends. No edits needed.
- Confirmed every agent and skill file references the master coordination tokens (validator already enforces this).

Files touched:

- `.codex/HANDOFF.md` — date + Verification Status restructure (append-only).
- `.codex/DEVELOPMENT_PLAN.md` — date header.
- `.codex/FEATURE_GUARDS.md` — date header.
- `plans/claude-code-current-plan.md` — "Last Completed" rewritten to reflect the bulletproof inline-style recipient row.
- `plans/codex-current-plan.md` — date + Current Task + Next Steps + Notes (pickup checklist for Codex).
- `.codex/CHANGELOG.md` — this entry.

Verification:

- `npm run agents:validate` — passed.
- `npm run verify:contact-selection --workspace=apps/web` — passed.
- `npm run verify:compose-coach --workspace=apps/web` — passed.
- `npm run build --workspace=apps/web` — passed (pre-existing >500 kB main chunk warning unchanged).
- JSON validation: `references/SHARED_CONTEXT.json` parses cleanly.

No code, prompt, schema, contract, or invariant changed in this pass — purely planning-file hygiene to prevent Codex from re-deriving today's context from scratch or accidentally reverting one of the new invariants.

### Target Recipient Chip Row — Bulletproof Single-Row Horizontal Scroll

- User reported the previous `grid grid-cols-2` fix still showed chips wrapping into two rows on External. Root cause: `grid-cols-2` resolves to `repeat(2, 1fr)` which is `minmax(auto, 1fr)` — the `auto` minimum lets a column grow with its content, so the lane wasn't actually pinned at half-width. Combined with possible Tailwind purging quirks on the newly-added `w-max` utility, the wrap reappeared.
- Hardened the layout so wrapping is impossible regardless of Tailwind version, HMR cache state, or content width:
  - Grid template set via inline style `gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)'` — columns are now strictly capped at half-width and will not grow with their content.
  - Lane gets `overflow-hidden` as a hard clip boundary (then the inner `overflow-x-auto` provides the actual scroll); inline `gridColumnStart: 1 | 2` based on `workMode` removes any reliance on `col-start-*` class generation.
  - Chip track is now `flex flex-nowrap items-center` with `width: 'max-content'` via inline style — guarantees the track is exactly content-wide and never wraps regardless of which Tailwind utilities ship.
  - Chips are `shrink-0 whitespace-nowrap` so they cannot be compressed and text cannot break.
- Behavior: External (`workMode === 'reply'`) shows chips in the left lane only; Internal (`workMode === 'internal'`) shows them in the right lane only. At rest, only one or two chips are visible; the user scrolls horizontally inside the lane to reveal the rest. No wrap; no spill across the centerline; symmetric for both modes.

Files touched:

- `apps/web/src/components/workbench/ComposerPanel.tsx` — recipient row hardened with inline `gridTemplateColumns`, inline `gridColumnStart`, `overflow-hidden` on the lane, `flex flex-nowrap`, inline `width: 'max-content'`, and `shrink-0 whitespace-nowrap` chips.

Verification:

- `npm run verify:contact-selection --workspace=apps/web` — passed.
- `npm run build --workspace=apps/web` — passed (pre-existing >500 kB main chunk warning unchanged).
- Skipped: `npm run build` (full root build), `npm run electron:build`, `verify:child-window-layout` — single-component renderer change.

Operator note: if the chips still appear wrapped after pulling, restart `npm run dev` / `npm run desktop:dev` and hard-refresh — JSX structural changes like grid template rewrites sometimes need a fresh module load.

### Target Recipient Chip Row — Half-Width Scroll Aligned To Active Mode

- Constrained the recipient chip row to a half-width horizontally-scrollable lane that mirrors the active mode button above. The row was previously a full-width flex scroller, which made the External set (New Lead / Existing Client / VIP Client / Others) drift visually under the Internal button and (because of intrinsic widths) appear to wrap. User feedback: "they're not good to look at — I don't want to see all the four buttons appearing."
- New structure: the recipient row is now `grid grid-cols-2 gap-1` and the scroll panel lives in `col-start-1` when External (`workMode === 'reply'`) is active and `col-start-2` when Internal (`workMode === 'internal'`) is active. Each lane is exactly half the parent width — so chips never spill past the centerline of the mode toggle.
- Chips themselves are now `flex-none whitespace-nowrap`, sitting inside a `flex w-max items-center pr-5` track. With `overflow-x-auto` on the lane and `w-max` on the track, the row is **always a single line that scrolls horizontally** — never wraps, never bleeds into the other half.
- Left/right fade gradients narrowed from `w-6` → `w-5` to match the tighter lane and keep the active-chip pill from being clipped.
- Anti-clutter: only one or two chips are visible at a time; the user scrolls inside the half-lane to reveal the rest. Matches the calm, professional feel of the workbench and is symmetric for both modes.

Files touched:

- `apps/web/src/components/workbench/ComposerPanel.tsx` — recipient row restructured from a single full-width scroller into a `grid grid-cols-2` with a mode-driven `col-start` and `flex-none whitespace-nowrap` chips on a `w-max` track.

Verification:

- `npm run verify:contact-selection --workspace=apps/web` — passed.
- `npm run build --workspace=apps/web` — passed (pre-existing >500 kB main chunk warning unchanged).
- Skipped: `npm run build` (full root build), `npm run electron:build`, `verify:child-window-layout` — renderer-only chip layout change, no API contract / Electron IPC / detached-window surface touched.

### Compose Coach Toast — Bright White Surface, Unmissable Pop-In, Raised To Center-Lower

- Pushed visibility further per repeated user feedback that the previous pearl version still read as dark. Surface is now pure `bg-white` with a crisp `border-amber-200` edge and a soft amber-tinted lift shadow (`0_20px_44px_-10px_rgba(218,143,73,0.32),0_2px_8px_rgba(31,24,18,0.08)`). No backdrop-blur (it muted the white). Text is `#1f1812` with `font-medium` for strong readability; eyebrow is `text-amber-700`; the alert glyph is a filled `bg-amber-400` chip with white `!` and its own tiny amber drop shadow. Fix button is an amber-50 pill with amber-300 border and amber-800 text. Close (×) is slate-400 with a slate-100 hover.
- Animation made unmissable: duration `480ms`, scale `0.55 → 1`, translateY `16px → 0`, opacity `0 → 1`, easing `cubic-bezier(0.34, 1.56, 0.64, 1)` for a pronounced bounce overshoot. Added `key={activeWarning.id}` on the inner toast div so React **remounts** on every new warning id — guarantees a fresh entry animation even when one warning replaces another while the toast is already visible. The existing double-`requestAnimationFrame` prime still runs on initial mount so the collapsed state is committed before the transition.
- Position raised from `bottom-[3.5rem]` to `bottom-[5rem]` so the toast sits slightly below the vertical center of the composer (≈62% from top in a 204px box). Top of the textarea stays fully visible; the toast still has a clear gap above the ⌘↵ / Generate action row.
- Padding bumped to `py-2` so the toast has presence without crowding.
- Anti-clutter contract unchanged (one warning at a time, dismissible, dismissed ids auto-reset, `suppressed` short-circuits).

Files touched:

- `apps/web/src/components/quality-guard/ComposeCoachStrip.tsx` — bright-white surface, amber accents, larger pop-in animation, `key` for guaranteed remount on warning-id change, `bottom-[5rem]` position.

Verification:

- `npm run verify:compose-coach --workspace=apps/web` — passed.
- `npm run build --workspace=apps/web` — passed (pre-existing >500 kB main chunk warning unchanged).
- Skipped: `npm run build` (full root build), `npm run electron:build`, `verify:child-window-layout` — renderer-only iteration on one component.

Operator note: if the change does not appear after pulling, restart `npm run dev` / `npm run desktop:dev` — the previous dark-slate visual was cached by an older Vite session for at least one user.

### Compose Coach Toast — Lighter Surface, Visible Animation, Lowered Position

- Iterated on the toast after user feedback: previous dark slate surface read as "too dark", entry animation was imperceptible (260ms / scale 0.92), and top-of-box position covered the user's earliest typed text.
- Surface is now a light warm pearl: `linear-gradient(180deg,rgba(255,253,251,0.97),rgba(244,238,234,0.96))` with `border-[#dcd1cb]`, `backdrop-blur-[10px]`, and a two-stop warm shadow (`0_18px_38px_-10px_rgba(58,40,32,0.30),0_2px_6px_rgba(58,40,32,0.10)`). Text is `#3a2f2c` (deep warm slate) for strong contrast; eyebrow is `#8a6f64`; amber `!` chip uses `bg-amber-100 text-amber-700 ring-amber-200/70` for a clear, calm alert glyph. The Fix button is a white pill with a warm border + dark warm text; the close (×) is `#9b8479` with a soft `#efe7e1` hover.
- Animation is now clearly visible: duration `360ms`, entry scale `0.82 → 1`, translateY `8px → 0`, opacity `0 → 1`, easing `cubic-bezier(0.34, 1.4, 0.64, 1)` for a gentle confident overshoot. The entry-flip now uses a **double `requestAnimationFrame`** so the collapsed state is committed and painted before the transition runs — fixes the "no animation visible" symptom where browsers skipped the transition on first mount.
- Position lowered toward the bottom of the box: `absolute inset-x-0 bottom-[3.5rem] z-30 flex justify-center px-3`. The toast now floats just above the ⌘↵ / Generate row, leaving the top of the textarea fully visible. Still anchored to the composer's `relative` inner box so it can never collide with the action row (`bottom-3 right-3 z-10`) or the attach (+) strip (`bottom-3 left-3 right-[6.7rem] z-20`).
- Exit duration nudged from 200ms → 220ms to match the more leisurely entry.
- Anti-clutter contract unchanged: one warning at a time, dismissible, dismissed ids reset when the underlying warning leaves the active set, `suppressed` still short-circuits.

Files touched:

- `apps/web/src/components/quality-guard/ComposeCoachStrip.tsx` — surface colors, animation params, double-RAF entry, position from top → bottom-[3.5rem].

Verification:

- `npm run verify:compose-coach --workspace=apps/web` — passed.
- `npm run build --workspace=apps/web` — passed (pre-existing >500 kB main chunk warning unchanged).
- Skipped: `npm run build` (full root build), `npm run electron:build`, `verify:child-window-layout` — renderer-only iteration on one component.

### Compose Coach Redesign — Dismissible Zoom-In Toast Over The Composer

- Replaced the basic block-level `ComposeCoachStrip` with a dull-grey contrast toast that floats over the top edge of the composer's fixed-height inner box. Visual treatment: gradient `rgba(74,71,78,0.94)` → `rgba(54,51,58,0.94)` background, 1px white/8% border, `backdrop-blur-[10px]`, soft `0_14px_34px_rgba(15,23,42,0.32)` shadow, white text at 92% opacity, small amber `!` glyph for the alert role. **Superseded same day by the lighter pearl surface above per user feedback.**
- Anti-clutter: shows **one** warning at a time (the first non-dismissed warning), never a stacked list. Compact single-row pill — no headers, no icons, no decorative chrome.
- Animated zoom-in entry (`scale 0.92 → 1`, `opacity 0 → 1`, `translateY -4px → 0`, 260ms ease-out) using a three-phase state machine (`entering` → `visible`), with a symmetric 200ms exit on dismiss before the warning id is permanently added to the dismissed set.
- Close (×) button lets the user acknowledge and clear the toast. Dismissed ids reset automatically when the underlying warning leaves the active set (`useEffect` syncs `dismissedIds` against the live `warnings` list), so a freshly re-triggered warning can show again.
- Positioning: `absolute inset-x-0 top-0 z-30 flex justify-center px-3 pt-2.5` inside the composer's `relative` inner box. The toast sits over the top edge of the input area — anchored to the box, never overlapping the `+` attach button (`absolute bottom-3 left-3 right-[6.7rem] z-20`) or the ⌘↵ / Generate row (`absolute bottom-3 right-3 z-10`).
- Suppression invariant preserved: `suppressed` still short-circuits to `null` so heavier surfaces (modals, guidance ring, guided tour) own the user's attention.
- Added `coach.dismiss` translation key in the type interface plus EN ("Dismiss") and ZH ("知道了").

Files touched:

- `apps/web/src/components/quality-guard/ComposeCoachStrip.tsx` — full rewrite as dismissible zoom-in toast with local `dismissedIds` + entry/exit animation phases.
- `apps/web/src/components/workbench/ComposerPanel.tsx` — `<ComposeCoachStrip>` placed inside the composer's `relative` inner box (anchor for the absolute toast), still rendered after the Generate row so it layers cleanly on top.
- `apps/web/src/i18n/translations.ts` — `coach.dismiss` added to type, EN, and ZH.

Verification:

- `npm run verify:compose-coach --workspace=apps/web` — passed.
- `npm run build --workspace=apps/web` — passed (includes `verify:contact-selection`; pre-existing >500 kB main chunk warning unchanged).
- Skipped: `npm run build` (full root build), `npm run electron:build`, `verify:child-window-layout` — renderer-only change, no API contract / Electron IPC / detached-window surface touched.

### Compose Coach Strip Position Fix (No More Overlap With Attach + Generate)

- Fixed a UI regression where the `ComposeCoachStrip` amber warning ("COACH: Add a clear ask or next step before sending.") rendered inside the fixed-height composer box and visually overlapped the absolutely-positioned attach (+) button on the left and the ⌘↵ / Generate row on the right. The composer container has `h-[176px] p-2.5 pb-[4.1rem]` (compact) / `h-[204px] p-3 pb-[4.75rem]`, so any block-level child placed in document flow collides with the absolute-positioned action row in the bottom padding zone.
- Moved `<ComposeCoachStrip>` out of the composer's fixed-height inner box and rendered it as a sibling below the box, still inside the outer `mt-2 flex flex-none flex-col … pb-4` wrapper. The strip keeps its own `mt-2` margin so it sits as a calm note below the composer with clean breathing room. The attach (+) button and Generate row are no longer occluded.
- No visual change when there are no warnings — `ComposeCoachStrip` already returns `null` when `warnings.length === 0` or `suppressed`. No prop changes; no other components touched.
- Renderer-only change. No `/api/generate` payload change, no Electron IPC change.

Files touched:

- `apps/web/src/components/workbench/ComposerPanel.tsx` — relocated `<ComposeCoachStrip>` from inside the composer box (between `<ComposerAttachmentStrip>` and the Generate action row) to a sibling beneath the composer box, inside the existing flex-col wrapper.

Verification:

- `npm run verify:compose-coach --workspace=apps/web` — passed.
- `npm run verify:next-step --workspace=apps/web` — passed.
- `npm run verify:smart-reply --workspace=apps/web` — passed.
- `npm run build --workspace=apps/web` — passed (includes `verify:contact-selection`; pre-existing >500 kB main chunk warning unchanged, already tracked under bundle-hygiene near-term work).
- Skipped: `npm run build` (full root build), `npm run electron:build`, `verify:child-window-layout` — change is renderer-only, no API contract / Electron IPC / detached-window surface touched.

## 2026-06-06

### Continuity Presentation On Main Workbench (Multi-Line + Expand)

- Expanded `ContactMemoryCue` on the main workbench from a single line to a multi-line + expandable review surface. Collapsed view shows top commitment + top summary/learning with a count chip and a "Based on N messages" freshness footer. Expanded view groups all open commitments (each with a done× dismiss action), the thread summary (with inline ✎ edit), and reply-learning signals — all compact and local-first.
- Added two thread mutators in `apps/web/src/config/contactThreads.ts`: `dismissContactCommitment(thread, sourceMessageId)` and `updateContactThreadSummary(thread, text)`. Both refresh through `refreshContactContinuity` and persist via the existing `saveContactThreads` path.
- Hardened auto-refresh so user edits and dismissals survive incoming messages:
  - Added `ContactThreadSummary.locked?: boolean` — `refreshContactContinuity` preserves a locked summary's text and only updates `messageCount` / `latestMessageAt`.
  - Added `ContactThread.dismissedCommitmentIds?: string[]` — `refreshContactContinuity` filters commitments whose `sourceMessageId` is in this set.
- Wired `dismissCommitment` and `updateThreadSummary` through `useContactThreads` and into `FloatingAssistant` → `ContactMemoryCue`.
- Added EN + ZH copy for: expand/collapse ARIA, "Based on {{count}} messages", section headings (Open commitments / Thread summary / Reply learning), commitment kind labels (Promise / Needs reply), learning kind labels (Accepted / Edited / Regenerated), Save / Cancel, edit ARIA, done ARIA, summary placeholder. Existing `memoryCueTitle` / `memoryCueCommitment` / `memoryCueLearning` keys preserved (the continuity verify script asserts them).
- Normalizers updated to read `locked` and `dismissedCommitmentIds` from `localStorage` so older stored threads still parse without data loss.

Files touched:

- `apps/web/src/config/contactThreads.ts` — types, normalizers, refresh, new helpers
- `apps/web/src/hooks/useContactThreads.ts` — exposes `dismissCommitment` / `updateThreadSummary`
- `apps/web/src/components/workbench/ContactMemoryCue.tsx` — full rewrite with collapsed + expanded view
- `apps/web/src/components/FloatingAssistant.tsx` — passes the two handlers
- `apps/web/src/i18n/translations.ts` — EN + ZH keys

Verification:

- `npm run verify:contact-continuity --workspace=apps/web` — passed.
- `npm run verify:next-step --workspace=apps/web` — passed.
- `npm run verify:contact-selection --workspace=apps/web` — passed.
- `npm run build --workspace=apps/web` — passed (includes `verify:contact-selection`; pre-existing >500 kB main chunk warning unchanged, already tracked under bundle-hygiene near-term work).
- Skipped: `npm run build` (full root build), `npm run electron:build`, `verify:child-window-layout` — change is renderer-only, no API contract / Electron IPC touched.

## 2026-06-04

### Master Agent Coordination Layer

- Added master coordination files and directories so Codex and Claude Code share one status/workflow layer: `AGENT_STATUS.md`, `INTEGRATION_GUIDE.md`, `docs/*`, `references/*`, `plans/*`, `projects/*`, `templates/*`, and `.agent/*`.
- Added machine-readable shared context in `references/SHARED_CONTEXT.json`.
- Added agent coordination scripts: `scripts/validate-plans.js`, `scripts/generate-status-report.js`, and `scripts/sync-agents.js`.
- Added root npm scripts: `agents:validate`, `agents:status`, and `agents:sync`.
- Updated `AGENTS.md`, `CLAUDE.md`, Codex agent profiles, and Codex skills to read master coordination files first.
- Updated `.codex/DEVELOPMENT_PLAN.md` and `.codex/FEATURE_GUARDS.md` so routine app changes update `.codex/*` plus master files, not `.claude/*`.
- Updated `README.md` with the new agent coordination entry points.

Verification:

- `npm run agents:validate` — passed.
- `npm run agents:status` — regenerated `AGENT_STATUS.md` from `references/SHARED_CONTEXT.json`.
- `npm run agents:validate` — passed after status regeneration.
- `npm run agents:sync` — passed.
- Python TOML validation for `agents/*.toml` and `.codex/config.toml` — passed.
- JSON validation for `package.json`, `references/SHARED_CONTEXT.json`, and `.claude/settings.json` — passed.

### Sales Workbench Simplification And Continuity Memory

- Added local-first contact continuity fields for long-thread summaries, open commitments, and reply outcome learning.
- Wired contact continuity into `buildContactThreadContext`, API request normalization, and backend contact-thread prompt formatting.
- Captured reply outcomes automatically: copied drafts become accepted learning, edited-and-copied drafts become style learning, and rewrite/regenerate actions become weak rejection signals.
- Added compact `ContactMemoryCue` to surface remembered commitments or preferences on the main workbench only when real data exists.
- Reduced main-screen clutter by hiding Quick Start scenarios outside the empty starting state.
- Extracted the More Features menu into `MoreFeaturesMenu` and grouped core client-work surfaces separately from secondary utilities.
- Removed referral nudges from the primary action-center count so growth utilities no longer compete with real work items.
- Added `npm run verify:contact-continuity --workspace=apps/web` and synced Codex/Claude verification guidance.

Verification:

- `npm run verify:smart-reply --workspace=apps/web` — passed.
- `npm run build --workspace=apps/web` — passed, including `verify:contact-selection`.
- `npm run verify:voice-profile-fragment --workspace=apps/api` — passed.
- `npm run verify:cross-language-fragment --workspace=apps/api` — passed.
- `npm run verify:next-step --workspace=apps/web` — passed.
- `npm run verify:quality-guard --workspace=apps/web` — initially failed in sandbox because npm could not resolve `registry.npmmirror.com` for `tsx`; rerun with approved network escalation passed.
- `npm run verify:contact-continuity --workspace=apps/web` — passed.
- `python3` TOML validation for `agents/*.toml` and `.codex/config.toml` — passed.
- `.claude/settings.json` JSON validation — passed.
- `npm run build` — passed, including web build, `verify:contact-selection`, Electron TypeScript build, and `verify:child-window-layout`.

### Codex Agent Foundation

- Added root `AGENTS.md`.
- Added `.codex/` project context and config.
- Added `codex/` pointer directory for discoverability.
- Added reusable agent profiles in `agents/*.toml`.
- Added local skills under `.agents/skills/*/SKILL.md` plus plural `SKILLS.md` pointers.
- Captured app-specific invariants for local-first contact memory, grounded generation, explicit selected-contact behavior, auth safety, and no fake integrations.

Verification:

- Parsed all TOML files successfully with Python `tomllib`.
- No runtime build was needed because the change was guidance-only.

### Codex-Owned Planning Source

- Added `.codex/PROJECT_BRIEF.md`, `.codex/DEVELOPMENT_PLAN.md`, `.codex/FEATURE_GUARDS.md`, `.codex/CHANGELOG.md`, and `.codex/HANDOFF.md`.
- Updated Codex/agent guidance to use `.codex` planning files as the source of truth.
- Added an after-change planning protocol requiring agents to update changelog, handoff, plan, guards, and agent workflows when relevant.
- Added cross-agent collaboration expectations for product, frontend, backend, and verification work.

Verification:

- Confirmed Codex/agent files no longer reference the legacy planning filenames.
- Parsed all TOML files successfully with Python `tomllib`.
- No runtime build was needed because the change was guidance-only.

### Claude Code Peer Configuration

- Added root `CLAUDE.md` mirroring `AGENTS.md` and pointing at `.codex/` planning files.
- Added `.claude/` directory with `README.md`, `settings.json` (permissions allowlist + env secret denylist), `agents/*.md` (`frontend-workbench`, `backend-api`, `product-ux`, `qa-verification`), and `skills/*/SKILL.md` (`reply-assistant-workbench`, `reply-assistant-generation-contract`, `reply-assistant-verification`).
- Claude Code now reads the same `.codex/` planning files as Codex. Agents and skills are 1:1 with `agents/*.toml` and `.agents/skills/*/SKILL.md` so the two harnesses stay in sync.
- Active plan lives in `.codex/`. Root `README.md` is product description only; root `UPLOADS.md` is reference only — neither is a planning source for either harness.

Verification:

- No runtime build was needed because the change was guidance-only.
- No existing file was modified or deleted other than this changelog and `HANDOFF.md`.

### Automatic Planning Protocol + Legacy Plan File Removal

- Hardened `CLAUDE.md` "Planning Protocol" — now explicit that every Claude Code agent updates the planning files in the **same change set**, never as a follow-up. Added anti-truncation, anti-feature-deletion, and exact-verification-recording rules.
- Added "Cross-Harness Collaboration" section to `CLAUDE.md` — codifies that Codex and Claude Code are peers and either harness updates the other's peer files when a workflow rule changes.
- Added "Agent Collaboration Model" section to `CLAUDE.md` — defines the typical flow product-ux → frontend-workbench/backend-api → qa-verification → planning update.
- Extended each Claude Code agent file (`.claude/agents/*.md`) and skill file (`.claude/skills/*/SKILL.md`) with the same automatic protocol so the rule is enforced regardless of entry point.
- Extended `.codex/DEVELOPMENT_PLAN.md` → "Plan Update Rules" with the bidirectional sync rule, so Codex (which already reads this file per `AGENTS.md`) automatically updates Claude Code's peer files after an approved change.
- Added `.codex/DEVELOPMENT_PLAN.md` → "Cross-Harness Sync Protocol" section.
- Removed all references in `CLAUDE.md` and `.claude/README.md` to `next-step.md`, `improvement.md`, `UPLOADS.md`, and root `README.md` as planning sources.
- Deleted `improvement.md` and `next-step.md` from the repo (superseded by `.codex/DEVELOPMENT_PLAN.md` and `.codex/FEATURE_GUARDS.md`). `README.md` and `UPLOADS.md` retained at user's request.
- Codex agent and skill files (`AGENTS.md`, `agents/*.toml`, `.agents/skills/*/SKILL.md`) were intentionally not modified per user instruction.

Verification:

- All `.claude/agents/*.md` and `.claude/skills/*/SKILL.md` re-validated: YAML frontmatter parses, names match file/dir stems, only valid Claude Code tools referenced, bodies non-trivial.
- `.claude/settings.json` re-validated as valid JSON (45 allow / 11 ask / 10 deny rules).
- Grep confirmed no Codex file (`AGENTS.md`, `agents/*.toml`, `.agents/skills/*/SKILL.md`) references the deleted `improvement.md` or `next-step.md`.
- No runtime build was needed because the change is guidance + dead-file removal only.

### UPLOADS.md Migration Into `.codex/UPLOADS_PLAN.md`

- Created `.codex/UPLOADS_PLAN.md` as the canonical Claude Code / Codex planning file for uploads and OCR. Captures every material rule from the root `UPLOADS.md`: product goal, UX rules, per-surface limits (3 composer / 5 business / 5 contact), file type scope, size policy (10 MB), data model (`UploadSource`, `UploadKind`, `UploadStatus`, `UploadContextSummary`), OCR architecture (Aliyun → Google Vision → Azure), confidence thresholds (≥0.85 ready, 0.65–0.85 needs-review, <0.65 retry/fail), SHA-256 caching for ≥30 days, parsing strategy per file type, `POST /api/uploads/process` contract, `attachmentContext` extension to `/api/generate`, prompt-wording rules, security/privacy (no background scanning, no raw binaries in localStorage, backend-only OCR env vars), acceptance checks, and non-goals.
- Framed as a shipped spec (frontend modules in `apps/web/src/uploads/*` and `apps/web/src/components/uploads/*`, backend modules in `apps/api/src/ocr/*`) since the architecture is already implemented and the deprecated `TableHelperModal` has been removed. The Deprecated/Removed section preserves the historical removal list as a "do not reintroduce" rule.
- Cross-references added:
  - `CLAUDE.md` → "Source-of-Truth Planning Docs" now lists `.codex/UPLOADS_PLAN.md`.
  - `.claude/README.md` → "Planning Files" now lists `.codex/UPLOADS_PLAN.md`.
  - `.claude/agents/backend-api.md` → "Read First" and "Owned Entrypoints" now cover OCR modules and the upload plan.
  - `.claude/skills/reply-assistant-generation-contract/SKILL.md` → "Read First" now covers the upload plan and OCR / uploads source folders.
  - `.codex/DEVELOPMENT_PLAN.md` → "Upload And OCR Direction" compressed to a quick reference that points at `.codex/UPLOADS_PLAN.md` as canonical.
  - `.codex/FEATURE_GUARDS.md` → "Upload Guards" expanded with all enduring upload invariants (provider order, confidence thresholds, SHA-256 caching, no fake OCR, no background scanning, backend-only OCR env vars, do-not-reintroduce TableHelperModal) and points to `.codex/UPLOADS_PLAN.md` as canonical.
- `.codex/HANDOFF.md` updated: shared-planning-docs list now includes `.codex/UPLOADS_PLAN.md`; the legacy-file note now reflects that root `UPLOADS.md` was removed on this date.
- Deleted root `UPLOADS.md`. Every material rule survives in `.codex/UPLOADS_PLAN.md`; only the "Current App Facts" snapshot (which described the pre-removal `TableHelperModal` state) was not copied across since it had been superseded by the shipped uploads architecture.
- Codex agent and skill files (`AGENTS.md`, `agents/*.toml`, `.agents/skills/*/SKILL.md`) intentionally not modified per user instruction. Codex still picks up the new planning file via the shared `.codex/` source-of-truth that `AGENTS.md` already directs it to read.

Verification:

- All `.claude/agents/*.md` and `.claude/skills/*/SKILL.md` re-validated after edits: YAML frontmatter parses, planning protocol intact.
- Grep confirmed no other repo file references the removed root `UPLOADS.md` (only this changelog entry and the `HANDOFF.md` history line, both pointing at the migration outcome).
- Confirmed shipped state: `apps/web/src/uploads/*` (6 files), `apps/web/src/components/uploads/*` (5 files), `apps/api/src/ocr/*` (6 files) all present; no `TableHelperModal.tsx` remains.
- No runtime build was needed because the change is planning migration + dead-file removal only.

### Master Coordination Layer Drift Fix + Validator Hardening

- Verified the master coordination layer added at root (`AGENT_STATUS.md`, `INTEGRATION_GUIDE.md`, `docs/`, `references/`, `plans/`, `projects/`, `templates/`, `.agent/`, `scripts/validate-plans.js`, `scripts/generate-status-report.js`, `scripts/sync-agents.js`). All 22 required files exist + non-empty; `npm run agents:validate`, `npm run agents:status`, and `npm run agents:sync` all pass; JSON (`package.json`, `references/SHARED_CONTEXT.json`, `.claude/settings.json`) and TOML (`agents/*.toml`, `.codex/config.toml`) validate cleanly.
- Closed four small drift gaps where skill files still carried the old "Sync the Codex peer" guidance that contradicted the new master-coordination workflow:
  - `.claude/skills/reply-assistant-workbench/SKILL.md` — added master-file references and replaced "sync the Codex peer" planning protocol with "master sync + do not edit `.claude/*` for routine app changes".
  - `.claude/skills/reply-assistant-generation-contract/SKILL.md` — same pattern.
  - `.claude/skills/reply-assistant-verification/SKILL.md` — added a "Read First" section and updated planning protocol; same pattern.
  - `.agents/skills/reply-assistant-verification/SKILL.md` — added a "Read First" section and expanded planning updates to include master sync. The other two Codex skills were already updated when the master layer rolled out.
- Hardened `scripts/validate-plans.js` so future drift fails the check. The validator now asserts every `agents/*.toml`, `.claude/agents/*.md`, `.agents/skills/*/SKILL.md`, and `.claude/skills/*/SKILL.md` file contains at least one master-coordination token (`AGENT_STATUS.md`, `INTEGRATION_GUIDE.md`, `SHARED_CONTEXT.json`, or "master files"). Drift simulation confirmed: stripping the token from one file causes `npm run agents:validate` to fail with a precise file-named error; restoring it passes.
- Confirmed Claude Code runtime files (`.claude/agents/*.md`, `.claude/skills/*/SKILL.md`) were the right edit target because the guidance change is a Claude Code runtime instruction change — explicitly carved out as allowed by `/CLAUDE.md` line 105. Routine app changes still update only master files plus `.codex/*`.

Verification:

- `npm run agents:sync` → `agent plan validation OK` → `AGENT_STATUS.md generated` → `agent plan validation OK` → `agent sync OK`.
- All 6 skill files (3 Claude Code + 3 Codex) now reference master coordination tokens.
- Drift simulation: removing master tokens from `.claude/skills/reply-assistant-workbench/SKILL.md` triggered `agents validation failed: .claude/skills/reply-assistant-workbench/SKILL.md must reference master coordination files`. Restoring returned `agent plan validation OK`.
- JSON + TOML validation all pass (`package.json`, `references/SHARED_CONTEXT.json`, `.claude/settings.json`, `agents/*.toml`, `.codex/config.toml`).
- No app runtime build needed — guidance + validator change only.

## 2026-06-07 — Guided Work Buddy v1 (outcome-led confidence cue + outcome-led selected-contact CTA)

Touched areas: generated-reply modal quality signals, command-center Daily Brief CTA, i18n EN/ZH. Renderer-only; no `/api/generate` shape change, no Electron IPC change.

User-facing change:

- The generated-reply modal now leads with a single, plain-language **confidence cue** in the header slot (replacing the static "Ready to copy and send" subtitle). It collapses the existing impression check + voice match + grounding signals into one honest sentence with a colored dot: "Sounds like you — ready to send." / "Worth a quick read before you send." / "Reads a little unlike your usual voice — worth a look." / "Add one more detail to sharpen this." Honesty-first ordering: any real concern (impression warning, voice "different") outranks a reassuring "ready", so the cue never claims a draft is safe when a signal disagrees.
- Anti-clutter: the always-on voice chip is now gated to the actionable `different` state only (the reassuring `similar` and the grey `learning` states are now summarized by the one-line cue instead of a second chip). The impression card still self-hides unless there is a warning, and the full "why / evidence" expander is unchanged — detail stays on demand. Net result is fewer standing chips, one calm lead.
- The selected-contact Daily Brief CTA is now outcome-led instead of the vague "Use Contact": it reads "Add detail" when the contact is missing context, "Reply now" when a reply is the next action, "Follow up" when a follow-up is due, and falls back to "Use Contact" otherwise. The button's behavior is unchanged — only the label now names the action.

Files modified:

- `apps/web/src/components/quality-guard/buildConfidenceVerdict.ts` (new) — pure, testable verdict builder (impression + voice + limited-context → one of `ready` / `ready-voice` / `review` / `voice-off` / `thin`).
- `apps/web/src/components/quality-guard/ConfidenceLine.tsx` (new) — calm one-line presentational cue (dot + sentence). Keeps the 653-line modal lean by housing logic + view outside it.
- `apps/web/src/components/workbench/GeneratedReplyModal.tsx` — computes the verdict from existing props, renders `ConfidenceLine` in the header subtitle slot, gates `VoiceMatchMeter` to the `different` state. `ImpressionCheckChip`, `VoiceMatchMeter`, `WhyThisReplyExpander` all remain rendered (quality-guard verify contract preserved).
- `apps/web/src/components/command-center/useCommandCenterPrimary.ts` — selected-contact primary `cta` derived from `commandCenterPriority` status/suggestedAction.
- `apps/web/src/i18n/translations.ts` — new EN+ZH keys: `modal.confidenceReadyVoice`, `modal.confidenceReview`, `modal.confidenceVoiceOff`, `modal.confidenceThin`, `floating.addDetailCta`, `floating.followUpCta`. The existing `modal.subtitle` string is reused as the plain `ready` sentence.

Not duplicated (already shipped, would have been clutter): pre-brief memory recall is already `ContactMemoryCue` on the main workbench; the needs-reply / draft-ready / empty-state CTAs were already plain verbs. Only the vague "Use Contact" CTA was refined.

Verification:

```bash
npm run verify:quality-guard --workspace=apps/web      # passed (wiring + runtime rule tests)
npm run verify:next-step --workspace=apps/web          # passed
npm run verify:smart-reply --workspace=apps/web        # passed
npm run verify:contact-continuity --workspace=apps/web # passed
npm run build --workspace=apps/web                     # passed (includes verify:contact-selection; pre-existing >500 kB bundle warning unchanged)
npx tsc --noEmit                                       # only pre-existing baseline errors; none reference the new/edited files
# Skipped: full `npm run build`, `npm run electron:build`
# Reason: renderer-only change; no API contract / Electron IPC / detached-window surface touched. The modal is also used in the detached window surface, but it computes the verdict from props it already receives there.
```

Follow-up: none required. Deferred v1 candidates (auto-advance "X of Y handled" rhythm, inline micro-asks for missing context) remain unbuilt by design.

## 2026-06-07 — Remembered context moved out of document flow into a calm left-edge toast dock

Area: main workbench (relationship-memory surface).

User-facing change: the **Remembered context** card no longer renders as an in-flow block under the Daily Brief card. Previously `ContactMemoryCue` sat in document flow between `DailyBriefCard` and the composer, so any selected contact with commitments / a thread summary / reply learning pushed the paste-message input box downward and cluttered the calm main screen. Remembered context is now an overlay-only system that never affects layout:

- A small, unobtrusive **left-edge button** (memory "M" glyph + count badge) the user taps to reveal the remembered items as a vertical **stack of neutral toasts** (open commitments with a done ✓ that calls `dismissCommitment`, the thread summary with inline ✎ edit calling `updateThreadSummary`, and read-only reply-learning signals). The stack is a left-anchored overlay with a light scrim; it stays open until dismissed and never enters document flow.
- An **auto-dismiss toast** modeled on `ComposeCoachStrip`: when a contact with remembered context is selected, a single compact neutral peek (title + top line + count) zooms in over the composer and fades after ~4.2s. It honors the same `composeCoachSuppressed` signal so it yields to modals / guidance ring / guided tour / active coach (one-calm-nudge invariant).

Palette is neutral light-grey/slate (white surface, `slate-200` border, slate text, soft neutral lift shadow, iOS rounding) — deliberately distinct from the amber compose-coach toast, no new accent colors.

Files modified:

- `apps/web/src/components/workbench/RememberedContextDock.tsx` (new) — owns the left-edge button, the auto-dismiss peek toast, and the on-demand stacked toasts. Keeps the editing/dismissal mutators reachable without growing `FloatingAssistant.tsx`.
- `apps/web/src/components/workbench/ContactMemoryCue.tsx` (deleted) — its single-card / expand-collapse model no longer fits the stacked-toast UX and was fully replaced by the dock.
- `apps/web/src/components/FloatingAssistant.tsx` — removed the in-flow `<ContactMemoryCue>` block (was ~line 2610), swapped the import, and mounted `<RememberedContextDock>` as an overlay sibling in the root `relative h-full w-full` container alongside `MilestoneToast` / `attentionToast`, gated to the main workbench (`!activeMiniScreen && !isMoreFeaturesOpen`) and passed `composeCoachSuppressed`.
- `apps/web/src/i18n/translations.ts` — new EN+ZH keys `memoryCueButtonAria` and `memoryCueStackClose`; existing `memoryCue*` strings reused.
- `apps/web/scripts/verify-contact-continuity.mjs` — repointed the component contract from `ContactMemoryCue` to `RememberedContextDock` (existence + FA import + FA render); copy assertions unchanged.

Verification:

```bash
npm run verify:contact-continuity --workspace=apps/web   # passed (updated contract)
npm run verify:relationship-memory --workspace=apps/web  # passed
npm run verify:compose-coach --workspace=apps/web        # passed (coach toast intact)
npm run build --workspace=apps/web                       # passed (includes verify:contact-selection; pre-existing >500 kB bundle warning unchanged)
# Skipped: full `npm run build`, `npm run electron:build`
# Reason: renderer-only change; no /api/generate shape, backend route, or Electron IPC surface touched.
# Not yet run: manual desktop smoke (npm run desktop:dev) — recommended next to confirm no layout shift + toast behavior.
```

Follow-up: manual desktop verification of the dock (input box does not move; toast appears then auto-dismisses; left-edge button shows count; stack opens with zero layout shift; dismiss-commitment + edit-summary persist; coach and memory toasts never collide).

## 2026-06-07 — Remembered-context dock redesigned into beautiful, guiding, wide toasts (v2)

Area: main workbench (relationship-memory surface) — presentation redesign of `RememberedContextDock`.

User-facing change: the first dock cut fixed the layout push but felt cramped and unpleasant — the opened stack was a narrow 260px left column (read as a "little/half screen") and the toasts did not clearly tell the user what to do. v2 reworks the presentation into a calm, professional guidance surface:

- **Wide horizontal peek toast.** When a contact with remembered context is selected, the peek is now a full-width horizontal toast (max 520px, comfortable margins) reading **who · when** plus the top item's guidance line — instead of a tiny pill. Still `ComposeCoachStrip`-style zoom-in + ~4.2s auto-dismiss, still honors `composeCoachSuppressed`.
- **Wide stacked guidance cards.** Tapping the left-edge button (or the peek) now opens a centered overlay over a soft dim holding **near-full-width horizontal cards** (max 540px) stacked with generous spacing — never a narrow column, never a screen takeover, never document flow. A "Handle with {name}" heading anchors the *who*.
- **Guidance + actionable.** Each card states who/what/when (contact name + kind label + `formatRelativeAge`) and carries a clear next action: needs-reply commitments show **Reply now**, promises show **Follow up** (both focus the composer via the existing `focusComposer`, routing the user to where they act), plus **Mark done** (→ `dismissCommitment`). The thread-summary card keeps inline ✎ edit (→ `updateThreadSummary`); reply-learning cards are read-only.
- Palette stays neutral light-grey/slate, distinct from the amber compose-coach toast.

Files modified:

- `apps/web/src/components/workbench/RememberedContextDock.tsx` — rewritten presentation: wide horizontal peek, wide stacked actionable guidance cards, who/what/when copy via `formatRelativeAge` (`apps/web/src/components/command-center/formatRelativeAge.ts`), new `onActNow` prop. Copy prop type widened to `AppTranslations['floating']`.
- `apps/web/src/components/FloatingAssistant.tsx` — passes `onActNow={focusComposer}` to the dock (no other structural change; still an overlay sibling gated to the main workbench).
- `apps/web/src/i18n/translations.ts` — new EN+ZH keys `memoryCueGuideHeading`, `memoryCueActReply`, `memoryCueActFollowUp`, `memoryCueDoneLabel`, `memoryCueLearnedHeading`.

Verification:

```bash
npm run verify:contact-continuity --workspace=apps/web   # passed
npm run verify:relationship-memory --workspace=apps/web  # passed
npm run verify:compose-coach --workspace=apps/web        # passed
npm run build --workspace=apps/web                       # passed (pre-existing >500 kB bundle warning unchanged)
# Skipped: full `npm run build`, `npm run electron:build` — renderer-only; no /api/generate, route, or IPC surface touched.
# Not yet run: manual desktop smoke (npm run desktop:dev).
```

Follow-up: manual desktop verification (wide peek appears then auto-dismisses; stack opens as wide cards, not a narrow column; "Reply now"/"Follow up" focus the composer; "Mark done" + summary edit persist; no collision with the compose-coach toast).

## 2026-06-07 — Remembered-context left-edge button: professional bell icon + calm "needs action" animation

Area: main workbench (`RememberedContextDock` left-edge button).

User-facing change: the left-edge button's plain "M" glyph was replaced with a clean lucide-style **notification bell** in a circular white button with a corner count badge (border-separated, slate-700). When the contact has at least one open commitment (real action needed, `hasPendingAction`), the bell plays a subtle **ring + zoom** attention burst (`remembered-bell-attention`) that fires briefly then rests for most of each 3.6s cycle — eye-catching without clutter — and is fully suppressed under `prefers-reduced-motion`. When there are no pending commitments (only summary/learning), the bell stays still so there is no false urgency.

Files modified:

- `apps/web/src/components/animate-fade-in.css` — new `@keyframes rememberedBellAttention` + `.remembered-bell-attention` class (transform-origin top, motion-safe-guarded), following the file's existing keyframe convention.
- `apps/web/src/components/workbench/RememberedContextDock.tsx` — left-edge button is now a 36px circular bell button with a corner count badge; bell SVG gets the attention class only when `hasPendingAction` (commitments exist).

Verification:

```bash
npm run verify:contact-continuity --workspace=apps/web   # passed
npm run build --workspace=apps/web                       # passed (pre-existing >500 kB bundle warning unchanged)
# Not yet run: manual desktop smoke (npm run desktop:dev) to feel the ring/zoom cadence.
```

Follow-up: confirm the ring/zoom cadence feels calm in the live app and the badge sits cleanly at the button corner.

## 2026-06-08 — Main workbench TARGET row: External recipient chips no longer wrap into a second line

Area: main workbench (`FloatingAssistant.tsx`) — TARGET section directly under the External/Internal mode pills.

User-facing change: with English copy the External mode showed four chips ("New Lead", "Existing Client", "VIP Client", "Others") that wrapped into a second row inside the left half of the TARGET card, while Internal's three shorter chips ("Colleague", "Leader", "Others") fit comfortably on one line. The user wanted External to match Internal's single-line look and to scroll horizontally inside the left half-lane only — never bleeding into the Internal half. The TARGET chip rows now use the same **single-line horizontal scroll** pattern that `ComposerPanel.tsx` already uses for its (currently inactive) chip row:

- External (`workMode === 'reply'`, left grid column) is wrapped in a `relative min-w-0 overflow-hidden` lane carrying left/right fade gradients tied to the existing `hasLeftRecipientFade` / `hasRightRecipientFade` state. The inner scroll container (`clean-scrollbar overflow-x-auto overflow-y-hidden`) attaches the already-declared `recipientScrollRef` and `updateRecipientFade` (only while reply mode is active). The chip track inside it is `flex flex-nowrap items-center gap-1 pr-5` with inline `width: 'max-content'`; chips are `shrink-0 whitespace-nowrap`. Result: External's four chips stay on one line and scroll horizontally inside the left half-lane.
- Internal (`workMode === 'internal'`, right grid column) is also wrapped in `relative min-w-0 overflow-hidden` so a long label can never bleed across the centerline. The flex track switched from `flex flex-wrap` to `flex flex-nowrap items-center gap-1` and keeps `justify-end` for right-alignment; chips gained `shrink-0 whitespace-nowrap` for the same single-line contract. Internal does not need horizontal scroll today (three short labels in EN and ZH both fit), but the contract is now identical so a longer label would still stay on one line.
- The existing `recipientScrollRef`, fade state, and the `useEffect` at `FloatingAssistant.tsx:806-817` that recalculates fade on `workMode` change and `resize` were previously wired but unused (the only `ComposerPanel` consumer passes `showModeAndRecipient={false}`). They are now load-bearing for the External lane and required no additional wiring.

Files modified:

- `apps/web/src/components/FloatingAssistant.tsx` — replaced the two `flex flex-wrap` chip rows inside the TARGET section (lines ~2718-2769) with the half-lane scroll structure described above; no behavior change to mode selection, recipient selection, or any state handlers.

Verification:

```bash
npm run build --workspace=apps/web   # passed (pre-existing >500 kB bundle warning unchanged)
# Skipped: full `npm run build`, `npm run electron:build`, and individual verify scripts — purely a renderer CSS/structure change inside the main workbench, no contract / IPC / state / handler changes, no copy added.
# Not yet run: manual desktop smoke (`npm run desktop:dev`).
```

Follow-up: manual desktop smoke to confirm the External lane scrolls horizontally without wrapping under normal zoom, fades appear when there is more to scroll, the lane never bleeds into Internal's half, and zoomed-in narrow widths still let the lane scroll rather than wrap.

## 2026-06-08 — Focus Plan polish: real timing, owed promises, single recommender core, de-bloated host, modal a11y

Area: Focus Plan (`apps/web/src/components/command-center/*`), the main workbench host (`FloatingAssistant.tsx`), and the Daily Brief recommender.

This builds on Codex's shipped Focus Plan by fixing logic breaks, adding two unused-but-derivable signals, removing orchestration bloat from the mega-host, and making the modal pleasant for non-technical office users — all inside the existing Focus Plan invariants (no new store, API, payload field, chatbot, or standing main-screen block).

User-facing changes:

- **"When" now tells the truth.** The modal previously discarded the timing label ("Now" / "Today" / "Before drafting") whenever a minute estimate existed, so every item just read "~N min". The "When" pill now shows the real timing as the value and the estimate as a small appended hint.
- **Real send-timing windows.** Reply and follow-up items now surface a contact's best window (e.g. "Best around 2 PM") via the existing `deriveSendTimingHint`, but only when the contact has a confident inbound band and the current hour is outside it — otherwise it stays quiet (no noise).
- **Owed promises are visible.** Promises you made (contact-memory `openCommitments` of kind `promise`, honouring dismissals) are a new Focus Plan source ranked just below an unanswered reply and deduped by contact — closing the gap where outbound promises were invisible (open-loop only catches their unanswered inbound). Routes through the existing follow-up handler.
- **Daily Brief and Focus Plan can't disagree.** Both now rank the shared head tiers through one core, `collectHeadWorkSignals`, so "Start here" and the Daily Brief's one best move stay in lockstep.
- **Calmer, more tappable modal.** Escape and backdrop click close it; the primary "Start here" is one full-width button that receives focus on open; focus is trapped in the card; the smallest fonts were lifted off 8–9px; and the clear state is a warm "all caught up" treatment instead of plain text. The action badge still reflects only actionable work (clear state shows no false badge).

Architecture / anti-bloat:

- Focus Plan orchestration was extracted out of `FloatingAssistant.tsx` (already ~3.3k lines) into a focused, testable hook `useFocusPlan.ts` (planner build, action router, promise + badge derivations). The host now passes signals + leaf handlers and renders `focusPlan.items` / `focusPlan.onRunItem`. The dense 94-line inline `handleFocusPlanItem` is gone; the host shrank from 3,299 → 3,252 lines while moving the complex logic into a 189-line module.

Files modified / added:

- `apps/web/src/components/command-center/leadWorkSignal.ts` — NEW. Shared `collectHeadWorkSignals` ranking core + `PROMISE_UPPER_KINDS`.
- `apps/web/src/components/command-center/focusPlan.ts` — uses the shared core; adds `promise` source, timing-aware `whenLabel`, `PromiseCommitmentInput` + `currentHour` inputs. (Runtime imports carry explicit `.ts` extensions so the strip-types verify runner resolves them; Vite resolves both forms.)
- `apps/web/src/components/command-center/workbenchRecommendation.ts` — head tiers now flow through `collectHeadWorkSignals`; tail (active-contact / add-contact / clear) unchanged.
- `apps/web/src/components/command-center/useFocusPlan.ts` — NEW. Hook owning the Focus Plan build + action routing.
- `apps/web/src/components/command-center/FocusPlanModal.tsx` — Escape/backdrop close, focus-on-open + focus trap, full-width primary CTA, larger fonts, warm clear state, timing-preserving "When" pill.
- `apps/web/src/components/FloatingAssistant.tsx` — removed inline planner memo + `handleFocusPlanItem`; added `focusPlanUploadPool`, `runFollowUpContact`, and the `useFocusPlan` call; restored the documented `const shouldShowReferralNudge = false` action-count guard (was missing).
- `apps/web/src/i18n/translations.ts` — EN+ZH `focusPlan` keys: `whenAround`, `clockTime`, `timeAm`, `timePm`, `promiseTitle`, `promiseReason` (+ matching `TranslationBundle` type fields).
- `apps/web/scripts/verify-focus-plan.ts` — extended: timing window (C1), promise rank + dedupe (C2), shared-core usage (A2), whenLabel preserved + Escape (A1/D), `useFocusPlan` hook present / no inline `handleFocusPlanItem` (B1), clear-state zero actionable.

Verification:

```bash
npm run verify:focus-plan --workspace=apps/web         # passed
npm run verify:next-step --workspace=apps/web          # passed
npm run verify:contact-continuity --workspace=apps/web # passed
npm run verify:smart-reply --workspace=apps/web        # passed
npm run build --workspace=apps/web                     # passed (pre-existing >500 kB bundle warning unchanged)
# Not run: npm run electron:build (renderer-only change). Not run: manual desktop smoke (npm run desktop:dev).
```

Follow-up: manual desktop smoke to feel the "When" pill (timing + estimate), the full-width Start here, Esc/backdrop close, the "one done → next slides up" momentum, and the warm clear state.

## 2026-06-08 — Crash fix: Focus Plan actions that open a mini-screen white-screened the app

Area: `apps/web/src/components/mini-screens/MiniScreenHost.tsx` (inline mini-screen host rendered by `FloatingAssistant.tsx`).

Symptom: pressing buttons inside the Focus Plan ("Next best work") modal — e.g. "Use now" on a Today Queue item like "Complete business context", or review / add-detail actions — turned the app window blank.

Root cause: `MiniScreenHost.tsx` called `isAppFoundationEmpty(contactThreads)` at line 124 but never imported it, so rendering any mini-screen inline threw `ReferenceError: isAppFoundationEmpty is not defined`, which unmounts the React tree (white screen). This is a pre-existing bug in `MiniScreenHost` (not introduced by the Focus Plan work, and unrelated to the planner/hook/modal); the detached variant `DetachedMiniScreenHost.tsx` already imported the helper correctly. Focus Plan surfaced it because several of its actions route through `openMiniScreen(...)` → `setActiveMiniScreen(...)` → inline `MiniScreenHost`. esbuild/Vite do not type-check, so the missing binding built cleanly and only failed at runtime.

Fix: added the missing `import { isAppFoundationEmpty } from '../../lib/isAppFoundationEmpty';` to `MiniScreenHost.tsx`. No behavior change beyond resolving the reference.

Files modified:

- `apps/web/src/components/mini-screens/MiniScreenHost.tsx` — added the missing import.

Verification:

```bash
npx tsc --noEmit -p apps/web/tsconfig.json   # MiniScreenHost isAppFoundationEmpty error resolved (other pre-existing, unrelated type errors remain)
npm run build --workspace=apps/web           # passed (pre-existing >500 kB bundle warning unchanged)
npm run verify:focus-plan --workspace=apps/web  # passed
# Manual desktop smoke recommended: open Focus Plan, press a "Use now" Today Queue item and a review/add-detail action — the mini-screen should now open instead of blanking.
```

Note: the "Follow up" / Smart Reply actions that only focus the composer never opened a mini-screen and so were unaffected by this crash. Separately, a few pre-existing type errors remain in unrelated quality-guard/cross-language components (`ImpressionCheckChip`, `CulturalTipStrip`, `WhyThisReplyExpander`, `ComposeCoachStrip`) where a translation group object can reach a string/ReactNode slot — out of scope for this fix but worth a follow-up since they could also throw at runtime.

## 2026-06-08 — Focus Plan: icon-anchored popover + natural task completion (count updates, warning fades when done)

Area: `FocusPlanModal.tsx`, `useFocusPlan.ts` + `focusPlan.ts`, `WorkbenchHeader.tsx`, `animate-fade-in.css`, `FloatingAssistant.tsx`.

User-facing changes (per request):

- **Modal no longer fully stacks over the workbench.** The Focus Plan now opens as a compact top-right popover anchored to the amber warning button it belongs to: right-aligned, dropping from just below the header, narrower (`max-w-[320px]`) so the panel shows behind it, with a `focus-plan-pop` origin-top-right grow animation and a small connecting notch at the top-right. Backdrop dim lightened. This makes it read as "opening out of that icon" instead of a centered overlay.
- **Tasks are accepted and leave the plan naturally.** Acting on any real Focus Plan item now marks it handled for the session (`useFocusPlan` `handledIds`, keyed by item id), so it disappears from the plan and the remaining count drops immediately. Item ids carry the work's timestamp, so genuinely new work (a new inbound message, a fresh draft) reappears rather than being permanently suppressed.
- **The warning count updates and the icon smoothly disappears when done.** The header badge reflects `actionableCount`, which now decrements as items are handled. The amber warning button is shown only while `actionableCount > 0` and, once the last item is handled, fades + shrinks out over ~280ms (`WorkbenchHeader` keeps it briefly mounted to animate the exit) instead of vanishing abruptly.

Implementation notes:

- `focusPlan.ts`: `BuildFocusPlanInput` gained optional `handledIds: ReadonlySet<string>`; the dedupe loop skips handled ids and the clear-state fallback now fires after handled filtering (so "all caught up" appears once everything is handled).
- `useFocusPlan.ts`: session `handledIds` state; `onRunItem` adds the acted item's id (non-clear) before routing; `items`/`actionableCount` derive from the filtered plan.
- `FloatingAssistant.tsx`: `shouldShowActionButton` is now `focusPlan.actionableCount > 0`.
- `WorkbenchHeader.tsx`: presence state (`actionMounted` / `actionLeaving`) drives a fade+scale exit on the warning button.

Files modified:

- `apps/web/src/components/command-center/FocusPlanModal.tsx`
- `apps/web/src/components/command-center/focusPlan.ts`
- `apps/web/src/components/command-center/useFocusPlan.ts`
- `apps/web/src/components/FloatingAssistant.tsx`
- `apps/web/src/components/workbench/WorkbenchHeader.tsx`
- `apps/web/src/components/animate-fade-in.css`

Verification:

```bash
npx tsc --noEmit -p apps/web/tsconfig.json   # no new errors in touched files
npm run verify:focus-plan --workspace=apps/web         # passed
npm run verify:next-step --workspace=apps/web          # passed
npm run verify:contact-continuity --workspace=apps/web # passed
npm run verify:smart-reply --workspace=apps/web        # passed
npm run build --workspace=apps/web                     # passed (pre-existing >500 kB bundle warning unchanged)
# Manual desktop smoke recommended: open the plan (popover should hang from the warning icon, panel visible at left), act on items and watch the badge count drop, handle the last one and watch the warning fade out.
```

Follow-up: the popover notch is positioned approximately under the top-right control cluster; if pixel-perfect alignment to the warning icon is wanted, the icon could be made the right-most header control. Manual desktop smoke still pending.

## 2026-06-08 — Focus Plan popover: icon-anchored, mostly outside the panel, frosted backdrop, right-sized

Area: `FocusPlanModal.tsx`, `FloatingAssistant.tsx`, `WorkbenchHeader.tsx`, `animate-fade-in.css`, and the Electron window sizing (`electron/main.ts`, `electron/preload.ts`, `apps/web/src/global.d.ts`).

Follows up the previous popover pass after screenshots showed it (a) trapped inside the 390px panel, (b) with the notch off the icon, (c) over-sized, and (d) exposing a bare grey window page beside the panel.

User-facing changes:

- **Hangs off the warning icon and sits mostly outside the panel.** Opening the Focus Plan now widens the desktop window to a dedicated `FOCUS_PLAN_WIDTH` (720px, right edge only) so the popover can live in the right-hand space instead of being clipped to the 390px panel. The modal is positioned by measuring the real warning-button rect (`[data-focus-plan-anchor]`): it drops just below the icon (never covering it) and extends right.
- **The notch touches the icon precisely.** The connecting arrow is placed at the icon's measured centre (`notchLeft = iconCentreX − modalLeft`), re-measured across a couple of frames and on resize so it settles after the window widens.
- **No more bare grey page.** The popover now uses the same frosted backdrop as the mini-screens (`bg-[#0f172a]/12 backdrop-blur-[3px]` over the full window) so the widened area reads as an intentional overlay rather than an empty white/grey sheet.
- **Right-sized, not zoomed.** Pulled the font/padding back from the over-large pass to a calm, compact scale (primary title 14px, body 11px, CTA 12px; `max-w` 360) with enough breathing room but no "blown-up" look.

Implementation:

- `electron/main.ts`: added `FOCUS_PLAN_WIDTH = 720`; raised `maxWidth` and the `clampWindowSize` upper bound to it; `desktop:set-panel-open` now accepts an optional `width` (clamped to `[PANEL_OPEN_WIDTH, FOCUS_PLAN_WIDTH]`). Standard panels still open at 574 (unchanged).
- `electron/preload.ts` + `apps/web/src/global.d.ts`: `setPanelOpen(open, width?)` signature.
- `FloatingAssistant.tsx`: the panel-open effect now also fires while the Focus Plan is open and passes `FOCUS_PLAN_PANEL_WIDTH` (720) only for the plan.
- `WorkbenchHeader.tsx`: warning button carries `data-focus-plan-anchor`.
- `FocusPlanModal.tsx`: `useLayoutEffect` measures the anchor and fixed-positions the popover + notch; frosted backdrop; trimmed sizing. Escape/backdrop close and focus management retained.
- `animate-fade-in.css`: `.focus-plan-pop` origin set to `top left` so it grows out of the icon.

Verification:

```bash
npx tsc --noEmit -p apps/web/tsconfig.json   # no new errors in touched files
npm run electron:build                       # passed (child-window-layout verify + electron tsc)
npm run build --workspace=apps/web           # passed (pre-existing >500 kB bundle warning unchanged)
npm run verify:focus-plan --workspace=apps/web         # passed
npm run verify:next-step --workspace=apps/web          # passed
npm run verify:contact-continuity --workspace=apps/web # passed
npm run verify:smart-reply --workspace=apps/web        # passed
# Manual desktop smoke recommended: open the plan — window widens, popover hangs from the icon with the arrow on it, frosted backdrop (no bare page), compact sizing.
```

Follow-up: if an even larger share outside the panel is wanted, `FOCUS_PLAN_WIDTH` / `FOCUS_PLAN_PANEL_WIDTH` and `MODAL_WIDTH` can be tuned together. Manual desktop smoke still pending.
