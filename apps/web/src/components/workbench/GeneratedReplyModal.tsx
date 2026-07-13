import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import type { AppTranslations } from '../../i18n/translations';
import type { WorkMode } from './types';
import ReplyIntelligenceModal from './ReplyIntelligenceModal';
import type { ReplyInsight, ReplyQuickAction } from './generatedReplyTypes';
import { useDeferredRangeClickApply } from '../../hooks/useDeferredRangeClickApply';
import { useTypingAssist } from '../../hooks/useTypingAssist';
import {
  applyWritingReminder,
  caretTouchesReminder,
  detectWritingReminder,
  replaceTextRange,
  tryAcceptWritingReminderKeydown,
} from '../../lib/writingReminder';
import { estimateReminderBubbleWidth, measureTextareaOverlayPosition } from '../../lib/textareaCaretOverlay';
import InlineGhostLayer from '../InlineGhostLayer';
import SmartWritingReminder from '../SmartWritingReminder';
import { usePanelDrag } from '../../hooks/usePanelDrag';
import { useNextStepClass } from '../guidance/NextStepProvider';
import ShortcutHint, { copyShortcutLabel } from '../guidance/ShortcutHint';
import CulturalTipStrip from '../cross-language/CulturalTipStrip';
import type { CulturalTipKey } from '../cross-language/culturalTip';
import ImpressionCheckChip from '../quality-guard/ImpressionCheckChip';
import VoiceMatchMeter from '../quality-guard/VoiceMatchMeter';
import WhyThisReplyExpander from '../quality-guard/WhyThisReplyExpander';
import ConfidenceLine from '../quality-guard/ConfidenceLine';
import { buildConfidenceVerdict } from '../quality-guard/buildConfidenceVerdict';
import type { ImpressionCheckResult } from '../quality-guard/impressionCheck';
import OutcomeSignalsRow from '../rewrite-modes/OutcomeSignalsRow';
import RewriteModeStrip from '../rewrite-modes/RewriteModeStrip';
import type { RewriteMode } from '../rewrite-modes/registry';
import SendTimingHint from '../timing-intelligence/SendTimingHint';
import type { SendTimingHint as SendTimingHintData } from '../timing-intelligence/deriveSendTimingHint';
import type { VoiceMatchResult } from '../quality-guard/voiceMatch';
import type { BasedOnDetail } from './buildReplyBasedOnLines';
import GeneratedReplyLanguageToggle from '../cross-language/GeneratedReplyLanguageToggle';
import type { DraftLanguage } from '../cross-language/draftLanguageToggle';

type EntitySuggestion = {
  start: number;
  end: number;
  suggestion: string;
  key: string;
};

