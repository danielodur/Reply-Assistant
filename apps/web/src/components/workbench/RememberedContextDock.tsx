import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type React from 'react';
import type {
  ContactOpenCommitment,
  ContactReplyLearningSignal,
  ContactThread,
} from '../../config/contactThreads';
import { interpolate, type AppTranslations } from '../../i18n/translations';
import AssistedNotesTextarea from '../AssistedNotesTextarea';
import { formatRelativeAge } from '../command-center/formatRelativeAge';

type FloatingCopy = AppTranslations['floating'];

type RememberedContextDockProps = {
  contact: ContactThread | null;
  copy: FloatingCopy;
  open: boolean;
  /** Yields the auto-dismiss peek toast to heavier surfaces (one-calm-nudge). */
  suppressed: boolean;
  onOpenChange: (open: boolean) => void;
  /** Routes the user to the composer so a card's primary action moves them forward. */
  onActNow: () => void;
  onDismissCommitment?: (contactId: string, sourceMessageId: string) => void;
  onUpdateThreadSummary?: (contactId: string, text: string) => void;
};

const AUTO_DISMISS_MS = 4200;
const EXIT_MS = 260;
const POPOVER_WIDTH = 440;
const POPOVER_MIN_HEIGHT = 640;
const NOTCH_FROM_LEFT = 36;
const GAP_BELOW_ICON = 14;
const EDGE_MARGIN = 10;
const FALLBACK_TOP = 56;

type PopoverPosition = { left: number; top: number; notchLeft: number };

function commitmentKindLabel(kind: ContactOpenCommitment['kind'], copy: FloatingCopy): string {
  return kind === 'promise' ? copy.memoryCueKindPromise : copy.memoryCueKindNeedsReply;
}

function learningKindLabel(kind: ContactReplyLearningSignal['kind'], copy: FloatingCopy): string {
  if (kind === 'accepted') return copy.memoryCueKindAccepted;
  if (kind === 'edited') return copy.memoryCueKindEdited;
  return copy.memoryCueKindRegenerated;
}

function actionLabel(kind: ContactOpenCommitment['kind'], copy: FloatingCopy): string {
  return kind === 'promise' ? copy.memoryCueActFollowUp : copy.memoryCueActReply;
}

export function getRememberedContextCounts(contact: ContactThread | null): { count: number; hasContext: boolean; hasPendingAction: boolean } {
  if (!contact) return { count: 0, hasContext: false, hasPendingAction: false };
  const commitments = contact.openCommitments?.length ?? 0;
  const learning = contact.replyLearning?.length ?? 0;
  const hasSummary = Boolean(contact.threadSummary?.text.trim());
  const summaryNeedsReview = hasSummary && contact.threadSummary?.locked !== true ? 1 : 0;
  const count = commitments + summaryNeedsReview;
  return {
    count,
    hasContext: count > 0,
    hasPendingAction: commitments > 0,
  };
}

function joinMeta(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(' · ');
}

