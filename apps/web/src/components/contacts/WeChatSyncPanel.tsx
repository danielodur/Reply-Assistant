import { useEffect, useMemo, useState } from 'react';
import type { ContactThread } from '../../config/contactThreads';
import type { AppTranslations } from '../../i18n/translations';
import type { EmailSyncUpdate } from './emailSyncTypes';
import { loadSyncDraft, saveSyncDraft } from './syncFormStorage';
import { requestWeChatSync } from './weChatSyncApi';

type WeChatSyncPanelProps = {
  copy: AppTranslations;
  contacts: ContactThread[];
  preferredTargetContactId?: string | null;
  onApplyUpdates: (updates: EmailSyncUpdate[]) => void;
};

type WeChatDraft = {
  workspaceId: string;
  syncCode: string;
  targetContactId: string;
};

const STORAGE_KEY = 'replyAssistantSync_wechat';

function loadDraft(): WeChatDraft {
  const stored = loadSyncDraft<Record<string, unknown>>(STORAGE_KEY, {});
  return {
    workspaceId: typeof stored.workspaceId === 'string' ? stored.workspaceId : '',
    syncCode: typeof stored.syncCode === 'string' ? stored.syncCode : '',
    targetContactId: typeof stored.targetContactId === 'string' ? stored.targetContactId : '',
  };
}

export default function WeChatSyncPanel({
  copy,
  contacts,
  preferredTargetContactId,
  onApplyUpdates,
}: WeChatSyncPanelProps) {
  const initialDraft = useMemo(loadDraft, []);
  const contactsWithIdentity = useMemo(
    () => contacts.filter(contact => Boolean(contact.id && contact.name.trim())),
    [contacts],
  );

  const [workspaceId, setWorkspaceId] = useState(initialDraft.workspaceId);
  const [syncCode, setSyncCode] = useState(initialDraft.syncCode);
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
    saveSyncDraft<WeChatDraft>(STORAGE_KEY, {
      workspaceId,
      syncCode,
      targetContactId,
    });
  }, [workspaceId, syncCode, targetContactId]);

  const buttonDisabled = isSyncing || !workspaceId.trim() || !syncCode.trim() || !targetContactId;
  const selectedContact = contactsWithIdentity.find(contact => contact.id === targetContactId);

  async function handleSync() {
    const id = workspaceId.trim();
    if (!id) {
      setError(copy.contactThreads.weChatWorkspaceIdRequired);
      setStatus('');
      return;
    }

    if (!targetContactId) {
      setError(copy.contactThreads.socialSyncTargetRequired);
      setStatus('');
      return;
    }

    if (!syncCode.trim()) {
      setError(copy.contactThreads.weChatSyncCodeRequired);
      setStatus('');
      return;
    }

    setIsSyncing(true);
    setError('');
    setStatus('');

    try {
      const result = await requestWeChatSync({
        syncConfig: {
          workspaceId: id,
          syncCode: syncCode.trim(),
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
      {/* No public API warning */}
      <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-[10px] leading-5 text-amber-800">
        <p className="font-semibold">{copy.contactThreads.weChatNoApiTitle}</p>
        <p className="mt-0.5">{copy.contactThreads.weChatNoApiBody}</p>
      </div>

      {/* Paste workaround */}
      <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[10px] leading-5 text-emerald-800">
        <p className="font-semibold">{copy.contactThreads.weChatPasteTitle}</p>
        <p className="mt-0.5">{copy.contactThreads.weChatPasteBody}</p>
      </div>

      {/* WeChat Work divider */}
      <p className="pt-1 text-[10px] font-semibold text-slate-500">{copy.contactThreads.weChatWorkSectionTitle}</p>
      <p className="text-[10px] leading-4 text-slate-400">{copy.contactThreads.weChatWorkSectionBody}</p>

      <p className="text-[10px] leading-5 text-slate-500">
        {copy.contactThreads.weChatSyncHint}
      </p>

      <input
        type="text"
        disabled={isSyncing}
        value={workspaceId}
        onChange={event => setWorkspaceId(event.currentTarget.value)}
        placeholder={copy.contactThreads.weChatWorkspaceIdPlaceholder}
        className="w-full rounded-[10px] border border-[#edd7e0] bg-white px-3 py-2 text-[11px] text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
      />

      <input
        type="password"
        disabled={isSyncing}
        value={syncCode}
        onChange={event => setSyncCode(event.currentTarget.value)}
        placeholder={copy.contactThreads.weChatSyncCodePlaceholder}
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
        {isSyncing ? copy.contactThreads.emailSyncRunning : copy.contactThreads.weChatSyncAction}
      </button>

      <p className="text-[10px] text-slate-500">
        {copy.contactThreads.socialSyncWebhookEndpoint} <span className="font-medium text-slate-600">{copy.contactThreads.weChatWebhookPath}</span>
      </p>

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
