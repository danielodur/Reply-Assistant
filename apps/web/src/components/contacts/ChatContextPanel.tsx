import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { AppTranslations } from '../../i18n/translations';
import AssistedNotesTextarea from '../AssistedNotesTextarea';

type ChatContextPanelProps = {
  contactId: string;
  existingContext: string | undefined;
  copy: AppTranslations;
  onSave: (contactId: string, chatContext: string) => void;
};

export default function ChatContextPanel({
  contactId,
  existingContext,
  copy,
  onSave,
}: ChatContextPanelProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [savedForId, setSavedForId] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const ct = copy.contactThreads;
  const hasContext = Boolean(existingContext?.trim());

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open]);

  useEffect(() => {
    if (open) {
      return;
    }

    triggerRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!savedForId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSavedForId(null);
    }, 20000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [savedForId]);

  function handleOpen() {
    setDraft(existingContext ?? '');
    setSavedForId(null);
    setOpen(true);
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }

  function handleSave() {
    onSave(contactId, draft);
    setSavedForId(contactId);
    setOpen(false);
  }

  function handleCancel() {
    setOpen(false);
  }

  if (open) {
    if (typeof document === 'undefined') {
      return null;
    }

    return createPortal(
      <>
        <div className="fixed inset-0 z-[160] bg-slate-900/24 backdrop-blur-[1px]" onClick={handleCancel} />
        <div className="fixed inset-0 z-[161] flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`chat-context-title-${contactId}`}
            className="flex h-[min(78vh,580px)] w-[min(92vw,500px)] flex-col rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_28px_70px_rgba(15,23,42,0.28)]"
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p id={`chat-context-title-${contactId}`} className="text-[15px] font-semibold text-slate-900">
                {ct.chatContextLabel}
              </p>
              <button
                type="button"
                aria-label={copy.settings.cancel}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-[15px] leading-none text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                onClick={handleCancel}
              >
                ×
              </button>
            </div>

            <AssistedNotesTextarea
              value={draft}
              onChange={setDraft}
              placeholder={ct.chatContextPlaceholder}
              textareaRef={textareaRef}
              assistBankKey="chat-context-panel"
              ghostMirrorClassName="px-3.5 py-3 text-[13px] leading-7"
              textareaClassName="min-h-[260px] w-full flex-1 rounded-[12px] border border-slate-200 bg-white px-3.5 py-3 text-[13px] leading-7 text-slate-700 outline-none placeholder:text-slate-400"
            />

            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                className="rounded-full bg-[#E85C8B] px-5 py-2 text-[12px] font-semibold text-white transition hover:bg-[#d94f81] disabled:opacity-60"
                onClick={handleSave}
                disabled={!draft.trim()}
              >
                {ct.chatContextSave}
              </button>
            </div>
          </div>
        </div>
      </>,
      document.body,
    );
  }

  return (
    <div className="mt-2 space-y-1">
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex items-center rounded-full bg-[#fff5f9] px-3 py-1.5 text-[11px] font-semibold text-[#b54e77] transition hover:bg-[#fdeaf1] hover:text-[#c15480]"
        onClick={handleOpen}
      >
        {hasContext ? `${ct.chatContextLabel} ✓` : ct.addChatContext}
      </button>
      {savedForId === contactId && (
        <p className="text-[10px] text-emerald-600">{ct.chatContextHint}</p>
      )}
    </div>
  );
}
