import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ContactMessageEntry, ContactThread } from '../../config/contactThreads';
import type { AppTranslations } from '../../i18n/translations';
import AssistedNotesTextarea from '../AssistedNotesTextarea';

type TimelineRow = {
  key: string;
  contactId: string;
  contactName: string;
  contactCompany?: string;
  message: ContactMessageEntry;
};

type HubView = 'timeline' | 'extra-notes';

type ChatContextHubModalProps = {
  open: boolean;
  onClose: () => void;
  threads: ContactThread[];
  initialContactId: string | null;
  onUpdateChatContext: (contactId: string, chatContext: string) => void;
  copy: AppTranslations;
};

export default function ChatContextHubModal({
  open,
  onClose,
  threads,
  initialContactId,
  onUpdateChatContext,
  copy,
}: ChatContextHubModalProps) {
  const ct = copy.contactThreads;
  /** Matches `MiniScreenFrame` back control (e.g. Contact threads). */
  const backPillClass =
    'shrink-0 rounded-full border border-[#f2d6e0] px-2.5 py-1 text-[10px] font-medium text-slate-600 transition hover:border-[#e7aac2] hover:text-[#d86a94]';
  const [filter, setFilter] = useState<'all' | string>('all');
  const [view, setView] = useState<HubView>('timeline');
  const [draft, setDraft] = useState('');
  const notesTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  /** Global hub (toolbar "Chat context") vs single contact ("Open chat" on a card). */
  const showContactPicker = initialContactId === null;

  const scopedContactId = useMemo(
    () => (initialContactId ?? (filter === 'all' ? null : filter)),
    [filter, initialContactId],
  );

  const selectedThread = useMemo(
    () => (scopedContactId ? threads.find(t => t.id === scopedContactId) ?? null : null),
    [scopedContactId, threads],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setFilter(initialContactId ?? 'all');
    setView('timeline');
  }, [open, initialContactId]);

  useEffect(() => {
    if (filter === 'all') {
      setView('timeline');
    }
  }, [filter]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onEscape(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (view === 'extra-notes') {
        e.stopPropagation();
        setView('timeline');
        return;
      }
      onClose();
    }
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [open, onClose, view]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (view === 'extra-notes' && open) {
      window.requestAnimationFrame(() => notesTextareaRef.current?.focus());
    }
  }, [view, open]);

  useEffect(() => {
    if (!open) return;
    setDraft(selectedThread?.chatContext ?? '');
  }, [open, selectedThread]);

  const timelineRows = useMemo(() => {
    const list: TimelineRow[] = [];
    const scope = scopedContactId === null ? threads : threads.filter(t => t.id === scopedContactId);
    for (const thread of scope) {
      for (const message of thread.messages) {
        list.push({
          key: `${thread.id}-${message.id}`,
          contactId: thread.id,
          contactName: thread.name,
          contactCompany: thread.company || undefined,
          message,
        });
      }
    }
    list.sort((a, b) => b.message.createdAt - a.message.createdAt);
    return list;
  }, [threads, scopedContactId]);

  function handleSaveExtraNotes() {
    if (!selectedThread) return;
    onUpdateChatContext(selectedThread.id, draft);
    setView('timeline');
  }

  if (!open || typeof document === 'undefined') {
    return null;
  }

  const extraNotesTitleId = 'chat-extra-notes-title';

  return createPortal(
    <>
      <div className="fixed inset-0 z-[160] bg-slate-900/24 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed inset-0 z-[161] flex items-center justify-center p-3 sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={view === 'extra-notes' ? extraNotesTitleId : 'chat-context-hub-title'}
          className="flex h-[min(82vh,600px)] w-[min(94vw,440px)] flex-col rounded-[20px] border border-[#ead5df] bg-white shadow-[0_28px_70px_rgba(15,23,42,0.28)]"
          onClick={e => e.stopPropagation()}
        >
          {view === 'extra-notes' && selectedThread ? (
            <>
              <div className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 pr-2">
                    <p id={extraNotesTitleId} className="text-[15px] font-semibold text-slate-900">
                      {ct.chatContextExtraLabel}
                    </p>
                    <p className="mt-1 truncate text-[12px] font-semibold text-slate-900">{selectedThread.name}</p>
                    {[selectedThread.company, selectedThread.email].filter(Boolean).length ? (
                      <p className="mt-0.5 truncate text-[11px] leading-5 text-slate-500">
                        {[selectedThread.company, selectedThread.email].filter(Boolean).join(' · ')}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-[10px] text-slate-400">{ct.stageLabels[selectedThread.stage]}</p>
                    <p className="mt-2 text-[11px] text-slate-500">{ct.chatExtraNotesScreenSubtitle}</p>
                  </div>
                  <button
                    type="button"
                    className={backPillClass}
                    onClick={() => setView('timeline')}
                  >
                    {copy.miniScreen.back}
                  </button>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3">
                <AssistedNotesTextarea
                  value={draft}
                  onChange={setDraft}
                  placeholder={ct.chatContextPlaceholder}
                  textareaRef={notesTextareaRef}
                  assistBankKey="chat-hub-notes"
                  ghostMirrorClassName="px-3.5 py-3 text-[13px] leading-7"
                  textareaClassName="min-h-[min(400px,58vh)] w-full flex-1 resize-y rounded-[14px] border border-slate-200 bg-[#fcfcfd] px-3.5 py-3 text-[13px] leading-7 text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#e88ab0] focus:ring-2 focus:ring-[#f1c4d6]/45"
                />
              </div>

              <div className="shrink-0 border-t border-slate-100 bg-[#fdfcfd] px-4 py-3">
                <button
                  type="button"
                  className="w-full rounded-full bg-[#E85C8B] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(232,92,139,0.22)] transition hover:bg-[#d94f81]"
                  onClick={handleSaveExtraNotes}
                >
                  {ct.chatContextSave}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1 pr-2">
                    {!showContactPicker ? (
                      selectedThread ? (
                        <>
                          <p id="chat-context-hub-title" className="truncate text-[15px] font-semibold text-slate-900">
                            {selectedThread.name}
                          </p>
                          {[selectedThread.company, selectedThread.email].filter(Boolean).length ? (
                            <p className="mt-0.5 truncate text-[11px] text-slate-500">
                              {[selectedThread.company, selectedThread.email].filter(Boolean).join(' · ')}
                            </p>
                          ) : null}
                          <p className="mt-1 text-[10px] text-slate-400">{ct.stageLabels[selectedThread.stage]}</p>
                        </>
                      ) : (
                        <>
                          <p id="chat-context-hub-title" className="text-[15px] font-semibold text-slate-900">
                            {ct.chatHubTitle}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">{ct.chatHubContactUnavailable}</p>
                        </>
                      )
                    ) : (
                      <>
                        <p id="chat-context-hub-title" className="text-[15px] font-semibold text-slate-900">
                          {ct.chatHubTitle}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{ct.chatHubSubtitle}</p>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    className={backPillClass}
                    onClick={onClose}
                  >
                    {copy.miniScreen.back}
                  </button>
                </div>

                {showContactPicker ? (
                  <div className="relative mt-3">
                    <select
                      value={filter}
                      onChange={e => {
                        const v = e.target.value;
                        setFilter(v === 'all' ? 'all' : v);
                      }}
                      aria-label={ct.chatHubFilterLabel}
                      className="clean-scrollbar w-full cursor-pointer appearance-none rounded-[14px] border border-[#efd8e2] bg-[linear-gradient(180deg,#fff_0%,#fffaf9_100%)] py-2.5 pl-3.5 pr-10 text-[12px] font-semibold text-slate-800 shadow-[0_2px_8px_rgba(221,131,168,0.08)] outline-none transition focus:border-[#e88ab0] focus:ring-2 focus:ring-[#f1c4d6]/55"
                    >
                      <option value="all">{ct.chatHubAllContacts}</option>
                      {threads.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                          {t.company ? ` · ${t.company}` : ''}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#b54e77]" aria-hidden>
                      ▾
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto clean-scrollbar px-4 py-3">
                {timelineRows.length === 0 ? (
                  <p className="rounded-[14px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-[12px] text-slate-600">
                    {ct.chatHubTimelineEmpty}
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {timelineRows.map(row => {
                      const m = row.message;
                      const dirLabel =
                        m.direction === 'inbound'
                          ? ct.timelineInbound
                          : m.direction === 'outbound'
                            ? ct.timelineOutbound
                            : ct.timelineNote;
                      const sourceLabel =
                        m.source === 'paste'
                          ? ct.sourcePasteLabel
                          : m.source === 'email-sync'
                            ? ct.sourceEmailSyncLabel
                            : m.source === 'generated-reply'
                              ? ct.sourceGeneratedReplyLabel
                              : ct.sourceManualNoteLabel;
                      const when = new Date(m.createdAt).toLocaleString();
                      const showContact = scopedContactId === null;
                      const partiesLine =
                        m.sender.trim() || m.receiver.trim()
                          ? ct.timelinePartiesLine
                            .replace('{sender}', m.sender.trim() || '—')
                            .replace('{receiver}', m.receiver.trim() || '—')
                          : null;
                      return (
                        <li
                          key={row.key}
                          className="rounded-[14px] border border-slate-100 bg-[#fcfcfd] px-3 py-2.5 shadow-[0_1px_0_rgba(15,23,42,0.04)]"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                            <span className="text-[10px] font-semibold tabular-nums text-slate-500">{when}</span>
                            {showContact ? (
                              <span className="max-w-[65%] truncate text-[10px] font-semibold text-[#b54e77]">
                                {row.contactName}
                                {row.contactCompany ? (
                                  <span className="font-normal text-slate-500"> · {row.contactCompany}</span>
                                ) : null}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-[10px] text-slate-500">
                            <span className="font-medium text-slate-600">{dirLabel}</span>
                            {' · '}
                            {sourceLabel}
                          </p>
                          {partiesLine ? (
                            <p className="mt-0.5 text-[10px] font-medium text-slate-600">{partiesLine}</p>
                          ) : null}
                          <p className="mt-1 whitespace-pre-wrap text-[12px] leading-5 text-slate-700">
                            {m.summary || m.text}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="shrink-0 space-y-2 border-t border-slate-100 bg-[#fdfcfd] px-4 py-3">
                {!selectedThread ? (
                  <p className="text-[11px] leading-5 text-slate-500">
                    {!showContactPicker ? ct.chatHubContactUnavailable : ct.chatHubAllNotesHint}
                  </p>
                ) : (
                  <button
                    type="button"
                    className="w-full rounded-[14px] border border-[#e8c9d6] bg-[#f8eaef] py-2.5 text-[12px] font-semibold text-[#8f4a62] shadow-[0_1px_0_rgba(255,255,255,0.65)_inset] transition hover:border-[#e7aac2] hover:bg-[#f5dfe8] hover:text-[#7a2d4a]"
                    onClick={() => setView('extra-notes')}
                  >
                    {ct.chatContextExtraLabel}
                  </button>
                )}
                <button
                  type="button"
                  className="w-full rounded-full bg-[#E85C8B] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(232,92,139,0.22)] transition hover:bg-[#d94f81]"
                  onClick={onClose}
                >
                  {ct.chatHubSaveAndClose}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
