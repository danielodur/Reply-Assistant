import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ContactMemoryProfile } from '../../config/contactThreads';
import type { AppTranslations } from '../../i18n/translations';
import AssistedNotesTextarea from '../AssistedNotesTextarea';

type ContactMemoryPanelProps = {
  contactId: string;
  existing: ContactMemoryProfile | undefined;
  copy: AppTranslations;
  onSave: (contactId: string, profile: ContactMemoryProfile) => void;
};

const STYLE_OPTIONS: Array<{ id: NonNullable<ContactMemoryProfile['communicationStyle']>; label: (c: AppTranslations['contactThreads']) => string }> = [
  { id: 'formal', label: c => c.memoryStyleFormal },
  { id: 'warm', label: c => c.memoryStyleWarm },
  { id: 'direct', label: c => c.memoryStyleDirect },
  { id: 'concise', label: c => c.memoryStyleConcise },
];

export default function ContactMemoryPanel({
  contactId,
  existing,
  copy,
  onSave,
}: ContactMemoryPanelProps) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState('');
  const [topics, setTopics] = useState('');
  const [notes, setNotes] = useState('');
  const [style, setStyle] = useState<ContactMemoryProfile['communicationStyle']>('');
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const ct = copy.contactThreads;

  useEffect(() => {
    if (!open) {
      return;
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open]);

  useEffect(() => {
    if (!open) {
      triggerRef.current?.focus();
    }
  }, [open]);

  function handleOpen() {
    setRole(existing?.role ?? '');
    setTopics(existing?.recurringTopics ?? '');
    setNotes(existing?.relationshipNotes ?? '');
    setStyle(existing?.communicationStyle ?? '');
    setOpen(true);
  }

  function handleSave() {
    onSave(contactId, {
      role: role.trim() || undefined,
      recurringTopics: topics.trim() || undefined,
      relationshipNotes: notes.trim() || undefined,
      communicationStyle: style || undefined,
    });
    setOpen(false);
  }

  const hasMemory = Boolean(
    existing?.role?.trim()
      || existing?.recurringTopics?.trim()
      || existing?.relationshipNotes?.trim()
      || existing?.communicationStyle,
  );

  if (open && typeof document !== 'undefined') {
    return createPortal(
      <>
        <div className="fixed inset-0 z-[160] bg-slate-900/24 backdrop-blur-[1px]" onClick={() => setOpen(false)} />
        <div className="fixed inset-0 z-[161] flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="flex max-h-[min(78vh,560px)] w-[min(92vw,420px)] flex-col rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_28px_70px_rgba(15,23,42,0.28)]"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0 pr-2">
                <p className="text-[15px] font-semibold text-slate-900">{ct.memoryPanelTitle}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{ct.memoryPanelSubtitle}</p>
              </div>
              <button
                type="button"
                className="shrink-0 cursor-pointer rounded-full border border-[#f2d6e0] px-2.5 py-1 text-[10px] font-medium text-slate-600 transition hover:border-[#e7aac2] hover:text-[#d86a94]"
                onClick={() => setOpen(false)}
              >
                {copy.miniScreen.back}
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
              <label className="block">
                <span className="text-[10px] font-medium text-slate-500">{ct.memoryRolePlaceholder}</span>
                <input
                  type="text"
                  value={role}
                  onChange={e => setRole(e.currentTarget.value)}
                  className="mt-1 w-full rounded-[10px] border border-slate-200 px-3 py-2 text-[12px] text-slate-800 outline-none"
                />
              </label>

              <div>
                <p className="text-[10px] font-medium text-slate-500">{ct.memoryStyleLabel}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {STYLE_OPTIONS.map(opt => (
                    <button
                      key={opt.id || 'none'}
                      type="button"
                      className={[
                        'rounded-full border px-2.5 py-0.5 text-[10px] transition',
                        style === opt.id
                          ? 'border-[#e88ab0] bg-[#fde9f2] font-semibold text-[#b84f79]'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                      ].join(' ')}
                      onClick={() => setStyle(style === opt.id ? '' : opt.id)}
                    >
                      {opt.label(ct)}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="text-[10px] font-medium text-slate-500">{ct.memoryTopicsPlaceholder}</span>
                <input
                  type="text"
                  value={topics}
                  onChange={e => setTopics(e.currentTarget.value)}
                  className="mt-1 w-full rounded-[10px] border border-slate-200 px-3 py-2 text-[12px] text-slate-800 outline-none"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-medium text-slate-500">{ct.memoryNotesPlaceholder}</span>
                <AssistedNotesTextarea
                  value={notes}
                  onChange={setNotes}
                  textareaRef={notesTextareaRef}
                  rows={4}
                  assistBankKey="contact-memory-notes"
                  ghostMirrorClassName="px-3 py-2 text-[12px] leading-5"
                  textareaClassName="w-full resize-none rounded-[10px] border border-slate-200 px-3 py-2 text-[12px] leading-5 text-slate-800 outline-none"
                  className="mt-1"
                />
              </label>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="rounded-full bg-[#E85C8B] px-5 py-2 text-[12px] font-semibold text-white transition hover:bg-[#d94f81]"
                onClick={handleSave}
              >
                {ct.memorySave}
              </button>
            </div>
          </div>
        </div>
      </>,
      document.body,
    );
  }

  return (
    <div className="mt-1.5">
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-[#e7aac2] hover:text-[#b54e77]"
        onClick={handleOpen}
      >
        {hasMemory ? `${ct.memoryPanelTitle} ✓` : `+ ${ct.memoryPanelTitle}`}
      </button>
    </div>
  );
}
