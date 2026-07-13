/**
 * Contact follow-up tasks for Today Queue / Action Inbox only.
 * Keep obligations there—avoid duplicating follow-up UI in global strips or notification spam.
 */
import { getContactFollowUpAgeDays, hasContactEmailNeedsAction, type ContactThread } from '../../config/contactThreads';
import type { AppTranslations } from '../../i18n/translations';
import type { ActionInboxRiskLevel } from '../action-inbox/types';
import type { QueueTask } from '../TodayQueue';
import { buildContactPriority } from './contactPriority';

function latestInboundEmailSummary(thread: ContactThread, fallback: string): string {
  const inbound = thread.messages
    .filter(message => message.direction === 'inbound' && message.source === 'email-sync')
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  return (inbound?.summary || inbound?.text || '').trim() || fallback;
}

function followUpRiskWaitingOnYou(ageDays: number): 'low' | 'medium' | 'high' {
  if (ageDays >= 3) return 'high';
  if (ageDays >= 2) return 'medium';
  return 'low';
}

function followUpRiskWaitingOnThem(ageDays: number): 'low' | 'medium' {
  return ageDays >= 4 ? 'medium' : 'low';
}

function followUpRiskStale(ageDays: number): 'low' | 'medium' | 'high' {
  if (ageDays >= 7) return 'high';
  if (ageDays >= 5) return 'medium';
  return 'low';
}

function latestInboundSummary(thread: ContactThread, fallback: string): string {
  const inbound = thread.messages
    .filter(message => message.direction === 'inbound')
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  return (inbound?.summary || inbound?.text || '').trim() || fallback;
}

function getNeedsReplySummary(thread: ContactThread, fallback: string): string {
  return hasContactEmailNeedsAction(thread)
    ? latestInboundEmailSummary(thread, fallback)
    : latestInboundSummary(thread, fallback);
}

export type ContactFollowUpInboxEntry = {
  contactId: string;
  title: string;
  body: string;
  prompt: string;
  intentLabel: string;
  followUp: string;
  riskLevel: ActionInboxRiskLevel;
  priority: number;
};

/** Derived follow-up rows for Action Inbox (stable ids, no extra UI chrome). */
export function buildContactFollowUpInboxEntries(threads: ContactThread[], copy: AppTranslations): ContactFollowUpInboxEntry[] {
  const entries: ContactFollowUpInboxEntry[] = [];

  for (const thread of threads) {
    if (thread.stage === 'closed' || thread.stage === 'internal') continue;

    const companySuffix = thread.company ? ` (${thread.company})` : '';
    const contactLabel = `${thread.name}${companySuffix}`;
    const priority = buildContactPriority(thread);

    if (priority.status === 'needs-reply') {
      const emailNeedsAction = hasContactEmailNeedsAction(thread);
      const summary = getNeedsReplySummary(thread, priority.promptSeed);
      const ageDays = Math.max(1, priority.followUpSignal.ageDays || 1);
      entries.push({
        contactId: thread.id,
        title: copy.contactThreads.followUpTaskTitle,
        body: emailNeedsAction
          ? copy.contactThreads.syncedEmailNeedsReplyBody.replace('{name}', contactLabel)
          : copy.contactThreads.waitingOnYouBody
            .replace('{name}', contactLabel)
            .replace('{days}', String(ageDays)),
        prompt: copy.contactThreads.followUpTaskPrompt
          .replace('{name}', contactLabel)
          .replace('{summary}', summary),
        intentLabel: emailNeedsAction
          ? copy.contactThreads.syncedEmailNeedsReplyIntent
          : copy.contactThreads.waitingOnYouLabel,
        followUp: emailNeedsAction ? 'Today' : `${ageDays}d`,
        riskLevel: emailNeedsAction ? 'high' : followUpRiskWaitingOnYou(ageDays),
        priority: emailNeedsAction ? 7 : ageDays >= 3 ? 5 : 4,
      });
      continue;
    }

    if (priority.status === 'follow-up-today') {
      const summary = priority.followUpSignal.summary || copy.contactThreads.waitingOnThemFallback;
      const ageDays = Math.max(2, priority.followUpSignal.ageDays || 2);
      entries.push({
        contactId: thread.id,
        title: copy.contactThreads.followUpTaskTitle,
        body: copy.contactThreads.waitingOnThemBody
          .replace('{name}', contactLabel)
          .replace('{summary}', summary)
          .replace('{days}', String(ageDays)),
        prompt: copy.contactThreads.promiseCheckTaskPrompt
          .replace('{name}', contactLabel)
          .replace('{summary}', summary),
        intentLabel: copy.contactThreads.waitingOnThemLabel,
        followUp: `${ageDays}d`,
        riskLevel: followUpRiskWaitingOnThem(ageDays),
        priority: 3,
      });
      continue;
    }

    const ageDays = getContactFollowUpAgeDays(thread);
    if (ageDays && ageDays >= 3) {
      entries.push({
        contactId: thread.id,
        title: copy.contactThreads.followUpTaskTitle,
        body: copy.contactThreads.followUpTaskBody
          .replace('{name}', contactLabel)
          .replace('{days}', String(ageDays)),
        prompt: copy.contactThreads.followUpTaskPrompt
          .replace('{name}', contactLabel)
          .replace('{summary}', copy.contactThreads.waitingOnThemFallback),
        intentLabel: copy.contactThreads.followUpTaskTitle,
        followUp: `${ageDays}d`,
        riskLevel: ageDays >= 7 ? 'high' : ageDays >= 5 ? 'medium' : 'low',
        priority: 2,
      });
    }
  }

  return entries;
}

