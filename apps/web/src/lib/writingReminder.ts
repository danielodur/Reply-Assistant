import type { KeyboardEvent } from 'react';
import { getSpellingSuggestion } from './wordBank';

export type WritingReminder = {
  start: number;
  end: number;
  replacement: string;
  label: string;
  key: string;
};

const CONTRACTION_FIXES: Record<string, string> = {
  thats: "that's",
  whats: "what's",
  whos: "who's",
  wheres: "where's",
  dont: "don't",
  cant: "can't",
  wont: "won't",
  shouldve: "should've",
  couldve: "could've",
  wouldve: "would've",
  didnt: "didn't",
  doesnt: "doesn't",
  isnt: "isn't",
  arent: "aren't",
  wasnt: "wasn't",
  werent: "weren't",
  couldnt: "couldn't",
  wouldnt: "wouldn't",
  shouldnt: "shouldn't",
  havent: "haven't",
  hasnt: "hasn't",
  hadnt: "hadn't",
  youre: "you're",
  theyre: "they're",
  yall: "y'all",
  youll: "you'll",
  youllve: "you'll've",
  youve: "you've",
  youvebeen: "you've been",
  theyll: "they'll",
  theyve: "they've",
  ive: "I've",
  im: "I'm",
};

const COMMON_TYPO_FIXES: Record<string, string> = {
  teh: 'the',
  thier: 'their',
  recieve: 'receive',
  adress: 'address',
  seperate: 'separate',
  definately: 'definitely',
  untill: 'until',
  wich: 'which',
  accomodate: 'accommodate',
  enviroment: 'environment',
  grammer: 'grammar',
  commendor: 'recommender',
  dected: 'detected',
  recieved: 'received',
  occured: 'occurred',
  alot: 'a lot',
};

const PROPER_NOUNS: Record<string, string> = {
  london: 'London',
  paris: 'Paris',
  tokyo: 'Tokyo',
  berlin: 'Berlin',
  toronto: 'Toronto',
  vancouver: 'Vancouver',
  lagos: 'Lagos',
  abuja: 'Abuja',
  nairobi: 'Nairobi',
  dubai: 'Dubai',
  california: 'California',
  texas: 'Texas',
  canada: 'Canada',
  nigeria: 'Nigeria',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
  january: 'January',
  february: 'February',
  march: 'March',
  april: 'April',
  may: 'May',
  june: 'June',
  july: 'July',
  august: 'August',
  september: 'September',
  october: 'October',
  november: 'November',
  december: 'December',
  english: 'English',
  sony: 'Sony',
  apple: 'Apple',
  samsung: 'Samsung',
  microsoft: 'Microsoft',
  google: 'Google',
  amazon: 'Amazon',
  facebook: 'Facebook',
  twitter: 'Twitter',
  linkedin: 'LinkedIn',
  wechat: 'WeChat',
  nike: 'Nike',
  adidas: 'Adidas',
};

