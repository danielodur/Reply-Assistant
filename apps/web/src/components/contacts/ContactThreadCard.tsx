import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { AppTranslations } from '../../i18n/translations';
import type { ContactThread } from '../../config/contactThreads';
import type { ContactPriority } from './contactPriority';
import { contactActionStyles } from './contactActionStyles';
import SmartCapturePanel from './SmartCapturePanel';
import ContactMemoryPanel from './ContactMemoryPanel';
import type { ContactMemoryProfile } from '../../config/contactThreads';
import type { UploadContextSummary } from '../../uploads/uploadTypes';
import CompactUploadRow from '../uploads/CompactUploadRow';
import SmartReplyButton from '../smart-reply/SmartReplyButton';
import RelationshipHintLine from '../relationship-memory/RelationshipHintLine';

type ContactThreadCardProps = {
  thread: ContactThread;
  copy: AppTranslations;
  priority: ContactPriority;
  isDone: boolean;
  isSnoozed: boolean;
  insight?: {
    inboundCount: number;
    outboundCount: number;
    chatTypes: string[];
    lastInbound: string;
    lastOutbound: string;
    actionLabel: string;
  } | null;
  isSelected: boolean;
  onRemove: () => void;
  onSelect: () => void;
  onMarkDone: () => void;
  onSnooze: () => void;
  onAddMessage: (contactId: string, text: string) => void;
  onSaveMemory?: (contactId: string, profile: ContactMemoryProfile) => void;
  onSaveAndCompose?: (contactId: string, text: string) => void;
  onOpenChatHub: (contactId: string) => void;
  uploads?: UploadContextSummary[];
  uploadMaxFiles?: number;
  uploadProcessing?: boolean;
  uploadError?: string;
  onAttachFiles?: (contactId: string, files: FileList) => void;
  onRemoveUpload?: (contactId: string, uploadId: string) => void;
  onSmartReply?: (contact: ContactThread) => void;
};

