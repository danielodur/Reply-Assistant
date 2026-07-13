import type { RecipientProfile, WorkMode } from '../workbench/types';

/**
 * Local impression-check rules. Runs in-renderer on the generated text so we
 * never need a follow-up model call to surface a quality signal. Deterministic
 * and short — these heuristics flag obvious mismatches, not subtle nuance.
 */

export type ImpressionStatus = 'ok' | 'warn';

export type ImpressionCheckResult = {
  formality: { status: ImpressionStatus; reasonKey: ImpressionReasonKey | null };
  toneRisk: { status: ImpressionStatus; reasonKey: ImpressionReasonKey | null };
  length: { status: ImpressionStatus; reasonKey: ImpressionReasonKey | null; words: number };
  /** True when any of the three rows is a warning — drives the auto-soften offer. */
  hasWarning: boolean;
};

/**
 * Stable keys for translation lookup. Keep this list in sync with the i18n keys
 * `floating.impressionReason*` so the UI can render copy without flowing strings
 * back through this module.
 */
export type ImpressionReasonKey =
  | 'formality-too-casual-for-vip'
  | 'formality-too-casual-for-leader'
  | 'formality-too-stiff-for-casual'
  | 'tone-risk-aggressive'
  | 'tone-risk-passive'
  | 'tone-risk-overpromise'
  | 'length-too-brief'
  | 'length-too-long';

const AGGRESSIVE_TERMS = [
  'must', 'have to', 'need to immediately', 'unacceptable', 'demand',
  'asap', 'right now', 'urgent!!', 'stop ', 'stop.', 'why didn', "you didn't",
];
const PASSIVE_TERMS = [
  'i guess', 'just wanted', 'sorry to bother', 'if it is not too much',
  'maybe we could', 'i was hoping', 'i could be wrong', 'i think maybe',
];
const OVERPROMISE_TERMS = [
  'guarantee', 'guaranteed', 'definitely will', 'for sure', '100%',
  'always available', "won't ever", 'never miss',
];
const STIFF_OPENERS = [
  'dear sir or madam',
  'to whom it may concern',
  'pursuant to',
  'kindly be advised',
  'i am writing to inform you',
];
const CASUAL_OPENERS = ['hey', 'yo', 'sup', 'hiya', 'gday'];

const LENGTH_BANDS: Record<string, { min: number; max: number }> = {
  'shorter-reply':       { min: 12, max: 80 },
  'longer-detailed':     { min: 60, max: 260 },
  'persuasive':          { min: 40, max: 200 },
  'apologetic-polite':   { min: 25, max: 140 },
  'casual-friendly':     { min: 12, max: 90 },
  'formal-professional': { min: 40, max: 220 },
  'follow-up':           { min: 18, max: 110 },
  'suggestion':          { min: 20, max: 140 },
  'simplify':            { min: 10, max: 90 },
  'improve':             { min: 18, max: 200 },
  'polish-english':      { min: 18, max: 220 },
};

const DEFAULT_LENGTH_BAND = { min: 18, max: 200 };

export type ImpressionCheckInput = {
  message: string;
  mode: WorkMode;
  recipient: RecipientProfile;
  textType: string;
  formality: number;
};

function countWords(text: string): number {
  const cleaned = text.replace(/[\s　]+/g, ' ').trim();
  if (!cleaned) return 0;
  // CJK-aware: ideographs are counted individually so length bands work for ZH too.
  const cjkChars = (cleaned.match(/[㐀-鿿豈-﫿]/gu) ?? []).length;
  const latinTokens = cleaned
    .replace(/[㐀-鿿豈-﫿]/gu, ' ')
    .split(/\s+/)
    .filter(token => token.length > 0).length;
  return cjkChars + latinTokens;
}

function lower(text: string): string {
  return text.toLowerCase();
}

