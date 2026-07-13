import { buildContactMessageEntry, type ContactMessageEntry } from './contactThreads';

export type SyncedContactMessage = {
  externalId?: string;
  direction: 'inbound' | 'outbound';
  source: 'email-sync';
  text: string;
  summary?: string;
  sentAt: string;
  sender?: string;
  receiver?: string;
};

function toTimestamp(iso: string): number {
  const value = new Date(iso).getTime();
  if (!Number.isFinite(value)) return Date.now();
  return value;
}

function toKey(message: ContactMessageEntry): string {
  return [
    message.direction,
    message.source,
    message.createdAt,
    message.text.trim().toLowerCase(),
  ].join('|');
}

export function mergeSyncedMessages(
  existingMessages: ContactMessageEntry[],
  syncedMessages: SyncedContactMessage[],
): ContactMessageEntry[] {
  if (!syncedMessages.length) return existingMessages;

  const existingKeys = new Set(existingMessages.map(toKey));
  const additions: ContactMessageEntry[] = [];

  syncedMessages.forEach(item => {
    const next = buildContactMessageEntry({
      direction: item.direction,
      source: 'email-sync',
      text: item.summary?.trim() || item.text,
      sender: item.sender,
      receiver: item.receiver,
      createdAt: toTimestamp(item.sentAt),
    });

    const key = toKey(next);
    if (!existingKeys.has(key)) {
      existingKeys.add(key);
      additions.push(next);
    }
  });

  return [...additions, ...existingMessages]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 30);
}