function isNameCharacter(char: string | undefined): char is string {
  return typeof char === 'string' && /[A-Za-z0-9'/-]/.test(char);
}

const IMPORTANT_INFO_SUGGESTIONS = [
  'today', 'tomorrow', 'tonight', 'next week', 'next month',
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
  'AM', 'PM',
] as const;

function getEntitySuggestion(text: string, caretPosition: number, candidates: string[]): EntitySuggestion | null {
  if (!candidates.length) return null;

  let start = caretPosition;
  while (start > 0 && isNameCharacter(text[start - 1])) {
    start -= 1;
  }

  let end = caretPosition;
  while (end < text.length && isNameCharacter(text[end])) {
    end += 1;
  }

  const query = text.slice(start, caretPosition).trim().toLowerCase();
  if (query.length < 2) return null;

  const matches = candidates
    .filter(candidate => {
      const normalized = candidate.toLowerCase();
      return normalized.startsWith(query) && normalized !== query;
    })
    .sort((left, right) => {
      const leftStarts = left.toLowerCase().startsWith(query) ? 0 : 1;
      const rightStarts = right.toLowerCase().startsWith(query) ? 0 : 1;
      if (leftStarts !== rightStarts) return leftStarts - rightStarts;
      const lengthDelta = left.length - right.length;
      if (lengthDelta !== 0) return lengthDelta;
      return left.localeCompare(right);
    })
    .slice(0, 1);

  if (!matches.length) return null;

  const suggestion = matches[0];
  return {
    start,
    end,
    suggestion,
    key: `${start}:${end}:${suggestion}`,
  };
}

function tryAcceptEntitySuggestionKeydown(
  e: KeyboardEvent<HTMLTextAreaElement>,
  entity: EntitySuggestion | null,
  text: string,
  caret: number,
): { next: string; nextCaret: number } | null {
  if (!entity || caret < entity.start || caret > entity.end) return null;

  if (e.key === 'Tab' && !e.shiftKey) {
    e.preventDefault();
    const next = replaceTextRange(text, entity.start, entity.end, entity.suggestion);
    const nextCaret = entity.start + entity.suggestion.length;
    return { next, nextCaret };
  }

  if (e.key === ' ') {
    e.preventDefault();
    const replaced = replaceTextRange(text, entity.start, entity.end, entity.suggestion);
    const pos = entity.start + entity.suggestion.length;
    const next = `${replaced.slice(0, pos)} ${replaced.slice(pos)}`;
    return { next, nextCaret: pos + 1 };
  }

  return null;
}

export type GeneratedReplyModalProps = {
  surface?: 'overlay' | 'window';
  copy: AppTranslations;
  isEditingGenerated: boolean;
  generatedMessage: string;
  contactNames: string[];
  /** Short bullets explaining what the draft leaned on (memory + timeline + input). */
  basedOnLines?: string[];
  prioritizedEntities?: string[];
  insight: ReplyInsight | null;
  mode: WorkMode;
  onToggleEditing: () => void;
  onClose: () => void;
  onMessageChange: (value: string) => void;
  onCopy: () => void;
  onAddToQueue?: () => void;
  isMacPlatform?: boolean;
  copyNextStepHint?: string;
  culturalTipKey?: CulturalTipKey | null;
  impressionCheck?: ImpressionCheckResult | null;
  voiceMatch?: VoiceMatchResult | null;
  whyDetails?: BasedOnDetail[];
  onAutoSoften?: () => void;
  /** Phase 18 — fire a regenerate with `rewrite-mode:<id>` source. Hidden
   *  when no handler is provided. Loading state disables the chips so the
   *  strip layout doesn't jump while a regen is in flight. */
  onRewriteMode?: (mode: RewriteMode) => void;
  loading?: boolean;
  /** Phase 19 — calm send-timing hint above the Copy button. `null` keeps
   *  the modal silent — there is nothing honest to say. */
  sendTimingHint?: SendTimingHintData | null;
  /** Detected language of the draft currently on screen (drives 中文/En pill). */
  draftDisplayLanguage?: DraftLanguage;
  onToggleDraftLanguage?: () => void;
  isTranslatingDraft?: boolean;
};

export default function GeneratedReplyModal({
  surface = 'overlay',
  copy,
  isEditingGenerated,
  generatedMessage,
  contactNames,
  basedOnLines = [],
  prioritizedEntities = [],
  insight,
  mode,
  onToggleEditing,
  onClose,
  onMessageChange,
  onCopy,
  onAddToQueue,
  isMacPlatform = false,
  copyNextStepHint,
  culturalTipKey = null,
  impressionCheck = null,
  voiceMatch = null,
  whyDetails = [],
  onAutoSoften,
  onRewriteMode,
  loading = false,
  sendTimingHint = null,
  draftDisplayLanguage = 'en',
  onToggleDraftLanguage,
  isTranslatingDraft = false,
}: GeneratedReplyModalProps) {
  const isWindowSurface = surface === 'window';
  const copyRingClass = useNextStepClass('copy');
  const { offset, handleProps } = usePanelDrag();
  const [addedToQueue, setAddedToQueue] = useState(false);
  const [isIntelligenceOpen, setIsIntelligenceOpen] = useState(false);
  const [caretPosition, setCaretPosition] = useState(0);
  const [dismissedReminderKey, setDismissedReminderKey] = useState<string | null>(null);
  const [dismissedEntitySuggestionKey, setDismissedEntitySuggestionKey] = useState<string | null>(null);
  const [reminderPosition, setReminderPosition] = useState({ left: 0, top: 0 });
  const [editorScroll, setEditorScroll] = useState({ left: 0, top: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const assist = useTypingAssist('reply-edit');
  const [inlineGhostSuffix, setInlineGhostSuffix] = useState('');
  const entityCandidates = useMemo(() => {
    const unique = new Map<string, string>();

    [...prioritizedEntities, ...contactNames, ...IMPORTANT_INFO_SUGGESTIONS].forEach(candidate => {
      const trimmed = String(candidate || '').trim();
      if (!trimmed) return;
      unique.set(trimmed.toLowerCase(), trimmed);
    });

    return Array.from(unique.values());
  }, [contactNames, prioritizedEntities]);
  const entitySuggestion = useMemo(
    () => getEntitySuggestion(generatedMessage, caretPosition, entityCandidates),
    [caretPosition, entityCandidates, generatedMessage],
  );
  const writingReminder = useMemo(
    () => detectWritingReminder(generatedMessage, caretPosition),
    [generatedMessage, caretPosition],
  );
  const activeWritingReminder = writingReminder && writingReminder.key !== dismissedReminderKey
    ? writingReminder
    : null;
  const activeEntitySuggestion = entitySuggestion && entitySuggestion.key !== dismissedEntitySuggestionKey
    ? entitySuggestion
    : null;
  const activeChip = useMemo(() => {
    if (activeWritingReminder) {
      return {
        start: activeWritingReminder.start,
        end: activeWritingReminder.end,
        label: activeWritingReminder.label,
        kind: 'writing' as const,
      };
    }

    if (activeEntitySuggestion) {
      return {
        start: activeEntitySuggestion.start,
        end: activeEntitySuggestion.end,
        label: activeEntitySuggestion.suggestion,
        kind: 'entity' as const,
      };
    }

    return null;
  }, [activeEntitySuggestion, activeWritingReminder]);

  const deferredModalChip = useMemo(() => {
    if (activeWritingReminder) {
      return {
        start: activeWritingReminder.start,
        end: activeWritingReminder.end,
        replacement: activeWritingReminder.replacement,
        chipKind: 'writing' as const,
      };
    }
    if (activeEntitySuggestion) {
      return {
        start: activeEntitySuggestion.start,
        end: activeEntitySuggestion.end,
        replacement: activeEntitySuggestion.suggestion,
        chipKind: 'entity' as const,
      };
    }
    return null;
  }, [activeEntitySuggestion, activeWritingReminder]);

  const modalChipClickApply = useDeferredRangeClickApply({
    textareaRef,
    chip: deferredModalChip,
    text: generatedMessage,
    onApply: useCallback(
      (next, nextCaret, chip) => {
        onMessageChange(next);
        const dismissKey = `${chip.start}:${chip.end}:${chip.replacement}`;
        if (chip.chipKind === 'entity') {
          setDismissedEntitySuggestionKey(dismissKey);
        } else {
          setDismissedReminderKey(dismissKey);
        }
        window.requestAnimationFrame(() => {
          textareaRef.current?.focus();
          textareaRef.current?.setSelectionRange(nextCaret, nextCaret);
          setCaretPosition(nextCaret);
        });
      },
      [onMessageChange],
    ),
  });

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !activeChip) {
      setReminderPosition(prev => (
        prev.left === 0 && prev.top === 0 ? prev : { left: 0, top: 0 }
      ));
      return;
    }

    const nextPosition = measureTextareaOverlayPosition(
      textarea,
      generatedMessage,
      activeChip.start,
      activeChip.end,
      estimateReminderBubbleWidth(activeChip.label),
    );
    setReminderPosition(prev => (
      prev.left === nextPosition.left && prev.top === nextPosition.top ? prev : nextPosition
    ));
  }, [activeChip, editorScroll.left, editorScroll.top, generatedMessage]);

  useLayoutEffect(() => {
    if (!isEditingGenerated || activeChip || caretPosition !== generatedMessage.length) {
      setInlineGhostSuffix('');
      return;
    }
    setInlineGhostSuffix(assist.ghostSuffix(generatedMessage, caretPosition));
  }, [activeChip, assist, caretPosition, generatedMessage, isEditingGenerated]);

  const syncCaretPosition = () => {
    const nextPosition = textareaRef.current?.selectionStart ?? 0;
    setCaretPosition(nextPosition);
  };

  const handleApplyEntitySuggestion = () => {
    if (!activeEntitySuggestion) return;

    const nextMessage = `${generatedMessage.slice(0, activeEntitySuggestion.start)}${activeEntitySuggestion.suggestion}${generatedMessage.slice(activeEntitySuggestion.end)}`;
    onMessageChange(nextMessage);

    window.requestAnimationFrame(() => {
      const nextCursor = activeEntitySuggestion.start + activeEntitySuggestion.suggestion.length;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCursor, nextCursor);
      setCaretPosition(nextCursor);
    });
  };

  const limitedContext = basedOnLines.length === 0
    || basedOnLines.includes(copy.modal.basedOnLimitedContext);
  const confidenceVerdict = buildConfidenceVerdict({ impressionCheck, voiceMatch, limitedContext });

  return (
    <div className={isWindowSurface ? 'h-full w-full overflow-hidden bg-white' : 'pointer-events-none absolute inset-0 z-[70]'}>
      <section
        className={[
          'flex min-h-0 flex-col rounded-[20px] border border-[#f1d5e1] bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.20)]',
          isWindowSurface
            ? 'h-full w-full overflow-hidden rounded-[18px] border-slate-200'
            : 'pointer-events-auto absolute left-1/2 top-1/2 flex w-[calc(100%-24px)] max-w-[430px] max-h-[min(88vh,640px)] flex-col',
        ].join(' ')}
        style={isWindowSurface ? undefined : {
          transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
        }}
      >
        <div className="flex shrink-0 items-start justify-between gap-3">
          <div
            className={[
              'min-w-0 flex-1 select-none',
              isWindowSurface ? '' : 'cursor-grab active:cursor-grabbing',
            ].join(' ')}
            {...(isWindowSurface ? {} : handleProps)}
            style={isWindowSurface ? ({ WebkitAppRegion: 'drag' } as CSSProperties) : undefined}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#cb5f89]">{copy.modal.title}</p>
            <ConfidenceLine copy={copy} verdict={confidenceVerdict} />
          </div>
          <div
            className="flex shrink-0 items-center gap-1.5"
            onPointerDown={event => event.stopPropagation()}
            style={isWindowSurface ? ({ WebkitAppRegion: 'no-drag' } as CSSProperties) : undefined}
          >
            <button
              type="button"
              title={isEditingGenerated ? copy.modal.doneEditing : copy.modal.editReply}
              aria-pressed={isEditingGenerated}
              className={[
                'rounded-full border p-1.5 transition',
                isEditingGenerated
                  ? 'border-[#e88ab0] bg-[#fde9f2] text-[#b84f79]'
                  : 'border-[#e7aac2] bg-white text-[#b54e77] hover:border-[#d67a9e] hover:bg-[#fff5f9]',
              ].join(' ')}
              onClick={onToggleEditing}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button
              type="button"
              className="rounded-full border border-[#eed9e2] px-2 py-1 text-[10px] text-slate-500 transition hover:border-[#e7aac2] hover:text-[#c15480]"
              onClick={onClose}
            >
              {copy.modal.close}
            </button>
          </div>
        </div>

        {basedOnLines.length > 0 ? (
          <div className="mt-2 shrink-0 rounded-[10px] border border-slate-100/90 bg-slate-50/70 px-2.5 py-1.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              {copy.modal.basedOnTitle}
            </p>
            <ul className="mt-1 space-y-0.5 text-[10px] leading-snug text-slate-500">
              {basedOnLines.map((line, index) => (
                <li key={`based-on-${index}`} className="flex gap-1.5">
                  <span className="shrink-0 text-slate-300 select-none" aria-hidden>
                    –
                  </span>
                  <span className="min-w-0 break-words">{line}</span>
                </li>
              ))}
            </ul>
            <WhyThisReplyExpander copy={copy} details={whyDetails} />
          </div>
        ) : null}

        <CulturalTipStrip copy={copy} tipKey={culturalTipKey} className="shrink-0" />

        {impressionCheck ? (
          <ImpressionCheckChip
            copy={copy}
            result={impressionCheck}
            onAutoSoften={onAutoSoften}
            className="shrink-0"
          />
        ) : null}

        {voiceMatch && voiceMatch.state === 'different' ? (
          <VoiceMatchMeter copy={copy} result={voiceMatch} className="shrink-0" />
        ) : null}

        <div className="clean-scrollbar relative mt-2 min-h-0 flex-1 overflow-y-auto rounded-[14px] border border-slate-200 bg-[#fcfcfd] p-3">
          {generatedMessage.trim() && onToggleDraftLanguage ? (
            <GeneratedReplyLanguageToggle
              displayLanguage={draftDisplayLanguage}
              onToggle={onToggleDraftLanguage}
              disabled={isTranslatingDraft}
            />
          ) : null}
          {isEditingGenerated ? (
            <>
              <div className="relative min-h-[min(42vh,320px)] pt-8">
                {activeChip ? (
                  <SmartWritingReminder
                    label={activeChip.label}
                    onApply={() => {
                      if (activeChip.kind === 'writing' && activeWritingReminder) {
                        const nextValue = applyWritingReminder(generatedMessage, activeWritingReminder);
                        onMessageChange(nextValue);
                        setDismissedReminderKey(activeWritingReminder.key);
                        const nextCaret = activeWritingReminder.start + activeWritingReminder.replacement.length;
                        setCaretPosition(nextCaret);
                        window.requestAnimationFrame(() => {
                          textareaRef.current?.focus();
                          textareaRef.current?.setSelectionRange(nextCaret, nextCaret);
                        });
                        return;
                      }

                      handleApplyEntitySuggestion();
                    }}
                    onDismiss={() => {
                      if (activeChip.kind === 'writing' && activeWritingReminder) {
                        setDismissedReminderKey(activeWritingReminder.key);
                        return;
                      }

                      if (activeEntitySuggestion) {
                        setDismissedEntitySuggestionKey(activeEntitySuggestion.key);
                      }
                    }}
                    className="pointer-events-auto absolute z-20"
                    style={{ left: `${reminderPosition.left}px`, top: `${reminderPosition.top}px` }}
                  />
                ) : null}
                {inlineGhostSuffix ? (
                  <InlineGhostLayer
                    value={generatedMessage}
                    suffix={inlineGhostSuffix}
                    scrollLeft={editorScroll.left}
                    scrollTop={editorScroll.top}
                    className="pointer-events-none absolute left-0 right-0 top-0 z-0 overflow-hidden whitespace-pre-wrap break-words pr-1 text-[12px] leading-6"
                  />
                ) : null}
                <textarea
                  ref={textareaRef}
                  className="clean-scrollbar relative z-10 min-h-[min(42vh,320px)] w-full resize-y overflow-y-auto border-0 bg-transparent p-0 text-[12px] leading-6 text-slate-700 outline-none"
                  value={generatedMessage}
                  onChange={event => {
                    const pos = event.currentTarget.selectionStart ?? 0;
                    setCaretPosition(pos);
                    setDismissedReminderKey(null);
                    setDismissedEntitySuggestionKey(null);
                    onMessageChange(event.currentTarget.value);
                  }}
                  onMouseDown={modalChipClickApply.onMouseDown}
                  onClick={() => {
                    syncCaretPosition();
                    modalChipClickApply.onClickDeferredApply();
                  }}
                  onKeyUp={syncCaretPosition}
                  onDoubleClick={e => {
                    const el = textareaRef.current;
                    if (!el) return;
                    const caret = el.selectionStart ?? 0;
                    if (activeWritingReminder && caretTouchesReminder(caret, activeWritingReminder)) {
                      e.preventDefault();
                      const nextValue = applyWritingReminder(generatedMessage, activeWritingReminder);
                      onMessageChange(nextValue);
                      setDismissedReminderKey(activeWritingReminder.key);
                      const nextCaret = activeWritingReminder.start + activeWritingReminder.replacement.length;
                      window.requestAnimationFrame(() => {
                        textareaRef.current?.focus();
                        textareaRef.current?.setSelectionRange(nextCaret, nextCaret);
                        setCaretPosition(nextCaret);
                      });
                      return;
                    }
                    if (
                      activeEntitySuggestion
                      && caret >= activeEntitySuggestion.start
                      && caret <= activeEntitySuggestion.end
                    ) {
                      e.preventDefault();
                      handleApplyEntitySuggestion();
                    }
                  }}
                  onSelect={syncCaretPosition}
                  onScroll={event => {
                    const t = event.currentTarget;
                    setEditorScroll({ left: t.scrollLeft, top: t.scrollTop });
                  }}
                  onKeyDown={e => {
                    const el = textareaRef.current;
                    const caret = el?.selectionStart ?? generatedMessage.length;
                    if (activeWritingReminder) {
                      const accepted = tryAcceptWritingReminderKeydown(
                        e,
                        activeWritingReminder,
                        generatedMessage,
                        caret,
                      );
                      if (accepted) {
                        onMessageChange(accepted.next);
                        setDismissedReminderKey(activeWritingReminder.key);
                        window.requestAnimationFrame(() => {
                          textareaRef.current?.focus();
                          textareaRef.current?.setSelectionRange(accepted.nextCaret, accepted.nextCaret);
                          setCaretPosition(accepted.nextCaret);
                        });
                        return;
                      }
                    }
                    if (activeEntitySuggestion) {
                      const accepted = tryAcceptEntitySuggestionKeydown(
                        e,
                        activeEntitySuggestion,
                        generatedMessage,
                        caret,
                      );
                      if (accepted) {
                        onMessageChange(accepted.next);
                        setDismissedEntitySuggestionKey(activeEntitySuggestion.key);
                        window.requestAnimationFrame(() => {
                          textareaRef.current?.focus();
                          textareaRef.current?.setSelectionRange(accepted.nextCaret, accepted.nextCaret);
                          setCaretPosition(accepted.nextCaret);
                        });
                        return;
                      }
                    }
                    const applied = assist.tabComplete(e, generatedMessage, caret);
                    if (applied) {
                      onMessageChange(applied.next);
                      window.requestAnimationFrame(() => {
                        textareaRef.current?.focus();
                        textareaRef.current?.setSelectionRange(applied.nextCaret, applied.nextCaret);
                        setCaretPosition(applied.nextCaret);
                      });
                    }
                  }}
                  autoFocus
                />
              </div>
            </>
          ) : (
            <p className="min-h-[min(42vh,320px)] whitespace-pre-line pt-8 pr-14 text-[12px] leading-6 text-slate-700">
              {generatedMessage}
            </p>
          )}
        </div>

        <OutcomeSignalsRow copy={copy} draft={generatedMessage} />

        {onRewriteMode ? (
          <RewriteModeStrip copy={copy} onSelect={onRewriteMode} loading={loading} />
        ) : null}

        <SendTimingHint copy={copy} hint={sendTimingHint} />

        <div className="mt-3 flex shrink-0 items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {onAddToQueue ? (
              <button
                type="button"
                className={[
                  'rounded-full border px-3 py-2 text-[11px] font-semibold transition',
                  addedToQueue
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-[#eed9e2] text-[#b54e77] hover:border-[#e7aac2] hover:bg-[#fff5f9]',
                ].join(' ')}
                disabled={addedToQueue}
                onClick={() => {
                  onAddToQueue();
                  setAddedToQueue(true);
                }}
              >
                {addedToQueue ? `✓ ${copy.floating.addedToQueue}` : copy.floating.addFollowUp}
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5">
            <ShortcutHint
              label={copyShortcutLabel(isMacPlatform)}
              pulsing={Boolean(copyRingClass)}
            />
            <button
              type="button"
              className={[
                'rounded-full bg-[#E85C8B] px-4 py-2 text-[11px] font-semibold text-white shadow-[0_10px_24px_rgba(232,92,139,0.24)] transition hover:bg-[#d94f7f]',
                copyRingClass,
              ].filter(Boolean).join(' ')}
              onClick={onCopy}
              aria-label={copyNextStepHint ? `${copy.modal.copyReply} — ${copyNextStepHint}` : copy.modal.copyReply}
              title={copyNextStepHint ?? undefined}
            >
              {copy.modal.copyReply}
            </button>
          </div>
        </div>

        {isIntelligenceOpen && insight && (
          <ReplyIntelligenceModal
            copy={copy}
            insight={insight}
            onClose={() => setIsIntelligenceOpen(false)}
          />
        )}
      </section>
    </div>
  );
}
