import { useEffect, useMemo, useState } from 'react';
import type { ContactThread } from '../../config/contactThreads';
import type { AppTranslations } from '../../i18n/translations';
import type { EmailSyncUpdate } from './emailSyncTypes';
import { loadSyncDraft, saveSyncDraft } from './syncFormStorage';
import { requestTelegramSync } from './telegramSyncApi';

type TelegramSyncPanelProps = {
  copy: AppTranslations;
  contacts: ContactThread[];
  preferredTargetContactId?: string | null;
  onApplyUpdates: (updates: EmailSyncUpdate[]) => void;
};

type TelegramDraft = {
  botToken: string;
  chatId: string;
  targetContactId: string;
};

const STORAGE_KEY = 'replyAssistantSync_telegram';

function loadDraft(): TelegramDraft {
  const stored = loadSyncDraft<Record<string, unknown>>(STORAGE_KEY, {});
  return {
    botToken: typeof stored.botToken === 'string' ? stored.botToken : '',
    chatId: typeof stored.chatId === 'string' ? stored.chatId : '',
    targetContactId: typeof stored.targetContactId === 'string' ? stored.targetContactId : '',
  };
}

export default function TelegramSyncPanel({
  copy,
  contacts,
  preferredTargetContactId,
  onApplyUpdates,
}: TelegramSyncPanelProps) {
  const initialDraft = useMemo(loadDraft, []);
  const contactsWithIdentity = useMemo(
    () => contacts.filter(contact => Boolean(contact.id && contact.name.trim())),
    [contacts],
  );

  const [botToken, setBotToken] = useState(initialDraft.botToken);
  const [chatId, setChatId] = useState(initialDraft.chatId);
  const [targetContactId, setTargetContactId] = useState(
    initialDraft.targetContactId || contactsWithIdentity[0]?.id || '',
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!contactsWithIdentity.length) {
      if (targetContactId) setTargetContactId('');
      return;
    }

    const preferred =
      preferredTargetContactId && contactsWithIdentity.some(contact => contact.id === preferredTargetContactId)
        ? preferredTargetContactId
        : '';
    const currentValid = contactsWithIdentity.some(contact => contact.id === targetContactId);
    const nextTarget = preferred || (currentValid ? targetContactId : contactsWithIdentity[0].id);

    if (nextTarget !== targetContactId) {
      setTargetContactId(nextTarget);
    }
  }, [preferredTargetContactId, targetContactId, contactsWithIdentity]);

  useEffect(() => {
    saveSyncDraft<TelegramDraft>(STORAGE_KEY, {
      botToken,
      chatId,
      targetContactId,
    });
  }, [botToken, chatId, targetContactId]);

  const buttonDisabled = isSyncing || !botToken.trim() || !targetContactId;

  const selectedContact = contactsWithIdentity.find(contact => contact.id === targetContactId);

  async function handleSync() {
    const token = botToken.trim();
    if (!token) {
      setError(copy.contactThreads.telegramBotTokenRequired);
      setStatus('');
      return;
    }

    if (!targetContactId) {
      setError(copy.contactThreads.socialSyncTargetRequired);
      setStatus('');
      return;
    }

    setIsSyncing(true);
    setError('');
    setStatus('');

    try {
      const result = await requestTelegramSync({
        syncConfig: {
          botToken: token,
          chatId: chatId.trim() || undefined,
          maxMessages: 40,
        },
        contacts,
        targetContactId,
      });

      onApplyUpdates(result.updates);
      setStatus(copy.contactThreads.socialSyncSummary
        .replace('{contacts}', String(result.summary.updatedContacts))
        .replace('{messages}', String(result.summary.matchedMessages)));
    } catch (syncError) {
      setError(copy.contactThreads.socialSyncGenericFailed);
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] leading-5 text-slate-500">
        {copy.contactThreads.telegramSyncHint}
      </p>

      <input
        type="password"
        disabled={isSyncing}
        value={botToken}
        onChange={event => setBotToken(event.currentTarget.value)}
        placeholder={copy.contactThreads.telegramBotTokenPlaceholder}
        className="w-full rounded-[10px] border border-[#edd7e0] bg-white px-3 py-2 text-[11px] text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
      />

      <input
        type="text"
        disabled={isSyncing}
        value={chatId}
        onChange={event => setChatId(event.currentTarget.value)}
        placeholder={copy.contactThreads.telegramChatIdPlaceholder}
        className="w-full rounded-[10px] border border-[#edd7e0] bg-white px-3 py-2 text-[11px] text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
      />

      {contactsWithIdentity.length === 0 ? (
        <p className="rounded-[8px] border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] text-amber-700">
          {copy.contactThreads.socialSyncNoContacts}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleSync}
        disabled={buttonDisabled}
        className={`w-full rounded-full px-4 py-2 text-[11px] font-semibold text-white transition ${buttonDisabled
          ? 'cursor-not-allowed bg-[#E85C8B]/60'
          : 'bg-[#E85C8B] hover:bg-[#d94f81]'
        }`}
      >
        {isSyncing ? copy.contactThreads.emailSyncRunning : copy.contactThreads.telegramSyncAction}
      </button>

      {selectedContact ? (
        <p className="text-[10px] text-slate-500">
          {copy.contactThreads.socialSyncTargetContact.replace('{name}', selectedContact.name)}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-[8px] border border-rose-200 bg-rose-50 px-2.5 py-2 text-[10px] text-rose-700">
          {error}
        </p>
      ) : null}

      {status ? (
        <p className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-[10px] text-emerald-700">
          {status}
        </p>
      ) : null}
    </div>
  );
}
