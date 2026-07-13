import { useCallback, useEffect, useState } from 'react';

/**
 * Guided tour state machine. Persists the current step so closing the panel
 * mid-tour (or restarting the app) resumes at the last unseen anchor. A
 * separate `done` flag prevents the tour from auto-launching again once
 * completed or explicitly skipped.
 */

export type GuidedTourStep = 'daily-brief' | 'add-contact' | 'quick-start' | 'cmd-k';

export const GUIDED_TOUR_STEPS: GuidedTourStep[] = [
  'daily-brief',
  'add-contact',
  'quick-start',
  'cmd-k',
];

const STATE_STORAGE_KEY = 'replyAssistantGuidedTourState';

type StoredState = {
  step: GuidedTourStep | null;
  done: boolean;
};

function readState(): StoredState {
  try {
    const raw = localStorage.getItem(STATE_STORAGE_KEY);
    if (!raw) return { step: null, done: false };
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    const step = isGuidedTourStep(parsed?.step) ? parsed.step : null;
    const done = Boolean(parsed?.done);
    return { step, done };
  } catch {
    return { step: null, done: false };
  }
}

function writeState(state: StoredState): void {
  try {
    localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Best-effort — storage failures should not break the tour.
  }
}

function isGuidedTourStep(value: unknown): value is GuidedTourStep {
  return value === 'daily-brief'
    || value === 'add-contact'
    || value === 'quick-start'
    || value === 'cmd-k';
}

export function nextGuidedTourStep(current: GuidedTourStep): GuidedTourStep | null {
  const index = GUIDED_TOUR_STEPS.indexOf(current);
  if (index < 0 || index >= GUIDED_TOUR_STEPS.length - 1) return null;
  return GUIDED_TOUR_STEPS[index + 1];
}

export type UseGuidedTourResult = {
  activeStep: GuidedTourStep | null;
  isActive: boolean;
  isCompleted: boolean;
  start: () => void;
  advance: () => void;
  skip: () => void;
  restart: () => void;
};

/**
 * - Auto-resumes if a step is stored and the tour is not yet completed.
 * - `start()` only kicks the tour off when it has not been completed.
 * - `restart()` clears the done flag and re-anchors at the first step — the
 *   Settings entry uses this so the user can replay any time.
 */
export function useGuidedTour(): UseGuidedTourResult {
  const [state, setState] = useState<StoredState>(() => readState());

  useEffect(() => {
    writeState(state);
  }, [state]);

  // Cross-window sync (multi-monitor setups, detached windows).
  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key === STATE_STORAGE_KEY) {
        setState(readState());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const start = useCallback(() => {
    setState(prev => (prev.done ? prev : { step: GUIDED_TOUR_STEPS[0], done: false }));
  }, []);

  const advance = useCallback(() => {
    setState(prev => {
      if (!prev.step) return prev;
      const next = nextGuidedTourStep(prev.step);
      if (next === null) {
        return { step: null, done: true };
      }
      return { step: next, done: false };
    });
  }, []);

  const skip = useCallback(() => {
    setState({ step: null, done: true });
  }, []);

  const restart = useCallback(() => {
    setState({ step: GUIDED_TOUR_STEPS[0], done: false });
  }, []);

  return {
    activeStep: state.step,
    isActive: state.step !== null,
    isCompleted: state.done,
    start,
    advance,
    skip,
    restart,
  };
}
