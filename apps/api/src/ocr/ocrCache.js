const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const cache = new Map();

export function getCachedOcrResult(hash) {
  const key = String(hash || "");
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.result;
}

export function setCachedOcrResult(hash, result, ttlMs = THIRTY_DAYS_MS) {
  const key = String(hash || "");
  if (!key) return;
  cache.set(key, {
    result,
    expiresAt: Date.now() + ttlMs,
  });
}
