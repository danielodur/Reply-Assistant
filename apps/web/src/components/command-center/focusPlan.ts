import type { ContactThread } from '../../config/contactThreads';
import type { AppTranslations } from '../../i18n/translations';
import type { UploadContextSummary } from '../../uploads/uploadTypes';
import type { ActionInboxItem } from '../action-inbox/types';
import type { ContactPriority } from '../contacts/contactPriority';
import type { QueueTask } from '../TodayQueue';
import type { OpenLoop } from '../follow-ups/detectOpenLoops';
// Explicit .ts extensions: this module's runtime imports are loaded directly by
// scripts/verify-focus-plan.ts under `node --experimental-strip-types`, which does
// not resolve extensionless relative TS imports. Vite resolves both forms.
import { deriveSendTimingHint } from '../timing-intelligence/deriveSendTimingHint.ts';
import { collectHeadWorkSignals, PROMISE_UPPER_KINDS, type HeadSignal } from './leadWorkSignal.ts';

export type FocusPlanSource =
  | 'draft'
  | 'action-inbox'
  | 'review-file'
  | 'reply-now'
  | 'promise'
  | 'add-detail'
  | 'follow-up'
  | 'open-loop'
  | 'today-queue'
  | 'clear';

export type FocusPlanRank = 'now' | 'next' | 'later';

export type FocusPlanAction =
  | { type: 'open-draft'; contactId: string }
  | { type: 'run-action-inbox-item'; itemId: string }
  | { type: 'review-upload'; uploadId: string }
  | { type: 'reply-contact'; contactId: string }
  | { type: 'add-detail'; contactId: string }
  | { type: 'follow-up-contact'; contactId: string; prompt: string }
  | { type: 'run-today-task'; taskId: string }
  | { type: 'review-contacts' };

export type FocusPlanItem = {
  id: string;
  rank: FocusPlanRank;
  source: FocusPlanSource;
  title: string;
  body: string;
  reason: string;
  cta: string;
  whereLabel: string;
  whenLabel: string;
  estimateMinutes?: number;
  contactId?: string;
  action: FocusPlanAction;
};

/** A promise the user owes a contact, derived from contact-memory open commitments. */
export type PromiseCommitmentInput = {
  contactId: string;
  contactName: string;
  summary: string;
  sourceMessageId: string;
};

export type BuildFocusPlanInput = {
  copy: AppTranslations;
  contactWithFreshDraft: ContactThread | null;
  topActionInboxItem: ActionInboxItem | null;
  reviewUpload: UploadContextSummary | null;
  contactNeedingReply: ContactThread | null;
  selectedContactThread: ContactThread | null;
  selectedPriority: ContactPriority | null;
  openLoop: OpenLoop | null;
  todayTasks: QueueTask[];
  /** Promises owed to contacts; ranked just below an unanswered reply. */
  promiseCommitments?: PromiseCommitmentInput[];
  /** Local hour (0–23) used to surface a send-timing window. Defaults to now. */
  currentHour?: number;
  /** Item ids the user has already handled this session; filtered out of the plan. */
  handledIds?: ReadonlySet<string>;
};

type FocusPlanCandidate = Omit<FocusPlanItem, 'rank'>;

const MAX_FOCUS_ITEMS = 3;

