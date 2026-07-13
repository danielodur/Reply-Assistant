import type { ContactThread } from '../../config/contactThreads';
import { getLatestInboundText } from '../command-center/contactHelpers';

export type SmartReplyMode = 'open-draft' | 'generate-from-inbound' | 'unavailable';

/**
 * What can Smart Reply do for this contact, *right now*?
 *
 * - 'open-draft': a fresh background-generated draft is waiting; one tap opens it.
 * - 'generate-from-inbound': we have their latest inbound but no draft yet; one
 *   tap pulls the inbound + memory and generates.
 * - 'unavailable': no inbound and no draft — Smart Reply has nothing to lean on.
 */
export function canSmartReply(thread: ContactThread): SmartReplyMode {
  if (thread.pendingDraft && thread.pendingDraft.message.trim().length > 0) {
    return 'open-draft';
  }
  if (getLatestInboundText(thread).length > 0) {
    return 'generate-from-inbound';
  }
  return 'unavailable';
}

export function isSmartReplyAvailable(thread: ContactThread): boolean {
  return canSmartReply(thread) !== 'unavailable';
}
