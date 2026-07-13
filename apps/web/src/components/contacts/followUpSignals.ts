import type { ContactMessageEntry, ContactThread } from '../../config/contactThreads';

export type ContactFollowUpSignal = {
  status: 'none' | 'waiting-on-you' | 'waiting-on-them';
  ageDays: number;
  summary?: string;
};

function sortMessages(messages: ContactMessageEntry[]): ContactMessageEntry[] {
  return [...messages].sort((a, b) => b.createdAt - a.createdAt);
}

function getAgeDays(timestamp: number): number {
  return Math.max(1, Math.floor((Date.now() - timestamp) / 86400000));
}

export function deriveContactFollowUpSignal(thread: ContactThread): ContactFollowUpSignal {
  const messages = sortMessages(thread.messages);
  if (!messages.length) {
    return { status: 'none', ageDays: 0 };
  }

  const latestMessage = messages[0];
  if (latestMessage.followUpKind === 'needs-reply') {
    return {
      status: 'waiting-on-you',
      ageDays: getAgeDays(latestMessage.createdAt),
      summary: latestMessage.followUpSummary || latestMessage.summary,
    };
  }

  if (latestMessage.followUpKind === 'promise') {
    return {
      status: 'waiting-on-them',
      ageDays: getAgeDays(latestMessage.createdAt),
      summary: latestMessage.followUpSummary || latestMessage.summary,
    };
  }

  return { status: 'none', ageDays: 0 };
}