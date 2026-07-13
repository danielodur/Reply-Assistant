import type { ContactThread } from '../../config/contactThreads';
import type { ContactPriority } from '../contacts/contactPriority';
import {
  countPasteStarts,
  countRhythmByContact,
  countRhythmByScenario,
  getLastSelectedContactId,
  getRecentRhythmEvents,
  type WorkRhythmEvent,
} from './workRhythmStore';
import {
  getAllScenarioIds,
  getScenarioBoost,
  getTimeBand,
  SMART_SUGGESTION_MAX,
  type SmartSuggestion,
  type TimeBand,
} from './types';
import { getScenarioStageBoost } from '../scenarios/scenarioRegistry';

export type BuildSmartSuggestionsInput = {
  contactThreads: ContactThread[];
  contactPriorityRows: Array<{ thread: ContactThread; priority: ContactPriority }>;
  selectedContactId: string | null;
  composerEmpty: boolean;
  rhythmEvents?: WorkRhythmEvent[];
  timeBand?: TimeBand;
};

function rhythmBoostForContact(contactId: string, events: WorkRhythmEvent[]): number {
  const count = countRhythmByContact(contactId, events);
  return Math.min(count * 4, 20);
}

function buildContactSuggestions(
  rows: Array<{ thread: ContactThread; priority: ContactPriority }>,
  events: WorkRhythmEvent[],
  selectedContactId: string | null,
): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];

  for (const { thread, priority } of rows) {
    const rhythmBoost = rhythmBoostForContact(thread.id, events);

    if (priority.nextActionIntent === 'reply') {
      suggestions.push({
        id: `reply:${thread.id}`,
        kind: 'reply-contact',
        score: priority.score + rhythmBoost + 10,
        contactId: thread.id,
        contactName: thread.name,
      });
    }

    if (priority.nextActionIntent === 'follow-up' || priority.suggestedAction === 'follow-up') {
      suggestions.push({
        id: `follow-up:${thread.id}`,
        kind: 'follow-up-contact',
        score: priority.score + rhythmBoost + 5,
        contactId: thread.id,
        contactName: thread.name,
        promptSeed: priority.promptSeed,
      });
    }
  }

  const lastSelectedId = getLastSelectedContactId(events);
  const resumeContactId = selectedContactId ?? lastSelectedId;
  if (resumeContactId) {
    const thread = rows.find(row => row.thread.id === resumeContactId)?.thread;
    if (thread) {
      const priority = rows.find(row => row.thread.id === resumeContactId)?.priority;
      suggestions.push({
        id: `resume:${thread.id}`,
        kind: 'resume-contact',
        score: (priority?.score ?? 15) + rhythmBoostForContact(thread.id, events) + 8,
        contactId: thread.id,
        contactName: thread.name,
      });
    }
  }

  return suggestions;
}

function buildScenarioSuggestions(
  events: WorkRhythmEvent[],
  timeBand: TimeBand,
  selectedContactId: string | null,
  rows: Array<{ thread: ContactThread; priority: ContactPriority }>,
): SmartSuggestion[] {
  const selectedRow = selectedContactId
    ? rows.find(row => row.thread.id === selectedContactId)
    : null;
  const selectedPriority = selectedRow?.priority ?? null;
  const selectedStage = selectedRow?.thread.stage ?? null;

  return getAllScenarioIds().map(scenarioId => {
    let score = countRhythmByScenario(scenarioId, events) * 5 + getScenarioBoost(scenarioId, timeBand);

    if (scenarioId === 'follow-up' && selectedPriority?.suggestedAction === 'follow-up') {
      score += 15;
    }
    if ((scenarioId === 'running-late' || scenarioId === 'thank-colleague' || scenarioId === 'ask-extension')
      && selectedPriority?.status === 'no-action-needed') {
      score += 4;
    }

    // Phase 8 — stage-aware sales boost. Lifts sales scenarios when the
    // currently-selected contact's stage matches their intent.
    score += getScenarioStageBoost(scenarioId, selectedStage);

    return {
      id: `scenario:${scenarioId}`,
      kind: 'quick-scenario' as const,
      score,
      scenarioId,
    };
  });
}

export function buildSmartSuggestions(input: BuildSmartSuggestionsInput): SmartSuggestion[] {
  const {
    contactThreads,
    contactPriorityRows,
    selectedContactId,
    composerEmpty,
    rhythmEvents = getRecentRhythmEvents(),
    timeBand = getTimeBand(),
  } = input;

  if (contactThreads.length === 0) {
    return [{
      id: 'add-contact',
      kind: 'add-contact',
      score: 100,
    }];
  }

  const suggestions: SmartSuggestion[] = [
    ...buildContactSuggestions(contactPriorityRows, rhythmEvents, selectedContactId),
    ...buildScenarioSuggestions(rhythmEvents, timeBand, selectedContactId, contactPriorityRows),
  ];

  if (composerEmpty && countPasteStarts(rhythmEvents) >= 2) {
    suggestions.push({
      id: 'paste-message',
      kind: 'paste-message',
      score: 25 + countPasteStarts(rhythmEvents) * 3,
    });
  }

  const deduped = new Map<string, SmartSuggestion>();
  for (const suggestion of suggestions) {
    const existing = deduped.get(suggestion.kind + (suggestion.contactId ?? suggestion.scenarioId ?? ''));
    if (!existing || suggestion.score > existing.score) {
      deduped.set(suggestion.kind + (suggestion.contactId ?? suggestion.scenarioId ?? ''), suggestion);
    }
  }

  return [...deduped.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, SMART_SUGGESTION_MAX);
}

export function getPrioritizedScenarioIds(suggestions: SmartSuggestion[]): string[] {
  const scenarioSuggestions = suggestions
    .filter(suggestion => suggestion.kind === 'quick-scenario' && suggestion.scenarioId)
    .sort((a, b) => b.score - a.score);

  const prioritized = scenarioSuggestions.map(suggestion => suggestion.scenarioId as string);
  const rest = getAllScenarioIds().filter(id => !prioritized.includes(id));
  return [...prioritized, ...rest];
}

export function getTopSmartSuggestion(suggestions: SmartSuggestion[]): SmartSuggestion | null {
  return suggestions[0] ?? null;
}

export function getPaletteSuggestions(suggestions: SmartSuggestion[]): SmartSuggestion[] {
  const contactFirst = suggestions.filter(suggestion =>
    suggestion.kind === 'reply-contact'
    || suggestion.kind === 'follow-up-contact'
    || suggestion.kind === 'resume-contact'
    || suggestion.kind === 'paste-message'
    || suggestion.kind === 'add-contact',
  );

  if (contactFirst.length >= 3) {
    return contactFirst.slice(0, 3);
  }

  return suggestions.slice(0, 3);
}