function checkFormality(input: ImpressionCheckInput): ImpressionCheckResult['formality'] {
  const lowered = lower(input.message);
  const startsWith = (terms: string[]) => terms.some(t => lowered.trimStart().startsWith(t));

  if (input.recipient === 'vip-client' && (input.formality <= 2 || startsWith(CASUAL_OPENERS))) {
    return { status: 'warn', reasonKey: 'formality-too-casual-for-vip' };
  }
  if (input.recipient === 'leader' && input.formality <= 2) {
    return { status: 'warn', reasonKey: 'formality-too-casual-for-leader' };
  }
  if (
    (input.recipient === 'others' || input.recipient === 'colleague')
    && input.textType === 'casual-friendly'
    && (input.formality >= 4 || STIFF_OPENERS.some(opener => lowered.includes(opener)))
  ) {
    return { status: 'warn', reasonKey: 'formality-too-stiff-for-casual' };
  }
  return { status: 'ok', reasonKey: null };
}

function checkToneRisk(input: ImpressionCheckInput): ImpressionCheckResult['toneRisk'] {
  const lowered = lower(input.message);
  const containsAny = (terms: string[]) => terms.some(term => lowered.includes(term));

  if (containsAny(AGGRESSIVE_TERMS)) {
    return { status: 'warn', reasonKey: 'tone-risk-aggressive' };
  }
  if (containsAny(OVERPROMISE_TERMS)) {
    return { status: 'warn', reasonKey: 'tone-risk-overpromise' };
  }
  if (input.recipient !== 'colleague' && containsAny(PASSIVE_TERMS)) {
    return { status: 'warn', reasonKey: 'tone-risk-passive' };
  }
  return { status: 'ok', reasonKey: null };
}

function checkLength(input: ImpressionCheckInput): ImpressionCheckResult['length'] {
  const words = countWords(input.message);
  const band = LENGTH_BANDS[input.textType] ?? DEFAULT_LENGTH_BAND;
  if (words < band.min) {
    return { status: 'warn', reasonKey: 'length-too-brief', words };
  }
  if (words > band.max) {
    return { status: 'warn', reasonKey: 'length-too-long', words };
  }
  return { status: 'ok', reasonKey: null, words };
}

export function runImpressionCheck(input: ImpressionCheckInput): ImpressionCheckResult {
  const formality = checkFormality(input);
  const toneRisk = checkToneRisk(input);
  const length = checkLength(input);
  return {
    formality,
    toneRisk,
    length,
    hasWarning: formality.status === 'warn' || toneRisk.status === 'warn' || length.status === 'warn',
  };
}

/**
 * Should the recipient trigger the high-stakes send guard? Pure helper so both
 * Settings and FloatingAssistant can share the same predicate.
 */
export function isHighStakesRecipient(recipient: RecipientProfile): boolean {
  return recipient === 'vip-client' || recipient === 'leader';
}

/**
 * Maps an impression warning to a coarse "auto-soften" instruction the model
 * can apply on a regenerate. Returns null when no auto-soften would help.
 */
export type AutoSoftenIntent =
  | 'reduce-aggressive-language'
  | 'remove-overpromise'
  | 'tighten-length'
  | 'expand-with-context'
  | 'raise-formality'
  | 'lower-formality';

export function autoSoftenIntentFor(result: ImpressionCheckResult): AutoSoftenIntent | null {
  if (result.toneRisk.status === 'warn') {
    if (result.toneRisk.reasonKey === 'tone-risk-aggressive') return 'reduce-aggressive-language';
    if (result.toneRisk.reasonKey === 'tone-risk-overpromise') return 'remove-overpromise';
  }
  if (result.formality.status === 'warn') {
    if (
      result.formality.reasonKey === 'formality-too-casual-for-vip'
      || result.formality.reasonKey === 'formality-too-casual-for-leader'
    ) {
      return 'raise-formality';
    }
    if (result.formality.reasonKey === 'formality-too-stiff-for-casual') return 'lower-formality';
  }
  if (result.length.status === 'warn') {
    if (result.length.reasonKey === 'length-too-long') return 'tighten-length';
    if (result.length.reasonKey === 'length-too-brief') return 'expand-with-context';
  }
  return null;
}
