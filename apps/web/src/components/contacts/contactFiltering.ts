import type { ContactThread } from '../../config/contactThreads';
import type { RecipientProfile, WorkMode } from '../workbench/types';

/**
 * Work mode the app must use while this contact is selected so filters/picker stay consistent.
 * Call this whenever the user (or bootstrap) selects a contact—never drop the selection when
 * the current mode differs; switch the mode instead.
 */
export function requiredWorkModeForContact(thread: ContactThread): WorkMode {
  return thread.stage === 'internal' ? 'internal' : 'reply';
}

export function isContactCompatibleWithMode(thread: ContactThread, workMode: WorkMode): boolean {
  return workMode === 'internal' ? thread.stage === 'internal' : thread.stage !== 'internal';
}

export function getModeFilteredThreads(threads: ContactThread[], workMode: WorkMode): ContactThread[] {
  return threads.filter(thread => isContactCompatibleWithMode(thread, workMode));
}

export function matchesRecipientContext(
  thread: ContactThread,
  workMode: WorkMode,
  recipientProfile: RecipientProfile,
): boolean {
  const hasMatchingHistory = thread.replies.some(reply => reply.mode === workMode && reply.recipient === recipientProfile);

  if (workMode === 'internal') {
    const hasInternalHistory = thread.replies.some(reply => reply.mode === 'internal');
    return hasMatchingHistory || !hasInternalHistory;
  }

  if (recipientProfile === 'new-lead') {
    return thread.stage === 'new-lead' || hasMatchingHistory;
  }

  if (recipientProfile === 'existing-client') {
    return thread.stage === 'active-client' || thread.stage === 'follow-up' || thread.stage === 'closed' || hasMatchingHistory;
  }

  if (recipientProfile === 'vip-client') {
    const vipHaystack = [thread.name, thread.company, thread.notes].join(' ').toLowerCase();
    return thread.stage === 'vip-client' || hasMatchingHistory || vipHaystack.includes('vip');
  }

  return hasMatchingHistory;
}