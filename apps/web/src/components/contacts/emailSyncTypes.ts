import type { ContactThread } from '../../config/contactThreads';

export type EmailSyncProvider = 'imap' | 'gmail-oauth' | 'microsoft-oauth';

export type EmailSyncConfig = {
  provider: EmailSyncProvider;
  host?: string;
  port?: number;
  secure?: boolean;
  username: string;
  password?: string;
  accessToken?: string;
  oauthUserEmail?: string;
  mailbox?: string;
  sinceDays?: number;
  maxMessages?: number;
};

export type EmailSyncUpdate = {
  contactId: string;
  chatContext: string;
  matchedMessages: number;
  lastSyncedAt: string;
  syncedMessages?: Array<{
    externalId?: string;
    direction: 'inbound' | 'outbound';
    source: 'email-sync';
    text: string;
    summary?: string;
    sentAt: string;
    sender?: string;
    receiver?: string;
  }>;
};

export type EmailSyncSummary = {
  fetchedMessages: number;
  matchedMessages: number;
  updatedContacts: number;
};

export type EmailSyncResponse = {
  ok: boolean;
  error?: string;
  updates: EmailSyncUpdate[];
  summary: EmailSyncSummary;
};

export function isEmailSyncResponse(data: unknown): data is EmailSyncResponse {
  if (!data || typeof data !== 'object') return false;
  const d = data as Partial<EmailSyncResponse>;
  return (
    d.ok === true &&
    Array.isArray(d.updates) &&
    d.summary !== null &&
    typeof d.summary === 'object'
  );
}

export type EmailSyncRequest = {
  syncConfig: EmailSyncConfig;
  contacts: ContactThread[];
};
