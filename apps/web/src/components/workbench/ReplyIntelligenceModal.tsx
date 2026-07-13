import type { AppTranslations } from '../../i18n/translations';
import type { ReplyInsight } from './generatedReplyTypes';

type ReplyIntelligenceModalProps = {
  copy: AppTranslations;
  insight: ReplyInsight;
  onClose: () => void;
};

const riskPillClass: Record<ReplyInsight['riskLevel'], string> = {
  low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  high: 'border-red-200 bg-red-50 text-red-700',
};

export default function ReplyIntelligenceModal({ copy, insight, onClose }: ReplyIntelligenceModalProps) {
  const riskLabel = insight.riskLevel === 'high'
    ? copy.modal.highRisk
    : insight.riskLevel === 'medium'
      ? copy.modal.mediumRisk
      : copy.modal.lowRisk;

  return (
    <div className="absolute inset-0 z-[80] flex items-center justify-center bg-[#0f172a]/24 px-4 backdrop-blur-[2px]">
      <section className="w-full max-w-[360px] rounded-[22px] border border-[#efd7e2] bg-[linear-gradient(180deg,#ffffff,#fff8fb)] p-4 shadow-[0_28px_70px_rgba(15,23,42,0.20)]">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#cb5f89]">{copy.modal.intelligenceTitle}</p>
          <button
            type="button"
            className="rounded-full border border-[#eed9e2] px-2 py-1 text-[10px] text-slate-500 transition hover:border-[#e7aac2] hover:text-[#c15480]"
            onClick={onClose}
          >
            {copy.modal.close}
          </button>
        </div>

        <div className="mt-4 space-y-3 text-[12px] leading-6 text-slate-700">
          <p>
            <span className="font-semibold text-slate-900">{copy.modal.riskTypeLabel}:</span>{' '}
            <span className={['inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em]', riskPillClass[insight.riskLevel]].join(' ')}>
              {riskLabel}
            </span>
          </p>
          <p><span className="font-semibold text-slate-900">{copy.modal.intentLabel}:</span> {insight.intentLabel}</p>
          <p><span className="font-semibold text-slate-900">{copy.modal.nextActionLabel}:</span> {insight.nextAction}</p>
          <p><span className="font-semibold text-slate-900">{copy.modal.followUpLabel}:</span> {insight.followUp}</p>
        </div>
      </section>
    </div>
  );
}
