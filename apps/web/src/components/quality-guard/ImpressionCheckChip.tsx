import type { AppTranslations } from '../../i18n/translations';
import type { ImpressionCheckResult, ImpressionReasonKey, ImpressionStatus } from './impressionCheck';

type ImpressionCheckChipProps = {
  copy: AppTranslations;
  result: ImpressionCheckResult;
  onAutoSoften?: () => void;
  className?: string;
};

const REASON_LOOKUP: Record<ImpressionReasonKey, keyof AppTranslations['floating']> = {
  'formality-too-casual-for-vip':    'impressionReasonFormalityTooCasualForVip',
  'formality-too-casual-for-leader': 'impressionReasonFormalityTooCasualForLeader',
  'formality-too-stiff-for-casual':  'impressionReasonFormalityTooStiffForCasual',
  'tone-risk-aggressive':            'impressionReasonToneAggressive',
  'tone-risk-passive':               'impressionReasonTonePassive',
  'tone-risk-overpromise':           'impressionReasonToneOverpromise',
  'length-too-brief':                'impressionReasonLengthTooBrief',
  'length-too-long':                 'impressionReasonLengthTooLong',
};

function statusGlyph(status: ImpressionStatus): string {
  return status === 'ok' ? '✓' : '⚠';
}

function statusClass(status: ImpressionStatus): string {
  return status === 'ok'
    ? 'text-emerald-600'
    : 'text-amber-600';
}

function reasonText(copy: AppTranslations, reasonKey: ImpressionReasonKey | null): string | null {
  if (!reasonKey) return null;
  const key = REASON_LOOKUP[reasonKey];
  if (!key) return null;
  return copy.floating[key] ?? null;
}

function StatusRow({
  label,
  status,
  reason,
  copy,
}: {
  label: string;
  status: ImpressionStatus;
  reason: string | null;
  copy: AppTranslations;
}) {
  return (
    <li className="flex items-start gap-2">
      <span className={`shrink-0 text-[11px] font-bold leading-4 ${statusClass(status)}`} aria-hidden="true">
        {statusGlyph(status)}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-slate-700">
          {label}
          <span className="ml-1 font-normal text-slate-400">
            · {status === 'ok' ? copy.floating.impressionStatusOk : copy.floating.impressionStatusWarn}
          </span>
        </p>
        {reason ? (
          <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{reason}</p>
        ) : null}
      </div>
    </li>
  );
}

/**
 * Calm 3-row card surfacing the local impression check. Hidden entirely when
 * everything is OK so the modal stays clean.
 */
export default function ImpressionCheckChip({ copy, result, onAutoSoften, className = '' }: ImpressionCheckChipProps) {
  if (!result.hasWarning) return null;

  return (
    <aside
      role="note"
      className={[
        'mt-2 rounded-[10px] border border-amber-100 bg-amber-50/70 px-2.5 py-1.5',
        className,
      ].filter(Boolean).join(' ')}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-700">
          {copy.floating.impressionCheckTitle}
        </p>
        {onAutoSoften ? (
          <button
            type="button"
            onClick={onAutoSoften}
            className="rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[9px] font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-50"
          >
            {copy.floating.impressionAutoSoften}
          </button>
        ) : null}
      </div>
      <ul className="mt-1 space-y-1">
        <StatusRow
          copy={copy}
          label={copy.floating.impressionFormalityLabel}
          status={result.formality.status}
          reason={reasonText(copy, result.formality.reasonKey)}
        />
        <StatusRow
          copy={copy}
          label={copy.floating.impressionToneLabel}
          status={result.toneRisk.status}
          reason={reasonText(copy, result.toneRisk.reasonKey)}
        />
        <StatusRow
          copy={copy}
          label={copy.floating.impressionLengthLabel}
          status={result.length.status}
          reason={reasonText(copy, result.length.reasonKey)}
        />
      </ul>
    </aside>
  );
}
