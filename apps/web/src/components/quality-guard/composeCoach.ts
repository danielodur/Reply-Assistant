import type { RelationshipStats } from '../relationship-memory/deriveRelationshipStats';

/**
 * Phase 17 — Real-Time Compose Coach.
 *
 * Pure heuristics that run on the composer textarea (not the generated draft —
 * that's the impression chip's job). Returns at most three warnings so the
 * strip stays calm. Never emits anything for very short inputs.
 *
 * Honesty rules:
 *   - Each warning encodes the heuristic that fired in `id` so the UI can
 *     show the right copy and the "fix" action can target the right intent.
 *   - `tooLong` only fires when we have an observed outbound-length baseline
 *     for the selected contact (Phase 15 stats). Without a baseline we stay
 *     silent — "too long" is a comparative claim, not an absolute one.
 *   - `intentForFix` maps to existing regenerate intents so this module
 *     introduces no new prompt vocabulary.
 */

export type ComposeCoachWarningId =
  | 'missingAsk'
  | 'confrontational'
  | 'tooLong'
  | 'allCaps';

export type ComposeCoachWarning = {
  id: ComposeCoachWarningId;
  /**
   * Existing regenerate intent that softens / fixes this warning. `null`
   * means there is no obvious one-click fix — show the warning, hide the
   * fix button.
   */
  intentForFix: 'raise-formality' | 'tighten-length' | 'remove-overpromise' | null;
};

export type ComposeCoachContext = {
  /** Phase 15 stats for the selected contact, if any. */
  contactStats?: RelationshipStats | null;
  /** Recipient profile id — used as a fallback length expectation. */
  recipientProfile?: string | null;
};

export const COMPOSE_COACH_MIN_INPUT_CHARS = 40;

const CONFRONTATIONAL_PATTERNS: RegExp[] = [
  /\byou (should have|could have|need to|must|have to)\b/i,
  /\byou (didn[' ]?t|never|always)\b/i,
  /\bas i (already|previously) (said|mentioned|stated)\b/i,
  /\bthis is (unacceptable|ridiculous|absurd)\b/i,
  /\bi told you\b/i,
  /\bobviously\b/i,
  /\bclearly,? you\b/i,
];

const ASK_PATTERNS: RegExp[] = [
  /\?/, // any question mark
  /\b(please|could you|can you|would you|let me know|let's|let us)\b/i,
  /\b(by (monday|tuesday|wednesday|thursday|friday|tomorrow|next week|eod|end of))\b/i,
  /\b(confirm|approve|review|sign off|send over|share|reply with)\b/i,
];

const TOO_LONG_MULTIPLIER = 3;
const TOO_LONG_FLOOR_CHARS = 600;

function hasClearAsk(text: string): boolean {
  return ASK_PATTERNS.some(pattern => pattern.test(text));
}

function isConfrontational(text: string): boolean {
  return CONFRONTATIONAL_PATTERNS.some(pattern => pattern.test(text));
}

function isAllCapsShout(text: string): boolean {
  // Need at least one word ≥ 4 chars AND ratio of caps letters > 0.6 AND length > 80
  if (text.length <= 80) return false;
  const letters = text.replace(/[^A-Za-z]/g, '');
  if (letters.length < 30) return false;
  const upper = (text.match(/[A-Z]/g) || []).length;
  const lower = (text.match(/[a-z]/g) || []).length;
  if (lower + upper === 0) return false;
  const ratio = upper / (upper + lower);
  // Also require that there are sustained UPPER WORDS (≥2 caps-only words of length 4+).
  const capsWords = (text.match(/\b[A-Z]{4,}\b/g) || []).length;
  return ratio > 0.6 && capsWords >= 2;
}

function exceedsContactNorm(
  text: string,
  contactStats: RelationshipStats | null | undefined,
): boolean {
  if (!contactStats || contactStats.typicalOutboundLengthChars === null) return false;
  const baseline = contactStats.typicalOutboundLengthChars;
  return text.length > Math.max(TOO_LONG_FLOOR_CHARS, baseline * TOO_LONG_MULTIPLIER);
}

export function runComposeCoach(
  rawInput: string,
  context: ComposeCoachContext = {},
): ComposeCoachWarning[] {
  const text = (rawInput ?? '').trim();
  if (text.length < COMPOSE_COACH_MIN_INPUT_CHARS) return [];

  const warnings: ComposeCoachWarning[] = [];

  if (!hasClearAsk(text)) {
    warnings.push({ id: 'missingAsk', intentForFix: null });
  }

  if (isConfrontational(text)) {
    warnings.push({ id: 'confrontational', intentForFix: 'raise-formality' });
  }

  if (exceedsContactNorm(text, context.contactStats)) {
    warnings.push({ id: 'tooLong', intentForFix: 'tighten-length' });
  }

  if (isAllCapsShout(text)) {
    warnings.push({ id: 'allCaps', intentForFix: 'raise-formality' });
  }

  return warnings;
}

export const __INTERNAL = {
  CONFRONTATIONAL_PATTERNS,
  ASK_PATTERNS,
  TOO_LONG_MULTIPLIER,
  TOO_LONG_FLOOR_CHARS,
};
