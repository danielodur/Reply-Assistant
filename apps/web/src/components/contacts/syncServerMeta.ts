import type { AppTranslations } from '../../i18n/translations';

export type SyncServer = 'email' | 'dingtalk' | 'wechat' | 'whatsapp' | 'telegram';

const VALID_SYNC_SERVERS: SyncServer[] = ['email', 'dingtalk', 'wechat', 'whatsapp', 'telegram'];

export function isSyncServer(value: unknown): value is SyncServer {
  return typeof value === 'string' && VALID_SYNC_SERVERS.includes(value as SyncServer);
}

export function normalizeSyncServer(value: unknown): SyncServer {
  return isSyncServer(value) ? value : 'email';
}

export function getSyncServerLabel(copy: AppTranslations, id: SyncServer): string {
  if (id === 'email') return copy.contactThreads.syncServerEmail;
  if (id === 'dingtalk') return copy.contactThreads.syncServerDingTalk;
  if (id === 'wechat') return copy.contactThreads.syncServerWeChat;
  if (id === 'whatsapp') return copy.contactThreads.syncServerWhatsApp;
  return copy.contactThreads.syncServerTelegram;
}

export function getSyncServerTitle(copy: AppTranslations, id: SyncServer): string {
  const label = getSyncServerLabel(copy, id);
  const zh = copy.contactThreads.emailSyncTitle.includes('连接');
  return zh ? `连接${label}` : `Connect ${label}`;
}
