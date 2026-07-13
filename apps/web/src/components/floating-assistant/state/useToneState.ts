import { useState } from 'react';

import { loadToneProfiles, type ToneProfileData } from '../../workbench/toneProfiles';
import type { TonePreset } from '../../workbench/types';

/**
 * Owns the four tone sliders (formality / warmth / urgency / confidence),
 * the active preset, and the saved profile list.
 *
 * Step 0 extraction from FloatingAssistant.tsx — pure state move. No behavior
 * change. Field names match the previous in-line `useState` declarations so
 * destructuring keeps every existing reference working.
 */
export function useToneState() {
  const [formality, setFormality] = useState(3);
  const [warmth, setWarmth] = useState(3);
  const [urgency, setUrgency] = useState(2);
  const [confidence, setConfidence] = useState(3);
  const [activeTonePreset, setActiveTonePreset] = useState<TonePreset>(null);
  const [savedToneProfiles, setSavedToneProfiles] =
    useState<ToneProfileData[]>(loadToneProfiles);

  return {
    formality,
    setFormality,
    warmth,
    setWarmth,
    urgency,
    setUrgency,
    confidence,
    setConfidence,
    activeTonePreset,
    setActiveTonePreset,
    savedToneProfiles,
    setSavedToneProfiles,
  };
}
