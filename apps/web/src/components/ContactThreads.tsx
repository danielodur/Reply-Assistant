import { useEffect, useMemo, useRef, useState } from 'react';
import { type ContactMemoryProfile, type ContactStage, type ContactThread } from '../config/contactThreads';
import type { AppTranslations } from '../i18n/translations';
import { useContactDailyFocus } from '../hooks/useContactDailyFocus';
import MiniScreenFrame from './MiniScreenFrame';
import ContactThreadCard from './contacts/ContactThreadCard';
import CreateContactWizard from './contacts/wizard/CreateContactWizard';
import { writeReplyLanguagePreference } from '../lib/replyLanguagePreference';
import CreateContactSuccessToast from './contacts/CreateContactSuccessToast';
import { buildContactPriority } from './contacts/contactPriority';
import ChatContextHubModal from './contacts/ChatContextHubModal';
import { consumePendingCaptureDraft } from './contacts/pendingCaptureDraft';
import { useContactUploads } from '../uploads/useContactUploads';
import { PROFILE_UPLOAD_LIMIT } from '../uploads/uploadValidation';
type ContactThreadsProps = {
  onClose: () => void;
  copy: AppTranslations;
  threads: ContactThread[];
  selectedContactId: string | null;
  onSelectContact: (contactId: string | null) => void;
  onRemoveContact: (contactId: string) => void;
  onCreateContact: (input: {
    name: string;
    company?: string;
    email?: string;
    stage?: ContactStage;
    notes?: string;
    memoryProfile?: ContactMemoryProfile;
  }) => ContactThread;
  onAddMessage: (contactId: string, text: string) => void;
  onUpdateChatContext: (contactId: string, chatContext: string) => void;
  onSaveMemory: (contactId: string, profile: ContactMemoryProfile) => void;
  onSaveAndCompose: (contactId: string, text: string) => void;
  onSmartReply?: (contact: ContactThread) => void;
};

