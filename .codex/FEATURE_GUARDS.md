# Codex Feature Guards

Last updated: 2026-06-09

This file protects the app from accidental feature loss during agent-driven development. Update it when approved changes add new invariants.

## Storage And Data Guards

- Contacts, memory, drafts, timelines, queues, recent replies, and selected contact remain local-first.
- Supabase is identity, telemetry, profile, support, and optional sync durability only.
- Do not add contact/message tables as canonical storage without explicit approval.
- Do not replace existing localStorage keys or migration behavior without preserving user data.
- Do not store raw uploaded binaries in localStorage.

## Generation Guards

- Build generation requests through `buildStructuredRequest`.
- Normalize generation requests through `normalizeGenerateRequest`.
- Do not change `/api/generate` shape without frontend, backend, docs, and verification updates.
- Keep optional prompt blocks omission-safe.
- Do not invent "Based on" evidence or values not present in contact, business, message, or attachment context.
- Supported providers in server code are `deepseek`, `openai`, `zhipu`, `qwen`, and `moonshot`.
- Do not claim unsupported providers are active.

## Integration Guards

- Email sync can use IMAP, Gmail OAuth, and Microsoft OAuth as implemented.
- Social/chat surfaces must stay honest about webhook, import, bot, or scaffold status.
- Do not add unauthorized scraping for WhatsApp, WeChat, DingTalk, Telegram, Gmail, Microsoft, or any platform.
- Official integrations must include the real auth, scope, webhook, review, or business-account requirements.

## Auth Guards

- Do not bypass `AuthGate` or verified-email access to the workbench.
- Do not expose service-role keys to renderer or static auth pages.
- Account delete stays API-side with Bearer auth.
- Deep-link changes must update Electron, static callback pages, and renderer auth config together.
- Password rules must stay aligned between renderer and static callback code.

## Workbench Guards

- `FloatingAssistant.tsx` should remain orchestration-focused.
- Put new state in existing state hooks or focused sibling hooks.
- Add workbench UI in focused components instead of growing `FloatingAssistant.tsx` or `more-features.tsx` with large inline surfaces.
- Preserve explicit selected-contact behavior; no bootstrap auto-selection.
- Medium-confidence paste matches require user confirmation.
- Child windows must keep selected-contact and generated-reply IPC behavior aligned.
- Keep one active next-step cue; do not show competing proactive prompts.
- Keep the header status pill as the single success/status surface.
- Do not reintroduce wide duplicate toasts over Daily Brief.
- Contact continuity memory (thread summaries, open commitments, reply learning) stays local-first and optional; older stored contacts must normalize without data loss.
- User intent on continuity must survive auto-refresh: a `ContactThreadSummary.locked` summary keeps its text through `refreshContactContinuity` (counts/timestamps may update); commitments whose `sourceMessageId` is in `ContactThread.dismissedCommitmentIds` must not reappear on refresh. `dismissContactCommitment` and `updateContactThreadSummary` are the canonical mutators.
- Remembered context (`RememberedContextDock`, `apps/web/src/components/workbench/RememberedContextDock.tsx`) is **overlay-only and must never occupy document flow** on the main workbench. The earlier in-flow `ContactMemoryCue` card was removed precisely because it pushed the paste-message input box down and cluttered the calm screen — do not reintroduce an in-flow remembered-context block between the Daily Brief card and the composer (or anywhere in the scroll flow). The left-edge bell and centered blur/dim stack are also retired. Current invariants:
  - The remembered-context bell lives in `WorkbenchHeader.tsx`, in the compact partially overlapping action-icon row next to the amber Focus Plan icon, between the language and text-type controls. Do not move it back to the left screen edge. The bell uses `[data-remembered-context-anchor]`, shows a count badge only when remembered context exists, and may use the calm `remembered-bell-attention` ring+zoom only when there is an open commitment.
  - The opened surface is a right-side icon-anchored popover, not an in-panel modal stack. It measures `[data-remembered-context-anchor]`, uses a transparent `fixed inset-0 z-[68]` click-away wrapper, points a notch at the bell, caps height to the viewport, and scrolls content internally. It participates in the normal Electron expanded-panel path through `isRememberedContextOpen`, but the expanded area must remain visually transparent. The popover should keep a generated-reply-like vertical scale when space allows (`POPOVER_MIN_HEIGHT = 640` or equivalent) so it does not feel like a cramped half panel.
  - Do not add `backdrop-blur`, dim layers, frosted overlays, grey/white blank side panels, or a centered duplicate app-like surface to remembered context. `verify:contact-continuity` guards against the old left-edge trigger and blur backdrop.
  - Tapping Focus Plan closes remembered context; tapping remembered context closes Focus Plan. More Features and detached child screens close remembered context. Do not allow these surfaces to stack over each other.
  - The header bell is an action-required notice icon, not a passive archive shortcut. It should appear only when there is unfinished remembered work (`rememberedContextCounts.count > 0`): open commitments and unreviewed/unlocked summaries may count. Saved/locked thread summaries (`threadSummary.locked === true`) and reply-learning remain stored in local contact memory, but they must not keep the bell visible or keep a pending count on the badge. Do not collapse this back to "any remembered context = show notice icon" or users cannot tell when all remembered-context work is finished.
  - The auto-dismiss peek toast remains wide and horizontal (full-width, max ~520px, comfortable margins), fires once when a contact with remembered context is selected, and honors `composeCoachSuppressed` (one-calm-nudge).
  - Cards are **guidance-led and actionable**: needs-reply → **Reply now**, promise → **Follow up** (both call `onActNow` → `focusComposer`), **Mark done** → `dismissContactCommitment`, inline summary edit → `updateContactThreadSummary`, reply-learning read-only. The thread-summary read and edit areas must fill the tall popover and remain large enough for real work (`min-h-[420px]` or equivalent), with internal scroll in both read and edit modes. Edit mode must use the app's assisted text editing behavior (`AssistedNotesTextarea` or equivalent), must not cap existing long summaries with a restrictive `maxLength`, and must keep Cancel/Save visible in a fixed footer outside the textarea scroll. The edit textarea itself must flex above the footer (`min-h-0` or equivalent); do not put the full summary-panel minimum height on the textarea, or it will push the footer out of view. The assisted editor wrapper must stretch as a flex column and the textarea should be `flex-1`, so the bordered input box expands toward the footer instead of leaving a large blank gap.
  - Palette is neutral light-grey/slate (white/near-white surface, `slate-200` border, slate text, soft neutral lift shadow, iOS rounding) — visually distinct from the amber compose-coach toast. Do not introduce new accent colors here, and do not regress the dock back into an always-on in-flow card.
