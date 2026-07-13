import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import type React from 'react';
import { WORK_MODES } from './constants';
import type { AppTranslations } from '../../i18n/translations';
import type { RecipientProfile, WorkMode } from './types';
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
import ComposerAttachmentStrip from '../uploads/ComposerAttachmentStrip';
import type { UploadContextSummary } from '../../uploads/uploadTypes';
import { useNextStepClass } from '../guidance/NextStepProvider';
import ShortcutHint, { generateShortcutLabel } from '../guidance/ShortcutHint';
import ComposeCoachStrip from '../quality-guard/ComposeCoachStrip';
import type { ComposeCoachWarning } from '../quality-guard/composeCoach';

type ComposerPanelProps = {
  copy: AppTranslations;
  compactMode: boolean;
  workMode: WorkMode;
  recipientOptions: Array<{ id: RecipientProfile }>;
  recipientProfile: RecipientProfile;
  hasLeftRecipientFade: boolean;
  hasRightRecipientFade: boolean;
  recipientScrollRef: React.RefObject<HTMLDivElement | null>;
  inputTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  contactPicker?: React.ReactNode;
  currentModePlaceholder: string;
  input: string;
  loading: boolean;
  onSelectWorkMode: (value: WorkMode) => void;
  onSelectRecipient: (value: RecipientProfile) => void;
  onRecipientScroll: () => void;
  onInputChange: (value: string) => void;
  attachments: UploadContextSummary[];
  attachmentProcessing: boolean;
  onAttachFiles: (files: FileList) => void;
  onRemoveAttachment: (id: string) => void;
  onGenerate: () => void;
  showModeAndRecipient?: boolean;
  isMacPlatform?: boolean;
  generateNextStepHint?: string;
  coachWarnings?: ComposeCoachWarning[];
  coachSuppressed?: boolean;
  onCoachFix?: (warning: ComposeCoachWarning) => void;
};

