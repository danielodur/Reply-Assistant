/**
 * Per-contact "reply in" language preference, stored locally.
 *
 * Lightweight: a single localStorage record keyed by contactId. Stored
 * outside ContactMemoryProfile so we can evolve it without touching the
 * larger contact memory contract.
 *
 *   - 'en'   → always reply to this contact in English
 *   - 'zh'   → always reply to this contact in Chinese
 *   - 'auto' → use the detected inbound language; fall back to app default
 */

export type ReplyLanguagePreference = 'en' | 'zh' | 'auto';

const STORAGE_KEY = 'replyAssistantReplyLanguagePreferences';

type PreferenceMap = Record<string, ReplyLanguagePreference>;

function isPreference(value: unknown): value is ReplyLanguagePreference {
  return value === 'en' || value === 'zh' || value === 'auto';
}

function loadAll(): PreferenceMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const result: PreferenceMap = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof key === 'string' && isPreference(value)) {
        result[key] = value;
      }
    }
    return result;
  } catch {
    return {};
  }
}

function saveAll(map: PreferenceMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore quota / private-mode failures — preference is best-effort.
  }
}

export function readReplyLanguagePreference(contactId: string | null): ReplyLanguagePreference {
  if (!contactId) return 'auto';
  return loadAll()[contactId] ?? 'auto';
}

export function writeReplyLanguagePreference(contactId: string, preference: ReplyLanguagePreference): void {
  const map = loadAll();
  if (preference === 'auto') {
    if (!(contactId in map)) return;
    delete map[contactId];
  } else {
    map[contactId] = preference;
  }
  saveAll(map);
}

export function clearReplyLanguagePreferences(): void {
  saveAll({});
}
