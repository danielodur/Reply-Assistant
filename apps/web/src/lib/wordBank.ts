/**
 * wordBank — production-style static suggestions with no user-memory learning.
 * This avoids reinforcing accidental/incorrect words while keeping suggestions broad.
 */

// Generic vocabulary fallback so suggestions work even before the app learns user-specific words.
const COMMON_WORDS = [
  'about', 'above', 'accept', 'across', 'action', 'actually', 'add', 'address', 'after', 'again', 'against',
  'off',
  'ago', 'all', 'allow', 'already', 'also', 'always', 'amazing', 'and', 'another', 'any', 'anyone', 'anything',
  'anyway', 'appreciate', 'are', 'around', 'asap', 'ask', 'attached', 'available', 'away', 'back', 'because',
  'been', 'before', 'being', 'below', 'best', 'better', 'between', 'body', 'both', 'breakdown', 'brief',
  'build', 'business', 'but', 'call', 'can', 'cannot', 'care', 'case', 'check', 'clarify', 'client', 'close',
  'coming', 'complete', 'confirm', 'connected', 'consider', 'continue', 'copy', 'could', 'course', 'create',
  'current', 'customer', 'date', 'day', 'dear', 'decide', 'definitely', 'deliver', 'details', 'did', 'different',
  'discuss', 'do', 'document', 'documented', 'documenting', 'documentation', 'documents', 'done', 'due', 'early', 'email', 'end', 'enough', 'ensure', 'even', 'event',
  'every', 'everyone', 'everything', 'exactly', 'example', 'expect', 'experience', 'explain', 'extend', 'faster',
  'feedback', 'feel', 'few', 'final', 'find', 'first', 'follow', 'followup', 'for', 'forward', 'from', 'further',
  'get', 'give', 'glad', 'go', 'good', 'great', 'happy', 'have', 'hello', 'help', 'here', 'high', 'hi', 'how',
  'idea', 'if', 'important', 'in', 'include', 'including', 'info', 'information', 'instead', 'internal', 'into',
  'is', 'issue', 'it', 'just', 'keep', 'kind', 'know', 'latest', 'let', 'letus', 'line', 'link', 'list', 'longer',
  'looking', 'lot', 'make', 'many', 'may', 'maybe', 'meeting', 'message', 'more', 'most', 'move', 'much', 'must',
  'my', 'name', 'need', 'next', 'no', 'note', 'noted', 'now', 'of', 'offer', 'on', 'once', 'one', 'only', 'open',
  'option', 'or', 'order', 'our', 'out', 'over', 'part', 'perfect', 'plan', 'please', 'point', 'possible',
  'prefer', 'prepare', 'price', 'priority', 'probably', 'process', 'product', 'progress', 'project', 'provide',
  'quick', 'quickly', 'reach', 'ready', 'really', 'reason', 'receive', 'regards', 'related', 'reply', 'request',
  'required', 'reschedule', 'response', 'review', 'right', 'run', 'schedule', 'see', 'send', 'sent', 'share',
  'short', 'should', 'show', 'simple', 'since', 'small', 'so', 'soon', 'sorry', 'start', 'status', 'step',
  'still', 'subject', 'support', 'sure', 'take', 'team', 'thank', 'thanks', 'that', 'the', 'their', 'them',
  'then', 'there', 'these', 'they', 'this', 'thought', 'through', 'time', 'to', 'today', 'tomorrow', 'touch',
  'understand', 'update', 'upon', 'urgent', 'use', 'used', 'useful', 'usually', 'value', 'very', 'via', 'want', 'was', 'way', 'we', 'welcome',
  'well', 'what', 'when', 'where', 'which', 'while', 'who', 'will', 'with', 'without', 'work', 'would', 'yes',
  'yet', 'you', 'your', 'youre', 'yours',
  'account', 'accounts', 'agreement', 'align', 'aligned', 'analysis', 'analyze', 'announce', 'approved',
  'arrange', 'arranged', 'assessment', 'assist', 'assistance', 'attention', 'authenticate', 'availability',
  'baseline', 'blocker', 'briefly', 'capacity', 'category', 'change', 'changes', 'checkpoint', 'closeout',
  'collaborate', 'collaboration', 'comment', 'comments', 'communication', 'compliance', 'configure', 'connection',
  'consistency', 'constraint', 'contact', 'context', 'contract', 'coordinate', 'coordination', 'correction',
  'coverage', 'critical', 'deliverable', 'dependencies', 'dependency', 'deployment', 'design', 'diagnostic',
  'documentation', 'efficiency', 'engagement', 'enhancement', 'estimate', 'evaluation', 'execution', 'external',
  'finalize', 'followup', 'framework', 'functional', 'guidance', 'handoff', 'implementation', 'improve',
  'improved', 'improvement', 'incident', 'insight', 'integrate', 'integration', 'interface', 'investigate',
  'iteration', 'milestone', 'mitigation', 'objective', 'observability', 'optimize', 'optimization', 'owner',
  'ownership', 'pipeline', 'planning', 'postpone', 'preparation', 'priority', 'procedure', 'production',
  'professional', 'proposal', 'quality', 'readiness', 'recommend', 'recommendation', 'regression', 'reliability',
  'resolution', 'resource', 'resources', 'retrospective', 'roadmap', 'scope', 'security', 'service',
  'solution', 'specification', 'stakeholder', 'standard', 'strategy', 'structure', 'summary', 'sync',
  'timeline', 'tracking', 'transition', 'troubleshoot', 'validation', 'visibility', 'workflow',
];

