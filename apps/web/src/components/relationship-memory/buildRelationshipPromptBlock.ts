import type { RelationshipStats } from './deriveRelationshipStats';

/**
 * Phase 15 — Dynamic Relationship Memory prompt block.
 *
 * Renders derived stats as plain English lines for the model. UI language
 * is irrelevant here — prompts stay English regardless of the renderer's
 * locale. Returns `null` when no stat passes its threshold so callers can
 * stay silent rather than emit a "Derived signals:" header with no body.
 *
 * Manual `ContactMemoryProfile` wins on conflict — this block is appended
 * after the manual memorySummary so the model sees the user-set context
 * first and reads derived lines as augmentation, not override.
 */
const ONE_MINUTE_MS = 60 * 1000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

const SHORT_INBOUND_CHARS = 80;
const LONG_INBOUND_CHARS = 280;

function describeReplyGap(ms: number): string {
  if (ms < ONE_HOUR_MS) {
    const minutes = Math.max(1, Math.round(ms / ONE_MINUTE_MS));
    return `Typical reply latency: about ${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  if (ms < ONE_DAY_MS) {
    const hours = Math.max(1, Math.round(ms / ONE_HOUR_MS));
    return `Typical reply latency: about ${hours} hour${hours === 1 ? '' : 's'}`;
  }
  const days = Math.max(1, Math.round(ms / ONE_DAY_MS));
  return `Typical reply latency: about ${days} day${days === 1 ? '' : 's'}`;
}

export function buildRelationshipPromptBlock(stats: RelationshipStats): string | null {
  const lines: string[] = [];

  if (stats.avgReplyGapMs !== null) {
    lines.push(describeReplyGap(stats.avgReplyGapMs));
  }

  if (stats.typicalInboundLengthChars !== null) {
    if (stats.typicalInboundLengthChars <= SHORT_INBOUND_CHARS) {
      lines.push("Their inbound messages are usually short — match brevity.");
    } else if (stats.typicalInboundLengthChars >= LONG_INBOUND_CHARS) {
      lines.push(
        "Their inbound messages are usually long and detailed — give them substance, not a one-liner.",
      );
    }
  }

  if (stats.typicalOutboundLengthChars !== null) {
    if (stats.typicalOutboundLengthChars <= SHORT_INBOUND_CHARS) {
      lines.push("Your past replies to them are usually short — keep that voice.");
    } else if (stats.typicalOutboundLengthChars >= LONG_INBOUND_CHARS) {
      lines.push("Your past replies to them are usually long — keep that voice.");
    }
  }

  if (stats.outboundFormalityBias === 'formal') {
    lines.push("Observed: your tone with this contact tends formal.");
  } else if (stats.outboundFormalityBias === 'casual') {
    lines.push("Observed: your tone with this contact tends casual.");
  }

  if (lines.length === 0) return null;
  return ['Derived relationship signals:', ...lines].join('\n');
}