export default function RememberedContextDock({
  contact,
  copy,
  open,
  suppressed,
  onOpenChange,
  onActNow,
  onDismissCommitment,
  onUpdateThreadSummary,
}: RememberedContextDockProps) {
  const [toastPhase, setToastPhase] = useState<'idle' | 'entering' | 'visible' | 'exiting'>('idle');
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const lastShownRef = useRef<string | null>(null);
  const [pos, setPos] = useState<PopoverPosition | null>(null);

  const commitments = contact?.openCommitments ?? [];
  const learningSignals = contact?.replyLearning ?? [];
  const summaryText = contact?.threadSummary?.text.trim() ?? '';
  const summaryAt = contact?.threadSummary?.latestMessageAt ?? null;
  const messageCount = contact?.threadSummary?.messageCount ?? contact?.messages.length ?? 0;
  const { count, hasContext } = getRememberedContextCounts(contact);

  const who = contact ? joinMeta([contact.name, contact.company]) : '';

  const topItem = commitments[0]
    ? {
        label: commitmentKindLabel(commitments[0].kind, copy),
        body: commitments[0].summary,
        when: formatRelativeAge(commitments[0].createdAt, copy),
      }
    : summaryText
      ? {
          label: copy.memoryCueThreadSummaryHeading,
          body: summaryText,
          when: summaryAt ? formatRelativeAge(summaryAt, copy) : '',
        }
      : learningSignals[0]
        ? {
            label: learningKindLabel(learningSignals[0].kind, copy),
            body: learningSignals[0].preview,
            when: formatRelativeAge(learningSignals[0].createdAt, copy),
          }
        : null;

  useEffect(() => {
    onOpenChange(false);
    setIsEditingSummary(false);
  }, [contact?.id, onOpenChange]);

  useEffect(() => {
    if (!hasContext && open) onOpenChange(false);
  }, [hasContext, onOpenChange, open]);

  // Auto-dismiss peek toast: fires once when a contact with remembered context is selected.
  useEffect(() => {
    const id = contact?.id ?? null;
    if (id === lastShownRef.current) return;
    lastShownRef.current = id;
    if (!id || !hasContext || suppressed || open) {
      setToastPhase('idle');
      return;
    }
    setToastPhase('entering');
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => setToastPhase('visible'));
    });
    const hideTimer = window.setTimeout(() => setToastPhase('exiting'), AUTO_DISMISS_MS);
    const idleTimer = window.setTimeout(() => setToastPhase('idle'), AUTO_DISMISS_MS + EXIT_MS);
    return () => {
      window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
      window.clearTimeout(hideTimer);
      window.clearTimeout(idleTimer);
    };
  }, [contact?.id, hasContext, suppressed, open]);

  useLayoutEffect(() => {
    if (!open) return;

    function measure() {
      const anchor = document.querySelector('[data-remembered-context-anchor]');
      if (!anchor) {
        setPos(null);
        return;
      }
      const rect = anchor.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const top = Math.min(rect.bottom + GAP_BELOW_ICON, window.innerHeight - EDGE_MARGIN);
      const maxLeft = window.innerWidth - POPOVER_WIDTH - EDGE_MARGIN;
      const left = Math.max(EDGE_MARGIN, Math.min(centerX - NOTCH_FROM_LEFT, maxLeft));
      const notchLeft = Math.max(18, Math.min(centerX - left, POPOVER_WIDTH - 18));
      setPos({ left, top, notchLeft });
    }

    measure();
    const raf1 = window.requestAnimationFrame(measure);
    const raf2 = window.requestAnimationFrame(() => window.requestAnimationFrame(measure));
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onOpenChange(false);
        return;
      }
      if (event.key !== 'Tab' || !sectionRef.current) return;
      const focusable = sectionRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [onOpenChange, open]);

  const stop = useCallback((event: React.MouseEvent) => event.stopPropagation(), []);

  if (!contact || !hasContext) return null;

  const closeAll = () => {
    setToastPhase('idle');
    onOpenChange(false);
  };

  const actNow = () => {
    closeAll();
    onActNow();
  };

  const startEditingSummary = () => {
    setSummaryDraft(summaryText);
    setIsEditingSummary(true);
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const cancelEditingSummary = () => {
    setIsEditingSummary(false);
    setSummaryDraft('');
  };

  const saveSummary = () => {
    if (onUpdateThreadSummary) onUpdateThreadSummary(contact.id, summaryDraft);
    setIsEditingSummary(false);
    setSummaryDraft('');
  };

  const toastVisible = toastPhase === 'visible';
  const toastMounted = toastPhase !== 'idle';
  const top = pos?.top ?? FALLBACK_TOP;
  const maxHeight = `calc(100vh - ${top + EDGE_MARGIN}px)`;
  const minHeight = `min(${POPOVER_MIN_HEIGHT}px, calc(100vh - ${top + EDGE_MARGIN}px))`;

  return (
    <>
      {/* Auto-dismiss peek toast — wide, horizontal, guiding */}
      {toastMounted ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute inset-x-0 bottom-[8.5rem] z-[42] flex justify-center px-4"
        >
          <button
            type="button"
            onClick={() => {
              setToastPhase('idle');
              onOpenChange(true);
            }}
            className={[
              'pointer-events-auto flex w-full max-w-[520px] items-center gap-3 rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-left',
              'shadow-[0_18px_40px_-14px_rgba(15,23,42,0.30),0_2px_8px_rgba(15,23,42,0.06)]',
              'transition-[opacity,transform] duration-[420ms] will-change-transform',
              toastVisible
                ? 'scale-100 opacity-100 translate-y-0 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
                : 'scale-[0.6] opacity-0 translate-y-3 ease-out',
            ].join(' ')}
          >
            <span aria-hidden="true" className="mt-[5px] h-2 w-2 flex-none rounded-full bg-slate-400" />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-1.5">
                <span className="truncate text-[12px] font-semibold text-slate-700">{who}</span>
                {topItem?.when ? (
                  <span className="flex-none text-[10px] text-slate-400">{topItem.when}</span>
                ) : null}
              </span>
              {topItem ? (
                <span className="mt-0.5 block truncate text-[11px] leading-4 text-slate-500">
                  <span className="text-slate-400">{topItem.label}</span>
                  <span className="mx-1 text-slate-300">·</span>
                  {topItem.body}
                </span>
              ) : null}
            </span>
            <span className="flex-none rounded-full bg-slate-100 px-2 py-[2px] text-[10px] font-semibold text-slate-500">
              {count}
            </span>
          </button>
        </div>
      ) : null}

      {/* On-demand remembered context: right-side anchored, no blur or dim layer. */}
      {open ? (
        <div className="fixed inset-0 z-[68]" role="presentation" onClick={() => onOpenChange(false)}>
          <button
            type="button"
            aria-label={copy.memoryCueStackClose}
            className="absolute inset-0 cursor-default bg-transparent"
          />
          <section
            ref={sectionRef}
            role="dialog"
            aria-modal="true"
            aria-label={copy.memoryCueTitle}
            onClick={stop}
            style={pos
              ? { position: 'fixed', left: pos.left, top, width: POPOVER_WIDTH, minHeight, maxHeight }
              : { position: 'fixed', right: EDGE_MARGIN, top, width: POPOVER_WIDTH, minHeight, maxHeight }}
            className="remembered-context-pop flex flex-col overflow-hidden rounded-[22px] rounded-tl-[9px] border border-slate-200 bg-[#fffdf9] p-3.5 shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
          >
            <span
              aria-hidden="true"
              style={{ left: pos?.notchLeft ?? NOTCH_FROM_LEFT }}
              className="absolute -top-1.5 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px] border-l border-t border-slate-200 bg-[#fffdf9]"
            />
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {copy.memoryCueTitle}
                  </p>
                <p className="truncate text-[12px] font-semibold text-slate-600">
                  {interpolate(copy.memoryCueGuideHeading, { name: contact.name })}
                </p>
                </div>
                <button
                  type="button"
                  aria-label={copy.memoryCueStackClose}
                  onClick={() => onOpenChange(false)}
                  className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:border-slate-300 hover:text-slate-600"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="clean-scrollbar flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pb-1 pr-1">
                {commitments.map(item => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-[16px] border border-slate-200 bg-white px-4 py-3 shadow-[0_16px_36px_-18px_rgba(15,23,42,0.3)]"
                  >
                    <span aria-hidden="true" className="mt-[6px] h-2 w-2 flex-none rounded-full bg-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                        {joinMeta([commitmentKindLabel(item.kind, copy), contact.name, formatRelativeAge(item.createdAt, copy)])}
                      </p>
                      <p className="mt-1 text-[12px] leading-5 text-slate-600">{item.summary}</p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={actNow}
                          className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-slate-900"
                        >
                          {actionLabel(item.kind, copy)}
                        </button>
                        {onDismissCommitment ? (
                          <button
                            type="button"
                            onClick={() => onDismissCommitment(contact.id, item.sourceMessageId)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                          >
                            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
                              <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {copy.memoryCueDoneLabel}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}

                {summaryText || isEditingSummary ? (
                  <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-[16px] border border-slate-200 bg-white px-4 py-3 shadow-[0_16px_36px_-18px_rgba(15,23,42,0.3)]">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                        {joinMeta([
                          copy.memoryCueThreadSummaryHeading,
                          messageCount > 0 ? copy.memoryCueBasedOnMessages.replace('{{count}}', String(messageCount)) : null,
                          summaryAt ? formatRelativeAge(summaryAt, copy) : null,
                        ])}
                      </p>
                      {!isEditingSummary && onUpdateThreadSummary ? (
                        <button
                          type="button"
                          aria-label={copy.memoryCueEditAria}
                          onClick={startEditingSummary}
                          className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-100 hover:text-slate-600"
                        >
                          {'✎'}
                        </button>
                      ) : null}
                    </div>
                    {isEditingSummary ? (
                      <div className="mt-2 flex min-h-0 flex-1 flex-col">
                        <AssistedNotesTextarea
                          textareaRef={textareaRef}
                          value={summaryDraft}
                          onChange={setSummaryDraft}
                          placeholder={copy.memoryCueSummaryPlaceholder}
                          rows={14}
                          autoFocus
                          assistBankKey="reply-edit"
                          className="flex min-h-0 flex-1 flex-col overflow-hidden"
                          ghostMirrorClassName="pointer-events-none absolute z-0 whitespace-pre-wrap break-words px-3 py-2 text-[12px] leading-5 text-slate-500"
                          textareaClassName="clean-scrollbar min-h-0 w-full flex-1 resize-none overflow-y-auto rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-[12px] leading-5 text-slate-700 outline-none focus:border-slate-400"
                        />
                        <div className="mt-3 flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 pt-3">
                          <p className="min-w-0 truncate text-[10px] font-medium text-slate-400">
                            {copy.memoryCueEditAria}
                          </p>
                          <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={cancelEditingSummary}
                            className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[11px] font-semibold text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                          >
                            {copy.memoryCueCancelLabel}
                          </button>
                          <button
                            type="button"
                            onClick={saveSummary}
                            className="rounded-full bg-slate-900 px-4 py-1.5 text-[11px] font-semibold text-white shadow-[0_10px_20px_rgba(15,23,42,0.16)] transition hover:bg-slate-800"
                          >
                            {copy.memoryCueSaveLabel}
                          </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="clean-scrollbar mt-3 min-h-[420px] flex-1 overflow-y-auto rounded-[12px] border border-slate-100 bg-slate-50/45 px-3 py-2 text-[12px] leading-5 text-slate-600">
                        {summaryText}
                      </p>
                    )}
                  </div>
                ) : null}

                {learningSignals.map(item => (
                  <div
                    key={item.id}
                    className="rounded-[16px] border border-slate-200 bg-white px-4 py-3 shadow-[0_16px_36px_-18px_rgba(15,23,42,0.3)]"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                      {joinMeta([copy.memoryCueLearnedHeading, learningKindLabel(item.kind, copy)])}
                    </p>
                    <p className="mt-1 text-[12px] leading-5 text-slate-600">{item.preview}</p>
                  </div>
                ))}
              </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
