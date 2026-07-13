import type { ContactThread } from '../../config/contactThreads';
import type { UploadContextSummary } from '../../uploads/uploadTypes';
import type { ActionInboxItem } from '../action-inbox/types';
import type { ContactPriority } from '../contacts/contactPriority';
import { collectHeadWorkSignals } from './leadWorkSignal';

export type WorkbenchRecommendationKind =
  | 'draft-ready'
  | 'do-action'
  | 'review-file'
  | 'reply-now'
  | 'add-detail'
  | 'follow-up'
  | 'active-contact'
  | 'add-contact'
  | 'clear';

export type WorkbenchRecommendation = {
  kind: WorkbenchRecommendationKind;
  contact?: ContactThread;
  priority?: ContactPriority;
  actionItem?: ActionInboxItem;
  upload?: UploadContextSummary;
};

export type BuildWorkbenchRecommendationInput = {
  contactThreads: ContactThread[];
  contactPriorityRows: Array<{ thread: ContactThread; priority: ContactPriority }>;
  selectedContactThread: ContactThread | null;
  topActionInboxItem: ActionInboxItem | null;
  contactWithFreshDraft: ContactThread | null;
  reviewUpload: UploadContextSummary | null;
};

export function findUploadNeedingReview(uploads: UploadContextSummary[]): UploadContextSummary | null {
  return uploads.find(upload => (
    upload.status === 'needs-review'
    || (upload.status === 'ready' && upload.confidence > 0 && upload.confidence < 0.85)
  )) ?? null;
}

export function buildWorkbenchRecommendation(input: BuildWorkbenchRecommendationInput): WorkbenchRecommendation {
  const {
    contactThreads,
    contactPriorityRows,
    selectedContactThread,
    topActionInboxItem,
    contactWithFreshDraft,
    reviewUpload,
  } = input;

  const contactNeedingReplyRow = contactPriorityRows.find(row => row.priority.nextActionIntent === 'reply') ?? null;
  const selectedPriority = selectedContactThread
    ? contactPriorityRows.find(row => row.thread.id === selectedContactThread.id)?.priority ?? null
    : null;

  // Shared head tiers — kept in lockstep with Focus Plan via collectHeadWorkSignals.
  const [lead] = collectHeadWorkSignals({
    contactWithFreshDraft,
    topActionInboxItem,
    reviewUpload,
    contactNeedingReply: contactNeedingReplyRow?.thread ?? null,
    selectedContactThread,
    selectedPriority,
  });

  if (lead) {
    switch (lead.kind) {
      case 'draft':
        return { kind: 'draft-ready', contact: lead.contact };
      case 'action-inbox':
        return { kind: 'do-action', actionItem: lead.actionItem };
      case 'review-file':
        return { kind: 'review-file', upload: lead.upload };
      case 'reply-now':
        return {
          kind: 'reply-now',
          contact: lead.contact,
          priority: contactNeedingReplyRow?.priority,
        };
      case 'add-detail':
        return { kind: 'add-detail', contact: lead.contact, priority: lead.priority };
      case 'follow-up':
        return { kind: 'follow-up', contact: lead.contact, priority: lead.priority };
    }
  }

  if (selectedContactThread) {
    return { kind: 'active-contact', contact: selectedContactThread, priority: selectedPriority ?? undefined };
  }

  if (contactThreads.length === 0) {
    return { kind: 'add-contact' };
  }

  return { kind: 'clear' };
}
