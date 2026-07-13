import { useCallback, useMemo } from 'react';
import type { ContactThread } from '../../config/contactThreads';
import { interpolate, type AppTranslations } from '../../i18n/translations';
import type { ActionInboxItem } from '../action-inbox/types';
import { buildContactPriority } from '../contacts/contactPriority';
import type { RecipientProfile, WorkMode } from '../workbench/types';
import type { ContactPriority } from '../contacts/contactPriority';
import type { UploadContextSummary } from '../../uploads/uploadTypes';
import { getLatestInboundText } from './contactHelpers';
import { formatRelativeAge } from './formatRelativeAge';
import type { CommandCenterPrimary } from './DailyBriefCard';
import {
  buildWorkbenchRecommendation,
  type WorkbenchRecommendation,
} from './workbenchRecommendation';

export type CommandCenterStats = {
  needsReply: number;
  waitingOnClient: number;
  recentCaptured: number;
  drafts: number;
};

type UseCommandCenterPrimaryParams = {
  contactThreads: ContactThread[];
  selectedContactThread: ContactThread | null;
  recentRepliesCount: number;
  composerEmpty: boolean;
  topActionInboxItem: ActionInboxItem | null;
  pendingActionInboxCount: number;
  copy: AppTranslations;
  applySelectedContactId: (contactId: string | null, thread?: ContactThread | null, workModeHint?: 'reply' | 'internal') => void;
  handleActionInboxDoNow: (item: ActionInboxItem) => void | Promise<void>;
  openMiniScreen: (screenId: import('../workbench/types').MiniScreenId) => void;
  setWorkMode: (mode: 'reply' | 'internal') => void;
  setRecipientProfileByMode: React.Dispatch<React.SetStateAction<Record<WorkMode, RecipientProfile>>>;
  setInput: (value: string) => void;
  setTextType: (value: string) => void;
  setLastCaptureSource: (value: 'paste' | 'typed' | null) => void;
  setContactMatchCandidates: (value: []) => void;
  setIsContactConfirmationNeeded: (value: boolean) => void;
  setIsActionCenterOpen: (value: boolean) => void;
  showHeaderStatusAlert: (label: string) => void;
  focusComposer: () => void;
  onDailyBriefCta?: (source: 'inbox' | 'needs-reply' | 'selected' | 'smart-reply' | 'draft-ready' | 'review-file' | 'add-detail' | 'follow-up' | 'clear') => void;
  /** When the Daily Brief should route through one-tap Smart Reply rather than filling the composer. */
  lazyMode?: boolean;
  /** Contact whose pendingDraft is ready (highest-priority signal when present). */
  contactWithFreshDraft?: ContactThread | null;
  /** Highest-priority upload that needs user review before confident drafting. */
  reviewUpload?: UploadContextSummary | null;
  onReviewUpload?: (upload: UploadContextSummary) => void;
  onAskForContactDetail?: (contact: ContactThread) => void;
  /** Trigger that runs Smart Reply / Open Draft for the supplied contact. */
  runSmartReply?: (contact: ContactThread) => void;
  /** First name shown on the empty-state Daily Brief for newly signed-in users. */
  welcomeFirstName?: string;
};

export type UseCommandCenterPrimaryResult = {
  contactPriorityRows: Array<{ thread: ContactThread; priority: ContactPriority }>;
  contactNeedingReply: ContactThread | null;
  commandCenterStats: CommandCenterStats;
  dailyBrief: CommandCenterPrimary | null;
  commandCenterPrimary: CommandCenterPrimary;
  hasDailyBrief: boolean;
};

