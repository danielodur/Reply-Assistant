import type { AppTranslations } from '../../i18n/translations';
import { computeOutcomeSignals } from './outcomeSignals';

type OutcomeSignalsRowProps = {
  copy: AppTranslations;
  draft: string;
};

/**
 * Phase 18 — outcome signals row beneath the draft.
 *
 * Three booleans rendered as ticks (active) or muted dots (inactive). No
 * percentages. No "confidence". The eyebrow says "Signals" so the user
 * reads them as deterministic checks, not predictions.
 *
 * Returns `null` for short drafts (`computeOutcomeSignals` returns null).
 */
export default function OutcomeSignalsRow({ copy, draft }: OutcomeSignalsRowProps) {
  const signals = computeOutcomeSignals(draft);
  if (!signals) return null;
  const signalsCopy = copy.outcomeSignals;

  const items: Array<{ label: string; active: boolean }> = [
    { label: signalsCopy.clarity, active: signals.hasClarity },
    { label: signalsCopy.hasClearCTA, active: signals.hasClearCTA },
    { label: signalsCopy.professional, active: signals.isProfessional },
  ];

  return (
    <p
      className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500"
      data-outcome-signals="true"
    >
      <span className="font-semibold uppercase tracking-[0.06em] text-slate-500">
        {signalsCopy.eyebrow}:
      </span>
      {items.map((item, index) => (
        <span
          key={item.label}
          className={[
            'inline-flex items-center gap-1',
            item.active ? 'text-emerald-700' : 'text-slate-400',
          ].join(' ')}
        >
          <span aria-hidden="true">{item.active ? '✓' : '·'}</span>
          <span>{item.label}</span>
          {index < items.length - 1 ? (
            <span aria-hidden="true" className="ml-1 text-slate-300">·</span>
          ) : null}
        </span>
      ))}
    </p>
  );
}
