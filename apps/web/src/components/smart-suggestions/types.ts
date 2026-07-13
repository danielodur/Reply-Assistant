export type SmartSuggestionKind =
  | 'reply-contact'
  | 'follow-up-contact'
  | 'resume-contact'
  | 'quick-scenario'
  | 'paste-message'
  | 'add-contact';

export type SmartSuggestion = {
  id: string;
  kind: SmartSuggestionKind;
  score: number;
  contactId?: string;
  contactName?: string;
  scenarioId?: string;
  promptSeed?: string;
};

export const SMART_CHIP_SCORE_THRESHOLD = 40;
export const SMART_SUGGESTION_PALETTE_LIMIT = 3;
export const SMART_SUGGESTION_MAX = 5;

export type TimeBand = 'morning' | 'afternoon' | 'evening';

export function getTimeBand(date = new Date()): TimeBand {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

import { ALL_SCENARIO_IDS as REGISTRY_SCENARIO_IDS } from '../scenarios/scenarioRegistry';

const TIME_BAND_SCENARIO_BOOST: Record<TimeBand, Record<string, number>> = {
  morning: {
    'running-late': 12,
    'ask-extension': 8,
    'cold-outreach': 10,
    'pitch-followup': 6,
  },
  afternoon: {
    'follow-up': 10,
    'polite-decline': 6,
    'pitch-followup': 8,
    'objection-price': 6,
  },
  evening: {
    'thank-colleague': 8,
    'follow-up': 6,
    'closing-nudge': 8,
    're-engagement': 6,
  },
};

export function getScenarioBoost(scenarioId: string, timeBand: TimeBand): number {
  return TIME_BAND_SCENARIO_BOOST[timeBand][scenarioId] ?? 0;
}

export function getAllScenarioIds(): readonly string[] {
  return REGISTRY_SCENARIO_IDS;
}
