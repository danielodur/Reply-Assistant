# Codex Development Plan

Last updated: 2026-06-09

This is the Codex-owned development plan. Keep it current after approved changes. Do not truncate shipped context into vague summaries, and do not delete shipped features unless the user explicitly approves removing them.

## Current Foundation

The app already has:

- Auth-gated Electron workbench with Supabase email verification and Netlify deep-link callbacks.
- Daily Brief, Open Actions, Today Queue, Action Inbox, Weekly Recap, Contacts, Recent Replies, Snippets, Business Context, Settings, Help Center, and Refer Friends.
- Explicit selected-contact behavior with cross-window sync.
- Contact memory, timelines, pending drafts, recent replies, style memory, and business context stored local-first.
- Smart Capture and paste matching with confirmation for risky matches.
- One-click Smart Reply and lazy-mode draft preparation.
- Next-step guidance ring with single active primary cue.
- Cmd+K command palette and calm hint behavior.
- Cross-language detection, reply-language toggle, cultural tips, and backend cross-language prompt honor.
- Perfect-contact wizard with communication preference capture.
- Quality guard, impression checks, voice-match meter, high-stakes copy guard, and full evidence expander.
- Native desktop notifications, quiet hours, badge count, and notification action focus.
- Guided tour with sample contact.
- Sales scenario registry with stage-aware ranking.
- Relationship memory, intent chip, compose coach, rewrite modes, outcome signals, follow-ups, send-timing intelligence, and voice profile prompt fragment.
- Upload/OCR modules and UI scaffolding for composer, business, and contact attachments.
- Sales/client-ops workbench simplification: More Features now separates core client work from secondary utilities, Quick Start hides outside the empty starting state, and contact continuity memory flows into generation.
- Local contact continuity memory: long-thread summaries, open commitments, and reply outcome learning are stored local-first and included in contact thread context.
- Continuity presentation on the main workbench: `RememberedContextDock` (replaces the former in-flow `ContactMemoryCue` card, which was removed because it pushed the input box down and cluttered the screen). The dock is overlay-only and never affects layout. The remembered-context bell now lives in the top header action cluster next to the amber Focus Plan icon, not on the left screen edge. Opening it shows a right-side icon-anchored popover with a transparent click-away wrapper, notch pointed at the bell, viewport-capped internal scrolling, and no blur/dim/blank side-panel behavior. The auto-dismiss peek remains a wide horizontal toast (who · when + top line) modeled on `ComposeCoachStrip` and gated by `composeCoachSuppressed`. Cards are actionable: needs-reply → "Reply now", promise → "Follow up" (both `onActNow` → `focusComposer`), "Mark done" → `dismissCommitment`, inline ✎ summary edit → `updateThreadSummary` with a large editor, read-only reply-learning; relative "when" via `formatRelativeAge`. User dismissals and edited summaries survive auto-refresh via `dismissedCommitmentIds` and `ContactThreadSummary.locked`.
- Target recipient chip row: the shipped active row is the TARGET section in `FloatingAssistant.tsx`, where External (`workMode === 'reply'`) lives in the left half-lane and Internal lives in the right half-lane. Each lane is clipped by `relative min-w-0 overflow-hidden`; External has `clean-scrollbar overflow-x-auto overflow-y-hidden`, `recipientScrollRef`, fade gradients, a `flex flex-nowrap` track with inline `width: 'max-content'`, and `shrink-0 whitespace-nowrap` chips. Internal keeps a right-aligned no-wrap lane so long labels cannot bleed across the centerline. `ComposerPanel.tsx` still preserves the inactive inline-grid reference implementation (`showModeAndRecipient={false}` in the only shipped call site). Single-line horizontal scroll, never wraps, never spills across the centerline.
- Guided Work Buddy v1 (first cut): the generated-reply modal leads with a single plain-language confidence cue (`ConfidenceLine` driven by the pure `buildConfidenceVerdict`) that collapses impression check + voice match + grounding into one honest sentence with a colored dot, in the header slot that previously held the static "Ready to copy and send" subtitle. Ordering is honesty-first (impression warning or voice "different" outranks "ready"). Anti-clutter: `VoiceMatchMeter` is gated to the actionable `different` state, the impression card self-hides unless warning, and the "why/evidence" expander is unchanged — `ImpressionCheckChip`/`VoiceMatchMeter`/`WhyThisReplyExpander` remain rendered for the verify contract. The selected-contact Daily Brief CTA (`useCommandCenterPrimary`) is outcome-led ("Add detail"/"Reply now"/"Follow up"/fallback "Use Contact") with unchanged behavior. EN+ZH keys added for all four confidence sentences and the two CTA verbs.
- Guided Work Buddy v2: command-center recommendation model chooses one best next move (draft ready, action inbox, upload review, reply, add detail, follow-up, active contact, add contact, or clear). Daily Brief shows one short reason line, exposes a compact missing-context micro-ask only when the composer is empty, routes low-confidence attachment review to the right existing surface, and falls back to a calm clear-for-now state when no client action needs attention.
- Focus Plan overlay: the former inline Action Center overlay is now a compact `FocusPlanModal` backed by pure `buildFocusPlan`. It derives at most three industry-neutral work items ("Start here" / "Next" / "Later") from existing local signals only: pending drafts, Action Inbox, upload review, reply-needed contacts, missing detail, owed promises, follow-up/open loop, and Today Queue tasks. It dedupes same-contact work, routes actions through existing handlers, uses the existing header action button ("Open plan"), and adds no permanent main-screen block, chatbot surface, backend contract, or new storage.
- Focus Plan polish (2026-06-08): the "When" pill preserves real timing (estimate is only a hint); reply/follow-up items show a real send-timing window via `deriveSendTimingHint` when the contact's band is known and the current hour is outside it; owed promises (`openCommitments` kind `promise`) are a new source ranked just below `reply-now`; the Daily Brief recommendation and Focus Plan share one ranking core (`collectHeadWorkSignals` in `leadWorkSignal.ts`) so their top item can't disagree; orchestration moved out of `FloatingAssistant.tsx` into the `useFocusPlan` hook; and `FocusPlanModal` gained Escape/backdrop close, focus-on-open + focus trap, a full-width "Start here", larger fonts, and a warm clear state.
- Focus Plan visual contract (2026-06-08): the popover opens from the header action without dimming or blurring the workbench. It uses the normal expanded Electron panel path for right-side icon-anchored placement, but the expanded area stays transparent (`body` background transparent and Electron window transparent), so Focus Plan does not show a dull blank right-side panel behind the card. The desktop IPC signature remains `setPanelOpen(open: boolean)` with no custom Focus Plan width.
- Focus Plan overflow contract (2026-06-08): the card is viewport-capped and its task body scrolls internally, so extra tasks or longer EN/ZH text never push the anchored popover off-screen.
- Focus Plan child-screen routing contract (2026-06-08): Today Queue `open-screen` tasks launched from the plan use `openMiniScreen(action.screenId)`, which opens detached draggable Electron child windows when available. Do not bypass this with direct inline `setActiveMiniScreen(action.screenId)`.
- More Features drawer close contract (2026-06-09): More Features slides left instead of abruptly disappearing or showing a transparent side ghost. The drawer's own transform transition remains in `more-features.tsx`; `MORE_FEATURES_EXIT_MS` and `MORE_FEATURES_DRAWER_TRANSITION_MS` must stay tied at 300ms. The drawer width is tied to the actual Electron expansion delta with `MORE_FEATURES_DRAWER_WIDTH = 184`, anchored at fixed `left-[390px]`, and the closed transform must be `-translate-x-full`, moving the drawer left by its own width so it tucks under the right side of the 390px assistant; it must not move 390px left under the whole assistant. `MoreFeatures` receives `visible={isMoreFeaturesVisible}` and applies `visible ? 'visible' : 'invisible'` after the close hold. `FloatingAssistant.tsx` must keep `isMoreFeaturesVisible = isMoreFeaturesOpen || isMoreFeaturesClosing` for the main panel corner state and other visual gates, but `isMoreFeaturesClosing` must not keep `setPanelOpen(true)` active; otherwise the expanded Electron shell remains as a transparent ghost area during close. `electron/main.ts` owns the matching non-native 300ms panel-close width tween (`PANEL_CLOSE_ANIMATION_MS = 300`) from 574px to 390px and must not use native animated close bounds that shake the whole assistant. This is presentation/orchestration only; child-screen routing, Focus Plan, remembered context, IPC shape, storage, prompts, and translation keys are unchanged.
- Compose coach toast on the main workbench: `ComposeCoachStrip` is a dismissible bright white toast with `border-amber-200`, amber accent eyebrow + glyph, and a pronounced 480ms pop-in animation (scale 0.55 → 1, bounce overshoot). Positioned at `bottom-[5rem]` inside the composer's `relative` inner box — slightly below the vertical center — so the top of the textarea stays fully visible. Anti-clutter: one warning at a time, with a close (×) button; dismissed ids reset automatically when the underlying warning leaves the active set. Honors `suppressed` so heavier surfaces still own attention. Inner div uses `key={activeWarning.id}` so React remounts on each new warning id and the entry animation always runs.

