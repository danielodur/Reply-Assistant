import type { ImpressionCheckResult } from './impressionCheck';
import type { VoiceMatchResult } from './voiceMatch';

/**
 * Collapses the existing quality signals (impression check, voice match, and how
 * grounded the draft is) into a single plain-language verdict for the calm
 * one-line confidence cue. The detailed signals stay available on demand — this
 * is only the lead sentence.
 *
 * Honesty-first ordering: any real concern outranks a reassuring "ready" so we
 * never tell the user a draft is safe to send when a signal disagrees.
 */

export type ConfidenceVerdictKey = 'ready' | 'ready-voice' | 'review' | 'voice-off' | 'thin';
export type ConfidenceTone = 'ready' | 'caution' | 'neutral';

export type ConfidenceVerdict = {
  key: ConfidenceVerdictKey;
  tone: ConfidenceTone;
};

export function buildConfidenceVerdict(input: {
  impressionCheck?: ImpressionCheckResult | null;
  voiceMatch?: VoiceMatchResult | null;
  /** True when the draft leaned on little or no grounded context. */
  limitedContext?: boolean;
}): ConfidenceVerdict {
  const { impressionCheck = null, voiceMatch = null, limitedContext = false } = input;

  if (impressionCheck?.hasWarning) {
    return { key: 'review', tone: 'caution' };
  }
  if (voiceMatch?.state === 'different') {
    return { key: 'voice-off', tone: 'caution' };
  }
  if (limitedContext) {
    return { key: 'thin', tone: 'neutral' };
  }
  if (voiceMatch?.state === 'similar') {
    return { key: 'ready-voice', tone: 'ready' };
  }
  return { key: 'ready', tone: 'ready' };
}
