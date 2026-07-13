/**
 * Phase 18 — Rewrite modes registry.
 *
 * Five professional rewrite voices the user can audition against the
 * current draft without leaving the modal. Each mode maps to a stable id
 * that travels through the existing `generationContext.title` channel as
 * `rewrite-mode:<id>` — same pattern as `auto-soften:*` and
 * `compose-coach:*`. The backend reads it from `replyIntelligence.js` /
 * the prompt builder when (and if) it chooses to honor the directive;
 * unrecognized values are a no-op.
 *
 * Design rule: this is a fixed, ordered list. Adding a mode means:
 *  - registry entry here
 *  - EN + ZH i18n labels under `rewriteModes.<id>`
 *  - fixture in verify-rewrite-modes.mjs
 * — all in the same commit. Modes must not duplicate scenario chips
 *   (`scenarios/scenarioRegistry.ts`) — scenarios are pre-generate prompts,
 *   modes are post-generate rewrites.
 */

export type RewriteModeId =
  | 'diplomatic'
  | 'leadership'
  | 'negotiation'
  | 'customerSupport'
  | 'recruiting'
  | 'voiceLikeMe';

export type RewriteMode = {
  id: RewriteModeId;
  /** Stable source-context title fragment sent to the backend. */
  sourceTitle: `rewrite-mode:${RewriteModeId}`;
};

export const REWRITE_MODES: readonly RewriteMode[] = [
  { id: 'voiceLikeMe', sourceTitle: 'rewrite-mode:voiceLikeMe' },
  { id: 'diplomatic', sourceTitle: 'rewrite-mode:diplomatic' },
  { id: 'leadership', sourceTitle: 'rewrite-mode:leadership' },
  { id: 'negotiation', sourceTitle: 'rewrite-mode:negotiation' },
  { id: 'customerSupport', sourceTitle: 'rewrite-mode:customerSupport' },
  { id: 'recruiting', sourceTitle: 'rewrite-mode:recruiting' },
] as const;

export function getRewriteModeById(id: string): RewriteMode | null {
  return REWRITE_MODES.find(mode => mode.id === id) ?? null;
}
