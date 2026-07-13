import type { ContactThread } from '../../config/contactThreads';
import type { UploadContextSummary } from '../../uploads/uploadTypes';
import type { ActionInboxItem } from '../action-inbox/types';
import type { ContactPriority } from '../contacts/contactPriority';

/**
 * Single source of truth for the shared "what to do next" head tiers.
 *
 * Both the Daily Brief card (`buildWorkbenchRecommendation`) and Focus Plan
 * (`buildFocusPlan`) rank these six signals in the same order, so their top
 * item can never silently disagree. Each surface maps the result into its own
 * shape and appends its own tail (Daily Brief → active-contact/add-contact/clear;
 * Focus Plan → promise/open-loop/today-queue).
 */
export type HeadSignalKind =
  | 'draft'
  | 'action-inbox'
  | 'review-file'
  | 'reply-now'
  | 'add-detail'
  | 'follow-up';

export type HeadSignal =
  | { kind: 'draft'; contact: ContactThread }
  | { kind: 'action-inbox'; actionItem: ActionInboxItem }
  | { kind: 'review-file'; upload: UploadContextSummary }
  | { kind: 'reply-now'; contact: ContactThread }
  | { kind: 'add-detail'; contact: ContactThread; priority: ContactPriority }
  | { kind: 'follow-up'; contact: ContactThread; priority: ContactPriority };

export type CollectHeadWorkSignalsInput = {
  contactWithFreshDraft: ContactThread | null;
  topActionInboxItem: ActionInboxItem | null;
  reviewUpload: UploadContextSummary | null;
  contactNeedingReply: ContactThread | null;
  selectedContactThread: ContactThread | null;
  selectedPriority: ContactPriority | null;
};

/** The shared head tiers in priority order. Empty when no head work is pending. */
export function collectHeadWorkSignals(input: CollectHeadWorkSignalsInput): HeadSignal[] {
  const {
    contactWithFreshDraft,
    topActionInboxItem,
    reviewUpload,
    contactNeedingReply,
    selectedContactThread,
    selectedPriority,
  } = input;
  const signals: HeadSignal[] = [];

  if (contactWithFreshDraft?.pendingDraft) {
    signals.push({ kind: 'draft', contact: contactWithFreshDraft });
  }
  if (topActionInboxItem) {
    signals.push({ kind: 'action-inbox', actionItem: topActionInboxItem });
  }
  if (reviewUpload) {
    signals.push({ kind: 'review-file', upload: reviewUpload });
  }
  if (contactNeedingReply) {
    signals.push({ kind: 'reply-now', contact: contactNeedingReply });
  }
  if (selectedContactThread && selectedPriority?.status === 'missing-context') {
    signals.push({ kind: 'add-detail', contact: selectedContactThread, priority: selectedPriority });
  }
  if (selectedContactThread && selectedPriority?.suggestedAction === 'follow-up') {
    signals.push({ kind: 'follow-up', contact: selectedContactThread, priority: selectedPriority });
  }

  return signals;
}

/** Head tiers that outrank a Focus-Plan promise (a promise sits just below these). */
export const PROMISE_UPPER_KINDS: ReadonlySet<HeadSignalKind> = new Set<HeadSignalKind>([
  'draft',
  'action-inbox',
  'review-file',
  'reply-now',
]);
