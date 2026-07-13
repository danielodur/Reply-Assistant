import { useEffect, useMemo, useRef, useState } from 'react';
import type { ContactThread } from '../../config/contactThreads';
import type { AppTranslations } from '../../i18n/translations';
import type { RecipientProfile, WorkMode } from '../workbench/types';
import { getModeFilteredThreads, matchesRecipientContext } from './contactFiltering';

type ContactPickerProps = {
  copy: AppTranslations;
  threads: ContactThread[];
  selectedContactId: string | null;
  workMode: WorkMode;
  recipientProfile: RecipientProfile;
  onSelectContact: (contactId: string | null) => void;
};

export default function ContactPicker({
  copy,
  threads,
  selectedContactId,
  workMode,
  recipientProfile,
  onSelectContact,
}: ContactPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedThread = threads.find(thread => thread.id === selectedContactId) ?? null;
  const modeFilteredThreads = useMemo(() => getModeFilteredThreads(threads, workMode), [threads, workMode]);
  const contextFilteredThreads = useMemo(() => {
    const narrowedThreads = modeFilteredThreads.filter(thread => matchesRecipientContext(thread, workMode, recipientProfile));
    return narrowedThreads.length > 0 ? narrowedThreads : modeFilteredThreads;
  }, [modeFilteredThreads, recipientProfile, workMode]);
  const filteredThreads = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return contextFilteredThreads;

    return contextFilteredThreads.filter(thread => {
      const haystack = [thread.name, thread.company, thread.notes, copy.contactThreads.stageLabels[thread.stage]].join(' ').toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [contextFilteredThreads, copy.contactThreads.stageLabels, search]);

  /** Keep the active selection visible even if mode/recipient filtering would hide it. */
  const listThreads = useMemo(() => {
    if (!selectedContactId) return filteredThreads;
    if (filteredThreads.some(t => t.id === selectedContactId)) return filteredThreads;
    const selected = threads.find(t => t.id === selectedContactId);
    return selected ? [selected, ...filteredThreads] : filteredThreads;
  }, [filteredThreads, selectedContactId, threads]);

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      return;
    }

    searchInputRef.current?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (contactId: string | null) => {
    onSelectContact(contactId);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="mt-2" ref={containerRef}>
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[16px] border border-[#f1d7e3] bg-white px-3 py-2.5 text-left shadow-[0_12px_24px_rgba(232,92,139,0.08)] transition hover:border-[#e7aac2] active:scale-[0.99]"
          onClick={() => setIsOpen(prev => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          onKeyDown={event => {
            if (!isOpen && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault();
              setIsOpen(true);
            }
          }}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-slate-700">
              {selectedThread ? selectedThread.name : copy.contactThreads.pickerPlaceholder}
            </p>
            <p className="mt-0.5 truncate text-[10px] text-slate-400">
              {selectedThread?.company || (workMode === 'internal' ? copy.contactThreads.internalSearchPlaceholder : copy.contactThreads.searchPlaceholder)}
            </p>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff3f7] text-[#c15480]">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              className={['h-4 w-4 transition-transform duration-200', isOpen ? 'rotate-180' : 'rotate-0'].join(' ')}
              aria-hidden="true"
            >
              <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>

        {isOpen && (
          <div className="absolute inset-x-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-[18px] border border-[#f1d7e3] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.14)]">
            <div className="border-b border-[#f7e3ea] p-2.5">
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder={workMode === 'internal' ? copy.contactThreads.internalSearchPlaceholder : copy.contactThreads.searchPlaceholder}
                className="w-full rounded-[12px] border border-[#f1d7e3] bg-[#fffafb] px-3 py-2 text-[11px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#e88ab0]"
              />
            </div>

            <div className="clean-scrollbar max-h-56 scroll-smooth overflow-y-auto p-2">
              <button
                type="button"
                className={[
                  'flex w-full items-center justify-between rounded-[14px] px-3 py-2 text-left transition',
                  selectedContactId === null ? 'bg-[#fff0f6] text-[#b84f79] active:bg-[#fde9f2]' : 'cursor-pointer text-slate-500 hover:bg-[#fff7fa] active:bg-[#fde9f2]',
                ].join(' ')}
                onClick={() => handleSelect(null)}
              >
                <span className="text-[11px] font-medium">{copy.contactThreads.clearSelectionLabel}</span>
              </button>

              {listThreads.length > 0 ? (
                listThreads.map(thread => (
                  <button
                    key={thread.id}
                    type="button"
                    className={[
                      'mt-1.5 flex w-full cursor-pointer items-start justify-between gap-3 rounded-[14px] px-3 py-2.5 text-left transition',
                      selectedContactId === thread.id ? 'bg-[#fff0f6] active:bg-[#fde9f2]' : 'hover:bg-[#fff7fa] active:bg-[#fde9f2]',
                    ].join(' ')}
                    onClick={() => handleSelect(thread.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-slate-700">{thread.name}</p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-400">
                        {thread.company || copy.contactThreads.stageLabels[thread.stage]}
                      </p>
                    </div>
                    {selectedContactId === thread.id ? (
                      <span className="rounded-full bg-[#fde9f2] px-2 py-0.5 text-[9px] font-semibold text-[#b84f79]">
                        {copy.contactThreads.selectedContact}
                      </span>
                    ) : null}
                  </button>
                ))
              ) : (
                <p className="px-3 py-4 text-[11px] text-slate-400">{copy.contactThreads.noSearchResults}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
