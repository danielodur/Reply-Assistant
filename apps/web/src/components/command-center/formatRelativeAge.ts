import { interpolate, type AppTranslations } from '../../i18n/translations';

export function formatRelativeAge(
  timestamp: number | null,
  copy: AppTranslations['floating'],
): string {
  if (!timestamp) return copy.daysAgoShort.replace('{{count}}', '0');
  const diffMs = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return copy.justNow;
  if (minutes < 60) return interpolate(copy.minutesAgoShort, { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return interpolate(copy.hoursAgoShort, { count: hours });
  const days = Math.floor(hours / 24);
  return interpolate(copy.daysAgoShort, { count: days });
}