export default function ContactThreadCard({
  thread,
  copy,
  priority,
  isDone,
  isSnoozed,
  insight,
  isSelected,
  onRemove,
  onSelect,
  onMarkDone,
  onSnooze,
  onAddMessage,
  onSaveMemory,
  onSaveAndCompose,
  onOpenChatHub,
  uploads = [],
  uploadMaxFiles = 5,
  uploadProcessing = false,
  uploadError = '',
  onAttachFiles,
  onRemoveUpload,
  onSmartReply,
}: ContactThreadCardProps) {
  const [showInsightModal, setShowInsightModal] = useState(false);

  const riskLabel =
    priority.level === 'action-now'
      ? copy.contactThreads.priorityRiskActionNow
      : priority.level === 'due-today'
        ? copy.contactThreads.priorityRiskDueToday
        : copy.contactThreads.priorityRiskWatchlist;

  const riskToneClass =
    priority.level === 'action-now'
      ? 'border-red-200 bg-red-50 text-red-700'
      : priority.level === 'due-today'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-slate-200 bg-slate-50 text-slate-600';

  const activityText = priority.latestActivityAt
    ? copy.contactThreads.priorityLastActivity.replace('{time}', new Date(priority.latestActivityAt).toLocaleString())
    : copy.contactThreads.priorityNoActivity;
  const priorityReason = copy.contactThreads.priorityReasons[priority.reason] ?? copy.contactThreads.priorityReasons['quiet-thread'];

  useEffect(() => {
    if (!showInsightModal) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowInsightModal(false);
      }
    };

    window.addEventListener('keydown', onEscape);
    return () => {
      window.removeEventListener('keydown', onEscape);
    };
  }, [showInsightModal]);

  return (
    <article
      className={[
        'rounded-[14px] border bg-white px-4 py-3 transition-all duration-200 ease-out',
        (isDone || isSnoozed) ? 'opacity-80' : '',
        'border-slate-200 hover:scale-[1.005] hover:border-[#dd83a8] hover:ring-2 hover:ring-inset hover:ring-[#f1c4d6] hover:shadow-[0_10px_26px_rgba(221,131,168,0.14)]',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold text-slate-900">{thread.name}</p>
          <p className="mt-0.5 text-[10px] text-slate-500">
            {thread.company || copy.contactThreads.unassigned}
          </p>
          {thread.email ? (
            <p className="mt-0.5 text-[10px] text-slate-500">{thread.email}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          {onSmartReply ? (
            <SmartReplyButton
              thread={thread}
              copy={copy}
              onSmartReply={onSmartReply}
              variant="compact"
            />
          ) : null}
          <button
            type="button"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-[13px] font-semibold leading-none text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            aria-label={copy.contactThreads.removeContact}
            title={copy.contactThreads.removeContact}
            onClick={onRemove}
          >
            ×
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
            {copy.contactThreads.stageLabels[thread.stage]}
          </span>
          {priority.needsAttention ? (
            <span className={`rounded-full border px-2.5 py-1 font-semibold ${riskToneClass}`}>
              {riskLabel}
            </span>
          ) : null}
        </div>

        {insight ? (
          <button
            type="button"
            aria-label={copy.contactThreads.contactInsightsTitle}
            title={copy.contactThreads.contactInsightsTitle}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#ecd3de] bg-[#fff5f9] text-[#b54e77] transition hover:border-[#e7aac2] hover:text-[#c15480]"
            onClick={() => setShowInsightModal(true)}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
      </div>

      <p className="mt-2 text-[10px] text-slate-500">{activityText}</p>
      <p className="mt-1 text-[10px] text-slate-700">
        <span className="font-semibold text-slate-800">{copy.contactThreads.priorityReasonLabel}:</span> {priorityReason}
      </p>
      <RelationshipHintLine thread={thread} copy={copy} />
      {isDone ? (
        <p className="mt-1 text-[10px] text-emerald-700">{copy.contactThreads.focusDoneState}</p>
      ) : null}
      {isSnoozed ? (
        <p className="mt-1 text-[10px] text-slate-500">{copy.contactThreads.focusSnoozedState}</p>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {!isDone ? (
            <button
              type="button"
              className={`cursor-pointer ${contactActionStyles.secondary}`}
              onClick={onSnooze}
            >
              {copy.contactThreads.snoozeUntilTomorrow}
            </button>
          ) : null}
          {!isDone ? (
            <button
              type="button"
              className={`cursor-pointer ${contactActionStyles.success}`}
              onClick={onMarkDone}
            >
              {copy.contactThreads.markDoneAction}
            </button>
          ) : null}
        </div>
        <button
          type="button"
          className={[
            'shrink-0 cursor-pointer rounded-full px-2.5 py-1 text-[10px] font-semibold transition',
            isSelected
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-[0_2px_8px_rgba(16,185,129,0.12)]'
              : 'border border-[#b84f79] bg-[#fde9f2] text-[#7a2d4a] shadow-sm hover:border-[#9d3d5c] hover:bg-[#fcdcec] hover:text-[#5c2440]',
          ].join(' ')}
          onClick={() => {
            onSelect();
          }}
          aria-pressed={isSelected}
        >
          {isSelected ? copy.contactThreads.selectedContact : copy.contactThreads.useContactActionShort}
        </button>
      </div>

      {showInsightModal && insight && typeof document !== 'undefined'
        ? createPortal(
          <>
            <div
              className="fixed inset-0 z-[180] bg-slate-900/30 backdrop-blur-[2px]"
              onClick={() => setShowInsightModal(false)}
            />
            <div className="fixed inset-0 z-[181] flex items-center justify-center p-4">
              <section
                role="dialog"
                aria-modal="true"
                className="w-full max-w-[360px] rounded-[18px] border border-[#ead5df] bg-white p-4 shadow-[0_26px_66px_rgba(15,23,42,0.24)]"
                onClick={event => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-semibold text-slate-900">{copy.contactThreads.contactInsightsTitle}</p>
                  <button
                    type="button"
                    aria-label={copy.settings.cancel}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-[14px] leading-none text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                    onClick={() => setShowInsightModal(false)}
                  >
                    ×
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-[11px] border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[9px] uppercase tracking-[0.04em] text-slate-500">{copy.contactThreads.messagesFromCountLabel}</p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-800">{insight.inboundCount}</p>
                  </div>
                  <div className="rounded-[11px] border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[9px] uppercase tracking-[0.04em] text-slate-500">{copy.contactThreads.messagesToCountLabel}</p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-800">{insight.outboundCount}</p>
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-[11px] text-slate-600">
                  <p><span className="font-semibold text-slate-800">{copy.contactThreads.chatTypeLabel}:</span> {insight.chatTypes.length ? insight.chatTypes.join(', ') : '-'}</p>
                  <p><span className="font-semibold text-slate-800">{copy.contactThreads.lastReceivedLabel}:</span> {insight.lastInbound || copy.contactThreads.noLastReceived}</p>
                  <p><span className="font-semibold text-slate-800">{copy.contactThreads.lastSentLabel}:</span> {insight.lastOutbound || copy.contactThreads.noLastSent}</p>
                  <p><span className="font-semibold text-slate-800">{copy.contactThreads.callToActionLabel}:</span> {insight.actionLabel}</p>
                </div>
              </section>
            </div>
          </>,
          document.body,
        )
        : null}

      <div className="mt-3 flex w-full flex-col items-start gap-2">
        <button
          type="button"
          className="cursor-pointer rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-[#e7aac2] hover:text-[#b54e77]"
          onClick={() => onOpenChatHub(thread.id)}
        >
          {copy.contactThreads.chatHubPerContactAction}
        </button>
        {onSaveMemory ? (
          <ContactMemoryPanel
            contactId={thread.id}
            existing={thread.memoryProfile}
            copy={copy}
            onSave={onSaveMemory}
          />
        ) : null}
        {onAttachFiles && onRemoveUpload ? (
          <CompactUploadRow
            title={copy.contactThreads.companyFilesTitle}
            hint={copy.contactThreads.companyFilesHint}
            attachLabel={copy.floating.attachFiles}
            limitReachedLabel={copy.floating.uploadLimitReached}
            removalDialogCopy={{
              title: copy.floating.removeLastLearningFileTitle,
              body: copy.floating.removeLastLearningFileBody,
              confirm: copy.floating.removeLastLearningFileConfirm,
              keep: copy.floating.removeLastLearningFileKeep,
              remove: copy.floating.removeLastLearningFileAction,
              cancel: copy.settings.cancel,
            }}
            uploads={uploads}
            maxFiles={uploadMaxFiles}
            processing={uploadProcessing}
            error={uploadError}
            onAttach={files => onAttachFiles(thread.id, files)}
            onRemove={uploadId => onRemoveUpload(thread.id, uploadId)}
          />
        ) : null}
      </div>

      <SmartCapturePanel
        contactId={thread.id}
        contactName={thread.name}
        messages={thread.messages}
        copy={copy}
        onSaveInbound={onAddMessage}
        onSaveAndCompose={onSaveAndCompose}
      />

    </article>
  );
}
