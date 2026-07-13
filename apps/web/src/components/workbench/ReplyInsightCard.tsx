import type { ReplyInsight } from './generatedReplyTypes';

type ReplyInsightCardProps = {
  insight: ReplyInsight | null;
};

const riskPillClass: Record<ReplyInsight['riskLevel'], string> = {
  low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  high: 'border-rose-200 bg-rose-50 text-rose-700',
};

export default function ReplyInsightCard({ insight }: ReplyInsightCardProps) {
  if (!insight) return null;

  return (
    <section className="mt-3 rounded-[14px] border border-[#f1dce5] bg-[#fff9fb] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#cb5f89]">Reply intelligence</p>
        <span className={[
          'rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em]',
          riskPillClass[insight.riskLevel],
        ].join(' ')}>
          {insight.riskLevel} risk
        </span>
      </div>

      <div className="mt-2 space-y-1.5 text-[11px] leading-5 text-slate-600">
        <p><span className="font-semibold text-slate-700">Intent:</span> {insight.intentLabel}</p>
        <p><span className="font-semibold text-slate-700">Next action:</span> {insight.nextAction}</p>
        <p><span className="font-semibold text-slate-700">Follow-up:</span> {insight.followUp}</p>
      </div>
    </section>
  );
}
