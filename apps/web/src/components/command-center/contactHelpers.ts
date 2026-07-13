import type { ContactThread } from '../../config/contactThreads';

export function getLatestInboundText(thread: ContactThread): string {
  const latestInbound = thread.messages
    .filter(message => message.direction === 'inbound')
    .sort((a, b) => b.createdAt - a.createdAt)[0];

  return (latestInbound?.text || latestInbound?.summary || '').trim();
}
