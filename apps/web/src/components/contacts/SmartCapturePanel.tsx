import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ContactMessageEntry } from '../../config/contactThreads';
import type { AppTranslations } from '../../i18n/translations';
import { useDeferredRangeClickApply } from '../../hooks/useDeferredRangeClickApply';
import { useTypingAssist } from '../../hooks/useTypingAssist';
import {
  applyWritingReminder,
  caretTouchesReminder,
  detectWritingReminder,
  tryAcceptWritingReminderKeydown,
} from '../../lib/writingReminder';
import { estimateReminderBubbleWidth, measureTextareaOverlayPosition } from '../../lib/textareaCaretOverlay';
import InlineGhostLayer from '../InlineGhostLayer';
import SmartWritingReminder from '../SmartWritingReminder';

type SmartCapturePanelProps = {
  contactId: string;
  contactName: string;
  messages: ContactMessageEntry[];
  copy: AppTranslations;
  onSaveInbound: (contactId: string, text: string) => void;
  /** Saves inbound then closes contacts and opens main composer with this text */
  onSaveAndCompose?: (contactId: string, text: string) => void;
};

export default function SmartCapturePanel({
  contactId,
  contactName,
  messages,
  copy,
  onSaveInbound,
  onSaveAndCompose,
}: SmartCapturePanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<'idle' | 'error'>('idle');
  const [showSavedCheck, setShowSavedCheck] = useState(false);
  const ct = copy.contactThreads;
  const rootRef = useRef<HTMLElement | null>(null);
  const draftTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const wasExpandedRef = useRef(false);
  const suppressAutoHideUntilRef = useRef(0);
  const collapseReasonRef = useRef<'manual' | 'save' | 'auto' | null>(null);

  const assist = useTypingAssist('smart-capture');
  const [inlineGhostSuffix, setInlineGhostSuffix] = useState('');

  const [caretIndex, setCaretIndex] = useState(0);
  const [textareaScroll, setTextareaScroll] = useState({ left: 0, top: 0 });
  const [dismissedReminderKey, setDismissedReminderKey] = useState<string | null>(null);

  const writingReminder = useMemo(
    () => detectWritingReminder(draft, caretIndex),
    [draft, caretIndex],
  );
  const activeWritingReminder = writingReminder && writingReminder.key !== dismissedReminderKey
    ? writingReminder
    : null;

  const reminderClickApply = useDeferredRangeClickApply({
    textareaRef: draftTextareaRef,
    chip: activeWritingReminder
      ? {
          start: activeWritingReminder.start,
          end: activeWritingReminder.end,
          replacement: activeWritingReminder.replacement,
        }
      : null,
    text: draft,
    onApply: useCallback((next, nextCaret, chip) => {
      setDraft(next);
      setCaretIndex(nextCaret);
      setStatus('idle');
      setDismissedReminderKey(`${chip.start}:${chip.end}:${chip.replacement}`);
      window.requestAnimationFrame(() => {
        draftTextareaRef.current?.focus();
        draftTextareaRef.current?.setSelectionRange(nextCaret, nextCaret);
      });
    }, []),
  });

  const [reminderPosition, setReminderPosition] = useState({ left: 0, top: 0 });

  useLayoutEffect(() => {
    const textarea = draftTextareaRef.current;
    if (!textarea || !activeWritingReminder) {
      setReminderPosition({ left: 0, top: 0 });
      return;
    }
    const bubbleWidth = estimateReminderBubbleWidth(activeWritingReminder.label);
    const nextPosition = measureTextareaOverlayPosition(
      textarea,
      draft,
      activeWritingReminder.start,
      activeWritingReminder.end,
      bubbleWidth,
    );
    setReminderPosition(nextPosition);
  }, [activeWritingReminder, draft, textareaScroll.top, textareaScroll.left]);

  useLayoutEffect(() => {
    if (caretIndex !== draft.length) {
      setInlineGhostSuffix('');
      return;
    }
    setInlineGhostSuffix(assist.ghostSuffix(draft, caretIndex));
  }, [assist, caretIndex, draft]);

  useEffect(() => {
    if (!expanded && !wasExpandedRef.current) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const panel = rootRef.current;
      if (!panel) {
        return;
      }

      const scrollContainer = panel.closest('.clean-scrollbar') as HTMLElement | null;
      if (!scrollContainer) {
        if (!expanded && wasExpandedRef.current) {
          panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }

      const panelRect = panel.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      const topOffset = panelRect.top - containerRect.top - 8;
      const bottomOffset = panelRect.bottom - containerRect.bottom;

      if (!expanded && wasExpandedRef.current) {
        const collapseReason = collapseReasonRef.current;
        collapseReasonRef.current = null;

        if (collapseReason === 'auto') {
          return;
        }

        const targetTop = containerRect.top + containerRect.height * 0.2;
        const shiftToTargetTop = panelRect.top - targetTop;

        if (Math.abs(shiftToTargetTop) > 4) {
          scrollContainer.scrollBy({ top: shiftToTargetTop, behavior: 'smooth' });
          return;
        }

        if (panelRect.bottom > containerRect.bottom - 8) {
          scrollContainer.scrollBy({ top: panelRect.bottom - (containerRect.bottom - 8), behavior: 'smooth' });
        }
        return;
      }

      if (bottomOffset > 0) {
        scrollContainer.scrollBy({ top: bottomOffset + 2, behavior: 'smooth' });
        return;
      }

      if (topOffset < 0) {
        scrollContainer.scrollBy({ top: topOffset, behavior: 'smooth' });
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [expanded]);

  useEffect(() => {
    wasExpandedRef.current = expanded;
  }, [expanded]);

  useEffect(() => {
    if (!expanded) {
      return;
    }

    const panel = rootRef.current;
    if (!panel) {
      return;
    }

    const scrollContainer = panel.closest('.clean-scrollbar') as HTMLElement | null;
    if (!scrollContainer) {
      return;
    }

    let frameId = 0;

    const checkPanelFocus = () => {
      frameId = 0;

      if (Date.now() < suppressAutoHideUntilRef.current) {
        return;
      }

      const panelRect = panel.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      const focusTop = containerRect.top + containerRect.height * 0.12;
      const focusBottom = containerRect.bottom - containerRect.height * 0.22;
      const panelAnchor = panelRect.top + Math.min(panelRect.height, 180) * 0.5;
      const isOutOfFocus = panelAnchor < focusTop || panelAnchor > focusBottom;

      if (isOutOfFocus) {
        collapseReasonRef.current = 'auto';
        setExpanded(false);
      }
    };

    const handleScroll = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      frameId = window.requestAnimationFrame(checkPanelFocus);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [expanded]);

  useEffect(() => {
    if (!showSavedCheck) return;
    const timeoutId = window.setTimeout(() => {
      setShowSavedCheck(false);
    }, 900);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [showSavedCheck]);

  function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setStatus('error');
      return;
    }

    onSaveInbound(contactId, trimmed);
    setDraft('');
    setStatus('idle');
    suppressAutoHideUntilRef.current = Date.now() + 450;
    collapseReasonRef.current = 'save';
    setExpanded(false);
    setShowSavedCheck(true);
  }

  function handleSaveAndCompose() {
    const trimmed = draft.trim();
    if (!trimmed || !onSaveAndCompose) {
      setStatus('error');
      return;
    }
    onSaveInbound(contactId, trimmed);
    onSaveAndCompose(contactId, trimmed);
    setDraft('');
    setStatus('idle');
    suppressAutoHideUntilRef.current = Date.now() + 450;
    collapseReasonRef.current = 'save';
    setExpanded(false);
    setShowSavedCheck(true);
  }

  return (
    <section ref={rootRef} className="mt-3 rounded-[12px] border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[12px] text-slate-600">{ct.messageFromLabel}</p>
          <p className="text-[15px] font-semibold text-[#d94f81]">{contactName}</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-[12px] font-medium text-slate-500">{messages.length} {ct.messagesLabel}</p>
            <span
              className={[
                'inline-flex h-4 w-4 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 text-[10px] font-bold text-emerald-600 transition-all duration-300',
                showSavedCheck ? 'opacity-100 scale-100' : 'opacity-0 scale-90',
              ].join(' ')}
              aria-hidden="true"
            >
              ✓
            </span>
          </div>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            aria-label={expanded ? ct.collapseMessageAria : ct.expandMessageAria}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-[14px] leading-none text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            onClick={() => {
              suppressAutoHideUntilRef.current = Date.now() + 550;
              setExpanded(value => {
                const next = !value;
                if (!next) {
                  collapseReasonRef.current = 'manual';
                }
                return next;
              });
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d={expanded ? 'M7 15L12 10L17 15' : 'M7 9L12 14L17 9'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {expanded ? (
        <>
          <div className="relative mt-3 -mx-3 -mb-3">
            {inlineGhostSuffix ? (
              <InlineGhostLayer
                value={draft}
                suffix={inlineGhostSuffix}
                scrollLeft={textareaScroll.left}
                scrollTop={textareaScroll.top}
                className="pointer-events-none absolute left-3 right-3 top-2 z-0 overflow-hidden whitespace-pre-wrap break-words pr-1 text-[12px] leading-6"
              />
            ) : null}
            {activeWritingReminder ? (
              <SmartWritingReminder
                label={activeWritingReminder.label}
                className="pointer-events-auto absolute z-30"
                style={{ left: `${reminderPosition.left}px`, top: `${reminderPosition.top}px` }}
                onApply={() => {
                  const next = applyWritingReminder(draft, activeWritingReminder);
                  setDraft(next);
                  setDismissedReminderKey(activeWritingReminder.key);
                  const nextCaret = activeWritingReminder.start + activeWritingReminder.replacement.length;
                  setCaretIndex(nextCaret);
                  window.requestAnimationFrame(() => {
                    draftTextareaRef.current?.focus();
                    draftTextareaRef.current?.setSelectionRange(nextCaret, nextCaret);
                  });
                }}
                onDismiss={() => {
                  setDismissedReminderKey(activeWritingReminder.key);
                }}
              />
            ) : null}

            <textarea
              ref={draftTextareaRef}
              value={draft}
              onChange={event => {
                setDraft(event.currentTarget.value);
                setStatus('idle');
                setCaretIndex(event.currentTarget.selectionStart ?? event.currentTarget.value.length);
                setDismissedReminderKey(null);
              }}
              onMouseDown={reminderClickApply.onMouseDown}
              onClick={event => {
                setCaretIndex(event.currentTarget.selectionStart ?? 0);
                reminderClickApply.onClickDeferredApply();
              }}
              onKeyUp={event => {
                setCaretIndex(event.currentTarget.selectionStart ?? 0);
              }}
              onDoubleClick={e => {
                const el = draftTextareaRef.current;
                if (!activeWritingReminder || !el) return;
                const caret = el.selectionStart ?? 0;
                if (!caretTouchesReminder(caret, activeWritingReminder)) return;
                e.preventDefault();
                const nextValue = applyWritingReminder(draft, activeWritingReminder);
                setDraft(nextValue);
                setDismissedReminderKey(activeWritingReminder.key);
                const nextCaret = activeWritingReminder.start + activeWritingReminder.replacement.length;
                setCaretIndex(nextCaret);
                window.requestAnimationFrame(() => {
                  draftTextareaRef.current?.focus();
                  draftTextareaRef.current?.setSelectionRange(nextCaret, nextCaret);
                });
              }}
              onSelect={event => {
                setCaretIndex(event.currentTarget.selectionStart ?? 0);
              }}
              onScroll={event => {
                const target = event.currentTarget;
                setTextareaScroll({ left: target.scrollLeft, top: target.scrollTop });
              }}
              onKeyDown={e => {
                const el = draftTextareaRef.current;
                const caret = el?.selectionStart ?? draft.length;
                if (activeWritingReminder) {
                  const accepted = tryAcceptWritingReminderKeydown(e, activeWritingReminder, draft, caret);
                  if (accepted) {
                    setDraft(accepted.next);
                    setCaretIndex(accepted.nextCaret);
                    setStatus('idle');
                    setDismissedReminderKey(activeWritingReminder.key);
                    window.requestAnimationFrame(() => {
                      draftTextareaRef.current?.focus();
                      draftTextareaRef.current?.setSelectionRange(accepted.nextCaret, accepted.nextCaret);
                    });
                    return;
                  }
                }
                const applied = assist.tabComplete(e, draft, caret);
                if (applied) {
                  setDraft(applied.next);
                  setCaretIndex(applied.nextCaret);
                  setStatus('idle');
                  window.requestAnimationFrame(() => {
                    draftTextareaRef.current?.focus();
                    draftTextareaRef.current?.setSelectionRange(applied.nextCaret, applied.nextCaret);
                  });
                }
              }}
              placeholder={ct.smartCapturePlaceholder}
              className="relative z-10 min-h-[300px] w-full resize-none rounded-b-[10px] border border-slate-200 bg-white px-3 py-2 pb-20 text-[12px] leading-6 text-slate-700 outline-none placeholder:text-slate-400"
            />

            {status === 'error' ? (
              <p className="pointer-events-none absolute bottom-5 left-3 z-30 text-[10px] text-rose-500">{ct.captureError}</p>
            ) : null}

            <div className="absolute bottom-3 left-3 right-3 z-30 flex flex-wrap items-center justify-end gap-2">
              {onSaveAndCompose ? (
                <button
                  type="button"
                  className="order-2 rounded-full border border-[#d67a9e] bg-white px-3 py-2 text-[11px] font-semibold text-[#8b3558] transition hover:bg-[#fff5f9] disabled:cursor-not-allowed disabled:opacity-50 sm:order-1 sm:mr-auto"
                  onClick={handleSaveAndCompose}
                  disabled={!draft.trim()}
                >
                  {ct.saveAndCompose}
                </button>
              ) : null}
              <button
                type="button"
                className="order-1 rounded-full bg-[#E85C8B] px-4 py-2 text-[11px] font-semibold text-white shadow-[0_2px_8px_rgba(232,92,139,0.25)] transition hover:bg-[#d94f81] disabled:cursor-not-allowed disabled:opacity-50 sm:order-2"
                onClick={handleSave}
                disabled={!draft.trim()}
              >
                {ct.saveInboundMessage}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}