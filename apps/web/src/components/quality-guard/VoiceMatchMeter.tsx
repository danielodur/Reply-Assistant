import type { AppTranslations } from '../../i18n/translations';
import { interpolate } from '../../i18n/translations';
import type { VoiceMatchResult } from './voiceMatch';

type VoiceMatchMeterProps = {
  copy: AppTranslations;
  result: VoiceMatchResult;
  className?: string;
};

function labelFor(copy: AppTranslations, result: VoiceMatchResult): string {
  switch (result.state) {
    case 'similar':
      return copy.floating.voiceMatchSimilar;
    case 'different':
      return copy.floating.voiceMatchDifferent;
    case 'learning':
      return copy.floating.voiceMatchLearning;
    default:
      return copy.floating.voiceMatchUnknown;
  }
}

function toneClass(result: VoiceMatchResult): string {
  switch (result.state) {
    case 'similar':
      return 'border-emerald-100 bg-emerald-50/80 text-emerald-700';
    case 'different':
      return 'border-amber-100 bg-amber-50/80 text-amber-700';
    case 'learning':
      return 'border-slate-100 bg-slate-50/70 text-slate-500';
    default:
      return 'border-slate-100 bg-slate-50/70 text-slate-400';
  }
}

/**
 * Compact one-row chip: tells the user whether the draft sounds like their
 * usual voice for this contact. Hidden in the 'unknown' state so we never
 * surface an empty signal.
 */
export default function VoiceMatchMeter({ copy, result, className = '' }: VoiceMatchMeterProps) {
  if (result.state === 'unknown') return null;

  const subtitle = result.sampleCount > 0
    ? interpolate(copy.floating.voiceMatchSampleCount, { count: String(result.sampleCount) })
    : '';

  return (
    <aside
      className={[
        'mt-2 inline-flex items-center gap-2 rounded-full border px-2.5 py-1',
        toneClass(result),
        className,
      ].filter(Boolean).join(' ')}
    >
      <span className="text-[10px] font-semibold leading-none">{labelFor(copy, result)}</span>
      {subtitle ? (
        <span className="text-[9px] font-medium leading-none opacity-80">{subtitle}</span>
      ) : null}
    </aside>
  );
}