// Extra everyday vocabulary to prevent false corrections for valid words.
const EXTRA_COMMON_WORDS = [
  'people', 'person', 'persons', 'life', 'lives', 'live', 'lived', 'living',
  'mall', 'store', 'shop', 'shopping', 'street', 'avenue', 'station', 'airport',
  'train', 'flight', 'ticket', 'travel', 'trip', 'home', 'house', 'office',
  'family', 'friend', 'friends', 'brother', 'sister', 'mother', 'father',
  'morning', 'afternoon', 'evening', 'night', 'week', 'month', 'year',
  'school', 'class', 'lesson', 'study', 'learn', 'learning', 'teacher', 'student',
  'water', 'food', 'breakfast', 'lunch', 'dinner', 'coffee', 'tea',
  'money', 'bank', 'payment', 'invoice', 'amount', 'total',
  'news', 'media', 'social', 'public', 'private', 'local', 'global',
  'speak', 'speaking', 'talk', 'talking', 'listen', 'reading', 'writing',
  'music', 'movie', 'video', 'photo', 'picture', 'image',
  'weather', 'rain', 'sunny', 'cloudy', 'wind',
  'fine', 'great', 'awesome', 'cool', 'okay', 'ok',
  'were', 'their', 'there', 'they', 'them', 'yours', 'ours',
];

const WORD_POOL = Array.from(new Set([...COMMON_WORDS, ...EXTRA_COMMON_WORDS].map(w => w.toLowerCase())));
const WORD_SET = new Set(WORD_POOL);

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

/**
 * Suggest a spelling correction for a possibly misspelled token.
 * Returns null when confidence is low.
 */