function findWordBounds(text: string, caret: number): { start: number; end: number } | null {
  const safeCaret = Math.max(0, Math.min(caret, text.length));
  let start = safeCaret;
  let end = safeCaret;

  while (start > 0 && /[A-Za-z']/u.test(text[start - 1] ?? '')) start -= 1;
  while (end < text.length && /[A-Za-z']/u.test(text[end] ?? '')) end += 1;

  if (end <= start) return null;
  return { start, end };
}

function isLikelyInProgressWord(text: string, caret: number, token: string): boolean {
  // If caret is at the end of the input and the token is very short,
  // user is often still typing (e.g. "be" -> "been").
  if (caret === text.length && token.length <= 2) {
    return true;
  }

  return false;
}

function isSentenceStart(text: string, index: number): boolean {
  for (let i = index - 1; i >= 0; i -= 1) {
    const ch = text[i];
    if (/\s/u.test(ch)) continue;
    return ch === '.' || ch === '!' || ch === '?' || ch === '\n';
  }
  return true;
}

function matchCase(source: string, replacement: string): string {
  if (!source) return replacement;
  if (source === source.toUpperCase()) return replacement.toUpperCase();
  if (replacement.includes(' ')) {
    if (source[0] === source[0].toUpperCase()) {
      return replacement[0].toUpperCase() + replacement.slice(1);
    }
    return replacement;
  }
  if (source[0] === source[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function buildReminder(start: number, end: number, replacement: string): WritingReminder {
  return {
    start,
    end,
    replacement,
    label: replacement,
    key: `${start}:${end}:${replacement}`,
  };
}

function detectPatternReminder(text: string, caret: number): WritingReminder | null {
  const patterns: Array<{ regex: RegExp; replacement: (m: RegExpExecArray) => string }> = [
    { regex: /\bthere\s+going\b/gi, replacement: () => "they're going" },
    { regex: /\btheir\s+going\b/gi, replacement: () => "they're going" },
    { regex: /\byour\s+(welcome|right|ready|able)\b/gi, replacement: m => `you're ${m[1]}` },
    { regex: /\bits\s+(a|an|the|not|been|going)\b/gi, replacement: m => `it's ${m[1]}` },
    { regex: /\btheyre\b/gi, replacement: () => "they're" },
    { regex: /\byoure\b/gi, replacement: () => "you're" },
    { regex: /\b([Tt]he)\s+\1\b/g, replacement: m => m[1] },
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (caret < start || caret > end + 1) continue;
      return buildReminder(start, end, pattern.replacement(match));
    }
  }

  return null;
}

export function detectWritingReminder(text: string, caret: number): WritingReminder | null {
  const patternReminder = detectPatternReminder(text, caret);
  if (patternReminder) {
    return patternReminder;
  }

  const bounds = findWordBounds(text, caret);
  if (!bounds) return null;

  const token = text.slice(bounds.start, bounds.end);
  const normalized = token.toLowerCase();
  const inProgressWord = isLikelyInProgressWord(text, caret, token);

  if (normalized in CONTRACTION_FIXES) {
    const replacement = matchCase(token, CONTRACTION_FIXES[normalized]);
    return buildReminder(bounds.start, bounds.end, replacement);
  }

  if (normalized in COMMON_TYPO_FIXES) {
    const replacement = matchCase(token, COMMON_TYPO_FIXES[normalized]);
    return buildReminder(bounds.start, bounds.end, replacement);
  }

  const spellingSuggestion = getSpellingSuggestion(normalized);
  if (spellingSuggestion && spellingSuggestion !== normalized) {
    const replacement = matchCase(token, spellingSuggestion);
    return buildReminder(bounds.start, bounds.end, replacement);
  }

  if (normalized === 'i' && token !== 'I') {
    return buildReminder(bounds.start, bounds.end, 'I');
  }

  if (!inProgressWord && normalized in PROPER_NOUNS && token !== PROPER_NOUNS[normalized]) {
    const replacement = PROPER_NOUNS[normalized];
    return buildReminder(bounds.start, bounds.end, replacement);
  }

  if (!inProgressWord && token[0] && token[0] === token[0].toLowerCase() && isSentenceStart(text, bounds.start)) {
    const replacement = token[0].toUpperCase() + token.slice(1);
    if (replacement !== token) {
      return buildReminder(bounds.start, bounds.end, replacement);
    }
  }

  return null;
}

export function replaceTextRange(text: string, start: number, end: number, insertion: string): string {
  return `${text.slice(0, start)}${insertion}${text.slice(end)}`;
}

export function applyWritingReminder(text: string, reminder: WritingReminder): string {
  return replaceTextRange(text, reminder.start, reminder.end, reminder.replacement);
}

export function caretTouchesRange(caret: number, start: number, end: number): boolean {
  return caret >= start && caret <= end;
}

export function caretTouchesReminder(caret: number, reminder: WritingReminder): boolean {
  return caretTouchesRange(caret, reminder.start, reminder.end);
}

/** Tab or Space accepts the correction when the caret is on the misspelled range (Space adds a trailing space). */
export function tryAcceptWritingReminderKeydown(
  e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
  reminder: WritingReminder | null,
  text: string,
  caret: number,
): { next: string; nextCaret: number } | null {
  if (!reminder || !caretTouchesReminder(caret, reminder)) return null;

  if (e.key === 'Tab' && !e.shiftKey) {
    e.preventDefault();
    const replaced = applyWritingReminder(text, reminder);
    const nextCaret = reminder.start + reminder.replacement.length;
    return { next: replaced, nextCaret };
  }

  if (e.key === ' ') {
    e.preventDefault();
    const replaced = applyWritingReminder(text, reminder);
    const pos = reminder.start + reminder.replacement.length;
    const next = `${replaced.slice(0, pos)} ${replaced.slice(pos)}`;
    return { next, nextCaret: pos + 1 };
  }

  return null;
}