- `ComposeCoachStrip` is the dismissible compose-time coach toast. Layout invariants:
  - Renders as an `absolute inset-x-0 bottom-[5rem] z-30` overlay anchored to the composer's `relative` inner box, sitting slightly below the vertical center of the box. It must not occupy document flow in the composer wrapper (that pushes layout and clutters the calm screen), must not sit at the top of the box (covers the user's freshly typed text), and must not enter the bottom padding zone where the `+` attach strip (`bottom-3 left-3 right-[6.7rem] z-20`) and the ⌘↵ / Generate row (`bottom-3 right-3 z-10`) live.
  - Shows **one** warning at a time — never a stacked list. Anti-clutter is part of the contract.
  - Always includes a close (×) button. Dismissed ids are kept in local state and reset automatically once that warning leaves the active set, so a re-triggered warning can appear again.
  - Honors `suppressed` by short-circuiting to `null` so heavier surfaces (modals, guidance ring, guided tour) own the user's attention (the one-calm-nudge invariant).
  - Uses a bright white surface (`bg-white`) with an `amber-200` border and a soft amber-tinted lift shadow. Text is near-black `#1f1812` with `font-medium`; eyebrow is `amber-700`; alert glyph is a filled `amber-400` chip. Animation must be clearly perceptible: duration ≥420ms, scale ≤0.6 → 1, translateY ≥12px → 0, easing with bounce overshoot (`cubic-bezier(0.34, 1.56, 0.64, 1)` or equivalent). The inner toast div carries `key={activeWarning.id}` so React remounts on each new warning id and the entry animation always runs from scratch; a double `requestAnimationFrame` still primes the collapsed state on initial mount. Do not regress to a dark slate / pearl-grey / amber-block surface, and do not weaken the animation below the thresholds above.
