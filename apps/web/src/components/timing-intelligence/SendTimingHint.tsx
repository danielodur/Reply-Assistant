import { interpolate, type AppTranslations } from '../../i18n/translations';
import type { SendTimingHint as SendTimingHintData } from './deriveSendTimingHint';

type SendTimingHintProps = {
  copy: AppTranslations;
  hint: SendTimingHintData | null;
};

function formatHour(hour: number): string {
  // 24-hour `HH:00` reads cleanly in both EN and ZH without locale guessing.
  return `${hour.toString().padStart(2, '0')}:00`;
}

/**
 * Phase 19 — tiny inline send-timing hint above the Copy button.
 *
 * Returns `null` when no hint is available. When present, renders a single
 * pale slate sentence. The Copy button is never blocked; this is a calm
 * whisper, not a guard.
 */
export default function SendTimingHint({ copy, hint }: SendTimingHintProps) {
  if (!hint) return null;
  const timingCopy = copy.sendTiming;
  const hourLabel = formatHour(hint.recommendedHour);
  const sentence = interpolate(timingCopy.recommendedTime, { time: hourLabel });

  return (
    <p
      className="mt-2 text-[10px] text-slate-500"
      data-send-timing-hint={hint.recommendedHour}
    >
      <span className="font-semibold uppercase tracking-[0.06em] text-slate-400">
        {timingCopy.eyebrow}:
      </span>{' '}
      {sentence}
    </p>
  );
}
