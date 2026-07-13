import { useEffect, useState } from 'react';

import { detectIntent, type DetectedIntent } from './detectIntent';

const DEBOUNCE_MS = 450;

/**
 * Phase 14 — debounced wrapper around the pure detector.
 *
 * Mirrors the compose-coach cadence so the two header signals never compete
 * on a single keystroke.
 */
export function useDetectedIntent(input: string): DetectedIntent | null {
  const [intent, setIntent] = useState<DetectedIntent | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setIntent(detectIntent(input));
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [input]);

  return intent;
}
