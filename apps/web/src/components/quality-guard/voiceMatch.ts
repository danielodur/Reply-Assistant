import { styleHintsAsSnippetMemory } from '../../lib/contactStyleMemory';

/**
 * Lightweight, on-device "does this draft sound like me?" signal.
 *
 * The samples come from `contactStyleMemory` — text the user *edited away* from
 * the model on prior replies for this contact. We compare a small vocabulary
 * overlap so the meter is meaningful as soon as one or two samples exist, but
 * never confidently green when we have nothing to compare against.
 */

export type VoiceMatchState = 'unknown' | 'learning' | 'similar' | 'different';

export type VoiceMatchResult = {
  state: VoiceMatchState;
  sampleCount: number;
  /** Jaccard overlap (0..1) between the draft and the most recent sample; null when no samples. */
  similarity: number | null;
};

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'so', 'to', 'of', 'in', 'on', 'for',
  'is', 'am', 'are', 'be', 'as', 'at', 'by', 'it', 'its', 'this', 'that',
  'i', 'you', 'we', 'they', 'me', 'us', 'them', 'your', 'our', 'their',
  'with', 'from', 'into', 'about', 'up', 'down', 'out',
]);

const SIMILAR_THRESHOLD = 0.18;
const DIFFERENT_THRESHOLD = 0.06;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(token => token.length >= 3 && !STOPWORDS.has(token));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function readSamples(contactId: string): string[] {
  // styleHintsAsSnippetMemory returns one collapsed snippet with samples joined by '\n---\n'.
  const snippets = styleHintsAsSnippetMemory(contactId);
  if (!snippets.length) return [];
  return snippets[0].text.split('\n---\n').map(s => s.trim()).filter(Boolean);
}

export function computeVoiceMatch(contactId: string | null, generatedMessage: string): VoiceMatchResult {
  if (!contactId || !generatedMessage.trim()) {
    return { state: 'unknown', sampleCount: 0, similarity: null };
  }
  const samples = readSamples(contactId);
  if (samples.length === 0) {
    return { state: 'learning', sampleCount: 0, similarity: null };
  }

  const draftTokens = new Set(tokenize(generatedMessage));
  const best = samples
    .map(sample => jaccard(draftTokens, new Set(tokenize(sample))))
    .reduce((max, value) => (value > max ? value : max), 0);

  if (best >= SIMILAR_THRESHOLD) {
    return { state: 'similar', sampleCount: samples.length, similarity: best };
  }
  if (best <= DIFFERENT_THRESHOLD) {
    return { state: 'different', sampleCount: samples.length, similarity: best };
  }
  return { state: 'learning', sampleCount: samples.length, similarity: best };
}
