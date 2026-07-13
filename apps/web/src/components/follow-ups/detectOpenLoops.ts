import type { ContactThread } from '../../config/contactThreads';
import { deriveRelationshipStats } from '../relationship-memory/deriveRelationshipStats';

/**
 * Phase 19 — Open loops detection.
 *
 * Pure scan of contact threads. An "open loop" is an inbound message we
 * never replied to that has been waiting longer than the contact's typical
 * reply gap (Phase 15 stat) — or longer than `STALE_FALLBACK_MS` when no
 * stat is available.
 *
 * Honesty rules:
 *  - We only look at the newest message per thread. If the user already
 *    replied, the loop is closed by definition.
 *  - Threads where the newest message is outbound or a note are skipped.
 *  - When a Phase 15 reply-gap stat exists, "overdue" means current age
 *    > 3 × that gap (so a contact who normally replies in 10 minutes
 *    isn't surfaced after 30 minutes — but at 31 they are).
 *  - When no stat exists, fall back to 3 days. Never less aggressive than
 *    the existing follow-up text-type prompts.
 *  - Results are ranked by overdue ratio (most overdue first), capped at
 *    a small N so we never spam the Daily Brief.
 */

export const STALE_FALLBACK_MS = 3 * 24 * 60 * 60 * 1000;
export const TYPICAL_GAP_MULTIPLIER = 3;
export const MAX_OPEN_LOOPS = 5;

export type OpenLoop = {
  contactId: string;
  contactName: string;
  inboundAt: number;
  /** ms since the inbound landed, at `nowMs` */
  ageMs: number;
  /** ms the loop is over its threshold (always > 0 for emitted loops) */
  overdueMs: number;
  /** Source: 'observed' when we used a Phase 15 stat, 'fallback' otherwise. */
  source: 'observed' | 'fallback';
};

function newestMessage(thread: ContactThread) {
  if (!thread.messages || thread.messages.length === 0) return null;
  let head = thread.messages[0];
  for (const msg of thread.messages) {
    if (msg.createdAt > head.createdAt) head = msg;
  }
  return head;
}

export function detectOpenLoops(
  threads: readonly ContactThread[],
  nowMs: number = Date.now(),
): OpenLoop[] {
  const loops: OpenLoop[] = [];

  for (const thread of threads) {
    const newest = newestMessage(thread);
    if (!newest || newest.direction !== 'inbound') continue;

    const ageMs = nowMs - newest.createdAt;
    if (ageMs <= 0) continue;

    const stats = deriveRelationshipStats(thread.messages);
    const threshold =
      stats.avgReplyGapMs !== null
        ? stats.avgReplyGapMs * TYPICAL_GAP_MULTIPLIER
        : STALE_FALLBACK_MS;

    if (ageMs <= threshold) continue;

    loops.push({
      contactId: thread.id,
      contactName: thread.name,
      inboundAt: newest.createdAt,
      ageMs,
      overdueMs: ageMs - threshold,
      source: stats.avgReplyGapMs !== null ? 'observed' : 'fallback',
    });
  }

  loops.sort((a, b) => b.overdueMs - a.overdueMs);
  return loops.slice(0, MAX_OPEN_LOOPS);
}
