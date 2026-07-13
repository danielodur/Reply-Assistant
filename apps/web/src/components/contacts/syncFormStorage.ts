export function loadSyncDraft<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as T;
    if (!parsed || typeof parsed !== 'object') {
      return fallback;
    }

    return parsed;
  } catch {
    return fallback;
  }
}

export function saveSyncDraft<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeSyncDraft(key: string): void {
  localStorage.removeItem(key);
}
