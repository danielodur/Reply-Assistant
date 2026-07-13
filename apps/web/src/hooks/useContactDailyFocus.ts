import { useState } from 'react';

type ContactDailyFocusState = {
  date: string;
  doneIds: string[];
  snoozedUntil: Record<string, string>;
  analytics: {
    done: number;
    snoozed: number;
  };
};

const STORAGE_KEY = 'replyAssistantContactDailyFocus';

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getTomorrowKey(): string {
  const nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay.toISOString().slice(0, 10);
}

function normalizeState(raw: Partial<ContactDailyFocusState>): ContactDailyFocusState {
  const today = getTodayKey();
  const isCurrentDay = raw.date === today;
  const snoozedUntil = raw.snoozedUntil && typeof raw.snoozedUntil === 'object' ? raw.snoozedUntil : {};

  // Keep only active snoozes to avoid stale storage growth.
  const activeSnoozes = Object.fromEntries(
    Object.entries(snoozedUntil).filter(([, until]) => typeof until === 'string' && until >= today),
  );

  return {
    date: today,
    doneIds: isCurrentDay && Array.isArray(raw.doneIds) ? raw.doneIds : [],
    snoozedUntil: activeSnoozes,
    analytics: isCurrentDay
      ? {
          done: raw.analytics?.done ?? 0,
          snoozed: raw.analytics?.snoozed ?? 0,
        }
      : { done: 0, snoozed: 0 },
  };
}

function loadState(): ContactDailyFocusState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return normalizeState({});
    }

    const parsed = JSON.parse(raw) as Partial<ContactDailyFocusState>;
    return normalizeState(parsed);
  } catch {
    return normalizeState({});
  }
}

function saveState(state: ContactDailyFocusState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useContactDailyFocus() {
  const [state, setState] = useState<ContactDailyFocusState>(loadState);

  const setAndSave = (updater: (prev: ContactDailyFocusState) => ContactDailyFocusState) => {
    setState(prev => {
      const safePrev = normalizeState(prev);
      const next = normalizeState(updater(safePrev));
      saveState(next);
      return next;
    });
  };

  const markDone = (contactId: string) => {
    setAndSave(prev => {
      const alreadyDone = prev.doneIds.includes(contactId);
      return {
        ...prev,
        doneIds: alreadyDone ? prev.doneIds : [...prev.doneIds, contactId],
        snoozedUntil: Object.fromEntries(Object.entries(prev.snoozedUntil).filter(([id]) => id !== contactId)),
        analytics: alreadyDone
          ? prev.analytics
          : {
              ...prev.analytics,
              done: prev.analytics.done + 1,
            },
      };
    });
  };

  const snoozeUntilTomorrow = (contactId: string) => {
    setAndSave(prev => ({
      ...prev,
      doneIds: prev.doneIds.filter(id => id !== contactId),
      snoozedUntil: {
        ...prev.snoozedUntil,
        [contactId]: getTomorrowKey(),
      },
      analytics: {
        ...prev.analytics,
        snoozed: prev.analytics.snoozed + 1,
      },
    }));
  };

  const isDone = (contactId: string): boolean => state.doneIds.includes(contactId);

  const isSnoozed = (contactId: string): boolean => {
    const until = state.snoozedUntil[contactId];
    if (!until) return false;
    return until >= getTodayKey();
  };

  return {
    doneIds: state.doneIds,
    snoozedUntil: state.snoozedUntil,
    analytics: state.analytics,
    markDone,
    snoozeUntilTomorrow,
    isDone,
    isSnoozed,
  };
}
