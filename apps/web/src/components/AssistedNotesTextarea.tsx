import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { useDeferredRangeClickApply } from '../hooks/useDeferredRangeClickApply';
import { useTypingAssist } from '../hooks/useTypingAssist';
import {
  applyWritingReminder,
  caretTouchesReminder,
  detectWritingReminder,
  tryAcceptWritingReminderKeydown,
} from '../lib/writingReminder';
import { estimateReminderBubbleWidth, measureTextareaOverlayPosition } from '../lib/textareaCaretOverlay';
import InlineGhostLayer from './InlineGhostLayer';
import SmartWritingReminder from './SmartWritingReminder';

export type AssistedNotesTextareaProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  textareaClassName: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  /**
   * Dictionary scope for ghost completions. Pass `''` to disable ghost + Tab complete.
   * Default pool key when omitted: `assist-default`.
   */
  assistBankKey?: string;
  /** Padding + font classes matching the textarea so the ghost lines up (same values as before mirrorClassName). */
  ghostMirrorClassName?: string;
  autoFocus?: boolean;
  rows?: number;
};

/**
 * Multiline field: iOS-style correction chip + optional inline ghost completion (Tab to accept).
 */
export default function AssistedNotesTextarea({
  value,
  onChange,
  placeholder,
  className = '',
  textareaClassName,
  textareaRef: externalRef,
  assistBankKey,
  ghostMirrorClassName,
  autoFocus,
  rows,
}: AssistedNotesTextareaProps) {
  const assistKey = assistBankKey === '' ? null : (assistBankKey ?? 'assist-default');
  const assist = useTypingAssist(assistKey);
  const [inlineSuffix, setInlineSuffix] = useState('');
  const fallbackRef = useRef<HTMLTextAreaElement | null>(null);
  const textareaRef = externalRef ?? fallbackRef;
  const [caretIndex, setCaretIndex] = useState(0);
  const [scroll, setScroll] = useState({ left: 0, top: 0 });
  const [dismissedReminderKey, setDismissedReminderKey] = useState<string | null>(null);
  const [reminderPosition, setReminderPosition] = useState({ left: 0, top: 0 });

  const writingReminder = useMemo(
    () => detectWritingReminder(value, caretIndex),
    [value, caretIndex],
  );
  const activeReminder = writingReminder && writingReminder.key !== dismissedReminderKey
    ? writingReminder
    : null;

  const reminderClickApply = useDeferredRangeClickApply({
    textareaRef,
    chip: activeReminder
      ? {
          start: activeReminder.start,
          end: activeReminder.end,
          replacement: activeReminder.replacement,
        }
      : null,
    text: value,
    onApply: useCallback(
      (next, nextCaret, chip) => {
        onChange(next);
        setDismissedReminderKey(`${chip.start}:${chip.end}:${chip.replacement}`);
        setCaretIndex(nextCaret);
        window.requestAnimationFrame(() => {
          textareaRef.current?.focus();
          textareaRef.current?.setSelectionRange(nextCaret, nextCaret);
        });
      },
      [onChange, textareaRef],
    ),
  });

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !activeReminder) {
      setReminderPosition({ left: 0, top: 0 });
      return;
    }
    const bubbleWidth = estimateReminderBubbleWidth(activeReminder.label);
    const nextPosition = measureTextareaOverlayPosition(
      textarea,
      value,
      activeReminder.start,
      activeReminder.end,
      bubbleWidth,
    );
    setReminderPosition(nextPosition);
  }, [activeReminder, value, scroll.top, scroll.left, textareaRef]);

  useLayoutEffect(() => {
    if (assistKey == null || !ghostMirrorClassName) {
      setInlineSuffix('');
      return;
    }
    if (caretIndex !== value.length) {
      setInlineSuffix('');
      return;
    }
    setInlineSuffix(assist.ghostSuffix(value, caretIndex));
  }, [assist, assistKey, caretIndex, ghostMirrorClassName, value]);

  return (
    <div className={['relative', className].filter(Boolean).join(' ')}>
      {ghostMirrorClassName && assistKey != null && inlineSuffix ? (
        <InlineGhostLayer
          value={value}
          suffix={inlineSuffix}
          scrollLeft={scroll.left}
          scrollTop={scroll.top}
          className={['left-0 right-0 top-0 overflow-hidden pr-1', ghostMirrorClassName].join(' ')}
        />
      ) : null}

      {activeReminder ? (
        <SmartWritingReminder
          label={activeReminder.label}
          className="pointer-events-auto absolute z-30"
          style={{ left: `${reminderPosition.left}px`, top: `${reminderPosition.top}px` }}
          onApply={() => {
            const next = applyWritingReminder(value, activeReminder);
            onChange(next);
            setDismissedReminderKey(activeReminder.key);
            const nextCaret = activeReminder.start + activeReminder.replacement.length;
            setCaretIndex(nextCaret);
            window.requestAnimationFrame(() => {
              textareaRef.current?.focus();
              textareaRef.current?.setSelectionRange(nextCaret, nextCaret);
            });
          }}
          onDismiss={() => setDismissedReminderKey(activeReminder.key)}
        />
      ) : null}

      <textarea
        ref={textareaRef as React.Ref<HTMLTextAreaElement>}
        rows={rows}
        className={['relative z-10', textareaClassName].filter(Boolean).join(' ')}
        placeholder={placeholder}
        value={value}
        autoFocus={autoFocus}
        onChange={e => {
          onChange(e.currentTarget.value);
          setCaretIndex(e.currentTarget.selectionStart ?? e.currentTarget.value.length);
          setDismissedReminderKey(null);
        }}
        onMouseDown={reminderClickApply.onMouseDown}
        onClick={e => {
          setCaretIndex(e.currentTarget.selectionStart ?? 0);
          reminderClickApply.onClickDeferredApply();
        }}
        onDoubleClick={e => {
          const el = textareaRef.current;
          if (!activeReminder || !el) return;
          const caret = el.selectionStart ?? 0;
          if (!caretTouchesReminder(caret, activeReminder)) return;
          e.preventDefault();
          const next = applyWritingReminder(value, activeReminder);
          onChange(next);
          setDismissedReminderKey(activeReminder.key);
          const nextCaret = activeReminder.start + activeReminder.replacement.length;
          setCaretIndex(nextCaret);
          window.requestAnimationFrame(() => {
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(nextCaret, nextCaret);
          });
        }}
        onKeyUp={e => setCaretIndex(e.currentTarget.selectionStart ?? 0)}
        onSelect={e => setCaretIndex(e.currentTarget.selectionStart ?? 0)}
        onScroll={e => {
          const t = e.currentTarget;
          setScroll({ left: t.scrollLeft, top: t.scrollTop });
        }}
        onKeyDown={e => {
          const caret = e.currentTarget.selectionStart ?? value.length;
          if (activeReminder) {
            const accepted = tryAcceptWritingReminderKeydown(e, activeReminder, value, caret);
            if (accepted) {
              onChange(accepted.next);
              setCaretIndex(accepted.nextCaret);
              setDismissedReminderKey(activeReminder.key);
              window.requestAnimationFrame(() => {
                const el = textareaRef.current;
                el?.focus();
                el?.setSelectionRange(accepted.nextCaret, accepted.nextCaret);
              });
              return;
            }
          }
          if (assistKey == null || !ghostMirrorClassName) return;
          const applied = assist.tabComplete(e, value, caret);
          if (applied) {
            onChange(applied.next);
            setCaretIndex(applied.nextCaret);
            window.requestAnimationFrame(() => {
              const el = textareaRef.current;
              el?.focus();
              el?.setSelectionRange(applied.nextCaret, applied.nextCaret);
            });
          }
        }}
      />
    </div>
  );
}
