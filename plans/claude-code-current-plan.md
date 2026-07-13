# Claude Code Current Plan

Last updated: 2026-06-09

## Current Task

No active Claude Code task is recorded in this workspace.

## Cross-Harness Latest App Work

Codex latest app work on 2026-06-09 fixed the remaining More Features drawer close artifacts. The current contract is precise: `apps/web/src/components/more-features.tsx` exports `MORE_FEATURES_DRAWER_TRANSITION_MS = 300` and `MORE_FEATURES_DRAWER_WIDTH = 184`, anchors the drawer at fixed `left-[390px]`, closes it left with `-translate-x-full` by exactly its own width, and applies `visible ? 'visible' : 'invisible'` after the close hold. `FloatingAssistant.tsx` derives `isMoreFeaturesVisible = isMoreFeaturesOpen || isMoreFeaturesClosing` for the main panel visual state, but deliberately excludes `isMoreFeaturesClosing` from the `setPanelOpen(true)` expression so the Electron shell does not remain fully expanded as an empty transparent ghost area. `electron/main.ts` owns the matching cancellable 300ms non-native close tween (`PANEL_CLOSE_ANIMATION_MS = 300`) from 574px to 390px. Future Claude Code work must not reintroduce `-translate-x-[390px]`, a right-anchored drawer, native animated close bounds, or a fully expanded transparent shell during drawer close. Verification used: `verify:focus-plan`, `verify:contact-continuity`, `build --workspace=apps/web`, and `electron:build`; manual desktop smoke is still useful for final animation feel.

Remembered context is also current as of 2026-06-09. The "Needs reply / Thread summary · Based on N messages" surface opens from the header bell beside the amber Focus Plan icon, not from the left screen edge, and renders as a right-side icon-anchored popover with a transparent click-away wrapper, no blur/dim layer, no blank in-panel side surface, generated-reply-like height (`POPOVER_MIN_HEIGHT = 640` when space allows), large summary read/edit areas, assisted edit mode, no restrictive long-summary cap, and fixed Cancel/Save actions outside the textarea scroll. The remembered-context bell is action-only: saved/locked summaries and reply-learning remain in local contact memory but do not keep a zero-value notice icon visible. Future Claude Code work should preserve `.codex/FEATURE_GUARDS.md` remembered-context invariants and run `verify:contact-continuity` plus web build after touching that surface; add `verify:focus-plan` when the shared header action cluster or transparent expanded popover path changes.

Focus Plan remains the compact plan overlay. The old inline Action Center overlay in `FloatingAssistant.tsx` is `FocusPlanModal` backed by pure `buildFocusPlan`: at most three industry-neutral work items (`Start here` / `Next` / `Later`) derived from existing local signals only, deduped by contact/source, opened from the existing header action button, with no permanent main-screen block, chatbot surface, backend contract, or new storage. Visual guard: no blur/dim overlay, no custom Electron panel width, transparent expanded right-side placement, viewport-capped card, internal task-list scroll, and `setPanelOpen(open: boolean)`. Orchestration belongs in `useFocusPlan`, and Today Queue `open-screen` actions must route through `openMiniScreen(action.screenId)` so Electron keeps detached child-window behavior. Future Claude Code work should run `verify:focus-plan` after touching planner/modal/header-plan behavior.

Other fragile shipped UI contracts remain active: the TARGET recipient row in `FloatingAssistant.tsx` is the active half-lane single-line horizontal-scroll surface; `ComposerPanel.tsx` is only the inactive inline-grid reference because the shipped call passes `showModeAndRecipient={false}`. `ComposeCoachStrip` is the bright white one-warning toast with `bottom-[5rem]`, 480ms bounce pop-in, and `key={activeWarning.id}` remount behavior. Preserve both contracts unless the user explicitly approves changing them.

## Last Completed

Most recent Claude Code app work recorded in shared status: Focus Plan polish built on Codex's Focus Plan while preserving all invariants. The `FocusPlanModal` When pill preserves the real timing label and only appends minute estimates as hints; reply/follow-up items can surface real send-timing windows; owed promises from contact-memory commitments are a plan source ranked below unanswered replies; Daily Brief and Focus Plan share `collectHeadWorkSignals` so the top recommendation cannot silently disagree; orchestration moved from `FloatingAssistant.tsx` into `useFocusPlan`; and the modal gained Escape/backdrop close, focus-on-open/focus trap, a full-width "Start here", larger fonts, and a warm clear state. Verified with `verify:focus-plan`, `verify:next-step`, `verify:contact-continuity`, `verify:smart-reply`, `build --workspace=apps/web`, and `electron:build`.