function shortText(value: string | undefined, fallback: string): string {
  const text = (value ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return fallback;
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
}

function rankForIndex(index: number): FocusPlanRank {
  if (index === 0) return 'now';
  if (index === 1) return 'next';
  return 'later';
}

function dedupeKey(item: FocusPlanCandidate): string {
  if (item.contactId) return `contact:${item.contactId}`;
  return `${item.source}:${item.id}`;
}

function contactIdFromTaskId(taskId: string): string | undefined {
  for (const prefix of ['contact-priority-reply-', 'contact-priority-follow-up-', 'contact-follow-up-']) {
    if (taskId.startsWith(prefix)) return taskId.slice(prefix.length);
  }
  return undefined;
}

function formatClockHour(hour: number, copy: AppTranslations): string {
  const period = hour < 12 ? copy.focusPlan.timeAm : copy.focusPlan.timePm;
  const normalized = ((hour % 12) + 12) % 12;
  const display = normalized === 0 ? 12 : normalized;
  return copy.focusPlan.clockTime
    .replace('{{hour}}', String(display))
    .replace('{{period}}', period);
}

/** Real send-timing window when the contact has a clear band and we're outside it. */
function timingWhenLabel(
  contact: ContactThread,
  currentHour: number,
  copy: AppTranslations,
  fallback: string,
): string {
  const hint = deriveSendTimingHint(contact.messages, currentHour);
  if (!hint) return fallback;
  return copy.focusPlan.whenAround.replace('{{time}}', formatClockHour(hint.recommendedHour, copy));
}

function candidateFromHeadSignal(
  signal: HeadSignal,
  copy: AppTranslations,
  currentHour: number,
): FocusPlanCandidate {
  const c = copy.focusPlan;
  switch (signal.kind) {
    case 'draft': {
      const contact = signal.contact;
      return {
        id: `draft:${contact.id}:${contact.pendingDraft?.createdAt ?? contact.updatedAt}`,
        source: 'draft',
        contactId: contact.id,
        title: c.draftTitle.replace('{{name}}', contact.name),
        body: c.draftBody,
        reason: copy.floating.draftReadyReason,
        cta: copy.floating.openDraft,
        whereLabel: c.whereDraft,
        whenLabel: c.whenNow,
        estimateMinutes: 1,
        action: { type: 'open-draft', contactId: contact.id },
      };
    }
    case 'action-inbox': {
      const item = signal.actionItem;
      return {
        id: `action:${item.id}`,
        source: 'action-inbox',
        contactId: item.relatedContactId,
        title: item.title,
        body: shortText(item.body, item.prompt),
        reason: item.relatedContactId
          ? copy.floating.actionInboxContactReason
          : copy.floating.actionInboxPriorityReason,
        cta: copy.actionInbox.doNow,
        whereLabel: c.whereActionInbox,
        whenLabel: item.followUp || c.whenNow,
        action: { type: 'run-action-inbox-item', itemId: item.id },
      };
    }
    case 'review-file': {
      const upload = signal.upload;
      return {
        id: `upload:${upload.id}`,
        source: 'review-file',
        contactId: upload.contactId,
        title: copy.floating.reviewFileTitle.replace('{{filename}}', upload.filename),
        body: copy.floating.reviewFileBody,
        reason: copy.floating.reviewFileReason,
        cta: copy.floating.reviewFileCta,
        whereLabel: upload.source === 'business-context'
          ? c.whereBusinessContext
          : upload.source === 'contact'
            ? c.whereContactMemory
            : c.whereComposer,
        whenLabel: c.whenBeforeDrafting,
        estimateMinutes: 2,
        action: { type: 'review-upload', uploadId: upload.id },
      };
    }
    case 'reply-now': {
      const contact = signal.contact;
      const latest = contact.messages.find(message => message.direction === 'inbound') ?? contact.messages[0];
      return {
        id: `reply:${contact.id}:${contact.updatedAt}`,
        source: 'reply-now',
        contactId: contact.id,
        title: c.replyTitle.replace('{{name}}', contact.name),
        body: shortText(latest?.summary || latest?.text, contact.company || copy.floating.clientFallbackBody),
        reason: copy.floating.latestInboundReason,
        cta: copy.floating.replyNow,
        whereLabel: c.whereComposer,
        whenLabel: timingWhenLabel(contact, currentHour, copy, c.whenNow),
        estimateMinutes: 4,
        action: { type: 'reply-contact', contactId: contact.id },
      };
    }
    case 'add-detail': {
      const contact = signal.contact;
      return {
        id: `detail:${contact.id}`,
        source: 'add-detail',
        contactId: contact.id,
        title: c.detailTitle.replace('{{name}}', contact.name),
        body: copy.floating.addDetailMicroAsk,
        reason: copy.floating.addDetailReason,
        cta: copy.floating.addDetailCta,
        whereLabel: c.whereComposer,
        whenLabel: c.whenBeforeDrafting,
        estimateMinutes: 1,
        action: { type: 'add-detail', contactId: contact.id },
      };
    }
    case 'follow-up': {
      const contact = signal.contact;
      return {
        id: `follow-up:${contact.id}`,
        source: 'follow-up',
        contactId: contact.id,
        title: c.followUpTitle.replace('{{name}}', contact.name),
        body: shortText(signal.priority.promptSeed, copy.floating.clientFallbackBody),
        reason: copy.floating.followUpReason,
        cta: copy.floating.followUpCta,
        whereLabel: c.whereComposer,
        whenLabel: timingWhenLabel(contact, currentHour, copy, c.whenToday),
        estimateMinutes: 3,
        action: { type: 'follow-up-contact', contactId: contact.id, prompt: signal.priority.promptSeed },
      };
    }
  }
}

export function buildFocusPlan(input: BuildFocusPlanInput): FocusPlanItem[] {
  const {
    copy,
    contactWithFreshDraft,
    topActionInboxItem,
    reviewUpload,
    contactNeedingReply,
    selectedContactThread,
    selectedPriority,
    openLoop,
    todayTasks,
    promiseCommitments = [],
    currentHour = new Date().getHours(),
    handledIds,
  } = input;
  const c = copy.focusPlan;

  // Shared head tiers (kept in lockstep with the Daily Brief recommendation).
  const headSignals = collectHeadWorkSignals({
    contactWithFreshDraft,
    topActionInboxItem,
    reviewUpload,
    contactNeedingReply,
    selectedContactThread,
    selectedPriority,
  });
  const headCandidates = headSignals.map(signal => candidateFromHeadSignal(signal, copy, currentHour));

  // Promises sit just below an unanswered reply but above add-detail / follow-up.
  let promiseSplit = 0;
  headSignals.forEach((signal, index) => {
    if (PROMISE_UPPER_KINDS.has(signal.kind)) promiseSplit = index + 1;
  });

  const promiseCandidates: FocusPlanCandidate[] = promiseCommitments.map(commitment => ({
    id: `promise:${commitment.contactId}:${commitment.sourceMessageId}`,
    source: 'promise',
    contactId: commitment.contactId,
    title: c.promiseTitle.replace('{{name}}', commitment.contactName),
    body: shortText(commitment.summary, copy.floating.clientFallbackBody),
    reason: c.promiseReason,
    cta: copy.floating.followUpCta,
    whereLabel: c.whereComposer,
    whenLabel: c.whenToday,
    estimateMinutes: 3,
    action: { type: 'follow-up-contact', contactId: commitment.contactId, prompt: commitment.summary },
  }));

  const openLoopCandidates: FocusPlanCandidate[] = openLoop
    ? [{
        id: `open-loop:${openLoop.contactId}:${openLoop.inboundAt}`,
        source: 'open-loop',
        contactId: openLoop.contactId,
        title: c.openLoopTitle.replace('{{name}}', openLoop.contactName),
        body: c.openLoopBody,
        reason: copy.floating.latestInboundReason,
        cta: copy.floating.replyNow,
        whereLabel: c.whereComposer,
        whenLabel: c.whenToday,
        estimateMinutes: 4,
        action: { type: 'reply-contact', contactId: openLoop.contactId },
      }]
    : [];

  const todayCandidates: FocusPlanCandidate[] = todayTasks.map(task => ({
    id: `task:${task.id}`,
    source: 'today-queue',
    contactId: contactIdFromTaskId(task.id),
    title: task.title,
    body: shortText(task.body, task.title),
    reason: c.todayTaskReason,
    cta: copy.todayQueue.useNow,
    whereLabel: c.whereTodayQueue,
    whenLabel: task.meta?.followUpTiming || c.whenNext,
    estimateMinutes: task.estMinutes,
    action: { type: 'run-today-task', taskId: task.id },
  }));

  const candidates: FocusPlanCandidate[] = [
    ...headCandidates.slice(0, promiseSplit),
    ...promiseCandidates,
    ...headCandidates.slice(promiseSplit),
    ...openLoopCandidates,
    ...todayCandidates,
  ];

  const deduped: FocusPlanCandidate[] = [];
  const seen = new Set<string>();
  for (const item of candidates) {
    if (handledIds?.has(item.id)) continue;
    const key = dedupeKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
    if (deduped.length >= MAX_FOCUS_ITEMS) break;
  }

  // Clear state appears only once every candidate is absent or already handled.
  if (deduped.length === 0) {
    deduped.push({
      id: 'clear',
      source: 'clear',
      title: copy.floating.clearTitle,
      body: copy.floating.clearBody,
      reason: copy.floating.clearReason,
      cta: copy.floating.reviewContactsCta,
      whereLabel: c.whereContacts,
      whenLabel: c.whenWhenReady,
      action: { type: 'review-contacts' },
    });
  }

  return deduped.map((item, index) => ({
    ...item,
    rank: rankForIndex(index),
  }));
}
