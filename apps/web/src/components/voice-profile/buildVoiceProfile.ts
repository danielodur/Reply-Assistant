/**
 * Phase 21a — Voice profile derivation ("Write like me").
 *
 * Pure extraction of the user's voice fingerprint from their accepted /
 * edited replies. The samples already land in `contactStyleMemory` (per
 * contact) and in renderer-side `recentReplies` (global). This module
 * does not write or read storage — callers pass samples in.
 *
 * What we extract:
 *  - typical greeting openers (first short clause of each sample)
 *  - typical sign-offs (last short clause)
 *  - median sentence length (chars)
 *  - emoji usage (boolean)
 *
 * Honesty rule: return `null` when sample size is below threshold so the
 * UI / backend stay silent rather than pretending to know the user's
 * voice from a single sentence.
 */

export const VOICE_PROFILE_MIN_SAMPLES = 2;
const MAX_OPENERS = 3;
const MAX_SIGNOFFS = 3;
const MAX_SAMPLE_CHARS = 480;

export type VoiceProfile = {
  /** Up to 3 short openers we have seen the user use ("Hi {name},", "Hey there,", "Hi all,"). */
  openers: string[];
  /** Up to 3 short sign-offs ("Best,", "Thanks!", "Cheers,"). */
  signoffs: string[];
  /** Median sentence length across samples (chars), rounded. */
  medianSentenceLength: number;
  /** True when ≥1 sample contains an emoji. */
  usesEmoji: boolean;
  /** Number of samples that contributed. Useful for telemetry / debug. */
  sampleSize: number;
};

const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

function trimSample(text: string): string {
  return text.trim().slice(0, MAX_SAMPLE_CHARS);
}

const GREETING_PREFIX = /^(hi|hey|hello|dear|yo|hola|您好|你好)\b/i;

function firstClause(text: string): string {
  // When the sample opens with a recognisable greeting word, prefer the
  // prefix up to the first comma — that's the actual "opener" the user
  // would reuse. Otherwise take the first sentence (capped at 50 chars)
  // so we still get *something* useful from less conventional starters.
  const trimmed = text.trim();
  if (GREETING_PREFIX.test(trimmed)) {
    const commaIdx = trimmed.indexOf(',');
    if (commaIdx !== -1 && commaIdx <= 50) {
      return trimmed.slice(0, commaIdx + 1).trim();
    }
  }
  const sentenceIdx = trimmed.search(/[.!?\n]/);
  const cut = sentenceIdx === -1 ? Math.min(trimmed.length, 50) : Math.min(sentenceIdx, 50);
  return trimmed.slice(0, cut).trim();
}

function lastClause(text: string): string {
  // Take the last short line / clause as a sign-off candidate.
  const lines = text.trim().split(/\n+/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return '';
  const last = lines[lines.length - 1].trim();
  // Sign-offs are usually short (1-2 lines / a name). Skip when last line is a long paragraph.
  if (last.length > 60) return '';
  return last;
}

function medianOf(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  return sorted[mid];
}

function pushUnique(list: string[], item: string, cap: number): void {
  if (!item) return;
  const lower = item.toLowerCase();
  if (list.some(existing => existing.toLowerCase() === lower)) return;
  if (list.length >= cap) return;
  list.push(item);
}

export function buildVoiceProfile(
  samples: readonly string[] | null | undefined,
): VoiceProfile | null {
  if (!samples) return null;
  const cleaned = samples
    .map(s => (typeof s === 'string' ? trimSample(s) : ''))
    .filter(s => s.length > 0);
  if (cleaned.length < VOICE_PROFILE_MIN_SAMPLES) return null;

  const openers: string[] = [];
  const signoffs: string[] = [];
  const sentenceLengths: number[] = [];
  let usesEmoji = false;

  for (const sample of cleaned) {
    pushUnique(openers, firstClause(sample), MAX_OPENERS);
    pushUnique(signoffs, lastClause(sample), MAX_SIGNOFFS);
    if (EMOJI_REGEX.test(sample)) usesEmoji = true;
    for (const sentence of sample.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0)) {
      sentenceLengths.push(sentence.length);
    }
  }

  return {
    openers,
    signoffs,
    medianSentenceLength: medianOf(sentenceLengths),
    usesEmoji,
    sampleSize: cleaned.length,
  };
}
