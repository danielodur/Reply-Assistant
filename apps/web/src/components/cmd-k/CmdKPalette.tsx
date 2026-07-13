import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppTranslations } from '../../i18n/translations';
import { interpolate } from '../../i18n/translations';
import type { ContactThread } from '../../config/contactThreads';
import type { SmartSuggestion } from '../smart-suggestions/types';
import CmdKSuggestionList from './CmdKSuggestionList';
import { routeCmdKIntent, suggestionToIntent, type CmdKIntent } from './intentRouter';

type CmdKPaletteProps = {
  open: boolean;
  copy: AppTranslations;
  contacts: ContactThread[];
  suggestions: SmartSuggestion[];
  shortcutLabel: string;
  onClose: () => void;
  onDispatch: (intent: CmdKIntent) => void;
  onSelectSuggestion: (suggestion: SmartSuggestion) => void;
};

function intentLabel(intent: CmdKIntent, copy: AppTranslations): string {
  switch (intent.kind) {
    case 'select-contact':
      return interpolate(copy.floating.cmdKActionOpenContact, { name: intent.contact.name });
    case 'draft-reply':
      return interpolate(copy.floating.cmdKActionDraftReply, { name: intent.contact.name });
    case 'follow-up':
      return interpolate(copy.floating.cmdKActionFollowUp, { name: intent.contact.name });
    case 'paste-into-composer':
      return copy.floating.cmdKActionUseAsMessage;
    case 'empty':
      return '';
  }
}

export default function CmdKPalette({
  open,
  copy,
  contacts,
  suggestions,
  shortcutLabel,
  onClose,
  onDispatch,
  onSelectSuggestion,
}: CmdKPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const intent = useMemo(() => routeCmdKIntent(query, contacts), [query, contacts]);

  if (!open) return null;

  const primaryLabel = intentLabel(intent, copy);
  const hasIntent = intent.kind !== 'empty';

  const handleSubmit = () => {
    if (intent.kind === 'empty') return;
    onDispatch(intent);
  };

  return (
    <div
      className="absolute inset-0 z-[95] flex items-start justify-center px-4 pt-16"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[#0f172a]/30 backdrop-blur-[4px]" aria-hidden="true" />
      <section className="pointer-events-auto relative w-full max-w-[346px] overflow-hidden rounded-[18px] border border-[#eadbd4] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#b85a82]" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSubmit();
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
              }
            }}
            placeholder={copy.floating.cmdKPlaceholder}
            className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-slate-800 outline-none placeholder:text-slate-400"
          />
          <kbd className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">{shortcutLabel}</kbd>
        </div>

        <div className="max-h-[260px] overflow-y-auto px-2 py-2">
          {hasIntent ? (
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded-[12px] bg-[#fff7fa] px-2.5 py-2 text-left transition hover:bg-[#fde7ef]"
              onClick={handleSubmit}
            >
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-[#2f2926]">{primaryLabel}</p>
                {intent.kind === 'draft-reply' || intent.kind === 'follow-up' ? (
                  <p className="mt-0.5 truncate text-[10px] text-slate-500">{intent.prompt}</p>
                ) : null}
              </div>
              <span className="shrink-0 rounded-full bg-[#2f2926] px-2 py-0.5 text-[9px] font-semibold text-white">↵</span>
            </button>
          ) : (
            <>
              <CmdKSuggestionList
                suggestions={suggestions}
                copy={copy}
                onSelect={onSelectSuggestion}
              />
              <p className="px-2 py-2 text-center text-[10px] leading-4 text-slate-400">
                {copy.floating.cmdKEmptyState}
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
