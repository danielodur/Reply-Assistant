import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReplyInsight } from '../components/workbench/generatedReplyTypes';
import { computePriority } from '../components/action-inbox/priority';
import type { ActionInboxItem, ActionInboxState } from '../components/action-inbox/types';
import type { ContactFollowUpInboxEntry } from '../components/contacts/followUpTasks';
import { domainIncludesQueues, onDataReset } from '../config/resetAppData';

const STORAGE_KEY = 'replyAssistantActionInbox';

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getTomorrowKey(): string {
  const nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay.toISOString().slice(0, 10);
}

function loadState(): ActionInboxState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        items: [],
        analytics: { created: 0, done: 0, deferred: 0, delegated: 0 },
      };
    }

    const parsed = JSON.parse(raw) as Partial<ActionInboxState>;
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      analytics: {
        created: parsed.analytics?.created ?? 0,
        done: parsed.analytics?.done ?? 0,
        deferred: parsed.analytics?.deferred ?? 0,
        delegated: parsed.analytics?.delegated ?? 0,
      },
    };
  } catch {
    return {
      items: [],
      analytics: { created: 0, done: 0, deferred: 0, delegated: 0 },
    };
  }
}

function saveState(state: ActionInboxState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

type AddFromInsightInput = {
  insight: ReplyInsight;
  recipientLabel: string;
  prompt?: string;
};

type AddEmailActionInput = {
  contactId: string;
  contactName: string;
  newCount: number;
  title: string;
  body: string;
  prompt: string;
};

export function useActionInbox() {
  const [state, setState] = useState<ActionInboxState>(loadState);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setState(loadState());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    return onDataReset(domains => {
      if (domainIncludesQueues(domains)) {
        setState(loadState());
      }
    });
  }, []);

  const setAndSave = (updater: (prev: ActionInboxState) => ActionInboxState) => {
    setState(prev => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  };

  const addFromInsight = ({ insight, recipientLabel, prompt: promptOverride }: AddFromInsightInput) => {
    const createdAt = Date.now();
    const prompt = promptOverride ?? [
      `Draft a concise follow-up for ${recipientLabel}.`,
      `Intent: ${insight.intentLabel}.`,
      `Goal: ${insight.nextAction}`,
      `Timing: ${insight.followUp}`,
    ].join(' ');

    const nextItem: ActionInboxItem = {
      id: `action-${createdAt}`,
      title: `Follow up: ${insight.intentLabel}`,
      body: insight.nextAction,
      intentLabel: insight.intentLabel,
      riskLevel: insight.riskLevel,
      followUp: insight.followUp,
      priority: computePriority(insight.riskLevel, insight.followUp),
      prompt,
      createdAt,
      status: 'pending',
    };

    setAndSave(prev => ({
      items: [nextItem, ...prev.items],
      analytics: {
        ...prev.analytics,
        created: prev.analytics.created + 1,
      },
    }));
  };

  const addEmailAction = ({ contactId, contactName, newCount, title, body, prompt }: AddEmailActionInput) => {
    setAndSave(prev => {
      const existing = prev.items.find(item =>
        item.status === 'pending'
        && item.source === 'email-sync'
        && item.relatedContactId === contactId,
      );

      if (existing) {
        const nextCount = (existing.newEmailCount ?? 0) + newCount;
        return {
          ...prev,
          items: prev.items.map(item => {
            if (item.id !== existing.id) return item;
            return {
              ...item,
              title,
              body,
              prompt,
              newEmailCount: nextCount,
              createdAt: Date.now(),
              priority: Math.max(item.priority, 6),
            };
          }),
        };
      }

      const createdAt = Date.now();
      const nextItem: ActionInboxItem = {
        id: `action-email-${contactId}-${createdAt}`,
        title,
        body,
        intentLabel: `New email from ${contactName}`,
        riskLevel: 'medium',
        followUp: 'Reply today',
        priority: 6,
        prompt,
        createdAt,
        source: 'email-sync',
        relatedContactId: contactId,
        newEmailCount: newCount,
        status: 'pending',
      };

      return {
        items: [nextItem, ...prev.items],
        analytics: {
          ...prev.analytics,
          created: prev.analytics.created + 1,
        },
      };
    });
  };

  const markDone = (taskId: string) => {
    setAndSave(prev => {
      const target = prev.items.find(item => item.id === taskId);
      if (!target || target.status === 'done') {
        return prev;
      }

      return {
        items: prev.items.map(item => (item.id === taskId ? { ...item, status: 'done', deferUntil: undefined } : item)),
        analytics: {
          ...prev.analytics,
          done: prev.analytics.done + 1,
        },
      };
    });
  };

  const deferToTomorrow = (taskId: string) => {
    setAndSave(prev => {
      const target = prev.items.find(item => item.id === taskId);
      if (!target || target.status !== 'pending') {
        return prev;
      }

      return {
        items: prev.items.map(item => (item.id === taskId ? { ...item, deferUntil: getTomorrowKey() } : item)),
        analytics: {
          ...prev.analytics,
          deferred: prev.analytics.deferred + 1,
        },
      };
    });
  };

  const markDelegated = (taskId: string) => {
    setAndSave(prev => {
      const target = prev.items.find(item => item.id === taskId);
      if (!target || target.status === 'delegated') {
        return prev;
      }

      return {
        items: prev.items.map(item => (item.id === taskId ? { ...item, status: 'delegated', deferUntil: undefined } : item)),
        analytics: {
          ...prev.analytics,
          delegated: prev.analytics.delegated + 1,
        },
      };
    });
  };

  const removePending = (taskId: string) => {
    setAndSave(prev => {
      const exists = prev.items.some(item => item.id === taskId);
      if (!exists) {
        return prev;
      }

      return {
        ...prev,
        items: prev.items.filter(item => item.id !== taskId),
      };
    });
  };

  const syncContactFollowUps = useCallback((entries: ContactFollowUpInboxEntry[]) => {
    setAndSave(prev => {
      const wantIds = new Set(entries.map(entry => `contact-followup-${entry.contactId}`));
      const kept = prev.items.filter(item => {
        if (item.source !== 'contact-follow-up' || item.status !== 'pending') return true;
        return wantIds.has(item.id);
      });
      const byId = new Map(kept.map(item => [item.id, item]));
      let createdDelta = 0;
      for (const entry of entries) {
        const id = `contact-followup-${entry.contactId}`;
        if (!byId.has(id)) createdDelta++;
      }
      let nextItems = [...kept];
      for (const entry of entries) {
        const id = `contact-followup-${entry.contactId}`;
        const existing = byId.get(id);
        const nextItem: ActionInboxItem = {
          id,
          title: entry.title,
          body: entry.body,
          intentLabel: entry.intentLabel,
          riskLevel: entry.riskLevel,
          followUp: entry.followUp,
          priority: entry.priority,
          prompt: entry.prompt,
          createdAt: existing?.createdAt ?? Date.now(),
          source: 'contact-follow-up',
          relatedContactId: entry.contactId,
          status: 'pending',
        };
        const idx = nextItems.findIndex(item => item.id === id);
        if (idx >= 0) {
          nextItems[idx] = nextItem;
        } else {
          nextItems = [nextItem, ...nextItems];
        }
      }
      return {
        items: nextItems,
        analytics: {
          ...prev.analytics,
          created: prev.analytics.created + createdDelta,
        },
      };
    });
  }, []);

  const pendingItems = useMemo(() => {
    const today = getTodayKey();
    return state.items
      .filter(item => item.status === 'pending' && (!item.deferUntil || item.deferUntil <= today))
      .sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return b.createdAt - a.createdAt;
      });
  }, [state.items]);

  const completionRate = useMemo(() => {
    const actioned = state.analytics.done + state.analytics.delegated;
    if (state.analytics.created === 0) {
      return 0;
    }
    return Math.round((actioned / state.analytics.created) * 100);
  }, [state.analytics.created, state.analytics.delegated, state.analytics.done]);

  return {
    pendingItems,
    pendingCount: pendingItems.length,
    analytics: state.analytics,
    completionRate,
    addFromInsight,
    addEmailAction,
    markDone,
    deferToTomorrow,
    markDelegated,
    removePending,
    syncContactFollowUps,
  };
}
