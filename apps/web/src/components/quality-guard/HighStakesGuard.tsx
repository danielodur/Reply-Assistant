import { useEffect } from 'react';
import type { AppTranslations } from '../../i18n/translations';
import type { RecipientProfile } from '../workbench/types';
import type { ImpressionCheckResult } from './impressionCheck';
import ImpressionCheckChip from './ImpressionCheckChip';

type HighStakesGuardProps = {
  open: boolean;
  copy: AppTranslations;
  recipient: RecipientProfile;
  impression: ImpressionCheckResult | null;
  onCancel: () => void;
  onConfirm: () => void;
};

function titleFor(copy: AppTranslations, recipient: RecipientProfile): string {
  if (recipient === 'leader') return copy.floating.highStakesGuardTitleLeader;
  return copy.floating.highStakesGuardTitleVip;
}

/**
 * Pre-copy confirmation for high-stakes recipients. Surfaces the impression
 * check inline so the user sees *why* we paused them. Escape and click-out
 * cancel the action; the parent decides whether to suppress this guard
 * entirely via settings.highStakesGuard.
 */
export default function HighStakesGuard({
  open,
  copy,
  recipient,
  impression,
  onCancel,
  onConfirm,
}: HighStakesGuardProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-[80] flex items-center justify-center bg-[#0f172a]/30 px-3 backdrop-blur-[3px]"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onCancel();
      }}
      role="dialog"
      aria-modal="true"
    >
      <section className="w-full max-w-[328px] rounded-[16px] border border-amber-100 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.20)]">
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-700">
          {copy.floating.highStakesGuardEyebrow}
        </p>
        <p className="mt-1 text-[14px] font-semibold leading-tight text-slate-900">
          {titleFor(copy, recipient)}
        </p>
        <p className="mt-1 text-[11px] leading-snug text-slate-500">
          {copy.floating.highStakesGuardBody}
        </p>

        {impression ? (
          <ImpressionCheckChip copy={copy} result={impression} />
        ) : null}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            onClick={onCancel}
          >
            {copy.floating.highStakesGuardCancel}
          </button>
          <button
            type="button"
            className="rounded-full bg-amber-500 px-4 py-2 text-[11px] font-semibold text-white shadow-[0_10px_24px_rgba(245,158,11,0.28)] transition hover:bg-amber-600"
            onClick={onConfirm}
          >
            {copy.floating.highStakesGuardConfirm}
          </button>
        </div>
      </section>
    </div>
  );
}