export default function ComposerPanel({
  copy,
  compactMode,
  workMode,
  recipientOptions,
  recipientProfile,
  hasLeftRecipientFade,
  hasRightRecipientFade,
  recipientScrollRef,
  inputTextareaRef,
  contactPicker,
  currentModePlaceholder,
  input,
  loading,
  onSelectWorkMode,
  onSelectRecipient,
  onRecipientScroll,
  onInputChange,
  attachments,
  attachmentProcessing,
  onAttachFiles,
  onRemoveAttachment,
  onGenerate,
  showModeAndRecipient = true,
  isMacPlatform = false,
  generateNextStepHint,
  coachWarnings = [],
  coachSuppressed = false,
  onCoachFix,
}: ComposerPanelProps) {
  const modeIndex = WORK_MODES.findIndex(mode => mode.id === workMode);
  const generateRingClass = useNextStepClass('generate');
  const showGenerateShortcut = Boolean(input.trim()) && !loading;
  const assist = useTypingAssist('composer');
  const hasTableLikeInput = /\S {2,}\S/.test(input);
  const [textareaScroll, setTextareaScroll] = useState({ left: 0, top: 0 });
  const [inlineGhostSuffix, setInlineGhostSuffix] = useState('');
  const [caretIndex, setCaretIndex] = useState(0);
  const [dismissedReminderKey, setDismissedReminderKey] = useState<string | null>(null);
  const [reminderPosition, setReminderPosition] = useState({ left: 0, top: 0 });

  const reminder = useMemo(() => detectWritingReminder(input, caretIndex), [input, caretIndex]);
  const activeReminder = reminder && reminder.key !== dismissedReminderKey ? reminder : null;

  const reminderClickApply = useDeferredRangeClickApply({
    textareaRef: inputTextareaRef,
    chip: activeReminder
      ? {
          start: activeReminder.start,
          end: activeReminder.end,
          replacement: activeReminder.replacement,
        }
      : null,
    text: input,
    onApply: useCallback(
      (next, nextCaret, chip) => {
        onInputChange(next);
        setCaretIndex(nextCaret);
        setDismissedReminderKey(`${chip.start}:${chip.end}:${chip.replacement}`);
        window.requestAnimationFrame(() => {
          inputTextareaRef.current?.focus();
          inputTextareaRef.current?.setSelectionRange(nextCaret, nextCaret);
        });
      },
      [onInputChange, inputTextareaRef],
    ),
  });

  useLayoutEffect(() => {
    const textarea = inputTextareaRef.current;
    if (!textarea || !activeReminder) {
      setReminderPosition({ left: 0, top: 0 });
      return;
    }

    const bubbleWidth = estimateReminderBubbleWidth(activeReminder.label);
    const nextPosition = measureTextareaOverlayPosition(
      textarea,
      input,
      activeReminder.start,
      activeReminder.end,
      bubbleWidth,
    );
    setReminderPosition(nextPosition);
  }, [activeReminder, compactMode, input, inputTextareaRef, textareaScroll.top, textareaScroll.left]);

  useLayoutEffect(() => {
    if (caretIndex !== input.length) {
      setInlineGhostSuffix('');
      return;
    }
    setInlineGhostSuffix(assist.ghostSuffix(input, caretIndex));
  }, [assist, caretIndex, input]);

  const showWrapperCard = showModeAndRecipient || contactPicker != null;

  return (
    <>
      {showWrapperCard ? (
        <div className={`mt-2 rounded-[14px] border border-[#f4d7e1] bg-[#fff7fa] ${compactMode ? 'p-2' : 'p-2.5'}`}>
          {showModeAndRecipient ? (
            <>
              <div className={`relative rounded-[12px] bg-white ${compactMode ? 'p-0.5' : 'p-1'}`}>
                <div
                  className="pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-6px)] rounded-[10px] bg-[#E85C8B] shadow-[0_8px_18px_rgba(232,92,139,0.25)] transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(${modeIndex * 100}%)` }}
                />
                <div className="relative grid grid-cols-2 gap-1">
                  {WORK_MODES.map(mode => (
                    <button
                      key={mode.id}
                      type="button"
                      className={[
                        'relative z-10 rounded-[10px] font-semibold transition-colors duration-200',
                        compactMode ? 'px-2.5 py-1.5 text-[10px]' : 'px-3 py-2 text-[11px]',
                        workMode === mode.id ? 'text-white' : 'text-slate-600',
                      ].join(' ')}
                      onClick={() => onSelectWorkMode(mode.id)}
                    >
                      {copy.workModes[mode.id]}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className="mt-2 grid gap-1"
                style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}
              >
                <div
                  className="relative min-w-0 overflow-hidden"
                  style={{ gridColumnStart: workMode === WORK_MODES[1].id ? 2 : 1 }}
                >
                  <div
                    className={[
                      'pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-gradient-to-r from-[#fff7fa] via-[#fff7fa]/90 to-transparent transition-opacity duration-200',
                      hasLeftRecipientFade ? 'opacity-100' : 'opacity-0',
                    ].join(' ')}
                  />
                  <div
                    className={[
                      'pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-gradient-to-l from-[#fff7fa] via-[#fff7fa]/90 to-transparent transition-opacity duration-200',
                      hasRightRecipientFade ? 'opacity-100' : 'opacity-0',
                    ].join(' ')}
                  />
                  <div
                    ref={recipientScrollRef as React.Ref<HTMLDivElement>}
                    className="clean-scrollbar overflow-x-auto overflow-y-hidden pb-1"
                    onScroll={onRecipientScroll}
                  >
                    <div
                      className={`flex flex-nowrap items-center pr-5 ${compactMode ? 'gap-1' : 'gap-1.5'}`}
                      style={{ width: 'max-content' }}
                    >
                      {recipientOptions.map(option => (
                        <button
                          key={option.id}
                          type="button"
                          className={[
                            'shrink-0 whitespace-nowrap rounded-full border transition',
                            compactMode ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]',
                            recipientProfile === option.id
                              ? 'border-[#e88ab0] bg-[#fde9f2] text-[#b84f79]'
                              : 'border-[#edd7e0] bg-white text-slate-500 hover:border-[#e7aac2]',
                          ].join(' ')}
                          onClick={() => onSelectRecipient(option.id)}
                        >
                          {copy.recipientLabels[option.id] ?? option.id}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {contactPicker}
        </div>
      ) : null}

      <div className={`mt-2 flex flex-none flex-col ${compactMode ? 'px-0.5 pb-2 pt-0.5' : 'px-1 pb-4 pt-1'}`}>
        <div className={`relative rounded-[18px] border border-[#f4d7e1] bg-[#fffafb] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ${compactMode ? 'h-[176px] p-2.5 pb-[4.1rem]' : 'h-[204px] p-3 pb-[4.75rem]'}`}>
          {inlineGhostSuffix ? (
            <InlineGhostLayer
              value={input}
              suffix={inlineGhostSuffix}
              scrollLeft={textareaScroll.left}
              scrollTop={textareaScroll.top}
              className={[
                'pointer-events-none absolute z-0 overflow-hidden whitespace-pre-wrap break-words pr-1',
                compactMode ? 'left-2.5 right-2.5 top-2.5 text-[11px] leading-4.5' : 'left-3 right-3 top-3 text-[12px] leading-5',
              ].join(' ')}
            />
          ) : null}
          {activeReminder ? (
            <SmartWritingReminder
              label={activeReminder.label}
              className="pointer-events-auto absolute z-20"
              style={{ left: `${reminderPosition.left}px`, top: `${reminderPosition.top}px` }}
              onApply={() => {
                const nextValue = applyWritingReminder(input, activeReminder);
                onInputChange(nextValue);
                setDismissedReminderKey(activeReminder.key);
                const nextCaret = activeReminder.start + activeReminder.replacement.length;
                setCaretIndex(nextCaret);
                window.requestAnimationFrame(() => {
                  inputTextareaRef.current?.focus();
                  inputTextareaRef.current?.setSelectionRange(nextCaret, nextCaret);
                });
              }}
              onDismiss={() => {
                setDismissedReminderKey(activeReminder.key);
              }}
            />
          ) : null}
          <textarea
            ref={inputTextareaRef as React.Ref<HTMLTextAreaElement>}
            className={[
              'clean-scrollbar relative z-10 h-full w-full resize-none border-0 bg-transparent p-0 pr-1 text-slate-700 outline-none placeholder:text-slate-400',
              hasTableLikeInput ? 'overflow-auto whitespace-pre font-mono tracking-[-0.01em]' : 'overflow-y-auto',
              compactMode ? 'text-[11px] leading-4.5' : 'text-[12px] leading-5',
            ].join(' ')}
            wrap={hasTableLikeInput ? 'off' : 'soft'}
            placeholder={currentModePlaceholder}
            value={input}
            onChange={event => {
              onInputChange(event.currentTarget.value);
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
              const el = inputTextareaRef.current;
              if (!activeReminder || !el) return;
              const caret = el.selectionStart ?? 0;
              if (!caretTouchesReminder(caret, activeReminder)) return;
              e.preventDefault();
              const nextValue = applyWritingReminder(input, activeReminder);
              onInputChange(nextValue);
              setDismissedReminderKey(activeReminder.key);
              const nextCaret = activeReminder.start + activeReminder.replacement.length;
              setCaretIndex(nextCaret);
              window.requestAnimationFrame(() => {
                inputTextareaRef.current?.focus();
                inputTextareaRef.current?.setSelectionRange(nextCaret, nextCaret);
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
              const el = inputTextareaRef.current;
              const caret = el?.selectionStart ?? input.length;
              if (activeReminder) {
                const accepted = tryAcceptWritingReminderKeydown(e, activeReminder, input, caret);
                if (accepted) {
                  onInputChange(accepted.next);
                  setCaretIndex(accepted.nextCaret);
                  setDismissedReminderKey(activeReminder.key);
                  window.requestAnimationFrame(() => {
                    inputTextareaRef.current?.focus();
                    inputTextareaRef.current?.setSelectionRange(accepted.nextCaret, accepted.nextCaret);
                  });
                  return;
                }
              }
              const applied = assist.tabComplete(e, input, caret);
              if (applied) {
                onInputChange(applied.next);
                setCaretIndex(applied.nextCaret);
                window.requestAnimationFrame(() => {
                  inputTextareaRef.current?.focus();
                  inputTextareaRef.current?.setSelectionRange(applied.nextCaret, applied.nextCaret);
                });
              }
            }}
          />
          <ComposerAttachmentStrip
            uploads={attachments}
            processing={attachmentProcessing}
            attachLabel={copy.floating.attachFiles}
            limitReachedLabel={copy.floating.uploadLimitReached}
            onAttach={onAttachFiles}
            onRemove={onRemoveAttachment}
          />
          <div
            className={[
              'absolute z-10 flex items-center gap-1.5',
              compactMode ? 'bottom-2.5 right-2.5' : 'bottom-3 right-3',
            ].join(' ')}
          >
            {showGenerateShortcut ? (
              <ShortcutHint
                label={generateShortcutLabel(isMacPlatform)}
                pulsing={Boolean(generateRingClass)}
              />
            ) : null}
            <button
              className={[
                'rounded-full bg-[#2f2926] font-semibold text-white shadow-[0_10px_24px_rgba(47,41,38,0.22)] transition hover:bg-[#463b35] disabled:cursor-not-allowed disabled:opacity-60',
                compactMode ? 'px-3 py-1.5 text-[10px]' : 'px-3.5 py-1.5 text-[11px]',
                generateRingClass,
              ].filter(Boolean).join(' ')}
              onClick={onGenerate}
              disabled={loading || !input}
              aria-label={generateNextStepHint ? `${copy.floating.generate} — ${generateNextStepHint}` : copy.floating.generateShortcut}
              title={generateNextStepHint ?? copy.floating.generateShortcut}
            >
              {loading ? copy.floating.generating : copy.floating.generate}
            </button>
          </div>
          <ComposeCoachStrip
            copy={copy}
            warnings={coachWarnings}
            suppressed={coachSuppressed}
            onFix={onCoachFix ?? (() => {})}
          />
        </div>
      </div>
    </>
  );
}