Earlier Claude Code app work: Main workbench TARGET row fixed in the active `FloatingAssistant.tsx` surface so External recipient chips no longer wrap into a second line. The active TARGET row uses fixed half-lanes: External (`workMode === 'reply'`) sits in the left `relative min-w-0 overflow-hidden` lane with `w-5` fade gradients, `clean-scrollbar overflow-x-auto overflow-y-hidden`, `recipientScrollRef`, `updateRecipientFade`, a `flex flex-nowrap` chip track with inline `width: 'max-content'`, and `shrink-0 whitespace-nowrap` chips. Internal sits in the right `relative min-w-0 overflow-hidden` lane with `flex-nowrap` and right alignment so long labels cannot bleed across the centerline. `ComposerPanel.tsx` remains the inactive reference implementation because the only shipped call passes `showModeAndRecipient={false}`. Renderer-only; no `/api/generate`, route, IPC, state, handler, or copy change. Verified with `npm run build --workspace=apps/web`; manual desktop smoke still recommended for fade/scroll feel.

Guided Work Buddy v1 (first cut) — consolidates the spread-out reply intelligence into one calm, honesty-first cue in the generated-reply modal.

Implementation:
- `apps/web/src/components/quality-guard/buildConfidenceVerdict.ts` (new) — pure, testable verdict builder that collapses impression check + voice match + grounding into one of `ready` / `ready-voice` / `review` / `voice-off` / `thin`. Honesty-first ordering: an impression warning or voice `different` always outranks a reassuring `ready`, so the cue can never claim safety when a signal disagrees.
- `apps/web/src/components/quality-guard/ConfidenceLine.tsx` (new) — calm one-line presentational cue (colored dot + plain-language sentence). Houses logic + view outside the 653-line modal to keep it lean.
- `apps/web/src/components/workbench/GeneratedReplyModal.tsx` — computes the verdict from existing props and renders `ConfidenceLine` in the header subtitle slot that previously held the static "Ready to copy and send." `VoiceMatchMeter` is gated to the actionable `different` state; `ImpressionCheckChip` self-hides unless there is a warning; `WhyThisReplyExpander` is unchanged. All three quality-guard components remain rendered so the `verify:quality-guard` contract holds.
- `apps/web/src/components/command-center/useCommandCenterPrimary.ts` — selected-contact Daily Brief CTA is now outcome-led ("Add detail" / "Reply now" / "Follow up" / fallback "Use Contact"); behavior unchanged, label now names the action.
- New EN+ZH keys for all four confidence sentences (`modal.confidence*`) and the two CTA verbs (`floating.addDetailCta` / `floating.followUpCta`).

Renderer-only; no `/api/generate` shape change, no Electron IPC change. Deliberately did NOT add a separate pre-brief recall line — remembered context is now represented by the overlay-only `RememberedContextDock`, and duplicating it would be clutter. New Workbench invariant added to `.codex/FEATURE_GUARDS.md` protecting the cue as the single calm lead with detail kept on-demand. Verified via `verify:quality-guard`, `verify:next-step`, `verify:smart-reply`, `verify:contact-continuity`, and `build --workspace=apps/web` (all pass); `tsc --noEmit` shows only the pre-existing baseline config deprecation.

Earlier same day: Target recipient chip row in the composer (`apps/web/src/components/workbench/ComposerPanel.tsx`) hardened so wrapping is **structurally impossible** regardless of Tailwind version or HMR cache state.

Implementation:
- Outer grid uses inline `style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}` — `grid-cols-2` was rejected because Tailwind compiles `1fr` to `minmax(auto, 1fr)`, whose `auto` minimum lets the column grow with its content and broke the half-width constraint in the first attempt.
- The scroll lane uses inline `style={{ gridColumnStart: workMode === 'internal' ? 2 : 1 }}` — selects the left lane for External (`workMode === 'reply'`) or the right lane for Internal. Lane carries `overflow-hidden` as a hard clip boundary; inner `overflow-x-auto overflow-y-hidden` provides the actual horizontal scroll.
- Chip track is `flex flex-nowrap items-center pr-5` with inline `style={{ width: 'max-content' }}` — guarantees the track is exactly content-wide and never wraps, no reliance on the `w-max` utility class which can be JIT/purge-dependent.
- Chips are `shrink-0 whitespace-nowrap` — cannot be compressed, text cannot break.
- Fade gradients sit at `w-5` against the `#fff7fa` card surface and react to `hasLeftRecipientFade` / `hasRightRecipientFade` from the scroll handler.

Behavior: External chips stay in the left half-lane, Internal chips stay in the right half-lane; only one or two chips are visible at rest, the user scrolls inside the lane to reveal the rest. Symmetric for both modes, never crosses the centerline of the mode toggle, never wraps. New Workbench invariant added to `.codex/FEATURE_GUARDS.md` that explicitly forbids reverting this inactive `ComposerPanel.tsx` reference row to `grid-cols-2` or to class-only `col-start-*` / `w-max`.

