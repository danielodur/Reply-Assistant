import { useNextStepClass } from '../guidance/NextStepProvider';
import OpenLoopFootnote from '../follow-ups/OpenLoopFootnote';
import type { OpenLoop } from '../follow-ups/detectOpenLoops';
import type { AppTranslations } from '../../i18n/translations';

export type CommandCenterPrimary = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  reason?: string;
  microAsk?: {
    body: string;
    cta: string;
    onClick: () => void;
  };
  onClick: () => void;
};

type DailyBriefCardProps = {
  primary: CommandCenterPrimary;
  loading: boolean;
  nextStepHint?: string;
  /** Phase 19 — calm footnote for the single most-overdue open loop. */
  copy?: AppTranslations;
  openLoop?: OpenLoop | null;
  onSelectOpenLoopContact?: (contactId: string) => void;
};

export default function DailyBriefCard({
  primary,
  loading,
  nextStepHint,
  copy,
  openLoop = null,
  onSelectOpenLoopContact,
}: DailyBriefCardProps) {
  const ringClass = useNextStepClass('pick-contact');
  return (
    <section className="mb-2 rounded-[16px] border border-[#f1d7e0] bg-[#fffafb] p-2 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef96b7]/60"
          onClick={primary.onClick}
        >
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#b85d83]">
            {primary.eyebrow}
          </p>
          <p className="mt-1 truncate text-[13px] font-semibold text-slate-950">
            {primary.title}
          </p>
          <p className="mt-0.5 truncate text-[10px] leading-4 text-slate-500">
            {primary.body}
          </p>
          {primary.reason ? (
            <p className="mt-1 truncate text-[9px] font-medium text-[#9c735c]">
              {primary.reason}
            </p>
          ) : null}
        </button>
        <button
          type="button"
          data-tour-anchor="daily-brief-cta"
          disabled={loading}
          aria-label={nextStepHint ? `${primary.cta} — ${nextStepHint}` : primary.cta}
          title={nextStepHint ?? undefined}
          className={[
            'shrink-0 rounded-full px-3 py-1.5 text-[10px] font-semibold transition active:scale-[0.98]',
            loading ? 'cursor-not-allowed bg-slate-200 text-slate-400' : 'bg-[#2f2926] text-white hover:bg-[#463b35]',
            ringClass,
          ].filter(Boolean).join(' ')}
          onClick={primary.onClick}
        >
          {primary.cta}
        </button>
      </div>
      {primary.microAsk ? (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-[12px] border border-[#eadbd4] bg-white px-2.5 py-2">
          <p className="min-w-0 text-[10px] leading-4 text-slate-600">
            {primary.microAsk.body}
          </p>
          <button
            type="button"
            className="shrink-0 rounded-full border border-[#e7aac2] bg-[#fff5f9] px-2.5 py-1 text-[9px] font-semibold text-[#b54e77] transition hover:border-[#d67a9e]"
            onClick={primary.microAsk.onClick}
          >
            {primary.microAsk.cta}
          </button>
        </div>
      ) : null}
      {copy ? (
        <OpenLoopFootnote
          copy={copy}
          loop={openLoop}
          onSelectContact={onSelectOpenLoopContact}
        />
      ) : null}
    </section>
  );
}