export function useCommandCenterPrimary(params: UseCommandCenterPrimaryParams): UseCommandCenterPrimaryResult {
  const {
    contactThreads,
    selectedContactThread,
    recentRepliesCount,
    composerEmpty,
    topActionInboxItem,
    pendingActionInboxCount,
    copy,
    applySelectedContactId,
    handleActionInboxDoNow,
    openMiniScreen,
    setWorkMode,
    setRecipientProfileByMode,
    setInput,
    setTextType,
    setLastCaptureSource,
    setContactMatchCandidates,
    setIsContactConfirmationNeeded,
    setIsActionCenterOpen,
    showHeaderStatusAlert,
    focusComposer,
    onDailyBriefCta,
    lazyMode = false,
    contactWithFreshDraft = null,
    reviewUpload = null,
    onReviewUpload,
    onAskForContactDetail,
    runSmartReply,
    welcomeFirstName = '',
  } = params;

  const contactPriorityRows = useMemo(
    () => contactThreads
      .map(thread => ({
        thread,
        priority: buildContactPriority(thread),
      }))
      .sort((a, b) => {
        if (b.priority.score !== a.priority.score) return b.priority.score - a.priority.score;
        return (b.priority.latestActivityAt ?? b.thread.updatedAt) - (a.priority.latestActivityAt ?? a.thread.updatedAt);
      }),
    [contactThreads],
  );

  const contactNeedingReply = contactPriorityRows.find(row => row.priority.nextActionIntent === 'reply')?.thread ?? null;
  const commandCenterStats = useMemo((): CommandCenterStats => {
    const needsReply = contactPriorityRows.filter(row => row.priority.status === 'needs-reply').length;
    const waitingOnClient = contactPriorityRows.filter(row =>
      row.priority.status === 'waiting-on-client' || row.priority.status === 'follow-up-today',
    ).length;
    const recentCaptured = contactThreads.reduce((count, thread) => (
      count + thread.messages.filter(message => Date.now() - message.createdAt < 7 * 86400000).length
    ), 0);

    return {
      needsReply,
      waitingOnClient,
      recentCaptured,
      drafts: recentRepliesCount,
    };
  }, [contactPriorityRows, contactThreads, recentRepliesCount]);

  const recommendation = useMemo(
    () => buildWorkbenchRecommendation({
      contactThreads,
      contactPriorityRows,
      selectedContactThread,
      topActionInboxItem,
      contactWithFreshDraft,
      reviewUpload,
    }),
    [
      contactThreads,
      contactPriorityRows,
      selectedContactThread,
      topActionInboxItem,
      contactWithFreshDraft,
      reviewUpload,
    ],
  );

  const buildSelectedContactPrimary = useCallback((recommendationForContact: WorkbenchRecommendation): CommandCenterPrimary | null => {
    const contact = recommendationForContact.contact;
    if (!contact) return null;
    const priority = recommendationForContact.priority ?? contactPriorityRows.find(row => row.thread.id === contact.id)?.priority;
    const latestMessage = contact.messages[0] ?? null;
    const selectedCta = recommendationForContact.kind === 'add-detail'
      ? copy.floating.addDetailCta
      : recommendationForContact.kind === 'follow-up'
        ? copy.floating.followUpCta
        : priority?.suggestedAction === 'reply'
          ? copy.floating.replyNow
          : copy.floating.useContact;

    return {
      eyebrow: copy.floating.dailyBriefLabel,
      title: interpolate(copy.floating.activeClient, { name: contact.name }),
      body: latestMessage?.summary || latestMessage?.text || contact.company || copy.floating.clientFallbackBody,
      cta: selectedCta,
      reason: recommendationForContact.kind === 'add-detail'
        ? copy.floating.addDetailReason
        : recommendationForContact.kind === 'follow-up'
          ? copy.floating.followUpReason
          : copy.floating.selectedClientReason,
      microAsk: recommendationForContact.kind === 'add-detail' && composerEmpty && onAskForContactDetail
        ? {
            body: copy.floating.addDetailMicroAsk,
            cta: copy.floating.addDetailMicroAskCta,
            onClick: () => onAskForContactDetail(contact),
          }
        : undefined,
      onClick: () => {
        onDailyBriefCta?.(recommendationForContact.kind === 'add-detail'
          ? 'add-detail'
          : recommendationForContact.kind === 'follow-up'
            ? 'follow-up'
            : 'selected');
        applySelectedContactId(contact.id, contact);
        if (recommendationForContact.kind === 'add-detail') {
          if (onAskForContactDetail) {
            onAskForContactDetail(contact);
          } else {
            openMiniScreen('contact-threads');
          }
          return;
        }

        if (priority?.suggestedAction === 'reply') {
          const latestInboundText = getLatestInboundText(contact);
          if (latestInboundText) {
            setWorkMode('reply');
            setRecipientProfileByMode(prev => ({ ...prev, reply: 'existing-client' }));
            setInput(latestInboundText);
            setLastCaptureSource('typed');
            setContactMatchCandidates([]);
            setIsContactConfirmationNeeded(false);
          }
        } else if (priority?.suggestedAction === 'follow-up') {
          setWorkMode('reply');
          setRecipientProfileByMode(prev => ({ ...prev, reply: 'existing-client' }));
          setTextType('follow-up');
          setInput(priority.promptSeed);
          setLastCaptureSource('typed');
          setContactMatchCandidates([]);
          setIsContactConfirmationNeeded(false);
        }
        setIsActionCenterOpen(false);
        showHeaderStatusAlert(copy.floating.contactInComposer);
        focusComposer();
      },
    };
  }, [
    applySelectedContactId,
    composerEmpty,
    contactPriorityRows,
    copy,
    focusComposer,
    onAskForContactDetail,
    onDailyBriefCta,
    openMiniScreen,
    setContactMatchCandidates,
    setInput,
    setIsActionCenterOpen,
    setIsContactConfirmationNeeded,
    setLastCaptureSource,
    setRecipientProfileByMode,
    setTextType,
    setWorkMode,
    showHeaderStatusAlert,
  ]);

  const dailyBrief = useMemo((): CommandCenterPrimary | null => {
    if (recommendation.kind === 'draft-ready' && recommendation.contact?.pendingDraft && runSmartReply) {
      const draft = recommendation.contact.pendingDraft;
      const contact = recommendation.contact;
      return {
        eyebrow: `${copy.floating.draftReadyEyebrow} · ${formatRelativeAge(draft.createdAt, copy.floating)}`,
        title: interpolate(copy.floating.attentionToastDraftReady, { name: contact.name }),
        body: copy.floating.draftReadyBody,
        cta: copy.floating.openDraft,
        reason: copy.floating.draftReadyReason,
        onClick: () => {
          onDailyBriefCta?.('draft-ready');
          runSmartReply(contact);
        },
      };
    }

    if (recommendation.kind === 'do-action' && recommendation.actionItem) {
      const item = recommendation.actionItem;
      return {
        eyebrow: `${copy.floating.dailyBriefLabel} · ${formatRelativeAge(item.createdAt, copy.floating)}`,
        title: pendingActionInboxCount === 1
          ? copy.floating.actionsWaitingOne
          : interpolate(copy.floating.actionsWaitingMany, { count: pendingActionInboxCount }),
        body: item.body,
        cta: copy.actionInbox.doNow,
        reason: item.relatedContactId ? copy.floating.actionInboxContactReason : copy.floating.actionInboxPriorityReason,
        onClick: () => {
          onDailyBriefCta?.('inbox');
          void handleActionInboxDoNow(item);
        },
      };
    }

    if (recommendation.kind === 'review-file' && recommendation.upload && onReviewUpload) {
      const upload = recommendation.upload;
      return {
        eyebrow: copy.floating.dailyBriefLabel,
        title: interpolate(copy.floating.reviewFileTitle, { filename: upload.filename }),
        body: copy.floating.reviewFileBody,
        cta: copy.floating.reviewFileCta,
        reason: copy.floating.reviewFileReason,
        onClick: () => {
          onDailyBriefCta?.('review-file');
          onReviewUpload(upload);
        },
      };
    }

    if (recommendation.kind === 'reply-now' && recommendation.contact) {
      const contact = recommendation.contact;
      const latest = contact.messages.find(message => message.direction === 'inbound') ?? contact.messages[0];
      const latestAt = latest?.createdAt ?? contact.updatedAt;
      const latestInboundText = getLatestInboundText(contact);
      const canSmartReplyHere = lazyMode && runSmartReply && latestInboundText.length > 0;

      return {
        eyebrow: `${copy.floating.dailyBriefLabel} · ${formatRelativeAge(latestAt, copy.floating)}`,
        title: interpolate(copy.floating.needsYourReply, { name: contact.name }),
        body: latest?.summary || latest?.text || contact.company || copy.floating.clientFallbackBody,
        cta: canSmartReplyHere ? copy.floating.smartReplyLabel : copy.floating.replyNow,
        reason: copy.floating.latestInboundReason,
        onClick: () => {
          if (canSmartReplyHere && runSmartReply) {
            onDailyBriefCta?.('smart-reply');
            runSmartReply(contact);
            return;
          }
          onDailyBriefCta?.('needs-reply');
          applySelectedContactId(contact.id, contact);
          setWorkMode('reply');
          setRecipientProfileByMode(prev => ({ ...prev, reply: 'existing-client' }));
          if (latestInboundText) {
            setInput(latestInboundText);
            setLastCaptureSource('typed');
            setContactMatchCandidates([]);
            setIsContactConfirmationNeeded(false);
          }
          setIsActionCenterOpen(false);
          showHeaderStatusAlert(copy.floating.contactInComposer);
          focusComposer();
        },
      };
    }

    if (recommendation.kind === 'add-detail' || recommendation.kind === 'follow-up') {
      return buildSelectedContactPrimary(recommendation);
    }

    return null;
  }, [
    applySelectedContactId,
    buildSelectedContactPrimary,
    copy,
    focusComposer,
    handleActionInboxDoNow,
    lazyMode,
    onDailyBriefCta,
    onReviewUpload,
    pendingActionInboxCount,
    recommendation,
    runSmartReply,
    setContactMatchCandidates,
    setInput,
    setIsActionCenterOpen,
    setIsContactConfirmationNeeded,
    setLastCaptureSource,
    setRecipientProfileByMode,
    setWorkMode,
    showHeaderStatusAlert,
  ]);

  const commandCenterPrimary = useMemo((): CommandCenterPrimary => {
    if (dailyBrief) return dailyBrief;

    if (recommendation.kind === 'active-contact' && recommendation.contact) {
      const selected = buildSelectedContactPrimary(recommendation);
      if (selected) return selected;
    }

    if (recommendation.kind === 'clear') {
      return {
        eyebrow: copy.floating.dailyBriefLabel,
        title: copy.floating.clearTitle,
        body: copy.floating.clearBody,
        cta: copy.floating.reviewContactsCta,
        reason: copy.floating.clearReason,
        onClick: () => {
          onDailyBriefCta?.('clear');
          openMiniScreen('contact-threads');
        },
      };
    }

    return {
      eyebrow: copy.floating.dailyBriefLabel,
      title: welcomeFirstName
        ? interpolate(copy.auth.welcomeName, { name: welcomeFirstName })
        : copy.floating.startClientMemoryTitle,
      body: copy.floating.startClientMemoryBody,
      cta: copy.floating.addContact,
      reason: copy.floating.startClientMemoryReason,
      onClick: () => {
        openMiniScreen('contact-threads');
      },
    };
  }, [
    applySelectedContactId,
    buildSelectedContactPrimary,
    copy,
    dailyBrief,
    openMiniScreen,
    onDailyBriefCta,
    recommendation,
    welcomeFirstName,
  ]);

  return {
    contactPriorityRows,
    contactNeedingReply,
    commandCenterStats,
    dailyBrief,
    commandCenterPrimary,
    hasDailyBrief: dailyBrief !== null,
  };
}
