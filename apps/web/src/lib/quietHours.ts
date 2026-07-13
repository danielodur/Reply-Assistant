/**
 * Quiet-hours helpers. Times are stored as plain "HH:MM" 24h strings so they
 * round-trip cleanly through localStorage and the settings UI. We never need
 * timezone math here — the window is anchored to the user's local clock.
 *
 * Wrap-around windows (e.g. 22:00 → 08:00) are supported: any time that is
 * either after the start or before the end falls inside the window.
 */

const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;

/** Returns true when `value` is a syntactically valid 24-hour HH:MM string. */
export function isValidTimeString(value: string): boolean {
  return TIME_PATTERN.test(value);
}

/**
 * Parses HH:MM into minutes-since-midnight. Returns null for malformed input
 * so callers can fall back to defaults without throwing.
 */
export function parseTimeString(value: string): number | null {
  const match = TIME_PATTERN.exec(value);
  if (!match) return null;
  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

/**
 * Formats a Date as the same "HH:MM" representation we store in settings.
 * Useful for the runtime check — gives us minutes-since-midnight without
 * pulling in date-fns or its peers.
 */
export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export type QuietHoursWindow = {
  enabled: boolean;
  start: string;
  end: string;
};

/**
 * True when `now` falls inside the configured quiet-hours window.
 *
 * Edge cases:
 *  - When the window is disabled, always returns false.
 *  - When start and end are equal, the window is treated as a no-op.
 *  - Wrap-around windows (start > end) span across midnight.
 *  - Invalid time strings disable the window so notifications never stop firing
 *    silently because of a typo.
 */
export function isWithinQuietHours(now: Date, window: QuietHoursWindow): boolean {
  if (!window.enabled) return false;
  const start = parseTimeString(window.start);
  const end = parseTimeString(window.end);
  if (start === null || end === null) return false;
  if (start === end) return false;

  const current = minutesOfDay(now);
  if (start < end) {
    return current >= start && current < end;
  }
  // Wrap-around: e.g. 22:00 → 08:00
  return current >= start || current < end;
}
