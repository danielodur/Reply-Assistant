# Active Features

## Shipped / Active

- Auth-gated Electron workbench.
- Contact selection and local-first contact memory.
- Daily Brief and primary next-action work loop.
- Smart Reply and generated reply modal.
- Grounded "Based on" evidence.
- Cross-language reply support.
- Quality guard and voice match.
- Upload/OCR attachment context.
- Local contact continuity memory: thread summaries, open commitments, reply learning.
- Continuity presentation on the main workbench: overlay-only `RememberedContextDock` with a header bell/count button beside the amber Focus Plan icon, a wide auto-dismiss peek toast, and a right-side icon-anchored no-blur popover with reply/follow-up/mark-done actions plus generated-reply-like height for thread-summary read/edit work. Edit mode uses assisted writing behavior, keeps Cancel/Save visible outside the text scroll, and stretches the input box toward that fixed footer. The bell is action-only: saved/locked summaries remain in local contact memory but no longer keep the notice icon visible; user dismissals/edits survive auto-refresh.
- Target recipient chip row: half-width single-line horizontal scroll lane that mirrors the active mode button — External chips stay in the left lane, Internal chips stay in the right lane, never wrap, never spill past the centerline. Anti-clutter (one or two chips visible at rest; user scrolls to reveal the rest).
- Compose coach toast: `ComposeCoachStrip` is a dismissible bright white toast with `border-amber-200`, amber accent eyebrow + glyph, and an unmissable 480ms pop-in (scale 0.55 → 1, bounce overshoot via `cubic-bezier(0.34,1.56,0.64,1)`), positioned at `bottom-[5rem]` (slightly below vertical center) inside the composer so the top of the textarea stays visible. `key` on the inner div guarantees remount per new warning id so the animation always runs. Anti-clutter (one warning at a time, close button, automatic dismissal reset). Honors `suppressed` so heavier surfaces still own attention.
- Guided Work Buddy v2: command-center recommendation model chooses one best move, Daily Brief explains why in one short line, missing-context micro-ask appears only when useful, low-confidence attachment review routes to existing surfaces, and clear-for-now fallback avoids generic prompts when no client action needs attention.
- Focus Plan overlay: existing signals are turned into a compact "Start here / Next / Later" plan opened from the header action button, with no permanent main-screen block, no chatbot surface, and no new storage. Polished (2026-06-08): the "When" pill shows real timing plus an estimate hint, reply/follow-up items can surface a best-time-to-reply window, owed promises are a plan source, the Daily Brief and Focus Plan share one ranking core so their top item agrees, orchestration lives in the `useFocusPlan` hook (not the host), and the modal closes on Escape/backdrop with a focused full-width "Start here" and a warm clear state. Visual contract: no blur/dim overlay, no custom Electron width, right-side expanded placement, transparent expanded background, and internal modal scrolling for extra/long task content.
- More Features grouped into core work surfaces and secondary utilities. The drawer opens and closes with a visible slide; `FloatingAssistant.tsx` keeps the main workbench in the same attached visual state until close finishes, while `more-features.tsx` matches the drawer width to the Electron expansion delta, anchors it at the fixed main-panel edge, closes left by exactly its own width under the right side of the main assistant, and becomes invisible after the hold. Electron shrinks the expanded shell in sync with the drawer close, so pressing the More Features icon does not leave a transparent side ghost or trigger a whole-screen close shake.
- Guided Work Buddy v1 (first cut): generated-reply modal leads with a single plain-language, honesty-first confidence cue (`ConfidenceLine`); voice/impression detail stays on-demand only (anti-clutter). Selected-contact Daily Brief CTA is outcome-led ("Add detail" / "Reply now" / "Follow up").

## In Progress / Current Focus

- Master coordination files for Codex and Claude Code.
- Cleaner agent update workflow that avoids routine `.claude/*` edits.
