import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { caretTouchesRange, replaceTextRange } from '../lib/writingReminder';

const DEFAULT_DELAY_MS = 240;

export type DeferredApplyChip = {
  start: number;
  end: number;
  replacement: string;
  /** When set, combined editors route dismiss to the right suggestion bucket. */
  chipKind?: 'writing' | 'entity';
};

/**
 * Single-click on a typo applies the suggestion after a short delay, cancelled by a second
 * mousedown (so double-click to select the word still works).
 */
export function useDeferredRangeClickApply(options: {
  textareaRef: RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
  chip: DeferredApplyChip | null;
  text: string;
  onApply: (next: string, nextCaret: number, chip: DeferredApplyChip) => void;
  delayMs?: number;
}) {
  const { textareaRef, chip, text, onApply, delayMs = DEFAULT_DELAY_MS } = options;
  const timerRef = useRef<number | null>(null);
  const chipRef = useRef(chip);
  const textRef = useRef(text);
  const onApplyRef = useRef(onApply);
  chipRef.current = chip;
  textRef.current = text;
  onApplyRef.current = onApply;

  useEffect(
    () => () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onMouseDown = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const onClickDeferredApply = useCallback(() => {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      const currentChip = chipRef.current;
      const el = textareaRef.current;
      if (!currentChip || !el) return;
      if (el.selectionStart !== el.selectionEnd) return;
      const caret = el.selectionStart ?? 0;
      if (!caretTouchesRange(caret, currentChip.start, currentChip.end)) return;
      const next = replaceTextRange(textRef.current, currentChip.start, currentChip.end, currentChip.replacement);
      const nextCaret = currentChip.start + currentChip.replacement.length;
      onApplyRef.current(next, nextCaret, currentChip);
    }, delayMs);
  }, [clearTimer, delayMs, textareaRef]);

  return { onMouseDown, onClickDeferredApply };
}