## Active Priorities

1. Preserve the trust-and-flow workbench while improving continuity across sessions.
2. Keep future work inside existing modules unless a new boundary is clearly justified.
3. Keep the main screen focused on the next business communication action; secondary utilities stay reachable but not promoted.
4. Advance attachment/OCR usefulness without fake extraction or ungrounded claims.
5. Strengthen long-thread continuity: summaries, commitments, and accepted/rejected suggestion learning.
6. Keep auth and local-first storage boundaries stable.
7. Maintain fast targeted verification so development remains smooth.

## Near-Term Work Candidates

- Refine learning loop quality: better classification of accepted, edited, and regenerated draft outcomes without adding noisy UI.
- Local context retrieval: better selection of relevant contact/business memory for each generation.
- Upload confidence handling: make low-confidence attachment summaries visible and non-deceptive.
- Notification manual QA: macOS and Windows click-through, badge, quiet-hours, and focus behavior.
- Bundle and code-splitting hygiene for large renderer surfaces.

## Upload And OCR Direction

The full upload/OCR spec — UX rules, per-surface limits, file types, data model, provider order, confidence thresholds, caching, API contract, security, acceptance checks — lives in `.codex/UPLOADS_PLAN.md`.

Quick reference for plan-level priorities:

- Composer reply attachments: up to 3 temporary files for the current draft.
- Business context attachments: up to 5 local summaries.
- Contact attachments: up to 5 local summaries per contact.
- Provider order: Aliyun → Google Vision → Azure (no fake OCR when keys are absent).
- Confidence thresholds: ≥0.85 ready, 0.65–0.85 needs-review, <0.65 retry/fail.
- Cache OCR results by SHA-256 hash for at least 30 days.

