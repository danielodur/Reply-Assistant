import { useEffect, useState } from 'react';
import { domainIncludesQueues, onDataReset } from '../config/resetAppData';

type TodayQueueState = {
  doneIds: string[];
  snoozedUntil: Record<string, string>;
  analytics: {
    done: number;
    snoozed: number;
    usedNow: number;
    minutesSaved: number;
  };
};

const STORAGE_KEY_PREFIX = 'replyAssistantTodayQueue_';

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getStorageKey(): string {
  return `${STORAGE_KEY_PREFIX}${getTodayKey()}`;
}

function loadState(): TodayQueueState {
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) {
      return {
        doneIds: [],
        snoozedUntil: {},
        analytics: { done: 0, snoozed: 0, usedNow: 0, minutesSaved: 0 },
      };
    }

    const parsed = JSON.parse(raw) as Partial<TodayQueueState>;
    return {
      doneIds: Array.isArray(parsed.doneIds) ? parsed.doneIds : [],
      snoozedUntil: parsed.snoozedUntil && typeof parsed.snoozedUntil === 'object' ? parsed.snoozedUntil : {},
      analytics: {
        done: parsed.analytics?.done ?? 0,
        snoozed: parsed.analytics?.snoozed ?? 0,
        usedNow: parsed.analytics?.usedNow ?? 0,
        minutesSaved: parsed.analytics?.minutesSaved ?? 0,
      },
    };
  } catch {
    return {
      doneIds: [],
      snoozedUntil: {},
      analytics: { done: 0, snoozed: 0, usedNow: 0, minutesSaved: 0 },
    };
  }
}

function saveState(state: TodayQueueState): void {
  localStorage.setItem(getStorageKey(), JSON.stringify(state));
}

function getTomorrowKey(): string {
  const nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay.toISOString().slice(0, 10);
}

export function useTodayQueue() {
  const [state, setState] = useState<TodayQueueState>(loadState);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === getStorageKey()) {
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

  const setAndSave = (updater: (prev: TodayQueueState) => TodayQueueState) => {
    setState(prev => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  };

  const markDone = (taskId: string, estMinutes = 0) => {
    setAndSave(prev => ({
      doneIds: prev.doneIds.includes(taskId) ? prev.doneIds : [...prev.doneIds, taskId],
      snoozedUntil: Object.fromEntries(Object.entries(prev.snoozedUntil).filter(([id]) => id !== taskId)),
      analytics: prev.doneIds.includes(taskId)
        ? prev.analytics
        : {
            ...prev.analytics,
            done: prev.analytics.done + 1,
            minutesSaved: prev.analytics.minutesSaved + estMinutes,
          },
    }));
  };

  const markUsedNow = (taskId: string, estMinutes = 0) => {
    setAndSave(prev => {
      const alreadyDone = prev.doneIds.includes(taskId);
      return {
        doneIds: alreadyDone ? prev.doneIds : [...prev.doneIds, taskId],
        snoozedUntil: Object.fromEntries(Object.entries(prev.snoozedUntil).filter(([id]) => id !== taskId)),
        analytics: {
          ...prev.analytics,
          usedNow: prev.analytics.usedNow + 1,
          done: alreadyDone ? prev.analytics.done : prev.analytics.done + 1,
          minutesSaved: alreadyDone ? prev.analytics.minutesSaved : prev.analytics.minutesSaved + estMinutes,
        },
      };
    });
  };

  const snoozeUntilTomorrow = (taskId: string) => {
    setAndSave(prev => ({
      doneIds: prev.doneIds.filter(id => id !== taskId),
      snoozedUntil: { ...prev.snoozedUntil, [taskId]: getTomorrowKey() },
      analytics: {
        ...prev.analytics,
        snoozed: prev.analytics.snoozed + 1,
      },
    }));
  };

  const isDone = (taskId: string): boolean => state.doneIds.includes(taskId);

  const isSnoozed = (taskId: string): boolean => {
    const until = state.snoozedUntil[taskId];
    if (!until) {
      return false;
    }
    return until >= getTodayKey();
  };

  return {
    doneIds: state.doneIds,
    snoozedUntil: state.snoozedUntil,
    analytics: state.analytics,
    markDone,
    markUsedNow,
    snoozeUntilTomorrow,
    isDone,
    isSnoozed,
  };
}
