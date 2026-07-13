/**
 * Deterministic, on-device language detection for short business messages.
 *
 * Strategy: count CJK ideographs vs Latin letters in the *cleaned* text
 * (URLs, emails, numbers, punctuation, and whitespace removed). The label
 * is chosen by ratio thresholds tuned for short chat-style replies, not
 * long-form prose:
 *
 *   - >= 70% CJK     → 'zh'
 *   - >= 70% Latin   → 'en'
 *   - some of each   → 'mixed'
 *   - neither (or empty text) → 'unknown'
 *
 * No network calls. No model. No statefulness.
 */

export type DetectedLanguage = 'zh' | 'en' | 'mixed' | 'unknown';

const CJK_REGEX = /[㐀-鿿豈-﫿]/g;
const LATIN_LETTER_REGEX = /[A-Za-z]/g;
const STRIP_REGEX = /(https?:\/\/\S+|[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}|\d+|\s+|[\p{P}\p{S}])/gu;

const RATIO_THRESHOLD = 0.7;
const MIN_SIGNIFICANT_CHARS = 4;

export function detectLanguage(input: string): DetectedLanguage {
  if (!input) return 'unknown';

  const cleaned = input.replace(STRIP_REGEX, '');
  if (cleaned.length < MIN_SIGNIFICANT_CHARS) return 'unknown';

  const cjkCount = (cleaned.match(CJK_REGEX) ?? []).length;
  const latinCount = (cleaned.match(LATIN_LETTER_REGEX) ?? []).length;
  const total = cjkCount + latinCount;
  if (total === 0) return 'unknown';

  if (cjkCount / total >= RATIO_THRESHOLD) return 'zh';
  if (latinCount / total >= RATIO_THRESHOLD) return 'en';
  if (cjkCount > 0 && latinCount > 0) return 'mixed';

  return 'unknown';
}

/**
 * Picks a sensible *reply* language when the user has not chosen one yet.
 * Falls back to the user's app-level default when the inbound is mixed or
 * unknown — we never silently switch to a language the user hasn't seen.
 */
export function recommendReplyLanguage(
  inboundLanguage: DetectedLanguage,
  appDefault: 'en' | 'zh',
): 'en' | 'zh' {
  if (inboundLanguage === 'zh') return 'zh';
  if (inboundLanguage === 'en') return 'en';
  return appDefault;
}