- Generated-reply confidence cue (`ConfidenceLine` + `buildConfidenceVerdict`, rendered in the modal header slot):
  - The verdict ordering is **honesty-first** and must stay that way: an impression-check warning (`hasWarning`) and a voice-match `different` state both outrank a reassuring `ready` / `ready-voice`. The cue must never show a "ready to send" sentence when any quality signal disagrees (this is the concrete "do not hide failures behind confident copy" rule for this surface).
  - It is the single calm lead, not an extra panel. The detailed signals must stay available but on-demand: `ImpressionCheckChip` self-hides unless there is a warning, `VoiceMatchMeter` renders only in the actionable `different` state, and `WhyThisReplyExpander` keeps the full evidence behind its expander. Do not reintroduce an always-on voice chip or a second standing confidence surface.
  - `GeneratedReplyModal.tsx` must keep rendering `<ImpressionCheckChip>`, `<VoiceMatchMeter>`, and `<WhyThisReplyExpander>` (the `verify:quality-guard` contract checks for these tokens); gating their visibility is fine, removing them is not.
- Daily Brief selected-contact CTA is outcome-led: the label is derived from `commandCenterPriority` (`missing-context` → Add detail, `reply` → Reply now, `follow-up` → Follow up, else → Use Contact). The CTA's onClick behavior is unchanged; only the label names the action. Do not regress to a single static "Use Contact" label.
- Daily Brief recommendation flow is one-best-move, not a dashboard. `buildWorkbenchRecommendation` is the canonical priority order for command-center recommendations, and `DailyBriefCard` may show one short reason plus one compact micro-ask only when the recommendation needs missing context and the composer is empty. Do not add competing Daily Brief panels, stacked asks, or duplicate pre-brief memory recall. Attachment review must stay honest: low-confidence / needs-review uploads route to review before being treated as confident evidence.
- Focus Plan (`buildFocusPlan` + `FocusPlanModal`) is the compact office-work plan surface replacing the old inline Action Center overlay. It must stay anti-clutter:
  - Do not add a permanent main-screen block or strip for Focus Plan. The main workbench remains Daily Brief + composer; Focus Plan opens from the existing compact header action button.
  - Derive plan items from existing local signals only. Do not add a new localStorage store, backend endpoint, `/api/generate` payload field, or chatbot-like prompt box for this feature.
  - Cap visible plan items at three (`Start here`, `Next`, `Later`) and dedupe same-contact work so users do not see duplicate reply/follow-up tasks for the same person.
  - Keep copy industry-neutral and non-technical: contact, message, work, action, reply, follow-up, where, when. Do not narrow the product to one industry or expose model/prompt language.
  - Route item actions through existing handlers (`openPendingDraft`, Action Inbox, upload review, Smart Reply/contact selection, add-detail, Today Queue, Contacts). Do not create parallel action execution flows.
  - Focus Plan orchestration lives in the `useFocusPlan` hook (`apps/web/src/components/command-center/useFocusPlan.ts`), not inline in `FloatingAssistant.tsx`. The host passes signals + leaf handlers and renders `focusPlan.items` / `focusPlan.onRunItem`. Do not move the planner build, the action router, or the promise/badge derivations back inline — `FloatingAssistant.tsx` must stay orchestration-only.
  - The Daily Brief recommendation (`buildWorkbenchRecommendation`) and Focus Plan (`buildFocusPlan`) share one ranking core, `collectHeadWorkSignals` (`leadWorkSignal.ts`), for the head tiers (draft → action-inbox → review-file → reply-now → add-detail → follow-up). Their top item must never silently disagree. Do not fork or reorder that head logic in only one consumer.
  - The Focus Plan "When" value must preserve the timing label (`whenLabel`); a minute estimate is only ever an appended hint, never a replacement. When a contact has a confident send-timing band and the current hour is outside it, reply/follow-up items show the real window via `deriveSendTimingHint` (e.g. "Best around 2 PM"); otherwise stay quiet.
  - A promise owed to a contact (contact-memory `openCommitments` of kind `promise`, honouring `dismissedCommitmentIds`) is a Focus Plan source ranked just below `reply-now` and deduped by contact. It routes through the existing follow-up handler — no new action flow.
  - `FocusPlanModal` must stay keyboard- and pointer-friendly: Escape closes, backdrop click closes, the primary "Start here" action is one full-width tap target and receives focus on open, and focus is trapped within the card. The clear state is a calm "all caught up" treatment, never a false action badge (`actionableCount` excludes the clear item).
  - The Focus Plan opens as a compact popover anchored to the warning button it belongs to. It measures the button (`[data-focus-plan-anchor]`) and drops just below it (never covering it) with its notch on the icon's centre. The wrapper is a transparent click-away layer only (`fixed inset-0 z-[68]`): do not add `bg-*` dimming, `backdrop-blur-*`, or any frosted overlay to Focus Plan. Focus Plan may use the normal expanded Electron panel path (`isActionCenterOpen` in the `setPanelOpen` effect) so the popover can sit to the right of the 390px assistant, but the expanded area must remain visually transparent: `body` background is transparent and the main Electron window is transparent. Do not pass a custom width to `desktopApp.setPanelOpen`; `setPanelOpen` stays `(open: boolean)` in `electron/preload.ts`, `electron/main.ts`, and `apps/web/src/global.d.ts`.
  - `FocusPlanModal` must cap its card height to the viewport and scroll the task list internally. Keep the outer card `overflow-hidden` and the task body `overflow-y-auto` so extra tasks, longer translated copy, or zoom do not grow the shell off-screen or create another background surface.
  - Focus Plan actions that resolve to Today Queue `open-screen` tasks (for example Business Context, Snippet Library, Messages) must route through `openMiniScreen(action.screenId)`, not `setActiveMiniScreen(action.screenId)`. In Electron this preserves the real draggable detached child-window flow used by More Features (`desktopApp.openChildScreen`) and avoids duplicated inline mini-screens stacked over the FloatingAssistant.
  - Acting on a Focus Plan item marks it handled for the session by item id (`useFocusPlan` `handledIds`), so it leaves the plan immediately and the remaining count drops. Item ids carry the work's timestamp, so genuinely new work (new inbound, new draft) reappears; do not key handled state by contact alone or it will suppress future real work for that contact.
  - The amber warning button is shown only while `actionableCount > 0` and fades + shrinks out smoothly once the last item is handled (`WorkbenchHeader` keeps it mounted briefly to animate the exit). Do not make the button permanently visible or remove the exit transition.
  - Run `npm run verify:focus-plan --workspace=apps/web` after planner, modal, header button, hook, shared `collectHeadWorkSignals` core, or Focus Plan translation changes.
