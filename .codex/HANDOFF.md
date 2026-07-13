# Codex Handoff

Last updated: 2026-06-15

## Current State

Latest app work on 2026-06-15:

- FloatingAssistant UX & Stability Polish. Fixed `Cmd+Enter` stale closure bug by proxying `handleEscape` through a ref instead of re-binding the listener on every render. Fixed Electron IPC listener churn by proxying `onChildAction` through a ref, avoiding constant re-subscriptions when `contactThreads` change. Polished Contact Auto-Select UX to automatically apply high-confidence matches and focus the composer without requiring a manual click (respecting the medium-confidence confirmation guard). Moved Contact Confirmation UI below the composer to eliminate layout shift. Added focus restoration when the Generated Reply modal closes or when `Cmd+K` palette is escaped. Verified: `verify:contact-selection`, `verify:cmd-k`, `build --workspace=apps/web`.

Earlier app work on 2026-06-09:

- Coordination and continuation audit after the More Features drawer close polish. Directly checked the current implementation in `FloatingAssistant.tsx`, `more-features.tsx`, `more-features/*`, and `electron/main.ts`; confirmed the shipped drawer contract still matches the planning files; found stale Claude-facing continuation guidance; and updated `plans/claude-code-current-plan.md`, Codex/Claude workbench and verification skills, and frontend agent profiles so future Claude Code sessions preserve current implementations instead of rebuilding older variants. Guidance-only: no runtime code, prompt, schema, storage, API, IPC, route, translation, or UI behavior changed. Verified with `npm run agents:validate`; `npm run agents:status` regenerated `AGENT_STATUS.md` from `references/SHARED_CONTEXT.json`.
- More Features close polish after tracing the current drawer/Electron path and the user's report of a transparent ghost sheet plus whole-screen shake. The drawer still closes left, but the bad geometry is fixed: the 184px drawer no longer moves 390px left under the assistant, and it no longer anchors to the Electron window's changing right edge. `more-features.tsx` anchors the drawer at fixed `left-[390px]`, uses the shared 300ms close duration/easing, closes with `-translate-x-full` exactly one drawer width, then becomes `invisible` after the hold. `FloatingAssistant.tsx` still derives `isMoreFeaturesVisible = isMoreFeaturesOpen || isMoreFeaturesClosing` for host visual gates, but `isMoreFeaturesClosing` is intentionally excluded from the `setPanelOpen(true)` expression so the Electron shell does not stay fully expanded as an empty transparent side area during close. `electron/main.ts` replaces the late native close animation with a cancellable 300ms non-native width tween (`PANEL_CLOSE_ANIMATION_MS = 300`) from 574px to 390px, matching the drawer close and avoiding the native `setBounds(..., true)` shake. Renderer/Electron presentation only; no More Features menu actions, child-window routing, Focus Plan logic, remembered-context logic, `/api/generate`, backend, storage, IPC shape, prompt, or translation-key behavior changed. Verified: `verify:focus-plan`, `verify:contact-continuity`, `build --workspace=apps/web`, and `electron:build`.
- Earlier More Features close animation fix. The More Features drawer already had its own exit transition, but closing it from the More Features icon collapsed the Electron expanded panel immediately through `setPanelOpen(false)`, so the exit slide was clipped and the drawer appeared to disappear. The expanded shell hold remains correct, but the intermediate `-translate-x-[390px]` transform is superseded by the current `-translate-x-full` plus `invisible` behavior described above.
- Remembered-context notice-icons action-only fix. The top remembered-context bell now appears only when there is action-required remembered work (`rememberedContextCounts.count > 0`). Saved/locked thread summaries and reply-learning remain stored in contact memory, but they no longer mount the notice icon by themselves. `getRememberedContextCounts` keeps saved/locked summaries out of the pending count and now treats the proactive notice surface as action-only (`hasContext: count > 0`). Result: after Save/Close, if no open commitments or unreviewed summaries remain, the header bell disappears naturally instead of showing a zero-value notice. Verified: `verify:contact-continuity`, `verify:focus-plan`, `build --workspace=apps/web`.
- Remembered-context edit-mode fix. Thread-summary edit mode now uses `AssistedNotesTextarea` instead of a raw textarea, so it gets the app's existing writing-reminder / typing-assist behavior while the user edits remembered context. The old `maxLength={700}` cap is gone, which prevents long existing summaries from feeling locked/uneditable. Cancel and Save now sit in a visible fixed footer (`border-t border-slate-100 pt-3`) outside the textarea scroll area, so the user does not have to scroll the text to find the actions. Follow-up fixes: the assisted textarea itself is `min-h-0` and flexes above the footer; do not put `min-h-[420px]` back on the textarea because that hides the footer. The `AssistedNotesTextarea` wrapper is also a flex column and the textarea is `flex-1`, so the input box stretches down toward the fixed footer instead of leaving dead space. The tall generated-reply-like popover/read/edit height, no-blur/no-dim/no-blank-side-surface contract, header bell anchor, Focus Plan switching, and contact continuity mutators are unchanged. Verified: `verify:contact-continuity`, `verify:focus-plan`, `build --workspace=apps/web`.
- Remembered-context height match. The remembered-context popover now has a generated-reply-like vertical scale so the "Needs reply / Thread summary · Based on N messages" read and edit screens no longer feel cramped. `RememberedContextDock.tsx` adds `POPOVER_MIN_HEIGHT = 640` with viewport clamping, keeps the right-side icon anchor/no-blur/no-dim contract, and makes the summary card fill the available popover height. Read mode scrolls inside a tall `min-h-[420px]` summary panel; edit mode uses `rows={14}` with a `min-h-[420px]` textarea and internal scroll. No contact continuity logic changed: reply/follow-up, mark done, summary save, and reply-learning behavior are unchanged. Verified: `verify:contact-continuity`, `verify:focus-plan`, `build --workspace=apps/web`.

