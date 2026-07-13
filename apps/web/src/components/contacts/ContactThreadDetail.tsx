import type { ContactThread } from '../../config/contactThreads';
import type { AppTranslations } from '../../i18n/translations';
import SmartCapturePanel from './SmartCapturePanel';

type ContactThreadDetailProps = {
  thread: ContactThread;
  copy: AppTranslations;
  onBack: () => void;
  onRemove: () => void;
  onAddMessage: (contactId: string, text: string) => void;
  /** Opens unified chat context hub filtered to this contact */
  onOpenChatHub?: (contactId: string) => void;
};

export default function ContactThreadDetail({
  thread,
  copy,
  onBack,
  onRemove,
  onAddMessage,
  onOpenChatHub,
}: ContactThreadDetailProps) {
  return (
    <section className="space-y-3 rounded-[14px] border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <button
            type="button"
            className="text-[11px] font-medium text-slate-500 transition hover:text-slate-700"
            onClick={onBack}
          >
            {copy.miniScreen.back}
          </button>
          <p className="mt-1 text-[15px] font-semibold text-slate-900">{thread.name}</p>
          <p className="mt-1 text-[12px] text-slate-600">{thread.company || copy.contactThreads.unassigned}</p>
          <p className="mt-1 text-[12px] font-medium text-slate-500">
            {thread.messages.length} {copy.contactThreads.messagesLabel}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#f1c9d8] text-[15px] leading-none text-[#c45d86] transition hover:border-[#e7aac2] hover:text-[#b44f77]"
          aria-label={copy.contactThreads.removeContact}
          onClick={onRemove}
        >
          ×
        </button>
      </div>

      {onOpenChatHub ? (
        <button
          type="button"
          className="inline-flex rounded-full border border-[#efd8e2] bg-[#fff5f9] px-3 py-1.5 text-[11px] font-semibold text-[#b54e77] transition hover:border-[#e7aac2]"
          onClick={() => onOpenChatHub(thread.id)}
        >
          {copy.contactThreads.chatHubPerContactAction}
        </button>
      ) : null}

      <SmartCapturePanel
        contactId={thread.id}
        contactName={thread.name}
        messages={thread.messages}
        copy={copy}
        onSaveInbound={onAddMessage}
      />
    </section>
  );
}