import { interpolate, type AppTranslations } from '../../i18n/translations';
import type { RelationshipStats } from './deriveRelationshipStats';

/**
 * Phase 15 — Dynamic Relationship Memory formatter.
 *
 * Turns the pure stats object into at most two calm fragments joined by
 * the i18n separator. Returns `null` when every stat is below threshold
 * so the UI can stay completely silent.
 *
 * Priority (most actionable first):
 *   1. Reply-gap latency
 *   2. Inbound length preference
 *   3. Outbound formality bias (your own tone with this contact)
 *
 * Cap = 2 fragments. The point is a one-liner you read in passing, not a
 * dashboard.
 */

const SHORT_INBOUND_CHARS = 80;
const LONG_INBOUND_CHARS = 280;
const ONE_MINUTE_MS = 60 * 1000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

export type RelationshipHintParts = string[];

function describeReplyGap(
  avgReplyGapMs: number,
  copy: AppTranslations['relationshipMemory'],
): string {
  if (avgReplyGapMs < ONE_HOUR_MS) {
    const minutes = Math.max(1, Math.round(avgReplyGapMs / ONE_MINUTE_MS));
    return interpolate(copy.repliesWithinMinutes, { minutes });
  }
  if (avgReplyGapMs < ONE_DAY_MS) {
    const hours = Math.max(1, Math.round(avgReplyGapMs / ONE_HOUR_MS));
    return interpolate(copy.repliesWithinHours, { hours });
  }
  const days = Math.max(1, Math.round(avgReplyGapMs / ONE_DAY_MS));
  if (days === 1) return copy.repliesWithinOneDay;
  return interpolate(copy.repliesWithinDays, { days });
}

function describeInboundLength(
  typicalInboundLengthChars: number,
  copy: AppTranslations['relationshipMemory'],
): string | null {
  if (typicalInboundLengthChars <= SHORT_INBOUND_CHARS) return copy.prefersShort;
  if (typicalInboundLengthChars >= LONG_INBOUND_CHARS) return copy.prefersLong;
  return null;
}

function describeFormality(
  bias: 'formal' | 'casual',
  copy: AppTranslations['relationshipMemory'],
): string {
  return bias === 'formal' ? copy.formalBias : copy.casualBias;
}

export function buildRelationshipHintParts(
  stats: RelationshipStats,
  copy: AppTranslations['relationshipMemory'],
): RelationshipHintParts {
  const parts: string[] = [];

  if (stats.avgReplyGapMs !== null) {
    parts.push(describeReplyGap(stats.avgReplyGapMs, copy));
  }

  if (parts.length < 2 && stats.typicalInboundLengthChars !== null) {
    const lengthHint = describeInboundLength(stats.typicalInboundLengthChars, copy);
    if (lengthHint) parts.push(lengthHint);
  }

  if (parts.length < 2 && stats.outboundFormalityBias !== null) {
    parts.push(describeFormality(stats.outboundFormalityBias, copy));
  }

  return parts;
}

export function formatRelationshipHint(
  stats: RelationshipStats,
  copy: AppTranslations['relationshipMemory'],
): string | null {
  const parts = buildRelationshipHintParts(stats, copy);
  if (parts.length === 0) return null;
  return parts.join(copy.separator);
}