- Secondary utilities such as referrals, weekly recap, messages, help, reset, and generic queue views must not compete with the main business communication work loop.
- More Features drawer close behavior is a visible leftward drawer transition, not an instant unmount, transparent side ghost, or whole-window shake. `apps/web/src/components/more-features.tsx` owns the drawer's `transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]` slide and exports `MORE_FEATURES_DRAWER_TRANSITION_MS = 300`; `FloatingAssistant.tsx` uses `MORE_FEATURES_EXIT_MS = MORE_FEATURES_DRAWER_TRANSITION_MS` and `isMoreFeaturesClosing` only to keep React visual state alive through the exit. `FloatingAssistant.tsx` must derive and use `isMoreFeaturesVisible = isMoreFeaturesOpen || isMoreFeaturesClosing` for the main panel corner state and visual gates that would otherwise remount workbench surfaces during the exit, and pass `visible={isMoreFeaturesVisible}` to `MoreFeatures`. But `isMoreFeaturesClosing` must **not** be included in the `setPanelOpen(true)` expression; keeping the Electron shell fully expanded during close exposes an empty transparent ghost area. The drawer width must match the actual expanded Electron width delta (`MORE_FEATURES_DRAWER_WIDTH = 184`, matching 574px expanded shell minus 390px assistant), and the drawer must be anchored at fixed `left-[390px]`, not `right-0`, so Electron's synchronized width shrink does not double-move the drawer. The closed transform must be `-translate-x-full`, moving the drawer left by its own width under the right side of the 390px assistant; it must never use `-translate-x-[390px]` or any transform that moves the 184px drawer under the top-left and bottom-left corners. The drawer must apply `visible ? 'visible' : 'invisible'` after the close hold. `electron/main.ts` must keep `PANEL_CLOSE_ANIMATION_MS = 300`, cancel close tweens when a new panel-open request arrives, and use a controlled non-native width tween for close instead of native animated `setBounds(..., true)`, which can shake the whole assistant. The hold is presentation/orchestration only; it must not change More Features child-screen routing, Focus Plan, remembered context, IPC shape, storage, prompts, or translation keys.
- Target recipient chip row — the **active** chip row currently lives in `apps/web/src/components/FloatingAssistant.tsx` (the `<section>` under `copy.floating.targetLabel`, around lines ~2694-2770). `apps/web/src/components/workbench/ComposerPanel.tsx` still contains the original chip row structure but is **inactive in the shipped app** because the only `ComposerPanel` call site passes `showModeAndRecipient={false}` — its structure is preserved as the reference implementation. Both surfaces share the same **single-line horizontal scroll** contract:
  - The chip row is a 2-column `grid`. In `ComposerPanel.tsx` this is the **inline-styled** `gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)'` with inline `gridColumnStart: 1` for External (`workMode === 'reply'`) and `gridColumnStart: 2` for Internal — that inline form was added after a previous iteration where raw `1fr` (which defaults to `minmax(auto, 1fr)`) let a column grow with content and broke the half-width constraint. In `FloatingAssistant.tsx` the equivalent is Tailwind's `grid grid-cols-2` (which compiles to `repeat(2, minmax(0, 1fr))` in v3 and is therefore equivalent), with each mode rendering inside its own grid cell rather than via inline `gridColumnStart`. Do not regress either surface to a form where a column can grow with its content (e.g., raw `1fr`, `auto`, or no explicit column template).
  - Each per-mode lane is a `relative min-w-0 overflow-hidden` wrapper. `overflow-hidden` is a hard clip boundary so a chip row can never bleed across the centerline into the inactive mode's half.
  - The inner scroll container is `clean-scrollbar overflow-x-auto overflow-y-hidden` and carries the active mode's `recipientScrollRef` + `onScroll={updateRecipientFade}` (or equivalent). The fade state is recomputed on `workMode` change and `window resize` (see the `useEffect` at `FloatingAssistant.tsx:806-817`).
  - Chip track is `flex flex-nowrap items-center` with inline `width: 'max-content'` (External / scrolling lane) or with `justify-end` for Internal's right-aligned lane. Chips are `shrink-0 whitespace-nowrap`. Chips must never wrap into a second row and must never shrink.
  - Left/right fade gradients sit at `w-5` over the active lane and fade against the `#fff7fa` card surface. Do not remove them — they are the affordance that tells the user there is more to scroll.
  - Visible chip count at rest is intentionally small (one or two for External; the three Internal chips currently fit). Do not regress by removing the half-width grid lane in favor of a full-width row, by re-introducing `flex-wrap`, or by switching the `ComposerPanel.tsx` inline grid styles back to utility classes (kept inline there for JIT/purge resilience).

