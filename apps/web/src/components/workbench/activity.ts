const DAILY_KEY_PREFIX = 'replyAssistantDaily_';
const ACTIVE_DAYS_KEY = 'replyAssistantActiveDays';

export function getTodayKey(): string {
  return DAILY_KEY_PREFIX + new Date().toISOString().slice(0, 10);
}

export function loadTodayCount(): number {
  return Number.parseInt(localStorage.getItem(getTodayKey()) ?? '0', 10) || 0;
}

export function incrementTodayCount(): number {
  const next = loadTodayCount() + 1;
  localStorage.setItem(getTodayKey(), String(next));

  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(ACTIVE_DAYS_KEY);
    const days: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    if (!days.includes(today)) {
      const updated = [...days, today].slice(-365);
      localStorage.setItem(ACTIVE_DAYS_KEY, JSON.stringify(updated));
    }
  } catch {
    localStorage.setItem(ACTIVE_DAYS_KEY, JSON.stringify([today]));
  }

  return next;
}

export function computeStreak(): number {
  try {
    const raw = localStorage.getItem(ACTIVE_DAYS_KEY);
    if (!raw) return 0;

    const days = new Set<string>(JSON.parse(raw) as string[]);
    let streak = 0;
    const cursor = new Date();

    for (let index = 0; index < 365; index += 1) {
      const key = cursor.toISOString().slice(0, 10);
      if (!days.has(key)) {
        break;
      }
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  } catch {
    return 0;
  }
}
