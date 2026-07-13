import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import MiniScreenFrame from './MiniScreenFrame';
import { interpolate, type AppTranslations } from '../i18n/translations';
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

type Snippet = {
  id: string;
  title: string;
  text: string;
};

type Props = {
  onClose: () => void;
  onUse: (value: string) => void;
  copy: AppTranslations;
};

const STORAGE_KEY = 'replyAssistantSnippets';

function loadSnippets(defaultSnippets: Snippet[]): Snippet[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Snippet[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore malformed data
  }
  return defaultSnippets;
}

export default function SnippetLibrary({ onClose, onUse, copy }: Props) {
  const [snippets, setSnippets] = useState<Snippet[]>(() => loadSnippets(copy.snippetLibrary.defaultSnippets));
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  const [newTextCaretIndex, setNewTextCaretIndex] = useState(0);
  const [dismissedReminderKey, setDismissedReminderKey] = useState<string | null>(null);
  const [newTextReminderPosition, setNewTextReminderPosition] = useState({ left: 0, top: 0 });
  const [newTextScroll, setNewTextScroll] = useState({ left: 0, top: 0 });
  const [search, setSearch] = useState('');
  const [focusedSnippetId, setFocusedSnippetId] = useState<string | null>(null);
  const [activeSnippetId, setActiveSnippetId] = useState<string | null>(null);
  const [snippetPendingRemovalId, setSnippetPendingRemovalId] = useState<string | null>(null);
  const newTextRef = useRef<HTMLTextAreaElement | null>(null);
  const assist = useTypingAssist('snippets');
  const [inlineGhostSuffix, setInlineGhostSuffix] = useState('');
  const canSave = newText.trim().length > 0;
  const newTextReminder = useMemo(
    () => detectWritingReminder(newText, newTextCaretIndex),
    [newText, newTextCaretIndex],
  );
  const activeNewTextReminder = newTextReminder && newTextReminder.key !== dismissedReminderKey
    ? newTextReminder
    : null;

  const newTextReminderClickApply = useDeferredRangeClickApply({
    textareaRef: newTextRef,
    chip: activeNewTextReminder
      ? {
          start: activeNewTextReminder.start,
          end: activeNewTextReminder.end,
          replacement: activeNewTextReminder.replacement,
        }
      : null,
    text: newText,
    onApply: useCallback((next, nextCaret, chip) => {
      setNewText(next);
      setDismissedReminderKey(`${chip.start}:${chip.end}:${chip.replacement}`);
      setNewTextCaretIndex(nextCaret);
      window.requestAnimationFrame(() => {
        newTextRef.current?.focus();
        newTextRef.current?.setSelectionRange(nextCaret, nextCaret);
      });
    }, []),
  });

  useLayoutEffect(() => {
    const textarea = newTextRef.current;
    if (!textarea || !activeNewTextReminder) {
      setNewTextReminderPosition({ left: 0, top: 0 });
      return;
    }

    const nextPosition = measureTextareaOverlayPosition(
      textarea,
      newText,
      activeNewTextReminder.start,
      activeNewTextReminder.end,
      estimateReminderBubbleWidth(activeNewTextReminder.label),
    );
    setNewTextReminderPosition(nextPosition);
  }, [activeNewTextReminder, newText, newTextScroll.left, newTextScroll.top]);

  useLayoutEffect(() => {
    if (activeNewTextReminder || newTextCaretIndex !== newText.length) {
      setInlineGhostSuffix('');
      return;
    }
    setInlineGhostSuffix(assist.ghostSuffix(newText, newTextCaretIndex));
  }, [activeNewTextReminder, assist, newText, newTextCaretIndex]);

  const filteredSnippets = search.trim()
    ? snippets.filter(s => s.title.toLowerCase().includes(search.toLowerCase()) || s.text.toLowerCase().includes(search.toLowerCase()))
    : snippets;

  const save = (next: Snippet[]) => {
    setSnippets(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const handleAdd = () => {
    const text = newText.trim();
    if (!text) return;
    const title = newTitle.trim() || text.slice(0, 28);
    save([...snippets, { id: `custom-${Date.now()}`, title, text }]);
    setNewTitle('');
    setNewText('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    save(snippets.filter(s => s.id !== id));
  };

  const activeSnippet = snippets.find(snippet => snippet.id === activeSnippetId) ?? null;
  const snippetPendingRemoval = snippets.find(snippet => snippet.id === snippetPendingRemovalId) ?? null;

  useEffect(() => {
    if (!activeSnippetId && !snippetPendingRemovalId) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveSnippetId(null);
        setSnippetPendingRemovalId(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [activeSnippetId, snippetPendingRemovalId]);

  return (
    <MiniScreenFrame
      label={copy.snippetLibrary.frameLabel}
      title={copy.snippetLibrary.frameTitle}
      onClose={onClose}
      backLabel={copy.miniScreen.back}
      contentClassName="bg-[#fcfcfd] px-4 pt-4 pb-6"
      contentOverlay={snippetPendingRemoval ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a]/30 px-3 backdrop-blur-[3px]">
          <section className="w-full max-w-[292px] rounded-[18px] border border-[#f1d5e1] bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.20)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-[linear-gradient(180deg,#ef5d8f,#db4d83)] text-lg font-semibold text-white shadow-[0_10px_24px_rgba(255,192,211,0.32)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 text-[11px] font-bold tracking-[0.08em]">
                RA
              </div>
            </div>

            <p className="mt-3 text-center text-[13px] font-semibold text-slate-900">{copy.snippetLibrary.removeSnippetTitle}</p>
            <p className="mt-1 text-center text-[11px] leading-5 text-slate-600">
              {copy.snippetLibrary.removeSnippetConfirm}
            </p>
            <p className="mt-1 text-center text-[10px] font-medium text-[#b04f78]">{snippetPendingRemoval.title}</p>

            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                className="rounded-full border border-[#edd7e0] bg-white px-3 py-1.5 text-[10px] font-medium text-slate-500 transition hover:border-[#e7aac2] hover:text-[#c15480]"
                onClick={() => setSnippetPendingRemovalId(null)}
              >
                {copy.settings.cancel}
              </button>
              <button
                type="button"
                className="rounded-full bg-[#E85C8B] px-3 py-1.5 text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(232,92,139,0.24)] transition hover:bg-[#d94f81]"
                onClick={() => {
                  handleDelete(snippetPendingRemoval.id);
                  setSnippetPendingRemovalId(null);
                }}
              >
                {copy.snippetLibrary.removeSnippetAction}
              </button>
            </div>
          </section>
        </div>
      ) : activeSnippet ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a]/30 px-3 backdrop-blur-[3px]">
          <section className="animate-fade-in w-full rounded-[18px] border border-[#f0cadb] bg-white px-4 pt-4 pb-5 shadow-[0_24px_60px_rgba(15,23,42,0.24)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#cb5f89]">{copy.snippetLibrary.frameLabel}</p>
                <p className="mt-1 text-[14px] font-semibold leading-5 text-slate-900">{activeSnippet.title}</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-[#e8b1c6] bg-[#fdeaf1] px-3 py-1 text-[10px] font-semibold text-[#bc557d] transition hover:bg-[#f8dce8]"
                onClick={() => setActiveSnippetId(null)}
                aria-label={copy.messages.hide}
              >
                {copy.messages.hide}
              </button>
            </div>

            <div className="mt-3 rounded-[14px] border border-[#f4d7e1] bg-[#fff8fb] px-3.5 py-3.5">
              <p className="text-[12px] leading-6 text-slate-700">{activeSnippet.text}</p>
            </div>
          </section>
        </div>
      ) : null}
    >
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m16.5 16.5 3.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={copy.snippetLibrary.searchPlaceholder}
            className="w-full rounded-[10px] border border-slate-200 bg-white py-1.5 pl-7 pr-3 text-[11px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#e7aac2]"
          />
        </div>

        {/* Add button */}
        {!isAdding && (
          <button
            type="button"
            className="flex w-full items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-[#e8b4c8] bg-white px-3 py-2.5 text-[11px] font-medium text-[#b54e77] transition hover:bg-[#fff5f9]"
            onClick={() => setIsAdding(true)}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {copy.snippetLibrary.addSnippet}
          </button>
        )}

        {/* Inline add form */}
        {isAdding && (
          <div className="rounded-[14px] border border-[#f0dbe3] bg-white p-3">
            <input
              type="text"
              placeholder={copy.snippetLibrary.titlePlaceholder}
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full border-0 bg-transparent text-[12px] font-semibold text-slate-900 outline-none placeholder:text-slate-400"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
            <div className="relative">
              {inlineGhostSuffix ? (
                <InlineGhostLayer
                  value={newText}
                  suffix={inlineGhostSuffix}
                  scrollLeft={newTextScroll.left}
                  scrollTop={newTextScroll.top}
                  className="pointer-events-none absolute left-0 right-0 top-1.5 z-0 overflow-hidden whitespace-pre-wrap break-words pr-1 text-[11px] leading-5"
                />
              ) : null}
              {activeNewTextReminder ? (
                <SmartWritingReminder
                  label={activeNewTextReminder.label}
                  onApply={() => {
                    const next = applyWritingReminder(newText, activeNewTextReminder);
                    setNewText(next);
                    setDismissedReminderKey(activeNewTextReminder.key);
                    const nextCaret = activeNewTextReminder.start + activeNewTextReminder.replacement.length;
                    setNewTextCaretIndex(nextCaret);
                    window.requestAnimationFrame(() => {
                      newTextRef.current?.focus();
                      newTextRef.current?.setSelectionRange(nextCaret, nextCaret);
                    });
                  }}
                  onDismiss={() => setDismissedReminderKey(activeNewTextReminder.key)}
                  className="pointer-events-auto absolute z-20"
                  style={{ left: `${newTextReminderPosition.left}px`, top: `${newTextReminderPosition.top}px` }}
                />
              ) : null}
              <textarea
                ref={newTextRef as React.Ref<HTMLTextAreaElement>}
                placeholder={copy.snippetLibrary.textPlaceholder}
                value={newText}
                onChange={e => {
                  setNewTextCaretIndex(e.currentTarget.selectionStart ?? e.currentTarget.value.length);
                  setDismissedReminderKey(null);
                  setNewText(e.currentTarget.value);
                }}
                onMouseDown={newTextReminderClickApply.onMouseDown}
                onClick={e => {
                  setNewTextCaretIndex(e.currentTarget.selectionStart ?? 0);
                  newTextReminderClickApply.onClickDeferredApply();
                }}
                onKeyUp={e => setNewTextCaretIndex(e.currentTarget.selectionStart ?? 0)}
                onDoubleClick={e => {
                  const el = newTextRef.current;
                  if (!activeNewTextReminder || !el) return;
                  const caret = el.selectionStart ?? 0;
                  if (!caretTouchesReminder(caret, activeNewTextReminder)) return;
                  e.preventDefault();
                  const next = applyWritingReminder(newText, activeNewTextReminder);
                  setNewText(next);
                  setDismissedReminderKey(activeNewTextReminder.key);
                  const nextCaret = activeNewTextReminder.start + activeNewTextReminder.replacement.length;
                  setNewTextCaretIndex(nextCaret);
                  window.requestAnimationFrame(() => {
                    newTextRef.current?.focus();
                    newTextRef.current?.setSelectionRange(nextCaret, nextCaret);
                  });
                }}
                onSelect={e => setNewTextCaretIndex(e.currentTarget.selectionStart ?? 0)}
                onScroll={e => {
                  const t = e.currentTarget;
                  setNewTextScroll({ left: t.scrollLeft, top: t.scrollTop });
                }}
                onKeyDown={e => {
                  const caret = newTextRef.current?.selectionStart ?? newText.length;
                  if (activeNewTextReminder) {
                    const accepted = tryAcceptWritingReminderKeydown(e, activeNewTextReminder, newText, caret);
                    if (accepted) {
                      setNewText(accepted.next);
                      setNewTextCaretIndex(accepted.nextCaret);
                      setDismissedReminderKey(activeNewTextReminder.key);
                      window.requestAnimationFrame(() => {
                        newTextRef.current?.focus();
                        newTextRef.current?.setSelectionRange(accepted.nextCaret, accepted.nextCaret);
                      });
                      return;
                    }
                  }
                  const applied = assist.tabComplete(e, newText, caret);
                  if (applied) {
                    setNewText(applied.next);
                    setNewTextCaretIndex(applied.nextCaret);
                    window.requestAnimationFrame(() => {
                      newTextRef.current?.focus();
                      newTextRef.current?.setSelectionRange(applied.nextCaret, applied.nextCaret);
                    });
                  }
                }}
                rows={3}
                className="clean-scrollbar relative z-10 mt-1.5 w-full resize-none border-0 bg-transparent text-[11px] leading-5 text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={!canSave}
                className="flex-1 rounded-full bg-[#E85C8B] px-3 py-1.5 text-[10px] font-semibold text-white transition disabled:opacity-50"
                onClick={handleAdd}
              >
                {copy.snippetLibrary.save}
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-200 px-3 py-1.5 text-[10px] text-slate-500 transition hover:border-[#e7aac2]"
                onClick={() => {
                  setIsAdding(false);
                  setNewTitle('');
                  setNewText('');
                }}
              >
                {copy.snippetLibrary.cancel}
              </button>
            </div>
          </div>
        )}

        {/* Snippet list */}
        {filteredSnippets.length === 0 && search.trim() ? (
          <p className="rounded-[12px] border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-[11px] text-slate-500">
            {copy.snippetLibrary.noResults}
          </p>
        ) : (
          filteredSnippets.map(snippet => {
            const isFocused = focusedSnippetId === snippet.id;
            return (
            <article
              key={snippet.id}
              onMouseEnter={() => setFocusedSnippetId(snippet.id)}
              onMouseLeave={() => setFocusedSnippetId(null)}
              className={[
                'rounded-[16px] border bg-white px-4 py-3 transition-all duration-200',
                isFocused
                  ? 'scale-[1.01] border-[#dd83a8] ring-2 ring-[#f6dbe5] shadow-[0_8px_24px_rgba(221,131,168,0.16)]'
                  : 'border-slate-200',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12px] font-semibold text-slate-900">{snippet.title}</p>
                <button
                  type="button"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#f1c9d8] bg-[#fff1f6] text-[13px] font-semibold leading-none text-[#c45d86] transition hover:border-[#e7aac2] hover:bg-[#fde9f2] hover:text-[#b44f77]"
                  onClick={() => {
                    setActiveSnippetId(null);
                    setSnippetPendingRemovalId(snippet.id);
                  }}
                  aria-label={interpolate(copy.snippetLibrary.deleteSnippet, { title: snippet.title })}
                >
                  -
                </button>
              </div>
              <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-slate-600">{snippet.text}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="rounded-full border border-[#f0dbe3] bg-[#fff5f9] px-3 py-1.5 text-[10px] font-semibold text-[#b54e77] transition hover:border-[#e7aac2]"
                  onClick={() => onUse(snippet.text)}
                >
                  {copy.snippetLibrary.insertIntoInput}
                </button>
                <div>
                  {snippet.text.length > 120 ? (
                    <button
                      type="button"
                      className="rounded-full border border-[#edd7e0] bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500 transition hover:border-[#e7aac2] hover:text-[#c15480]"
                      onClick={() => {
                        setSnippetPendingRemovalId(null);
                        setActiveSnippetId(snippet.id);
                      }}
                    >
                      View All
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
          })
        )}
      </div>
    </MiniScreenFrame>
  );
}
