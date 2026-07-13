import type { KeyboardEvent } from 'react';
import { applySuggestionAtCaret, getSuggestions } from './wordBank';
import { detectWritingReminder } from './writingReminder';

/** Word fragment immediately left of caret (not across spaces). */
export function getActivePrefixAtCaret(beforeCaret: string): string {
  if (!beforeCaret.length) return '';
  if (/\s/u.test(beforeCaret[beforeCaret.length - 1] ?? '')) return '';

  let start = beforeCaret.length - 1;
  while (start >= 0 && /\S/u.test(beforeCaret[start] ?? '')) {
    start -= 1;
  }
  return beforeCaret.slice(start + 1);
}

/**
 * Ghost completion only at end-of-buffer: predicts the rest of the current word
 * from dictionary + context (see wordBank). Suppressed when a correction chip applies.
 */
export function computeGhostSuffix(text: string, caret: number, bankKey: string): string {
  if (caret !== text.length) return '';
  const before = text.slice(0, caret);
  const prefix = getActivePrefixAtCaret(before);
  if (prefix.length < 2) return '';
  if (/\d/u.test(prefix)) return '';
  if (detectWritingReminder(text, caret)) return '';

  const suggestions = getSuggestions(bankKey, prefix, 1, before);
  const top = suggestions[0];
  if (!top) return '';
  const pl = prefix.toLowerCase();
  if (!top.toLowerCase().startsWith(pl)) return '';
  if (top.length <= pl.length) return '';
  return top.slice(prefix.length);
}

export function tryCompleteWithGhostAtTab(
  e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
  text: string,
  caret: number,
  bankKey: string,
): { next: string; nextCaret: number } | null {
  if (e.key !== 'Tab' || e.shiftKey) return null;
  const before = text.slice(0, caret);
  const prefix = getActivePrefixAtCaret(before);
  if (prefix.length < 2) return null;
  if (detectWritingReminder(text, caret)) return null;

  const suggestions = getSuggestions(bankKey, prefix, 1, before);
  const top = suggestions[0];
  if (!top || !top.toLowerCase().startsWith(prefix.toLowerCase()) || top.length <= prefix.length) {
    return null;
  }

  e.preventDefault();
  return applySuggestionAtCaret(text, caret, top);
}
