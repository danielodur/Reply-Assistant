import type { ContactStage } from '../../config/contactThreads';
import type { RecipientProfile, WorkMode } from '../workbench/types';

/**
 * Single source of truth for scenario metadata.
 *
 * Previously this lived in two places (InstantAmmo's chip strip and the
 * smart-suggestion activation map in FloatingAssistant). Phase 8 consolidates
 * both, which means adding or editing a scenario now requires changing just
 * one file plus its bilingual copy entries.
 *
 * The i18n bundle owns labels and prompts; this module owns the *behavior*
 * (which recipient profile, text type, and work mode each scenario maps to).
 */

export type ScenarioId =
  // Office workflow (carried over from before Phase 8)
  | 'running-late'
  | 'polite-decline'
  | 'follow-up'
  | 'ask-extension'
  | 'thank-colleague'
  | 'escalate'
  // Sales pack (added in Phase 8)
  | 'cold-outreach'
  | 'pitch-followup'
  | 'objection-price'
  | 'closing-nudge'
  | 're-engagement';

export type ScenarioMetadata = {
  id: ScenarioId;
  emoji: string;
  recipient: RecipientProfile;
  textType: string;
  workMode: WorkMode;
  /** True when this scenario is part of the sales pack (used for ranking + analytics). */
  sales: boolean;
};

export const SCENARIO_REGISTRY: ScenarioMetadata[] = [
  { id: 'running-late',    emoji: '⏰', recipient: 'leader',          textType: 'apologetic-polite',   workMode: 'internal', sales: false },
  { id: 'polite-decline',  emoji: '🙏', recipient: 'existing-client', textType: 'apologetic-polite',   workMode: 'reply',    sales: false },
  { id: 'follow-up',       emoji: '📬', recipient: 'existing-client', textType: 'follow-up',           workMode: 'reply',    sales: false },
  { id: 'ask-extension',   emoji: '📅', recipient: 'leader',          textType: 'apologetic-polite',   workMode: 'internal', sales: false },
  { id: 'thank-colleague', emoji: '🤝', recipient: 'colleague',       textType: 'casual-friendly',     workMode: 'internal', sales: false },
  { id: 'escalate',        emoji: '🚨', recipient: 'leader',          textType: 'formal-professional', workMode: 'internal', sales: false },
  { id: 'cold-outreach',   emoji: '🎯', recipient: 'new-lead',        textType: 'persuasive',          workMode: 'reply',    sales: true  },
  { id: 'pitch-followup',  emoji: '🚀', recipient: 'existing-client', textType: 'follow-up',           workMode: 'reply',    sales: true  },
  { id: 'objection-price', emoji: '💬', recipient: 'existing-client', textType: 'persuasive',          workMode: 'reply',    sales: true  },
  { id: 'closing-nudge',   emoji: '🤝', recipient: 'new-lead',        textType: 'persuasive',          workMode: 'reply',    sales: true  },
  { id: 're-engagement',   emoji: '🌱', recipient: 'existing-client', textType: 'follow-up',           workMode: 'reply',    sales: true  },
];

const REGISTRY_BY_ID = SCENARIO_REGISTRY.reduce<Record<string, ScenarioMetadata>>((acc, scenario) => {
  acc[scenario.id] = scenario;
  return acc;
}, {});

export function getScenarioById(id: string): ScenarioMetadata | undefined {
  return REGISTRY_BY_ID[id];
}

export function getAllScenarioMetadata(): ScenarioMetadata[] {
  return SCENARIO_REGISTRY;
}

/**
 * Contact-stage boost — drives the Phase 8 "stage-aware Quick Start" promise.
 *
 * The numbers are deliberately small so they nudge the order without crowding
 * out the existing time-of-day boosts. Returns 0 when no contact is selected
 * or when the stage doesn't pair with this scenario.
 */
const STAGE_SCENARIO_BOOST: Record<ContactStage, Partial<Record<ScenarioId, number>>> = {
  'new-lead': {
    'cold-outreach': 18,
    'closing-nudge': 12,
    'objection-price': 6,
  },
  'active-client': {
    'pitch-followup': 14,
    're-engagement': 6,
    'follow-up': 8,
  },
  'vip-client': {
    'pitch-followup': 12,
    'objection-price': 8,
    'closing-nudge': 6,
  },
  'follow-up': {
    'pitch-followup': 10,
    're-engagement': 14,
    'follow-up': 8,
  },
  closed: {
    're-engagement': 16,
  },
  internal: {
    'thank-colleague': 6,
    escalate: 4,
  },
};

export function getScenarioStageBoost(scenarioId: string, stage: ContactStage | null | undefined): number {
  if (!stage) return 0;
  return STAGE_SCENARIO_BOOST[stage]?.[scenarioId as ScenarioId] ?? 0;
}

/** Bare list of scenario IDs in registry order — used as a stable default for the strip. */
export const ALL_SCENARIO_IDS: readonly ScenarioId[] = SCENARIO_REGISTRY.map(scenario => scenario.id);