export function buildContactFollowUpTasks(threads: ContactThread[], copy: AppTranslations): QueueTask[] {
  return threads
    .map((thread): QueueTask | null => {
      if (thread.stage === 'closed' || thread.stage === 'internal') {
        return null;
      }

      const priority = buildContactPriority(thread);
      const companySuffix = thread.company ? ` (${thread.company})` : '';
      const contactLabel = `${thread.name}${companySuffix}`;

      if (priority.status === 'needs-reply') {
        const emailNeedsAction = hasContactEmailNeedsAction(thread);
        const ageDays = Math.max(1, priority.followUpSignal.ageDays || 1);
        const summary = getNeedsReplySummary(thread, priority.promptSeed);
        return {
          id: `contact-priority-reply-${thread.id}`,
          title: copy.contactThreads.followUpTaskTitle,
          body: emailNeedsAction
            ? copy.contactThreads.syncedEmailNeedsReplyBody.replace('{name}', contactLabel)
            : copy.contactThreads.waitingOnYouBody
              .replace('{name}', contactLabel)
              .replace('{days}', String(ageDays)),
          estMinutes: 4,
          action: {
            kind: 'seed-input' as const,
            input: copy.contactThreads.followUpTaskPrompt
              .replace('{name}', contactLabel)
              .replace('{summary}', summary),
            workMode: 'reply' as const,
            recipient: 'existing-client' as const,
            textType: 'follow-up',
          },
          meta: {
            riskLevel: emailNeedsAction
              ? 'high' as const
              : followUpRiskWaitingOnYou(ageDays),
            followUpTiming: emailNeedsAction
              ? 'email'
              : `${ageDays}d`,
          },
        };
      }

      if (priority.status === 'follow-up-today') {
        const summary = priority.followUpSignal.summary || copy.contactThreads.waitingOnThemFallback;
        const ageDays = Math.max(2, priority.followUpSignal.ageDays || 2);
        return {
          id: `contact-priority-follow-up-${thread.id}`,
          title: copy.contactThreads.followUpTaskTitle,
          body: copy.contactThreads.waitingOnThemBody
            .replace('{name}', contactLabel)
            .replace('{summary}', summary)
            .replace('{days}', String(ageDays)),
          estMinutes: 2,
          action: {
            kind: 'seed-input' as const,
            input: copy.contactThreads.promiseCheckTaskPrompt
              .replace('{name}', contactLabel)
              .replace('{summary}', summary),
            workMode: 'reply' as const,
            recipient: 'existing-client' as const,
            textType: 'follow-up',
          },
          meta: {
            riskLevel: followUpRiskWaitingOnThem(ageDays),
            followUpTiming: `${ageDays}d`,
          },
        };
      }

      const ageDays = getContactFollowUpAgeDays(thread);
      if (!ageDays || ageDays < 3) {
        return null;
      }

      return {
        id: `contact-follow-up-${thread.id}`,
        title: copy.contactThreads.followUpTaskTitle,
        body: copy.contactThreads.followUpTaskBody
          .replace('{name}', `${thread.name}${companySuffix}`)
          .replace('{days}', String(ageDays)),
        estMinutes: 3,
        action: {
          kind: 'seed-input' as const,
          input: copy.contactThreads.followUpTaskPrompt
            .replace('{name}', `${thread.name}${companySuffix}`)
            .replace('{summary}', copy.contactThreads.waitingOnThemFallback),
          workMode: 'reply' as const,
          recipient: 'existing-client' as const,
          textType: 'follow-up',
        },
        meta: {
          riskLevel: followUpRiskStale(ageDays),
          followUpTiming: `${ageDays}d`,
        },
      };
    })
    .filter((task): task is QueueTask => Boolean(task))
    .sort((a, b) => b.estMinutes - a.estMinutes)
    .slice(0, 3);
}
