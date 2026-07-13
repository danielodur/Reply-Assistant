import type { ContactThread } from '../../config/contactThreads';
import type { AppTranslations } from '../../i18n/translations';
import EmailSyncPanel from './EmailSyncPanel';
import type { EmailSyncUpdate } from './emailSyncTypes';
import DingTalkSyncPanel from './DingTalkSyncPanel';
import WeChatSyncPanel from './WeChatSyncPanel';
import WhatsAppSyncPanel from './WhatsAppSyncPanel';
import TelegramSyncPanel from './TelegramSyncPanel';
import SyncPanelErrorBoundary from './SyncPanelErrorBoundary';
import { getSyncServerTitle, normalizeSyncServer, type SyncServer } from './syncServerMeta';

type SyncServerModalProps = {
  open: boolean;
  copy: AppTranslations;
  contacts: ContactThread[];
  preferredTargetContactId?: string | null;
  initialServer: SyncServer;
  onClose: () => void;
  onApplyUpdates: (updates: EmailSyncUpdate[]) => void;
};

export default function SyncServerModal({
  open,
  copy,
  contacts,
  preferredTargetContactId,
  initialServer,
  onClose,
  onApplyUpdates,
}: SyncServerModalProps) {
  if (!open) {
    return null;
  }

  const safeServer = normalizeSyncServer(initialServer);

  const panel = (() => {
    if (safeServer === 'email') {
      return (
        <EmailSyncPanel
          copy={copy}
          contacts={contacts}
          onApplyUpdates={onApplyUpdates}
          embedded
        />
      );
    }

    if (safeServer === 'dingtalk') {
      return (
        <DingTalkSyncPanel
          copy={copy}
          contacts={contacts}
          preferredTargetContactId={preferredTargetContactId}
          onApplyUpdates={onApplyUpdates}
        />
      );
    }

    if (safeServer === 'wechat') {
      return (
        <WeChatSyncPanel
          copy={copy}
          contacts={contacts}
          preferredTargetContactId={preferredTargetContactId}
          onApplyUpdates={onApplyUpdates}
        />
      );
    }

    if (safeServer === 'whatsapp') {
      return (
        <WhatsAppSyncPanel
          copy={copy}
          contacts={contacts}
          preferredTargetContactId={preferredTargetContactId}
          onApplyUpdates={onApplyUpdates}
        />
      );
    }

    return (
      <TelegramSyncPanel
        copy={copy}
        contacts={contacts}
        preferredTargetContactId={preferredTargetContactId}
        onApplyUpdates={onApplyUpdates}
      />
    );
  })();

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#0f172a]/25 px-3 backdrop-blur-[3px]">
      <section className="w-full max-w-[332px] rounded-[16px] border border-[#f0dbe3] bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.20)]">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-slate-900">{getSyncServerTitle(copy, safeServer)}</p>
          <button
            type="button"
            aria-label={copy.settings.cancel}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#edd7e0] text-[14px] leading-none text-slate-500 transition hover:border-[#e7aac2] hover:text-[#c15480]"
            onClick={onClose}
          >
            x
          </button>
        </div>

        <div className="mt-3 max-h-[360px] clean-scrollbar overflow-y-auto rounded-[12px] border border-[#f0dbe3] bg-[#fffafb] p-3">
          <SyncPanelErrorBoundary
            fallbackTitle={copy.contactThreads.socialSyncGenericFailed}
            fallbackBody={copy.contactThreads.syncServerComingSoonBody}
          >
            {panel}
          </SyncPanelErrorBoundary>
        </div>
      </section>
    </div>
  );
}
