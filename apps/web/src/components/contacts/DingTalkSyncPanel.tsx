import { useEffect, useMemo, useState } from 'react';
import type { ContactThread } from '../../config/contactThreads';
import type { AppTranslations } from '../../i18n/translations';
import type { EmailSyncUpdate } from './emailSyncTypes';
import { loadSyncDraft, saveSyncDraft } from './syncFormStorage';
import { requestDingTalkSync } from './dingTalkSyncApi';

type DingTalkSyncPanelProps = {
  copy: AppTranslations;
  contacts: ContactThread[];
  preferredTargetContactId?: string | null;
  onApplyUpdates: (updates: EmailSyncUpdate[]) => void;
};

type DingTalkDraft = {
  appKey: string;
  syncCode: string;
  targetContactId: string;
};

const STORAGE_KEY = 'replyAssistantSync_dingtalk';
const CONNECTED_STORAGE_KEY = 'replyAssistantConnected_dingtalk';

type StoredDingTalkConnection = {
  appKey: string;
  targetContactId: string;
  lastSyncedAt: string;
};

function loadDraft(): DingTalkDraft {
  const stored = loadSyncDraft<Record<string, unknown>>(STORAGE_KEY, {});
  return {
    appKey: typeof stored.appKey === 'string' ? stored.appKey : '',
    syncCode: typeof stored.syncCode === 'string' ? stored.syncCode : '',
    targetContactId: typeof stored.targetContactId === 'string' ? stored.targetContactId : '',
  };
}

function loadConnectedDraft(): StoredDingTalkConnection | null {
  const stored = loadSyncDraft<Record<string, unknown> | null>(CONNECTED_STORAGE_KEY, null);
  if (!stored || typeof stored !== 'object') return null;

  const appKey = typeof stored.appKey === 'string' ? stored.appKey : '';
  const targetContactId = typeof stored.targetContactId === 'string' ? stored.targetContactId : '';
  const lastSyncedAt = typeof stored.lastSyncedAt === 'string' ? stored.lastSyncedAt : '';

  if (!appKey.trim()) return null;

  return {
    appKey,
    targetContactId,
    lastSyncedAt,
  };
}

export default function DingTalkSyncPanel({
  copy,
  contacts,
  preferredTargetContactId,
  onApplyUpdates,
}: DingTalkSyncPanelProps) {
  const initialDraft = useMemo(loadDraft, []);
  const initialConnected = useMemo(loadConnectedDraft, []);
  const contactsWithIdentity = useMemo(
    () => contacts.filter(contact => Boolean(contact.id && contact.name.trim())),
    [contacts],
  );

  const [appKey, setAppKey] = useState(initialDraft.appKey);
  const [syncCode, setSyncCode] = useState(initialDraft.syncCode);
  const [targetContactId, setTargetContactId] = useState(
    initialDraft.targetContactId || contactsWithIdentity[0]?.id || '',
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [connectedDraft, setConnectedDraft] = useState<StoredDingTalkConnection | null>(initialConnected);

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
    saveSyncDraft<DingTalkDraft>(STORAGE_KEY, {
      appKey,
      syncCode,
      targetContactId,
    });
  }, [appKey, syncCode, targetContactId]);

  const buttonDisabled = isSyncing || !appKey.trim() || !syncCode.trim() || !targetContactId;
  const selectedContact = contactsWithIdentity.find(contact => contact.id === targetContactId);

  async function handleSync() {
    const key = appKey.trim();
    if (!key) {
      setError(copy.contactThreads.dingTalkAppKeyRequired);
      setStatus('');
      return;
    }

    if (!targetContactId) {
      setError(copy.contactThreads.socialSyncTargetRequired);
      setStatus('');
      return;
    }

    if (!syncCode.trim()) {
      setError(copy.contactThreads.dingTalkSyncCodeRequired);
      setStatus('');
      return;
    }

    setIsSyncing(true);
    setError('');
    setStatus('');

    try {
      const result = await requestDingTalkSync({
        syncConfig: {
          appKey: key,
          syncCode: syncCode.trim(),
          maxMessages: 40,
        },
        contacts,
        targetContactId,
      });

      onApplyUpdates(result.updates);
      const nextConnected = {
        appKey: key,
        targetContactId,
        lastSyncedAt: new Date().toISOString(),
      };
      saveSyncDraft(CONNECTED_STORAGE_KEY, nextConnected);
      setConnectedDraft(nextConnected);
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
        {copy.contactThreads.dingTalkSyncHint}
      </p>

      {connectedDraft ? (
        <p className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-[10px] text-emerald-700">
          {copy.contactThreads.dingTalkConnectedHint.replace('{appKey}', connectedDraft.appKey)}
        </p>
      ) : null}

      <input
        type="text"
        disabled={isSyncing}
        value={appKey}
        onChange={event => setAppKey(event.currentTarget.value)}
        placeholder={copy.contactThreads.dingTalkAppKeyPlaceholder}
        className="w-full rounded-[10px] border border-[#edd7e0] bg-white px-3 py-2 text-[11px] text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
      />

      <input
        type="password"
        disabled={isSyncing}
        value={syncCode}
        onChange={event => setSyncCode(event.currentTarget.value)}
        placeholder={copy.contactThreads.dingTalkSyncCodePlaceholder}
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
        {isSyncing ? copy.contactThreads.emailSyncRunning : copy.contactThreads.dingTalkSyncAction}
      </button>

      <p className="text-[10px] text-slate-500">
        {copy.contactThreads.socialSyncWebhookEndpoint} <span className="font-medium text-slate-600">{copy.contactThreads.dingTalkWebhookPath}</span>
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