export function getSpellingSuggestion(token: string): string | null {
  const normalized = token.toLowerCase().replace(/[^a-z']/g, '');
  if (normalized.length <= 4) return null;
  if (WORD_SET.has(normalized)) return null;

  // Detect merged words like "offwork" -> "off work"
  for (let i = 2; i <= normalized.length - 2; i += 1) {
    const left = normalized.slice(0, i);
    const right = normalized.slice(i);
    if (WORD_SET.has(left) && WORD_SET.has(right)) {
      return `${left} ${right}`;
    }
  }

  const candidates = WORD_POOL.filter(word => (
    Math.abs(word.length - normalized.length) <= 2
    && word.slice(0, 2) === normalized.slice(0, 2)
  ));

  let bestWord: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    const distance = levenshteinDistance(normalized, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestWord = candidate;
    }
  }

  if (!bestWord) return null;

  const hasRepeatedSequence = /(.)\1/u.test(normalized);
  const maxDistance = normalized.length <= 7 ? 1 : hasRepeatedSequence ? 2 : 1;
  if (bestDistance > maxDistance) return null;

  // Keep correction chip conservative to prevent noisy replacements.
  const relativeDistance = bestDistance / normalized.length;
  if (relativeDistance > 0.34) return null;

  return bestWord;
}

const CONTEXT_NEXT: Record<string, string[]> = {
  hi: ['there', 'team', 'everyone', 'all'],
  hello: ['there', 'team', 'everyone'],
  thanks: ['for', 'again', 'so', 'everyone'],
  thank: ['you', 'you!', 'you.', 'you,'],
  please: ['review', 'confirm', 'share', 'let', 'note'],
  we: ['are', 'can', 'will', 'should', 'need', 'have'],
  i: ['am', 'will', 'have', 'can', 'would', 'need'],
  you: ['are', 'can', 'will', 'should', 'have', 'need'],
  they: ['are', 'have', 'will', 'can'],
  this: ['is', 'will', 'should', 'looks'],
  that: ['is', 'was', 'will', 'should'],
  to: ['the', 'confirm', 'review', 'share', 'ensure', 'support'],
  for: ['the', 'your', 'this', 'that', 'today'],
  in: ['the', 'this', 'our', 'your'],
  on: ['the', 'this', 'our', 'your'],
  project: ['timeline', 'plan', 'status', 'scope'],
  update: ['on', 'for', 'the', 'regarding'],
  looking: ['forward', 'into', 'at'],
  forward: ['to'],
  let: ['me', 'us'],
  can: ['you', 'we', 'i'],
  could: ['you', 'we', 'i'],
  should: ['we', 'be', 'have'],
  would: ['you', 'like', 'be'],
  documentation: ['for', 'on', 'is', 'was'],
  document: ['the', 'this', 'that'],
  about: ['the', 'this', 'that', 'your'],
};

const CONTEXT_NEXT_BIGRAM: Record<string, string[]> = {
  'thank you': ['for', 'very', 'so', 'again'],
  'looking forward': ['to'],
  'let me': ['know', 'share', 'confirm'],
  'let us': ['know', 'share', 'confirm'],
  'we are': ['ready', 'aligned', 'available', 'working'],
  'we need': ['to', 'the', 'your'],
  'you are': ['welcome', 'right', 'correct'],
  'please review': ['the', 'this', 'and'],
  'please confirm': ['the', 'if', 'that'],
  'in the': ['project', 'document', 'meeting', 'timeline'],
  'on the': ['project', 'timeline', 'document', 'call'],
};

function getPreviousWords(context: string): { prev1: string; prev2: string } {
  const words = (context.toLowerCase().match(/[a-z']+/g) ?? []).filter(Boolean);
  const prev1 = words[words.length - 1] ?? '';
  const prev2 = words[words.length - 2] ?? '';
  return { prev1, prev2 };
}

/**
 * Disabled by design: we no longer learn from user input to avoid suggesting
 * accidental/incorrect vocabulary.
 */
export function learnText(): void {
  // No-op intentionally.
}

/**
 * Returns up to `max` word suggestions whose prefix matches `prefix`.
 * Results are sorted by usage frequency (most used first).
 */
export function getSuggestions(_key: string, prefix: string, max = 6, context = ''): string[] {
  const trimmed = prefix.trim().toLowerCase();
  if (trimmed.length < 2) return [];

  const { prev1, prev2 } = getPreviousWords(context);
  const bigramKey = prev2 && prev1 ? `${prev2} ${prev1}` : '';
  const contextBoostWords = new Set<string>([
    ...(CONTEXT_NEXT[prev1] ?? []),
    ...(bigramKey ? CONTEXT_NEXT_BIGRAM[bigramKey] ?? [] : []),
  ]);

  return WORD_POOL
    .filter(word => word.startsWith(trimmed) && word !== trimmed)
    .sort((a, b) => {
      const aBoost = contextBoostWords.has(a) ? 3 : 0;
      const bBoost = contextBoostWords.has(b) ? 3 : 0;
      if (aBoost !== bBoost) return bBoost - aBoost;

      const lenDelta = Math.abs(a.length - trimmed.length) - Math.abs(b.length - trimmed.length);
      if (lenDelta !== 0) return lenDelta;

      const aStarts = a.startsWith(trimmed) ? 0 : 1;
      const bStarts = b.startsWith(trimmed) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;

      return a.localeCompare(b);
    })
    .slice(0, max);
}

/**
 * Given the current textarea/input `value`, return the partial word the user
 * is currently typing (the last run of non-whitespace characters).
 */
export function getCurrentWord(value: string): string {
  const match = value.match(/(\S+)$/);
  return match ? match[1] : '';
}

/**
 * Replace the partial word ending before `caret` with `suggestion`. Does not add trailing space.
 */
export function applySuggestionAtCaret(value: string, caret: number, suggestion: string): { next: string; nextCaret: number } {
  const safeCaret = Math.max(0, Math.min(caret, value.length));
  const before = value.slice(0, safeCaret);
  const after = value.slice(safeCaret);
  const prefix = getCurrentWord(before);
  const wordStart = safeCaret - prefix.length;
  const next = `${value.slice(0, wordStart)}${suggestion}${after}`;
  const nextCaret = wordStart + suggestion.length;
  return { next, nextCaret };
}

