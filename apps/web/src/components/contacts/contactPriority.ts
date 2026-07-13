import { hasContactEmailNeedsAction, type ContactMessageEntry, type ContactThread } from '../../config/contactThreads';
import { deriveContactFollowUpSignal, type ContactFollowUpSignal } from './followUpSignals';

export type ContactPriorityLevel = 'action-now' | 'due-today' | 'watchlist' | 'stable';
export type ContactPriorityIntent = 'reply' | 'follow-up' | 'review';
export type ContactPriorityStatus =
  | 'needs-reply'
  | 'waiting-on-client'
  | 'follow-up-today'
  | 'recently-active'
  | 'missing-context'
  | 'no-action-needed';
export type ContactPriorityReason =
  | 'latest-inbound-unanswered'
  | 'email-needs-action'
  | 'follow-up-due'
  | 'waiting-on-client'
  | 'recent-activity'
  | 'missing-context'
  | 'quiet-thread';

export type ContactPriority = {
  level: ContactPriorityLevel;
  score: number;
  needsAttention: boolean;
  status: ContactPriorityStatus;
  reason: ContactPriorityReason;
  suggestedAction: ContactPriorityIntent;
  promptSeed: string;
  followUpSignal: ContactFollowUpSignal;
  latestActivityAt: number | null;
  latestInboundAt: number | null;
  latestOutboundAt: number | null;
  nextActionIntent: ContactPriorityIntent;
};

function getLatestTimestamp(
  messages: ContactMessageEntry[],
  predicate: (message: ContactMessageEntry) => boolean,
): number | null {
  return messages
    .filter(predicate)
    .reduce<number | null>((latest, message) => {
      if (latest === null || message.createdAt > latest) return message.createdAt;
      return latest;
    }, null);
}

function getPriorityLevel(score: number): ContactPriorityLevel {
  if (score >= 75) return 'action-now';
  if (score >= 45) return 'due-today';
  if (score >= 20) return 'watchlist';
  return 'stable';
}

function getPriorityState(params: {
  thread: ContactThread;
  followUpSignal: ContactFollowUpSignal;
  latestActivityAt: number | null;
  latestInboundAt: number | null;
  latestOutboundAt: number | null;
  emailNeedsAction: boolean;
}): Pick<ContactPriority, 'status' | 'reason' | 'suggestedAction' | 'promptSeed' | 'nextActionIntent'> {
  const {
    thread,
    followUpSignal,
    latestActivityAt,
    latestInboundAt,
    latestOutboundAt,
    emailNeedsAction,
  } = params;
  const inboundIsUnanswered = latestInboundAt !== null && (!latestOutboundAt || latestInboundAt > latestOutboundAt);

  if (emailNeedsAction) {
    return {
      status: 'needs-reply',
      reason: 'email-needs-action',
      suggestedAction: 'reply',
      promptSeed: `Draft a reply to ${thread.name} based on the latest synced email.`,
      nextActionIntent: 'reply',
    };
  }

  if (followUpSignal.status === 'waiting-on-you' || inboundIsUnanswered) {
    const summary = followUpSignal.summary || thread.messages.find(message => message.direction === 'inbound')?.summary || 'their latest message';
    return {
      status: 'needs-reply',
      reason: 'latest-inbound-unanswered',
      suggestedAction: 'reply',
      promptSeed: `Draft a reply to ${thread.name}. Reference: ${summary}`,
      nextActionIntent: 'reply',
    };
  }

  if (followUpSignal.status === 'waiting-on-them') {
    const isDue = followUpSignal.ageDays >= 2;
    return {
      status: isDue ? 'follow-up-today' : 'waiting-on-client',
      reason: isDue ? 'follow-up-due' : 'waiting-on-client',
      suggestedAction: 'follow-up',
      promptSeed: `Draft a concise follow-up to ${thread.name}.`,
      nextActionIntent: 'follow-up',
    };
  }

  if (!latestActivityAt) {
    return {
      status: 'missing-context',
      reason: 'missing-context',
      suggestedAction: 'review',
      promptSeed: `Add recent context for ${thread.name} before drafting.`,
      nextActionIntent: 'review',
    };
  }

  if (Date.now() - latestActivityAt < 7 * 86400000) {
    return {
      status: 'recently-active',
      reason: 'recent-activity',
      suggestedAction: 'review',
      promptSeed: `Review the latest context for ${thread.name}.`,
      nextActionIntent: 'review',
    };
  }

  return {
    status: 'no-action-needed',
    reason: 'quiet-thread',
    suggestedAction: 'review',
    promptSeed: `Review ${thread.name} when new context arrives.`,
    nextActionIntent: 'review',
  };
}

export function buildContactPriority(thread: ContactThread): ContactPriority {
  const followUpSignal = deriveContactFollowUpSignal(thread);
  const latestInboundAt = getLatestTimestamp(thread.messages, message => message.direction === 'inbound');
  const latestOutboundAt = getLatestTimestamp(thread.messages, message => message.direction === 'outbound');
  const latestActivityAt = thread.messages.length
    ? getLatestTimestamp(thread.messages, () => true)
    : thread.updatedAt || null;
  const emailNeedsAction = hasContactEmailNeedsAction(thread);
  const state = getPriorityState({
    thread,
    followUpSignal,
    latestActivityAt,
    latestInboundAt,
    latestOutboundAt,
    emailNeedsAction,
  });

  let score = 0;

  if (followUpSignal.status === 'waiting-on-you') {
    score += 58;
    score += Math.min(24, followUpSignal.ageDays * 6);
  }

  if (followUpSignal.status === 'waiting-on-them') {
    score += 24;
    score += Math.min(16, Math.max(0, followUpSignal.ageDays - 1) * 4);
  }

  if (emailNeedsAction) {
    score += 22;
  }

  if (latestInboundAt && (!latestOutboundAt || latestInboundAt > latestOutboundAt)) {
    score += 12;
  }

  if (thread.stage === 'vip-client') {
    score += 8;
  }

  if (thread.stage === 'new-lead') {
    score += 4;
  }

  const level = getPriorityLevel(score);

  return {
    level,
    score,
    needsAttention: level !== 'stable',
    status: state.status,
    reason: state.reason,
    suggestedAction: state.suggestedAction,
    promptSeed: state.promptSeed,
    followUpSignal,
    latestActivityAt,
    latestInboundAt,
    latestOutboundAt,
    nextActionIntent: state.nextActionIntent,
  };
}
