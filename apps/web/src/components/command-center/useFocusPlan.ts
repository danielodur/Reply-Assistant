import { useCallback, useMemo, useState } from 'react';
import type { ContactThread } from '../../config/contactThreads';
import type { AppTranslations } from '../../i18n/translations';
import type { UploadContextSummary } from '../../uploads/uploadTypes';
import type { ActionInboxItem } from '../action-inbox/types';
import type { ContactPriority } from '../contacts/contactPriority';
import type { QueueTask, TodayQueueAction } from '../TodayQueue';
import type { OpenLoop } from '../follow-ups/detectOpenLoops';
import {
  buildFocusPlan,
  type FocusPlanItem,
  type PromiseCommitmentInput,
} from './focusPlan';

type UseFocusPlanParams = {
  copy: AppTranslations;
  // Signals
  contactWithFreshDraft: ContactThread | null;
  topActionInboxItem: ActionInboxItem | null;
  reviewUpload: UploadContextSummary | null;
  contactNeedingReply: ContactThread | null;
  selectedContactThread: ContactThread | null;
  selectedPriority: ContactPriority | null;
  openLoop: OpenLoop | null;
  contactThreads: ContactThread[];
  actionInboxPendingItems: ActionInboxItem[];
  uploadPool: UploadContextSummary[];
  todayTasks: QueueTask[];
  // Leaf handlers (all resolution lives here so FloatingAssistant stays lean)
  closePlan: () => void;
  openPendingDraft: (contact: ContactThread) => void;
  handleActionInboxDoNow: (item: ActionInboxItem) => void | Promise<void>;
  onReviewUpload: (upload: UploadContextSummary) => void;
  runSmartReply: (contact: ContactThread) => void;
  handleAskForContactDetail: (contact: ContactThread) => void;
  onFollowUpContact: (contactId: string, prompt: string) => void;
  handleTodayQueueAction: (action: TodayQueueAction) => void | Promise<void>;
  openContacts: () => void;
};

export type UseFocusPlanResult = {
  items: FocusPlanItem[];
  actionableCount: number;
  hasActionableWork: boolean;
  onRunItem: (item: FocusPlanItem) => void;
};

export function useFocusPlan(params: UseFocusPlanParams): UseFocusPlanResult {
  const {
    copy,
    contactWithFreshDraft,
    topActionInboxItem,
    reviewUpload,
    contactNeedingReply,
    selectedContactThread,
    selectedPriority,
    openLoop,
    contactThreads,
    actionInboxPendingItems,
    uploadPool,
    todayTasks,
    closePlan,
    openPendingDraft,
    handleActionInboxDoNow,
    onReviewUpload,
    runSmartReply,
    handleAskForContactDetail,
    onFollowUpContact,
    handleTodayQueueAction,
    openContacts,
  } = params;

  // Items the user has acted on this session leave the plan immediately so the
  // remaining count (and the header badge) decrement naturally. Keyed by item id
  // — which carries the work's timestamp — so genuinely new work reappears.
  const [handledIds, setHandledIds] = useState<Set<string>>(() => new Set());

  // One owed promise per contact, honouring dismissals.
  const promiseCommitments = useMemo((): PromiseCommitmentInput[] => {
    const result: PromiseCommitmentInput[] = [];
    for (const thread of contactThreads) {
      const dismissed = new Set(thread.dismissedCommitmentIds ?? []);
      const promise = (thread.openCommitments ?? []).find(
        commitment => commitment.kind === 'promise' && !dismissed.has(commitment.sourceMessageId),
      );
      if (!promise) continue;
      result.push({
        contactId: thread.id,
        contactName: thread.name,
        summary: promise.summary,
        sourceMessageId: promise.sourceMessageId,
      });
    }
    return result;
  }, [contactThreads]);

  const items = useMemo(
    () => buildFocusPlan({
      copy,
      contactWithFreshDraft,
      topActionInboxItem,
      reviewUpload,
      contactNeedingReply,
      selectedContactThread,
      selectedPriority,
      openLoop,
      todayTasks,
      promiseCommitments,
      handledIds,
    }),
    [
      contactNeedingReply,
      contactWithFreshDraft,
      copy,
      handledIds,
      openLoop,
      promiseCommitments,
      reviewUpload,
      selectedContactThread,
      selectedPriority,
      todayTasks,
      topActionInboxItem,
    ],
  );

  const actionableCount = useMemo(
    () => items.filter(item => item.source !== 'clear').length,
    [items],
  );

  const onRunItem = useCallback((item: FocusPlanItem) => {
    closePlan();
    const action = item.action;

    // Acting on real work marks it handled so it leaves the plan and the count drops.
    if (item.source !== 'clear') {
      setHandledIds(prev => {
        if (prev.has(item.id)) return prev;
        const next = new Set(prev);
        next.add(item.id);
        return next;
      });
    }

    switch (action.type) {
      case 'open-draft': {
        const contact = contactThreads.find(thread => thread.id === action.contactId);
        if (contact) openPendingDraft(contact);
        return;
      }
      case 'run-action-inbox-item': {
        const actionItem = actionInboxPendingItems.find(candidate => candidate.id === action.itemId);
        if (actionItem) void handleActionInboxDoNow(actionItem);
        return;
      }
      case 'review-upload': {
        const upload = uploadPool.find(candidate => candidate.id === action.uploadId);
        if (upload) onReviewUpload(upload);
        return;
      }
      case 'reply-contact': {
        const contact = contactThreads.find(thread => thread.id === action.contactId);
        if (contact) runSmartReply(contact);
        return;
      }
      case 'add-detail': {
        const contact = contactThreads.find(thread => thread.id === action.contactId);
        if (contact) handleAskForContactDetail(contact);
        return;
      }
      case 'follow-up-contact': {
        onFollowUpContact(action.contactId, action.prompt);
        return;
      }
      case 'run-today-task': {
        const task = todayTasks.find(candidate => candidate.id === action.taskId);
        if (task) void handleTodayQueueAction(task.action);
        return;
      }
      case 'review-contacts':
      default:
        openContacts();
    }
  }, [
    actionInboxPendingItems,
    closePlan,
    contactThreads,
    handleActionInboxDoNow,
    handleAskForContactDetail,
    handleTodayQueueAction,
    onFollowUpContact,
    onReviewUpload,
    openContacts,
    openPendingDraft,
    runSmartReply,
    todayTasks,
    uploadPool,
  ]);

  return {
    items,
    actionableCount,
    hasActionableWork: actionableCount > 0,
    onRunItem,
  };
}
