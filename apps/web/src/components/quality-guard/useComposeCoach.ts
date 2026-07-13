import { useEffect, useMemo, useState } from 'react';

import {
  runComposeCoach,
  type ComposeCoachContext,
  type ComposeCoachWarning,
} from './composeCoach';

const DEBOUNCE_MS = 450;

/**
 * Phase 17 — debounced wrapper around the pure rule engine.
 *
 * Recomputes warnings ~450ms after the user stops typing so we never light
 * the strip mid-keystroke. Returns the previous warning list while a new
 * timer is pending — better than flashing empty between strokes.
 */
export function useComposeCoach(input: string, context: ComposeCoachContext): ComposeCoachWarning[] {
  const [warnings, setWarnings] = useState<ComposeCoachWarning[]>([]);
  const memoizedContext = useMemo(() => context, [
    context.contactStats,
    context.recipientProfile,
  ]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setWarnings(runComposeCoach(input, memoizedContext));
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [input, memoizedContext]);

  return warnings;
}
