import type { CmdKIntent } from '../cmd-k/intentRouter';

export const WORK_RHYTHM_STORAGE_KEY = 'replyAssistantWorkRhythm';
const MAX_EVENTS = 100;
const RHYTHM_WINDOW_MS = 14 * 86400000;

export type WorkRhythmEvent =
  | { kind: 'contact-selected'; contactId: string; at: number }
  | { kind: 'reply-copied'; contactId?: string; at: number }
  | { kind: 'quick-start'; scenarioId: string; at: number }
  | { kind: 'cmd-k'; intentKind: CmdKIntent['kind']; contactId?: string; at: number }
  | { kind: 'daily-brief-cta'; source: 'inbox' | 'needs-reply' | 'selected' | 'smart-reply' | 'draft-ready' | 'review-file' | 'add-detail' | 'follow-up' | 'clear'; at: number }
  | { kind: 'generate'; contactId?: string; textType?: string; at: number }
  | { kind: 'paste-start'; at: number }
  | { kind: 'smart-reply'; contactId: string; at: number };

type WorkRhythmEventInput =
  | Omit<Extract<WorkRhythmEvent, { kind: 'contact-selected' }>, 'at'>
  | Omit<Extract<WorkRhythmEvent, { kind: 'reply-copied' }>, 'at'>
  | Omit<Extract<WorkRhythmEvent, { kind: 'quick-start' }>, 'at'>
  | Omit<Extract<WorkRhythmEvent, { kind: 'cmd-k' }>, 'at'>
  | Omit<Extract<WorkRhythmEvent, { kind: 'daily-brief-cta' }>, 'at'>
  | Omit<Extract<WorkRhythmEvent, { kind: 'generate' }>, 'at'>
  | Omit<Extract<WorkRhythmEvent, { kind: 'paste-start' }>, 'at'>
  | Omit<Extract<WorkRhythmEvent, { kind: 'smart-reply' }>, 'at'>;

export function loadWorkRhythmEvents(): WorkRhythmEvent[] {
  try {
    const raw = localStorage.getItem(WORK_RHYTHM_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isWorkRhythmEvent).slice(-MAX_EVENTS);
  } catch {
    return [];
  }
}

function isWorkRhythmEvent(value: unknown): value is WorkRhythmEvent {
  if (!value || typeof value !== 'object') return false;
  const kind = (value as { kind?: unknown }).kind;
  return typeof kind === 'string' && typeof (value as { at?: unknown }).at === 'number';
}

export function appendWorkRhythmEvent(event: WorkRhythmEventInput): void {
  const next = [...loadWorkRhythmEvents(), { ...event, at: Date.now() }].slice(-MAX_EVENTS);
  localStorage.setItem(WORK_RHYTHM_STORAGE_KEY, JSON.stringify(next));
}

export function getRecentRhythmEvents(sinceMs = RHYTHM_WINDOW_MS): WorkRhythmEvent[] {
  const cutoff = Date.now() - sinceMs;
  return loadWorkRhythmEvents().filter(event => event.at >= cutoff);
}

export function countRhythmByContact(contactId: string, events = getRecentRhythmEvents()): number {
  return events.filter(event => {
    if (event.kind === 'contact-selected' && event.contactId === contactId) return true;
    if (event.kind === 'reply-copied' && event.contactId === contactId) return true;
    if (event.kind === 'generate' && event.contactId === contactId) return true;
    if (event.kind === 'cmd-k' && event.contactId === contactId) return true;
    if (event.kind === 'smart-reply' && event.contactId === contactId) return true;
    return false;
  }).length;
}

export function countRhythmByScenario(scenarioId: string, events = getRecentRhythmEvents()): number {
  return events.filter(event => event.kind === 'quick-start' && event.scenarioId === scenarioId).length;
}

export function countPasteStarts(events = getRecentRhythmEvents()): number {
  return events.filter(event => event.kind === 'paste-start').length;
}

export function getLastSelectedContactId(events = getRecentRhythmEvents()): string | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.kind === 'contact-selected') return event.contactId;
  }
  return null;
}