## UI Guards

- Keep the app compact, calm, and operational.
- Do not turn the product into a marketing landing page or a loose collection of mini tools.
- More Features remains secondary navigation; make the main workbench useful first.
- More Features should group core client-work surfaces separately from secondary utilities.
- Add EN and ZH copy together for user-visible strings.
- Avoid hiding technical failures behind confident UI copy.

## Agent Coordination Guards

- Master coordination files (`AGENT_STATUS.md`, `INTEGRATION_GUIDE.md`, `references/SHARED_CONTEXT.json`, `plans/*`, `projects/*`) are shared by Codex and Claude Code.
- Routine app changes update `.codex/*` and master coordination files; they do not edit `.claude/*`.
- Edit `.claude/*` only when Claude Code runtime instructions, permissions, agents, or skills changed.
- Run `npm run agents:validate` after coordination-file changes.

## Upload Guards

Full upload/OCR spec and invariants live in `.codex/UPLOADS_PLAN.md`. Key invariants enforced here:

- Max 3 composer files per draft.
- Max 5 business context files.
- Max 5 contact files per contact.
- Do not fake OCR or parsing. If provider keys are missing, return `unavailable` / `needs-review` / `failed` honestly.
- Low confidence means `needs-review`, not `ready` (thresholds: ≥0.85 ready, 0.65–0.85 needs-review, <0.65 retry next provider or fail).
- Generation must mention uncertainty or ask the user to verify when extraction confidence is weak.
- Provider order is Aliyun → Google Vision → Azure. Do not claim a provider is active unless it is.
- Cache OCR results by SHA-256 hash, not by filename alone. Do not re-OCR the same hash unless the user explicitly retries.
- Never store raw binary files in localStorage. Summaries, extracted text, hashes, and metadata only.
- No background directory scanning. Files are user-selected only.
- Backend-only env keys: `ALIYUN_OCR_*`, `GOOGLE_APPLICATION_CREDENTIALS` (or equivalent), `AZURE_COMPUTER_VISION_*`. Never expose to renderer.
- Do not reintroduce the deprecated manual `TableHelperModal` flow.