When upload/OCR behavior changes, update `.codex/UPLOADS_PLAN.md` first; only update this section if priorities or shipped status shift.

## Plan Update Rules

After any approved change — applies to **both Codex and Claude Code** in the same change set:

- Add a dated entry to `.codex/CHANGELOG.md` (append, never truncate, never compress history).
- Update `.codex/HANDOFF.md` with current state and next recommended checks (surgical edits, no vague summaries).
- Update this file when priorities, shipped status, or next work changes. Shipped features stay listed.
- Update `.codex/FEATURE_GUARDS.md` when a new protected behavior or invariant appears (append-only — removal needs explicit user approval).
- Update master coordination files after every approved change: `AGENT_STATUS.md`, `references/SHARED_CONTEXT.json`, and relevant files under `plans/`, `projects/`, `docs/`, or `references/`.
- Update Codex-side workflow files when Codex workflow itself changes: `AGENTS.md`, `agents/*.toml`, `.agents/skills/*/SKILL.md`.
- Do not edit `.claude/*` for routine app changes. Edit `.claude/*` only when Claude Code runtime instructions, permissions, agents, or skills changed.
- Run `npm run agents:validate` after coordination-file changes; run `npm run agents:status` or `npm run agents:sync` when status should be regenerated.
- Never delete a shipped feature from the plan without explicit user approval naming the feature.
- Record exact verification commands run and their result. Name any skipped commands and why.

## Master Coordination Protocol

Codex and Claude Code are peers operating on the same codebase against `.codex/` and the master coordination files.

- Both harnesses read `AGENT_STATUS.md`, `INTEGRATION_GUIDE.md`, `references/SHARED_CONTEXT.json`, and `.codex/*.md`.
- Shared workflow state lives in master files rather than duplicated Claude/Codex private files.
- Codex may update Codex-specific agent profiles and skills when its own workflow changes.
- Claude Code may update `.claude/*` only when Claude runtime configuration itself changes.
- `scripts/validate-plans.js`, `scripts/generate-status-report.js`, and `scripts/sync-agents.js` keep the master layer checkable.
