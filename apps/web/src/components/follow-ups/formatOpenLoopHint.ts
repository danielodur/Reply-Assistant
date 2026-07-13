import { interpolate, type AppTranslations } from '../../i18n/translations';
import type { OpenLoop } from './detectOpenLoops';

const ONE_MINUTE_MS = 60 * 1000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

/**
 * Phase 19 — formats a single open loop into a calm one-line hint.
 *
 * Reads like: "Waiting on Sarah Chen · overdue by ~4 days".
 * The unit picker chooses days / hours / minutes based on `overdueMs` so
 * we never report "overdue by 0 days" or "overdue by 5,873 minutes".
 */
export function formatOpenLoopHint(
  loop: OpenLoop,
  copy: AppTranslations['followUps'],
): string {
  const waiting = interpolate(copy.waitingOn, { name: loop.contactName });

  let overdueText: string;
  if (loop.overdueMs >= ONE_DAY_MS) {
    const days = Math.max(1, Math.round(loop.overdueMs / ONE_DAY_MS));
    overdueText = interpolate(days === 1 ? copy.overdueOneDay : copy.overdueDays, { days });
  } else if (loop.overdueMs >= ONE_HOUR_MS) {
    const hours = Math.max(1, Math.round(loop.overdueMs / ONE_HOUR_MS));
    overdueText = interpolate(copy.overdueHours, { hours });
  } else {
    const minutes = Math.max(1, Math.round(loop.overdueMs / ONE_MINUTE_MS));
    overdueText = interpolate(copy.overdueMinutes, { minutes });
  }

  return `${waiting}${copy.separator}${overdueText}`;
}