Latest app work on 2026-06-08:

- Remembered-context modal regression fix. The "Needs reply / Thread summary · Based on N messages" surface no longer opens as a blurred stack over the FloatingAssistant main panel. `RememberedContextDock` is now controlled by `FloatingAssistant.tsx` and rendered as a right-side icon-anchored popover, matching the Focus Plan placement model: transparent fixed click-away wrapper, viewport-capped card, notch pointing to `[data-remembered-context-anchor]`, no dim layer, no `backdrop-blur`, no dull blank in-panel surface. The remembered-context bell moved from the left screen edge into `WorkbenchHeader.tsx`, in the compact partially overlapping action-icon row next to the amber Focus Plan icon; tapping Focus Plan closes remembered context and tapping remembered context closes Focus Plan. `FloatingAssistant.tsx` includes `isRememberedContextOpen` in the normal `setPanelOpen` effect and closes remembered context when More Features or child screens open. Thread-summary edit mode was enlarged and is now superseded by the 2026-06-09 generated-reply-height pass. Logic preserved: reply/follow-up still calls `focusComposer`, mark-done still calls `dismissCommitment`, summary save still calls `updateThreadSummary`, reply-learning remains read-only, and no `/api/generate`, backend, storage, IPC child-screen, prompt, or translation-key behavior changed. Verified: `verify:contact-continuity`, `verify:focus-plan`, `build --workspace=apps/web`; manual desktop smoke recommended for final visual/notch feel in Electron.
- Focus Plan visual regression fix. The amber/header Focus Plan popover must open without any dim/blur layer and without a dull blank side panel behind it, while still sitting toward the right with its notch pointing at the amber icon. `FocusPlanModal.tsx` uses a transparent fixed click-away wrapper (`fixed inset-0 z-[68]`) with no `bg-*` or `backdrop-blur-*`. `FloatingAssistant.tsx` includes `isActionCenterOpen` in the normal `setPanelOpen` effect so the popover has the same right-side placement it has while More Features is open, but the expanded area is visually transparent (`apps/web/src/index.css` body background is transparent; `electron/main.ts` main window has `transparent: true` and transparent background color). Electron/preload carry no Focus Plan custom width, and `apps/web/src/global.d.ts` matches the runtime IPC signature `(open: boolean)`. Overflow is contained inside the card: the section has viewport `maxHeight` + `overflow-hidden`, and the task body is `clean-scrollbar ... overflow-y-auto`, so more tasks or longer translated copy scroll naturally without moving the anchored shell. Focus Plan / Today Queue open-screen actions route through `openMiniScreen(action.screenId)` so Electron opens the original draggable detached child windows (`desktopApp.openChildScreen`) instead of an inline duplicated `MiniScreenHost` over the FloatingAssistant. Planner logic, ranking, action routing, handled-item state, copy, storage, backend routes, and `/api/generate` are unchanged. Guard and `verify-focus-plan` updated to forbid custom Focus Plan width, dim/blur overlays, app-colored expanded background, unbounded modal overflow, or direct `setActiveMiniScreen(action.screenId)` for Today Queue open-screen actions. Verified: `verify:focus-plan`, `verify:next-step`, `build --workspace=apps/web`, `electron:build`; manual desktop smoke still recommended to confirm the detached child-window flow from Focus Plan buttons in the live shell.
- Focus Plan UX pass (icon-anchored popover + natural completion). The modal now opens as a compact top-right popover anchored to the amber warning button (right-aligned, drops from below the header, `max-w-[320px]`, `focus-plan-pop` origin-top-right grow + notch, lighter backdrop) instead of a centered full-panel overlay. Acting on an item marks it handled for the session (`useFocusPlan` `handledIds`, keyed by item id with its timestamp) so it leaves the plan and the count drops; genuinely new work reappears. The header badge reflects `actionableCount`; the warning button shows only while `actionableCount > 0` and fades+shrinks out (~280ms, `WorkbenchHeader` presence state) once the last item is handled. Files: `FocusPlanModal.tsx`, `focusPlan.ts`, `useFocusPlan.ts`, `FloatingAssistant.tsx`, `WorkbenchHeader.tsx`, `animate-fade-in.css`. Verified: `verify:focus-plan`, `verify:next-step`, `verify:contact-continuity`, `verify:smart-reply`, `build --workspace=apps/web`, `tsc` (no new errors in touched files). Guards added in `.codex/FEATURE_GUARDS.md`. Manual desktop smoke pending; notch alignment is approximate (could make the warning icon the right-most header control for a perfect point).
- Crash fix (white screen on Focus Plan buttons). `MiniScreenHost.tsx` called `isAppFoundationEmpty(contactThreads)` without importing it, so opening any inline mini-screen threw a `ReferenceError` and blanked the app. Focus Plan surfaced this because its "Use now" / review / add-detail actions route through `openMiniScreen` → inline `MiniScreenHost`. Pre-existing bug (the detached `DetachedMiniScreenHost.tsx` already imported the helper); fixed by adding `import { isAppFoundationEmpty } from '../../lib/isAppFoundationEmpty';`. Verified: `tsc` (that error gone), `build --workspace=apps/web`, `verify:focus-plan`. Manual desktop smoke recommended. Follow-up flagged: pre-existing type errors in `ImpressionCheckChip` / `CulturalTipStrip` / `WhyThisReplyExpander` / `ComposeCoachStrip` where a translation-group object can reach a string/ReactNode slot could also throw at runtime.
- Focus Plan polished into a real "work buddy" (Claude Code, building on Codex's Focus Plan). Fixed logic breaks, added two derivable-but-unused signals, de-bloated the host, and made the modal pleasant — all inside the existing Focus Plan invariants (no new store/API/payload/chatbot/standing block):
  - **"When" tells the truth.** `FocusPlanModal` no longer lets the minute estimate overwrite the timing label; the "When" pill shows `whenLabel` and appends the estimate as a hint.
  - **Real send-timing windows.** Reply/follow-up items show a contact's best window (e.g. "Best around 2 PM") via the existing `deriveSendTimingHint`, only when the contact has a confident inbound band and the current hour is outside it.
  - **Owed promises surface.** Contact-memory `openCommitments` of kind `promise` (honouring `dismissedCommitmentIds`) are a new `promise` source ranked just below `reply-now`, deduped by contact, routed through the existing follow-up handler.
  - **One ranking core.** `buildWorkbenchRecommendation` (Daily Brief) and `buildFocusPlan` now share `collectHeadWorkSignals` (`leadWorkSignal.ts`) for the head tiers, so "Start here" and the Daily Brief's one best move can't disagree.
  - **Anti-bloat.** Orchestration moved out of `FloatingAssistant.tsx` into `useFocusPlan.ts` (planner build + action router + promise/badge derivations); the inline 94-line `handleFocusPlanItem` is gone; host shrank 3,299 → 3,252 lines. Restored the documented `const shouldShowReferralNudge = false` action-count guard (it was missing).
  - **Modal a11y/feel.** Escape + backdrop close, focus-on-open + focus trap, full-width "Start here", larger fonts, warm "all caught up" clear state; badge still excludes the clear item.
  - New EN/ZH `focusPlan` keys: `whenAround`, `clockTime`, `timeAm`, `timePm`, `promiseTitle`, `promiseReason`. `verify-focus-plan.ts` extended for all of the above. Note: `focusPlan.ts` runtime imports use explicit `.ts` extensions so the strip-types verify runner resolves them (Vite resolves both). Verified: `verify:focus-plan`, `verify:next-step`, `verify:contact-continuity`, `verify:smart-reply`, `build --workspace=apps/web` (pre-existing >500 kB bundle warning unchanged). Not run: `electron:build` (renderer-only), manual desktop smoke.
- Focus Plan overlay landed. The old inline Action Center overlay in `FloatingAssistant.tsx` was replaced by `apps/web/src/components/command-center/FocusPlanModal.tsx`, backed by pure `buildFocusPlan` in `apps/web/src/components/command-center/focusPlan.ts`. It creates at most three industry-neutral work items ("Start here" / "Next" / "Later") from existing local signals only: pending drafts, Action Inbox, upload review, contact reply need, selected-contact missing detail, follow-up/open loop, and Today Queue tasks. Same-contact work is deduped, clear state remains available without showing a pending-work badge, and the existing header action button now says "Open plan". No permanent main-screen block, no chatbot prompt, no new storage, no `/api/generate` / backend / IPC change. EN/ZH `focusPlan` copy added. Verified: `verify:focus-plan`, `verify:next-step`, `verify:contact-continuity`, `verify:smart-reply`, `build --workspace=apps/web` (pre-existing >500 kB bundle warning unchanged). Codex workbench/verification skills now include Focus Plan guidance.
- Coordination audit after Focus Plan: Codex skills/plans and shared master files are aligned; `plans/claude-code-current-plan.md` has a cross-harness note naming Focus Plan as Codex's latest app work, and shared audience/current-priority wording now uses broader business-communication positioning instead of over-narrow sales/client language. Runtime code unchanged by this audit.
- Main workbench TARGET row fixed so External recipient chips no longer wrap into a second line. With English copy the External mode showed four chips ("New Lead", "Existing Client", "VIP Client", "Others") on two rows inside the left half of the TARGET card, while Internal's three shorter chips ("Colleague", "Leader", "Others") fit on one line. The TARGET section's chip rows in `FloatingAssistant.tsx` (lines ~2718-2769, distinct from the inactive `ComposerPanel.tsx` chip row used only when `showModeAndRecipient={true}`) were replaced with the same single-line horizontal scroll structure that `ComposerPanel.tsx` already documents: External (`workMode === 'reply'`, left grid column) gets a `relative min-w-0 overflow-hidden` lane with `w-5` left/right fade gradients tied to the existing `hasLeftRecipientFade` / `hasRightRecipientFade` state, an inner `clean-scrollbar overflow-x-auto overflow-y-hidden` container holding `recipientScrollRef` + `updateRecipientFade` only while reply mode is active, and a `flex flex-nowrap items-center gap-1 pr-5` track with inline `width: 'max-content'`; chips are `shrink-0 whitespace-nowrap`. Internal (`workMode === 'internal'`, right grid column) is wrapped in the same `relative min-w-0 overflow-hidden` lane so a long label can never bleed across the centerline, with the flex track switched from `flex-wrap` to `flex flex-nowrap items-center gap-1` keeping `justify-end`; chips gained `shrink-0 whitespace-nowrap`. The already-declared `recipientScrollRef`, fade state, and the `useEffect` at `FloatingAssistant.tsx:806-817` that recalculates fade on `workMode` / `resize` were previously unused (the only `ComposerPanel` consumer passes `showModeAndRecipient={false}`) and are now load-bearing for the External lane. Renderer-only; no `/api/generate` shape, route, IPC, state, or copy changes. Verified: `build --workspace=apps/web` (manual desktop smoke still recommended). Guard at `.codex/FEATURE_GUARDS.md` extended to name `FloatingAssistant.tsx` as the active chip-row surface alongside `ComposerPanel.tsx`.
- Codex/master alignment audit completed after the TARGET-row fix. Codex skills now point recipient-row work at both the active `FloatingAssistant.tsx` surface and the inactive `ComposerPanel.tsx` reference implementation, `plans/codex-current-plan.md` no longer contradicts the active `grid grid-cols-2` implementation, `references/SHARED_CONTEXT.json` now records the TARGET-row fix as Claude Code's latest completion, and `projects/active-features.md` names the active overlay-only `RememberedContextDock` instead of the removed in-flow `ContactMemoryCue`. Coordination-only; no runtime app behavior changed.

Earlier app work on 2026-06-07:

- Remembered-context left-edge button polished. The plain "M" glyph was replaced with a clean lucide-style notification bell in a 36px circular white button with a corner count badge (border-separated slate-700). When the contact has at least one open commitment (`hasPendingAction`), the bell plays a calm ring+zoom attention burst (`remembered-bell-attention` keyframe in `apps/web/src/components/animate-fade-in.css`) that fires briefly then rests for most of a 3.6s cycle, suppressed under `prefers-reduced-motion`; with no pending commitments it stays still (no false urgency). Anti-clutter by design. Files: `animate-fade-in.css` (keyframes), `apps/web/src/components/workbench/RememberedContextDock.tsx` (bell button). Renderer-only. Verified: `verify:contact-continuity`, `build --workspace=apps/web`. Guard updated in `.codex/FEATURE_GUARDS.md`.
- Remembered-context dock redesigned into beautiful guiding wide toasts (v2). The first cut fixed the layout push but the opened stack was a cramped narrow 260px left column ("little/half screen") and the toasts did not guide the user. v2 reworks `RememberedContextDock` presentation: the auto-dismiss peek is now a wide horizontal toast (max 520px) reading who · when + the top item's line; tapping the left-edge button or the peek opens a centered overlay over a soft dim with near-full-width horizontal guidance cards (max 540px, generous spacing) under a "Handle with {name}" heading — never a narrow column, never a screen takeover, never document flow. Cards are actionable: needs-reply → "Reply now", promise → "Follow up" (both call `onActNow` → `focusComposer`, routing to the composer), plus "Mark done" → `dismissCommitment`; thread summary keeps inline ✎ edit; reply-learning read-only. Relative "when" via `formatRelativeAge`. New EN+ZH keys: `memoryCueGuideHeading`, `memoryCueActReply`, `memoryCueActFollowUp`, `memoryCueDoneLabel`, `memoryCueLearnedHeading`. `FloatingAssistant` passes `onActNow={focusComposer}`. Renderer-only; no API/IPC change. Verified: `verify:contact-continuity`, `verify:relationship-memory`, `verify:compose-coach`, `build --workspace=apps/web` (manual desktop smoke still recommended). The `RememberedContextDock` invariant in `.codex/FEATURE_GUARDS.md` was updated to lock the wide-toast / guidance / actionable contract.
- Remembered context relocated out of document flow. The in-flow `ContactMemoryCue` card (which sat between the Daily Brief card and the composer and pushed the paste-message input box down whenever a contact had commitments / a thread summary / reply learning) was deleted and replaced by `apps/web/src/components/workbench/RememberedContextDock.tsx`. The dock is overlay-only and never affects layout: a small left-edge button (M glyph + count) opens the remembered items as a vertical stack of neutral toasts (commitment done ✓ → `dismissCommitment`, thread summary inline ✎ edit → `updateThreadSummary`, read-only reply-learning), plus an auto-dismiss peek toast (modeled on `ComposeCoachStrip`) that zooms in over the composer when a contact with remembered context is selected and fades after ~4.2s. Palette is neutral slate (white surface, `slate-200` border, slate text) — distinct from the amber coach toast. The peek toast honors `composeCoachSuppressed` (yields to modals / guidance / tour / active coach → one-calm-nudge). Mounted as an overlay sibling in the root `relative` container in `FloatingAssistant.tsx`, gated to the main workbench. New EN+ZH keys `memoryCueButtonAria` / `memoryCueStackClose`. `verify-contact-continuity.mjs` repointed from `ContactMemoryCue` to `RememberedContextDock`. Renderer-only; no `/api/generate`, backend route, or Electron IPC change. Verified: `verify:contact-continuity`, `verify:relationship-memory`, `verify:compose-coach`, `build --workspace=apps/web` (manual desktop smoke still recommended).
- Guided Work Buddy v2 landed. A new pure command-center recommendation builder (`workbenchRecommendation.ts`) chooses one best move without adding more priority branching to `FloatingAssistant.tsx`: pending draft → Action Inbox → upload review → reply now → add detail → follow-up → active contact → add contact / clear fallback. Daily Brief now shows one short reason line, supports a compact missing-context micro-ask only when the composer is empty, routes low-confidence / needs-review attachments to existing review surfaces, and has a calm clear-for-now fallback when contacts exist but no current client action needs attention. The same reason / micro-ask renders in the main Daily Brief and the Action Center copy. Local work-rhythm sources now include `review-file`, `add-detail`, `follow-up`, and `clear`. EN+ZH copy added. Renderer-only; no `/api/generate`, backend route, or Electron IPC change.
- Guided Work Buddy v1 (first cut) landed. The generated-reply modal now leads with a single plain-language **confidence cue** (`ConfidenceLine` + pure `buildConfidenceVerdict`) in the header slot, replacing the static "Ready to copy and send" subtitle. It collapses impression check + voice match + grounding into one honest sentence with a colored dot. Honesty-first ordering: an impression warning or voice "different" always outranks a "ready" verdict, so the cue can never claim safety when a signal disagrees. Anti-clutter: `VoiceMatchMeter` is now gated to the actionable `different` state (the reassuring `similar` and grey `learning` chips are folded into the one-line cue); `ImpressionCheckChip` still self-hides unless there's a warning; the "why/evidence" expander is unchanged. `ImpressionCheckChip`, `VoiceMatchMeter`, and `WhyThisReplyExpander` are all still rendered so the `verify:quality-guard` contract holds. The selected-contact Daily Brief CTA in `useCommandCenterPrimary` is now outcome-led ("Add detail" / "Reply now" / "Follow up" / fallback "Use Contact") instead of the vague "Use Contact" — behavior unchanged, label now names the action. New EN+ZH keys: `modal.confidence*` (4) and `floating.addDetailCta` / `floating.followUpCta`. Renderer-only; no `/api/generate` shape change, no Electron IPC change. Deliberately did NOT add a separate pre-brief recall line; remembered context is now represented by overlay-only `RememberedContextDock`, and duplicating it would be clutter.
- Codex pickup alignment pass: Codex-side skills now explicitly point future workbench changes at the fragile shipped surfaces Claude Code added today (`ComposerPanel.tsx` target recipient row and `ComposeCoachStrip.tsx` toast). The workbench skill now names the load-bearing inline layout/animation contracts, the verification skill maps those surfaces to `verify:contact-selection` / `verify:compose-coach` plus web build, and the generation-contract skill points upload/attachment changes at `.codex/UPLOADS_PLAN.md` and the no-fake-OCR guardrails. This was guidance-only; no runtime app behavior changed.
- Reworked the Target recipient chip row in the composer. The first half-width grid attempt still let chips wrap because `grid-cols-2` resolves to `minmax(auto, 1fr)` (column grows with content). Recipient row now uses **inline** `gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)'` with inline `gridColumnStart: 1` for External (`workMode === 'reply'`) and `gridColumnStart: 2` for Internal — columns are strictly capped at half-width. The lane has `overflow-hidden` as a hard clip boundary; the inner `overflow-x-auto` provides the actual horizontal scroll. Chip track is `flex flex-nowrap items-center` with inline `width: 'max-content'`; chips are `shrink-0 whitespace-nowrap`. Result: single-line horizontal scroll inside the active mode's half-lane, never wraps, never bleeds across the centerline, regardless of Tailwind version or HMR cache state. Anti-clutter preserved (one or two chips visible at rest).
- Redesigned `ComposeCoachStrip` (the compose-time warning surfaced by `useComposeCoach`) into a dismissible **bright white** toast positioned at `absolute inset-x-0 bottom-[5rem] z-30` inside the composer's `relative` inner box — slightly below the vertical center of the box, with the top of the textarea fully visible and a clear gap above the ⌘↵ / Generate action row. Surface: `bg-white` with `border-amber-200`, soft amber-tinted lift shadow (`0_20px_44px_-10px_rgba(218,143,73,0.32),0_2px_8px_rgba(31,24,18,0.08)`), no backdrop-blur. Text is `#1f1812` with `font-medium`; eyebrow is `text-amber-700`; the alert glyph is a filled `bg-amber-400` chip with white `!` and its own amber drop shadow. Fix button is amber-50 with amber-300 border and amber-800 text. Close (×) is slate-400 → slate-700 on hover. Animation is unmissable: duration `480ms`, scale `0.55 → 1`, translateY `16px → 0`, opacity `0 → 1`, easing `cubic-bezier(0.34, 1.56, 0.64, 1)` for a pronounced bounce overshoot. The inner toast div carries `key={activeWarning.id}` so React remounts on every new warning id and the entry animation always runs from scratch; the double-`requestAnimationFrame` prime still runs on initial mount. Anti-clutter: one warning at a time, dismissed ids reset when the underlying warning leaves the active set, `suppressed` still short-circuits to `null`. Previous dark slate (initial) and pearl-grey (mid) iterations are superseded.
- Earlier on the same day: fixed the overlap regression where the previous strip rendered inside the fixed-height composer box and collided with the `+` attach button and the ⌘↵ / Generate row. The new toast is anchored to the composer box but layered above the bottom padding zone, so the overlap can't recur. Invariant captured in `.codex/FEATURE_GUARDS.md` (Workbench Guards).
- Added `coach.dismiss` translation key with EN ("Dismiss") and ZH ("知道了"); type interface updated together.
- Renderer-only change. No `/api/generate` shape change, no Electron IPC change. New invariant added to `.codex/FEATURE_GUARDS.md` for the toast layout / one-at-a-time rule.
- Verified via `verify:compose-coach` and `build --workspace=apps/web`. Full root build and `electron:build` skipped because no cross-layer or Electron surface was touched.

Earlier app work on 2026-06-06:

- `ContactMemoryCue` on the main workbench expanded from a single-line preview into a multi-line + expandable review surface. Collapsed shows top commitment + top summary/learning with a count chip and "Based on N messages" footer; expanded groups all open commitments (dismiss×), the thread summary (inline ✎ edit), and reply-learning signals.
- New thread mutators in `apps/web/src/config/contactThreads.ts`: `dismissContactCommitment` and `updateContactThreadSummary`, exposed through `useContactThreads` as `dismissCommitment` and `updateThreadSummary`.
- Auto-refresh now preserves user intent: `ContactThreadSummary.locked` survives `refreshContactContinuity` (text kept, counts updated); `ContactThread.dismissedCommitmentIds` filters out commitments on every refresh so dismissed items don't reappear when a new message arrives.
- Renderer-only change; no `/api/generate` shape change, no Electron IPC change.
- Verified via `verify:contact-continuity`, `verify:next-step`, `verify:contact-selection`, and `build --workspace=apps/web`. Full root build and `electron:build` were skipped because no cross-layer or Electron surface was touched.

Earlier app work on 2026-06-04:

- Master agent coordination layer added. Both Codex and Claude Code should read `AGENT_STATUS.md`, `INTEGRATION_GUIDE.md`, `references/SHARED_CONTEXT.json`, `.codex/*`, and relevant master docs before non-trivial work.
- Routine app changes now update `.codex/*` plus master coordination files. Routine app changes do not edit `.claude/*`; edit `.claude/*` only when Claude Code runtime instructions, permissions, agents, or skills changed.
- New coordination commands: `npm run agents:validate`, `npm run agents:status`, and `npm run agents:sync`.
- Business Reply Assistant has been refocused toward Sales/Client Ops continuity.
- Contact threads now support local-first `threadSummary`, `openCommitments`, and `replyLearning` fields.
- Generation contact context now carries memory summary, recent timeline, long-thread summary, commitments, and reply learning through frontend builder, API normalizer, and backend prompt formatter.
- More Features now delegates menu rendering to `MoreFeaturesMenu`, with core client-work surfaces separated from secondary utilities.
- The main workbench shows overlay-only `RememberedContextDock` remembered-context cues when commitments/preferences exist, hides Quick Start outside the empty starting state, and no longer counts referral nudges as primary work actions.
- New targeted check: `npm run verify:contact-continuity --workspace=apps/web`.
- Master coordination layer verified end-to-end. Closed four small drift gaps where skill files still carried the pre-master-layer "Sync the Codex peer" guidance (3 `.claude/skills/*/SKILL.md` and 1 `.agents/skills/reply-assistant-verification/SKILL.md`). Hardened `scripts/validate-plans.js` so every `agents/*.toml`, `.claude/agents/*.md`, `.agents/skills/*/SKILL.md`, and `.claude/skills/*/SKILL.md` must reference a master coordination token (`AGENT_STATUS.md`, `INTEGRATION_GUIDE.md`, `SHARED_CONTEXT.json`, or "master files") — drift simulation confirmed the validator fails precisely on the offending file.

Project guidance is now coordinated by:

Master coordination layer:
- `AGENT_STATUS.md`
- `INTEGRATION_GUIDE.md`
- `docs/*`
- `references/*`
- `plans/*`
- `projects/*`
- `templates/*`
- `.agent/*`

Codex side:
- `AGENTS.md`
- `agents/*.toml`
- `.agents/skills/*/SKILL.md`

Claude Code side (added 2026-06-04):
- `CLAUDE.md`
- `.claude/agents/*.md`
- `.claude/skills/*/SKILL.md`
- `.claude/settings.json`

Shared planning files:
- `.codex/PROJECT_BRIEF.md`
- `.codex/DEVELOPMENT_PLAN.md`
- `.codex/FEATURE_GUARDS.md`
- `.codex/UPLOADS_PLAN.md`
- `.codex/CHANGELOG.md`
- `.codex/HANDOFF.md`

The active plan lives in `.codex/` plus the master coordination files. `AGENTS.md` (Codex root) and `CLAUDE.md` (Claude Code root) point at the master files and `.codex/`. Stable domain docs remain at the project root: `AI_ARCHITECTURE_CONTEXT.md`, `API_INTEGRATION_CONTRACTS.md`, `AUTH.md`, `APP_DATA_SCHEMAS.json`, `AI_SYSTEM_PROMPTS_MASTER.json`.

`improvement.md`, `next-step.md`, and root `UPLOADS.md` were removed on 2026-06-04 (superseded by `.codex/DEVELOPMENT_PLAN.md`, `.codex/FEATURE_GUARDS.md`, and `.codex/UPLOADS_PLAN.md`). The root `README.md` is retained as project description but is not a planning source — neither harness reads or writes it as part of the planning protocol.

## Current App Understanding

- Late-stage local-first Electron communication workbench.
- React/Vite renderer, Express API, Electron shell.
- `FloatingAssistant.tsx` is orchestration.
- Existing feature modules should be extended rather than replaced.
- Contacts and communication memory stay local-first.
- Supabase is identity, telemetry, profile, support, and optional sync durability.
- Generation must stay grounded and evidence must be honest.

## Next Agent Checklist

1. Read `AGENTS.md` (Codex) or `CLAUDE.md` (Claude Code).
2. Read `AGENT_STATUS.md`, `INTEGRATION_GUIDE.md`, and `references/SHARED_CONTEXT.json`.
3. Read all relevant `.codex/*.md` planning files.
4. Pick the matching Codex profile/skill if using Codex.
5. Inspect source files before editing.
6. Make the approved change.
7. Run targeted verification.
8. Update `.codex/CHANGELOG.md` and `.codex/HANDOFF.md`.
9. Update `.codex/DEVELOPMENT_PLAN.md` or `.codex/FEATURE_GUARDS.md` if behavior or workflow changed.
10. Update master coordination files and run `npm run agents:validate`.

## Verification Status

Latest app change (2026-06-15, FloatingAssistant UX & Stability Polish) validated with:

```bash
npm run verify:contact-selection --workspace=apps/web    # passed
npm run verify:cmd-k --workspace=apps/web                # passed
npm run build --workspace=apps/web                       # passed; pre-existing >500 kB bundle warning unchanged
```

Earlier guidance-only audit (2026-06-09, Codex/Claude continuation guidance alignment after current app inspection) validated with:

```bash
npm run agents:validate          # passed
npm run agents:status            # passed; regenerated AGENT_STATUS.md from references/SHARED_CONTEXT.json
# Skipped: app runtime verification
# Reason: guidance/planning-only change after direct source inspection; no runtime app code, prompt, schema, storage, API, IPC, route, translation, or UI behavior changed.
```

Latest app change (2026-06-09, More Features drawer close polish — matched timing, no transparent side ghost, no native close shake) validated with:

```bash
npm run verify:focus-plan --workspace=apps/web            # passed
npm run verify:contact-continuity --workspace=apps/web    # passed
npm run build --workspace=apps/web                        # passed; includes verify:contact-selection; pre-existing >500 kB bundle warning unchanged
npm run electron:build                                    # passed; includes verify:child-window-layout
# Manual desktop smoke still recommended for final drawer animation feel.
```

Earlier app change (2026-06-08, Focus Plan polish — real timing, owed promises, single recommender core, `useFocusPlan` hook, modal a11y) validated with:

```bash
npm run verify:focus-plan --workspace=apps/web            # passed
npm run verify:next-step --workspace=apps/web             # passed
npm run verify:contact-continuity --workspace=apps/web    # passed
npm run verify:smart-reply --workspace=apps/web           # passed
npm run build --workspace=apps/web                        # passed (pre-existing >500 kB bundle warning unchanged)
# Not run: npm run electron:build (renderer-only change); manual desktop smoke (npm run desktop:dev).
```

Latest app change (2026-06-07, Guided Work Buddy v2 — one-best-move recommendations + Daily Brief reasons/micro-asks) validated with:

```bash
npm run verify:next-step --workspace=apps/web              # passed
npm run verify:smart-reply --workspace=apps/web            # passed
npm run verify:contact-continuity --workspace=apps/web     # passed
npm run verify:contact-selection --workspace=apps/web      # passed
npm run build --workspace=apps/web                         # passed (pre-existing >500 kB bundle warning unchanged)
npm run verify:quality-guard --workspace=apps/web          # first failed in sandbox DNS fetching tsx from registry.npmmirror.com; rerun with approved network escalation passed
npm run verify:smart-suggestions --workspace=apps/web      # first failed in sandbox DNS fetching tsx from registry.npmmirror.com; rerun with approved network escalation passed
# Skipped: full `npm run build`, `npm run electron:build`
# Reason: renderer-only command-center/workbench change; no API contract / Electron IPC touched.
```

Latest app change (2026-06-07, Guided Work Buddy v1 — confidence cue + outcome-led selected-contact CTA) validated with:

```bash
npm run verify:quality-guard --workspace=apps/web      # passed (wiring + runtime rule tests)
npm run verify:next-step --workspace=apps/web          # passed
npm run verify:smart-reply --workspace=apps/web        # passed
npm run verify:contact-continuity --workspace=apps/web # passed
npm run build --workspace=apps/web                     # passed (includes verify:contact-selection; pre-existing >500 kB bundle warning unchanged)
npx tsc --noEmit                                       # only pre-existing baseline errors; none reference the new/edited files
# Skipped: full `npm run build`, `npm run electron:build`
# Reason: renderer-only change; no API contract / Electron IPC / detached-window surface touched.
```

Latest guidance-only sync (2026-06-07, Codex skill pickup alignment) validated with:

```bash
npm run agents:validate          # passed
# Skipped: app runtime verification
# Reason: guidance/planning-only change to Codex skills and handoff/changelog; no runtime code, prompt, schema, or API contract changed.
```

Latest app change (2026-06-07, target recipient chip row hardened with inline grid styles) validated with:

```bash
npm run verify:contact-selection --workspace=apps/web    # passed
npm run build --workspace=apps/web                       # passed (pre-existing >500 kB bundle warning unchanged)
# Skipped: full `npm run build`, `npm run electron:build`, `verify:child-window-layout`
# Reason: renderer-only change to ComposerPanel.tsx (recipient row inline-style restructure); no API contract / Electron IPC / detached-window surface touched.
```

Earlier same day (2026-06-07, target recipient chip row first half-width attempt — superseded by inline-style version above) validated with:

```bash
npm run verify:contact-selection --workspace=apps/web    # passed
npm run build --workspace=apps/web                       # passed
```

Earlier same day (2026-06-07, compose-coach toast redesign — final bright white iteration) validated with:

```bash
npm run verify:compose-coach --workspace=apps/web        # passed
npm run build --workspace=apps/web                       # passed (includes verify:contact-selection; pre-existing >500 kB bundle warning unchanged)
# Skipped: full `npm run build`, `npm run electron:build`, `verify:child-window-layout`
# Reason: renderer-only change to ComposeCoachStrip.tsx + ComposerPanel.tsx + translations EN/ZH; no API contract / Electron IPC / detached-window surface touched.
```

Earlier same day (2026-06-07, compose-coach strip position fix and intermediate iterations) validated with:

```bash
npm run verify:compose-coach --workspace=apps/web        # passed
npm run verify:next-step --workspace=apps/web            # passed
npm run verify:smart-reply --workspace=apps/web          # passed
npm run build --workspace=apps/web                       # passed (includes verify:contact-selection; pre-existing >500 kB bundle warning unchanged)
```

Earlier app change (2026-06-06, continuity presentation) validated with:

```bash
npm run verify:contact-continuity --workspace=apps/web   # passed
npm run verify:next-step --workspace=apps/web            # passed
npm run verify:contact-selection --workspace=apps/web    # passed
npm run build --workspace=apps/web                       # passed (pre-existing bundle warning unchanged)
# Skipped: full `npm run build`, `npm run electron:build`, `verify:child-window-layout`
# Reason: renderer-only change, no API contract / Electron IPC / detached-window surface touched.
```

Earlier app change (2026-06-04, master coordination layer + sales workbench) validated with:

```bash
npm run agents:validate          # passes (hardened — also asserts master-file refs in every agent/skill)
npm run agents:status            # regenerates AGENT_STATUS.md from references/SHARED_CONTEXT.json
npm run agents:sync              # full pipeline: validate → status → validate → "agent sync OK"
# drift simulation
sed -e 's/AGENT_STATUS\.md//g' .claude/skills/.../SKILL.md  # then `agents:validate` correctly FAILS
python3 TOML validation for agents/*.toml and .codex/config.toml
node JSON validation for package.json, references/SHARED_CONTEXT.json, and .claude/settings.json
npm run verify:smart-reply --workspace=apps/web
npm run build --workspace=apps/web
npm run verify:voice-profile-fragment --workspace=apps/api
npm run verify:cross-language-fragment --workspace=apps/api
npm run verify:next-step --workspace=apps/web
npm run verify:quality-guard --workspace=apps/web
npm run verify:contact-continuity --workspace=apps/web
python3 TOML validation for agents/*.toml and .codex/config.toml
node JSON validation for .claude/settings.json
npm run build
```

Note: `verify:quality-guard` first failed under sandbox DNS while npm tried to fetch `tsx` from `registry.npmmirror.com`; it passed after approved network escalation.

Legacy planning filename references were removed from Codex/agent guidance. Remaining `verify:next-step` text is a script name for the existing guidance-ring regression check, not a dependency on an external planning file.