export default function ContactThreads({
  onClose,
  copy,
  threads,
  selectedContactId,
  onSelectContact,
  onRemoveContact,
  onCreateContact,
  onAddMessage,
  onUpdateChatContext,
  onSaveMemory,
  onSaveAndCompose,
  onSmartReply,
}: ContactThreadsProps) {
  type ContactFilterValue = 'needs-action' | 'all';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [contactPendingRemoval, setContactPendingRemoval] = useState<ContactThread | null>(null);
  const [headerElevated, setHeaderElevated] = useState(false);
  const [contactFilter, setContactFilter] = useState<ContactFilterValue>('all');
  const [lastCreatedContact, setLastCreatedContact] = useState<{ name: string; company?: string } | null>(null);
  const [pendingCaptureNotes, setPendingCaptureNotes] = useState('');
  const cardsRef = useRef<HTMLDivElement | null>(null);
  const dailyFocus = useContactDailyFocus();
  const contactUploads = useContactUploads();
  const [chatHub, setChatHub] = useState<{ open: boolean; contactId: string | null }>({
    open: false,
    contactId: null,
  });

  useEffect(() => {
    if (!contactPendingRemoval) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContactPendingRemoval(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [contactPendingRemoval]);

  useEffect(() => {
    const pendingDraft = consumePendingCaptureDraft();
    if (!pendingDraft) return;
    setPendingCaptureNotes(pendingDraft.text);
    setShowCreateModal(true);
  }, []);

  const threadPriorities = useMemo(() => {
    const priorityMap = new Map<string, ReturnType<typeof buildContactPriority>>();
    for (const thread of threads) {
      priorityMap.set(thread.id, buildContactPriority(thread));
    }
    return priorityMap;
  }, [threads]);

  const sortedThreads = useMemo(() => {
    return [...threads].sort((a, b) => {
      const priorityA = threadPriorities.get(a.id);
      const priorityB = threadPriorities.get(b.id);
      const scoreA = priorityA?.score ?? 0;
      const scoreB = priorityB?.score ?? 0;

      if (scoreB !== scoreA) return scoreB - scoreA;
      return b.updatedAt - a.updatedAt;
    });
  }, [threadPriorities, threads]);

  const filteredThreads = useMemo(() => {
    if (contactFilter === 'all') return sortedThreads;
    return sortedThreads.filter(thread => {
      const priority = threadPriorities.get(thread.id);
      if (!priority?.needsAttention) return false;
      if (dailyFocus.isDone(thread.id)) return false;
      if (dailyFocus.isSnoozed(thread.id)) return false;
      return true;
    });
  }, [contactFilter, dailyFocus, sortedThreads, threadPriorities]);

  const threadInsights = useMemo(() => {
    const sourceLabelMap: Record<string, string> = {
      paste: copy.contactThreads.sourcePasteLabel,
      'email-sync': copy.contactThreads.sourceEmailSyncLabel,
      'manual-note': copy.contactThreads.sourceManualNoteLabel,
      'generated-reply': copy.contactThreads.sourceGeneratedReplyLabel,
    };

    const insightMap = new Map<string, {
      inboundCount: number;
      outboundCount: number;
      chatTypes: string[];
      lastInbound: number | null;
      lastOutbound: number | null;
      actionLabel: string;
    }>();

    for (const thread of threads) {
      const inbound = thread.messages.filter(message => message.direction === 'inbound');
      const outbound = thread.messages.filter(message => message.direction === 'outbound');
      const chatTypes = Array.from(new Set(thread.messages.map(message => sourceLabelMap[message.source] || message.source)));
      const lastInbound = inbound.length ? Math.max(...inbound.map(message => message.createdAt)) : null;
      const lastOutbound = outbound.length ? Math.max(...outbound.map(message => message.createdAt)) : null;

      insightMap.set(thread.id, {
        inboundCount: inbound.length,
        outboundCount: outbound.length,
        chatTypes,
        lastInbound,
        lastOutbound,
        actionLabel:
          lastInbound && (!lastOutbound || lastInbound > lastOutbound)
            ? copy.contactThreads.callToActionReply
            : copy.contactThreads.callToActionFollowUp,
      });
    }

    return insightMap;
  }, [threads, copy]);

  function formatDateTime(timestamp: number | null): string {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString();
  }

  return (
    <MiniScreenFrame
      label={copy.contactThreads.frameLabel}
      title={copy.contactThreads.frameTitle}
      onClose={onClose}
      backLabel={copy.miniScreen.back}
      contentClassName="bg-[#fcfcfd] px-4 pt-2 pb-4"
      contentScrollable={false}
      contentOverlay={contactPendingRemoval ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a]/30 px-3 backdrop-blur-[3px]">
          <section className="w-full max-w-[292px] rounded-[18px] border border-[#f1d5e1] bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.20)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-[linear-gradient(180deg,#ef5d8f,#db4d83)] text-lg font-semibold text-white shadow-[0_10px_24px_rgba(255,192,211,0.32)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 text-[11px] font-bold tracking-[0.08em]">
                RA
              </div>
            </div>

            <p className="mt-3 text-center text-[13px] font-semibold text-slate-900">{copy.contactThreads.removeContactTitle}</p>
            <p className="mt-1 text-center text-[11px] leading-5 text-slate-600">
              {copy.contactThreads.removeContactConfirm}
            </p>
            <p className="mt-1 text-center text-[10px] font-medium text-[#b04f78]">{contactPendingRemoval.name}</p>

            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                className="rounded-full border border-[#edd7e0] bg-white px-3 py-1.5 text-[10px] font-medium text-slate-500 transition hover:border-[#e7aac2] hover:text-[#c15480]"
                onClick={() => setContactPendingRemoval(null)}
              >
                {copy.settings.cancel}
              </button>
              <button
                type="button"
                className="rounded-full bg-[#E85C8B] px-3 py-1.5 text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(232,92,139,0.24)] transition hover:bg-[#d94f81]"
                onClick={() => {
                  onRemoveContact(contactPendingRemoval.id);
                  setContactPendingRemoval(null);
                }}
              >
                {copy.contactThreads.removeContactAction}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    >
      <CreateContactWizard
        copy={copy}
        open={showCreateModal}
        initialNotes={pendingCaptureNotes}
        onClose={() => setShowCreateModal(false)}
        onSubmit={payload => {
          const nextThread = onCreateContact({
            name: payload.name,
            company: payload.company,
            email: payload.email,
            stage: payload.stage,
            notes: payload.notes,
            memoryProfile: payload.memoryProfile,
          });
          if (payload.replyLanguage !== 'auto') {
            writeReplyLanguagePreference(nextThread.id, payload.replyLanguage);
          }
          const pendingText = pendingCaptureNotes.trim();
          if (pendingText) {
            onAddMessage(nextThread.id, pendingText);
            onSaveAndCompose(nextThread.id, pendingText);
          }
          setLastCreatedContact({ name: payload.name, company: payload.company });
          setPendingCaptureNotes('');
        }}
      />

      {lastCreatedContact && (
        <CreateContactSuccessToast
          contactName={lastCreatedContact.name}
          companyName={lastCreatedContact.company}
          onDismiss={() => setLastCreatedContact(null)}
        />
      )}

      <div className="flex h-full min-h-0 flex-col">
        <div className={`shrink-0 space-y-1.5 pb-1 transition-shadow duration-200${headerElevated ? ' shadow-[0_4px_12px_rgba(15,23,42,0.06)]' : ''}`}>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="shrink-0 rounded-full border border-[#efd8e2] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#7a2d4a] shadow-sm transition hover:border-[#e7aac2] hover:bg-[#fff5f9] hover:text-[#b54e77]"
              onClick={() => setChatHub({ open: true, contactId: null })}
            >
              {copy.contactThreads.chatHubOpenButton}
            </button>
            <button
              type="button"
              className="shrink-0 rounded-full bg-[#fff5f9] px-3 py-1.5 text-[10px] font-semibold text-[#b54e77] transition hover:bg-[#fdeaf1] hover:text-[#c15480]"
              onClick={() => {
                setPendingCaptureNotes('');
                setShowCreateModal(true);
              }}
            >
              {copy.contactThreads.addContactAction}
            </button>
          </div>

          <div className="inline-flex w-full items-center gap-1 rounded-full border border-[#efd8e2] bg-white p-1">
            <button
              type="button"
              className={[
                'min-w-0 flex-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition',
                contactFilter === 'all'
                  ? 'bg-[#fff3f8] text-[#b54e77]'
                  : 'text-slate-500 hover:text-slate-700',
              ].join(' ')}
              onClick={() => setContactFilter('all')}
            >
              {copy.contactThreads.contactFilterAll}
            </button>
            <button
              type="button"
              className={[
                'min-w-0 flex-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition',
                contactFilter === 'needs-action'
                  ? 'bg-[#fff3f8] text-[#b54e77]'
                  : 'text-slate-500 hover:text-slate-700',
              ].join(' ')}
              onClick={() => setContactFilter('needs-action')}
            >
              {copy.contactThreads.contactFilterNeedsAction}
            </button>
          </div>

        </div>

        <div
          ref={cardsRef}
          className="clean-scrollbar min-h-0 flex-1 overflow-y-auto pb-2"
          onScroll={() => setHeaderElevated((cardsRef.current?.scrollTop ?? 0) > 0)}
        >
          {filteredThreads.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
              <p className="text-[12px] font-semibold text-slate-700">
                {contactFilter === 'needs-action'
                  ? copy.contactThreads.contactFilterNeedsActionEmptyTitle
                  : copy.contactThreads.emptyTitle}
              </p>
              <p className="mt-2 text-[11px] text-slate-500">
                {contactFilter === 'needs-action'
                  ? copy.contactThreads.contactFilterNeedsActionEmptyBody
                  : copy.contactThreads.emptyBody}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredThreads.map(thread => {
                const insight = threadInsights.get(thread.id);
                const priority = threadPriorities.get(thread.id);

                return (
                  <ContactThreadCard
                    key={thread.id}
                    thread={thread}
                    copy={copy}
                    priority={priority ?? buildContactPriority(thread)}
                    isDone={dailyFocus.isDone(thread.id)}
                    isSnoozed={dailyFocus.isSnoozed(thread.id)}
                    insight={insight ? {
                      inboundCount: insight.inboundCount,
                      outboundCount: insight.outboundCount,
                      chatTypes: insight.chatTypes,
                      lastInbound: formatDateTime(insight.lastInbound),
                      lastOutbound: formatDateTime(insight.lastOutbound),
                      actionLabel: insight.actionLabel,
                    } : null}
                    isSelected={selectedContactId === thread.id}
                    onRemove={() => setContactPendingRemoval(thread)}
                    onSelect={() => onSelectContact(selectedContactId === thread.id ? null : thread.id)}
                    onMarkDone={() => dailyFocus.markDone(thread.id)}
                    onSnooze={() => dailyFocus.snoozeUntilTomorrow(thread.id)}
                    onAddMessage={onAddMessage}
                    onSaveMemory={onSaveMemory}
                    onSaveAndCompose={onSaveAndCompose}
                    onOpenChatHub={cid => setChatHub({ open: true, contactId: cid })}
                    uploads={contactUploads.uploadsByContact[thread.id] ?? []}
                    uploadMaxFiles={PROFILE_UPLOAD_LIMIT}
                    uploadProcessing={contactUploads.processingContactId === thread.id}
                    uploadError={contactUploads.processingContactId === thread.id ? contactUploads.error : ''}
                    onAttachFiles={(contactId, files) => void contactUploads.attachFiles(contactId, files)}
                    onRemoveUpload={contactUploads.removeUpload}
                    onSmartReply={onSmartReply}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ChatContextHubModal
        open={chatHub.open}
        onClose={() => setChatHub({ open: false, contactId: null })}
        threads={threads}
        initialContactId={chatHub.contactId}
        onUpdateChatContext={onUpdateChatContext}
        copy={copy}
      />
    </MiniScreenFrame>
  );
}