Earlier same day: Compose-coach toast iterated through three visual revisions to converge on a clearly visible **bright white** surface (`bg-white` over `border-amber-200`, soft amber-tinted lift shadow, `#1f1812 font-medium` text, `text-amber-700` eyebrow, filled `bg-amber-400` `!` chip) with an unmissable 480ms pop-in (scale 0.55 → 1, translateY 16px → 0, opacity 0 → 1, easing `cubic-bezier(0.34, 1.56, 0.64, 1)` for a bounce overshoot). `key={activeWarning.id}` on the inner div guarantees React remount per new warning id so the entry animation always runs; double-`requestAnimationFrame` still primes the collapsed state on initial mount. Toast positioned at `bottom-[5rem]` inside the composer's `relative` inner box — slightly below the vertical center, top of the textarea fully visible, clear gap above the ⌘↵ / Generate row. Anti-clutter contract preserved (one warning at a time, close × button, dismissed ids auto-reset, `suppressed` short-circuits to `null`). `coach.dismiss` translation added in EN + ZH. New Workbench invariant added to `.codex/FEATURE_GUARDS.md` covering the bright white surface, the animation thresholds (≥420ms / ≤0.6 scale / ≥12px translateY with bounce easing), and the `key`-based remount pattern.

Earlier on the same day: compose-coach strip overlap fix — the prior amber block strip was inside the composer's bottom padding zone and collided with the attach (+) button (`absolute bottom-3 left-3 right-[6.7rem] z-20`) and the ⌘↵ / Generate row (`absolute bottom-3 right-3 z-10`). The new toast is anchored to the composer's `relative` inner box but layered above the bottom action zone, so the overlap cannot recur. Intermediate dark-slate (initial redesign) and warm-pearl (mid iteration) versions are superseded by the final bright white surface above.

## Earlier Notes

Compose-coach toast iterated again after the user reported the previous pearl version still read as dark. `ComposeCoachStrip` now uses a **bright `bg-white`** surface with a crisp `border-amber-200` edge and a soft amber-tinted lift shadow (`0_20px_44px_-10px_rgba(218,143,73,0.32),0_2px_8px_rgba(31,24,18,0.08)`). No backdrop-blur (it muted the white). Text is near-black `#1f1812` with `font-medium`; eyebrow is `text-amber-700`; the alert glyph is a filled `bg-amber-400` chip with white `!` and its own amber drop shadow. Fix button is an amber-50 pill with amber-300 border and amber-800 text; close (×) is slate-400 → slate-700 on hover. Reads unmistakably as a clear professional notification against the cream composer.

Animation is now unmissable: duration `480ms`, scale `0.55 → 1`, translateY `16px → 0`, opacity `0 → 1`, easing `cubic-bezier(0.34, 1.56, 0.64, 1)` for a pronounced bounce overshoot. Added `key={activeWarning.id}` on the inner toast div so React **remounts** on every new warning id — guarantees a fresh entry animation even when one warning replaces another while the toast is already visible. The existing double-`requestAnimationFrame` prime still runs on initial mount so the collapsed state is committed before the transition.

Position raised from `bottom-[3.5rem]` to `bottom-[5rem]` inside the composer's `relative` inner box. The toast now sits slightly below the vertical center of the box (≈62% from top in a 204px box). Top of the textarea stays fully visible; the toast still has a clear gap above the ⌘↵ / Generate action row. Padding bumped to `py-2` for more presence without crowding. Anti-clutter contract unchanged.

Updated `.codex/FEATURE_GUARDS.md` invariant: bright white surface, amber accents, animation thresholds (≥420ms / ≤0.6 scale / ≥12px translateY / bounce easing), and the `key`-based remount pattern are all now protected.

Earlier same day: compose-coach strip position fix that moved the prior amber block strip out of the bottom padding zone where it overlapped the `+` attach button and the ⌘↵ / Generate row. The new toast supersedes that block strip.

Earlier: Continuity presentation on the main workbench originally used `ContactMemoryCue` as a compact multi-line + expandable review surface; that surface has since been replaced by overlay-only `RememberedContextDock`. User dismissals and edited summaries survive auto-refresh via `ContactThread.dismissedCommitmentIds` and `ContactThreadSummary.locked`.

## Next Steps

1. Read `AGENT_STATUS.md`, `INTEGRATION_GUIDE.md`, `references/SHARED_CONTEXT.json`, and `.codex/*` before non-trivial work.
2. Use master files as shared coordination state.
3. Avoid routine `.claude/*` edits unless Claude Code runtime instructions or permissions changed.

## Notes

Claude Code remains a peer implementation harness, but product and workflow state now lives in master files plus `.codex/`.
