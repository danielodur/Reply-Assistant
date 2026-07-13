/**
 * Phase 18 — Outcome signals.
 *
 * Pure honest heuristics over the generated draft. Reports three booleans
 * the user can read at a glance: does this draft read with clarity, does
 * it carry a clear next step, does the tone read professional. We label
 * these "signals" — never percentages, never confidence scores — because
 * they are deterministic rules, not ML predictions.
 *
 * Returns `null` for very short drafts. The strip stays silent in that
 * case rather than showing three empty ticks.
 */

export const OUTCOME_SIGNALS_MIN_DRAFT_CHARS = 50;

export type OutcomeSignals = {
  hasClarity: boolean;
  hasClearCTA: boolean;
  isProfessional: boolean;
};

const CLEAR_CTA_PATTERNS: RegExp[] = [
  /\?/,
  /\b(please|kindly) (confirm|review|share|send|reply|let me know)\b/i,
  /\b(could|would|can) you\b/i,
  /\bby (eod|end of (day|week)|tomorrow|monday|tuesday|wednesday|thursday|friday)\b/i,
  /\b(let me know|let us know) (by|if|when|whether)\b/i,
  /\b(next step|next steps|action items?)\b/i,
];

const UNPROFESSIONAL_PATTERNS: RegExp[] = [
  /\b(lol|haha|omg|wtf|yo)\b/i,
  /[!?]{3,}/,
  /\b[A-Z]{5,}\b.*\b[A-Z]{5,}\b/, // sustained shouting (two long all-caps runs)
];

const CLARITY_FILLER_PATTERNS: RegExp[] = [
  /\bat the end of the day\b/i,
  /\bto be perfectly honest\b/i,
  /\bbasically\b/i,
  /\bjust wanted to (just )?(quickly )?say\b/i,
  /\bsort of\b/i,
  /\bkind of\b/i,
];

function countMatches(text: string, patterns: RegExp[]): number {
  let count = 0;
  for (const pattern of patterns) {
    if (pattern.test(text)) count += 1;
  }
  return count;
}

function averageSentenceLength(text: string): number {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  if (sentences.length === 0) return 0;
  return sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
}

export function computeOutcomeSignals(draft: string | null | undefined): OutcomeSignals | null {
  const text = (draft ?? '').trim();
  if (text.length < OUTCOME_SIGNALS_MIN_DRAFT_CHARS) return null;

  // Clarity: short-ish average sentence length AND ≤1 filler phrase.
  const avgSentence = averageSentenceLength(text);
  const fillers = countMatches(text, CLARITY_FILLER_PATTERNS);
  const hasClarity = avgSentence > 0 && avgSentence <= 140 && fillers <= 1;

  // Clear CTA: at least one ask pattern fires.
  const hasClearCTA = countMatches(text, CLEAR_CTA_PATTERNS) >= 1;

  // Professional: no unprofessional markers AND not all-lowercase blob.
  const unprofessional = countMatches(text, UNPROFESSIONAL_PATTERNS);
  const startsCapitalized = /^[A-Z一-鿿]/.test(text); // Latin or CJK starter
  const isProfessional = unprofessional === 0 && startsCapitalized;

  return { hasClarity, hasClearCTA, isProfessional };
}

export const __INTERNAL = {
  CLEAR_CTA_PATTERNS,
  UNPROFESSIONAL_PATTERNS,
  CLARITY_FILLER_PATTERNS,
};
