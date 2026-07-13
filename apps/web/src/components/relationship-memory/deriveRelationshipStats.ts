import type { ContactMessageEntry } from '../../config/contactThreads';

/**
 * Phase 15 — Dynamic Relationship Memory.
 *
 * Pure derivation of relationship signals from a contact thread's message
 * history. Never guesses: each stat is gated by a sample-size threshold and
 * reports `null` until the threshold is met, so the UI can stay silent
 * rather than show a confident-sounding line built from a single message.
 *
 * Returned in milliseconds / characters / "formal" | "casual" — the
 * formatter decides how to render. The store has no opinion about i18n.
 */

export const MIN_REPLY_GAP_SAMPLES = 2;
export const MIN_LENGTH_SAMPLES = 3;
export const MIN_FORMALITY_SAMPLES = 3;

export type RelationshipStats = {
  /** Average ms between an inbound message and the next outbound from us. */
  avgReplyGapMs: number | null;
  replyGapSampleSize: number;
  /** Median character length of inbound messages from this contact. */
  typicalInboundLengthChars: number | null;
  /** Median character length of outbound messages we send to this contact. */
  typicalOutboundLengthChars: number | null;
  lengthSampleSize: number;
  /** Observed formality bias of outbound (our) messages: 'formal' | 'casual' | null. */
  outboundFormalityBias: 'formal' | 'casual' | null;
  formalitySampleSize: number;
};

const EMPTY_STATS: RelationshipStats = {
  avgReplyGapMs: null,
  replyGapSampleSize: 0,
  typicalInboundLengthChars: null,
  typicalOutboundLengthChars: null,
  lengthSampleSize: 0,
  outboundFormalityBias: null,
  formalitySampleSize: 0,
};

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return sorted[mid];
}

const CASUAL_MARKERS = /(\s|^)(hey|hi|yo|lol|haha|sup|gonna|wanna|kinda|ok cool|nbd|np|cheers)(\s|[.,!?]|$)/i;
const FORMAL_MARKERS = /(dear |sincerely|regards|kindly|please find|i would like|further to|attached please|thank you for your)/i;

function classifyFormalityScore(text: string): number {
  // Negative = casual, positive = formal, 0 = neutral.
  let score = 0;
  if (CASUAL_MARKERS.test(text)) score -= 1;
  if (FORMAL_MARKERS.test(text)) score += 1;
  // Greeting heuristics that don't depend on word lists alone.
  if (/^hi\b|^hey\b/i.test(text.trim())) score -= 1;
  if (/^dear\b/i.test(text.trim())) score += 1;
  return score;
}

export function deriveRelationshipStats(
  messages: readonly ContactMessageEntry[] | null | undefined,
): RelationshipStats {
  if (!messages || messages.length === 0) return EMPTY_STATS;

  // Sort ascending so reply-gap math walks forward in time.
  const ordered = [...messages].sort((a, b) => a.createdAt - b.createdAt);

  // Reply gap: pair each inbound with the next outbound that follows it.
  const replyGaps: number[] = [];
  let pendingInboundAt: number | null = null;
  for (const msg of ordered) {
    if (msg.direction === 'inbound') {
      // If multiple inbound arrive before we reply, we still measure from the
      // newest inbound (so a backlog doesn't fake a worse latency).
      pendingInboundAt = msg.createdAt;
    } else if (msg.direction === 'outbound' && pendingInboundAt !== null) {
      const gap = msg.createdAt - pendingInboundAt;
      if (gap > 0) replyGaps.push(gap);
      pendingInboundAt = null;
    }
  }

  const avgReplyGapMs =
    replyGaps.length >= MIN_REPLY_GAP_SAMPLES
      ? Math.round(replyGaps.reduce((a, b) => a + b, 0) / replyGaps.length)
      : null;

  // Length stats by direction.
  const inboundLengths: number[] = [];
  const outboundLengths: number[] = [];
  for (const msg of ordered) {
    const text = (msg.text || msg.summary || '').trim();
    if (!text) continue;
    if (msg.direction === 'inbound') inboundLengths.push(text.length);
    else if (msg.direction === 'outbound') outboundLengths.push(text.length);
  }

  const totalLengthSamples = inboundLengths.length + outboundLengths.length;
  const typicalInboundLengthChars =
    inboundLengths.length >= MIN_LENGTH_SAMPLES ? median(inboundLengths) : null;
  const typicalOutboundLengthChars =
    outboundLengths.length >= MIN_LENGTH_SAMPLES ? median(outboundLengths) : null;

  // Outbound formality bias.
  let formalityScore = 0;
  let formalitySamples = 0;
  for (const msg of ordered) {
    if (msg.direction !== 'outbound') continue;
    const text = (msg.text || '').trim();
    if (!text) continue;
    formalitySamples += 1;
    formalityScore += classifyFormalityScore(text);
  }

  let outboundFormalityBias: 'formal' | 'casual' | null = null;
  if (formalitySamples >= MIN_FORMALITY_SAMPLES) {
    if (formalityScore >= 2) outboundFormalityBias = 'formal';
    else if (formalityScore <= -2) outboundFormalityBias = 'casual';
  }

  return {
    avgReplyGapMs,
    replyGapSampleSize: replyGaps.length,
    typicalInboundLengthChars,
    typicalOutboundLengthChars,
    lengthSampleSize: totalLengthSamples,
    outboundFormalityBias,
    formalitySampleSize: formalitySamples,
  };
}

/** True when at least one stat passes its threshold. */
export function hasAnyRelationshipSignal(stats: RelationshipStats): boolean {
  return (
    stats.avgReplyGapMs !== null
    || stats.typicalInboundLengthChars !== null
    || stats.typicalOutboundLengthChars !== null
    || stats.outboundFormalityBias !== null
  );
}
