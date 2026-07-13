/**
 * Phase 14 — Intent detection (renderer side, no LLM).
 *
 * Pure heuristic classifier on the composer input. Returns null whenever
 * the signal is too thin or two intents tie — we never want the chip to
 * imply confidence we don't have. Matches the Cmd+K router policy: pure
 * patterns, deterministic, testable.
 *
 * Intent ids align with the categories listed in next-step.md Phase 14.
 * Adding a new intent means: pattern array + EN+ZH copy + verify test in
 * the same commit.
 */

export type DetectedIntentId =
  | 'request'
  | 'approval'
  | 'negotiation'
  | 'followUp'
  | 'escalation'
  | 'apology'
  | 'scheduling'
  | 'feedback'
  | 'statusUpdate'
  | 'reminder';

export type DetectedUrgency = 'medium' | 'high';

export type DetectedIntent = {
  id: DetectedIntentId;
  urgency: DetectedUrgency | null;
};

export const INTENT_DETECT_MIN_INPUT_CHARS = 32;
export const INTENT_DETECT_MIN_SCORE = 2;

const INTENT_PATTERNS: Record<DetectedIntentId, RegExp[]> = {
  request: [
    /\bcould you\b/i,
    /\bwould you\b/i,
    /\bcan you\b/i,
    /\bplease (send|share|provide|forward|attach|review)\b/i,
    /\bkindly (send|share|provide|forward|review)\b/i,
    /\bwe (need|require) (you|your)\b/i,
  ],
  approval: [
    /\bapprove\b/i,
    /\bapproval\b/i,
    /\bsign[- ]?off\b/i,
    /\bgreen[- ]?light\b/i,
    /\b(review and )?confirm (the|this|that)\b/i,
    /\bgive (the|me|us)? ?go[- ]?ahead\b/i,
  ],
  negotiation: [
    /\bprice\b/i,
    /\bpricing\b/i,
    /\bdiscount\b/i,
    /\bquote\b/i,
    /\bquotation\b/i,
    /\brate\b/i,
    /\b(counter[- ]?offer|counter[- ]?proposal)\b/i,
    /\b(margin|markup|net[- ]?\d+)\b/i,
    /\b(terms (and|&) conditions|payment terms)\b/i,
    /\bnegotiat(e|ion|ing)\b/i,
  ],
  followUp: [
    /\bfollowing up\b/i,
    /\bcircling back\b/i,
    /\bchecking in\b/i,
    /\b(any|an) update\b/i,
    /\bbumping this\b/i,
    /\bjust (a|wanted to) (quick |gentle )?(follow|nudge)\b/i,
  ],
  escalation: [
    /\b(urgent|critical|blocker|blocking)\b/i,
    /\bescalat(e|ion|ing)\b/i,
    /\b(loop in|cc) (leadership|the team|manager|head of)\b/i,
    /\b(asap|as soon as possible)\b/i,
    /\bcannot wait\b/i,
  ],
  apology: [
    /\b(i am|i'm) (so |very |really )?sorry\b/i,
    /\bapologi(s|z)e\b/i,
    /\b(my (mistake|bad|fault))\b/i,
    /\b(regret|regrets) (that|this|the)\b/i,
    /\bplease accept our apolog/i,
  ],
  scheduling: [
    /\b(schedule|reschedule|set up)( a)? (call|meeting|sync)\b/i,
    /\b(calendar|invite|invitation)\b/i,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday) (morning|afternoon|evening|at)\b/i,
    /\bnext (week|monday|tuesday|wednesday|thursday|friday)\b/i,
    /\b(does|would|is) ?\d{1,2}\s?(am|pm)?\b.*\b(work|ok|fine|good)\b/i,
  ],
  feedback: [
    /\b(your |any |my )?thoughts on\b/i,
    /\b(feedback|review) on\b/i,
    /\bhow does (it|this|that) look\b/i,
    /\b(does this|is this|would this) (work|make sense|be ok)\b/i,
    /\b(input|opinion) (on|about)\b/i,
  ],
  statusUpdate: [
    /\b(quick )?(status|progress) update\b/i,
    /\bwanted to (share|let you know|give you)\b/i,
    /\b(here is|here's) (a|the|an) (quick )?update\b/i,
    /\bfyi\b/i,
    /\b(as|by) of (today|yesterday|monday|tuesday|wednesday|thursday|friday)\b/i,
  ],
  reminder: [
    /\b(a |quick |gentle )?reminder\b/i,
    /\bjust a (gentle )?(reminder|nudge)\b/i,
    /\b(don[' ]?t forget|please remember)\b/i,
  ],
};

const HIGH_URGENCY_PATTERNS: RegExp[] = [
  /\b(urgent|critical|blocker|blocking)\b/i,
  /\b(asap|as soon as possible)\b/i,
  /\bby (eod|end of day|cob|end of business)\b/i,
  /\b(today|right now)\b/i,
  /\b!{2,}\b/,
];

const MEDIUM_URGENCY_PATTERNS: RegExp[] = [
  /\bby (tomorrow|monday|tuesday|wednesday|thursday|friday)\b/i,
  /\bthis week\b/i,
  /\b(soon|shortly)\b/i,
  /\b(end of (the )?week|eow)\b/i,
];

function countMatches(text: string, patterns: RegExp[]): number {
  let count = 0;
  for (const pattern of patterns) {
    if (pattern.test(text)) count += 1;
  }
  return count;
}

function detectUrgency(text: string): DetectedUrgency | null {
  if (countMatches(text, HIGH_URGENCY_PATTERNS) >= 1) return 'high';
  if (countMatches(text, MEDIUM_URGENCY_PATTERNS) >= 1) return 'medium';
  return null;
}

export function detectIntent(rawInput: string): DetectedIntent | null {
  const text = (rawInput ?? '').trim();
  if (text.length < INTENT_DETECT_MIN_INPUT_CHARS) return null;

  const scores: Array<{ id: DetectedIntentId; score: number }> = [];
  for (const [id, patterns] of Object.entries(INTENT_PATTERNS) as Array<[DetectedIntentId, RegExp[]]>) {
    const score = countMatches(text, patterns);
    if (score >= INTENT_DETECT_MIN_SCORE) scores.push({ id, score });
  }

  if (scores.length === 0) return null;
  scores.sort((a, b) => b.score - a.score);

  // Ambiguous: top two intents tied at the same score. Never guess.
  if (scores.length > 1 && scores[0].score === scores[1].score) return null;

  return {
    id: scores[0].id,
    urgency: detectUrgency(text),
  };
}

export const __INTERNAL = {
  INTENT_PATTERNS,
  HIGH_URGENCY_PATTERNS,
  MEDIUM_URGENCY_PATTERNS,
};
