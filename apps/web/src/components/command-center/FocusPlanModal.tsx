import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { AppTranslations } from '../../i18n/translations';
import type { FocusPlanItem } from './focusPlan';

const MODAL_WIDTH = 360;
const NOTCH_FROM_LEFT = 34;
const GAP_BELOW_ICON = 14;
const EDGE_MARGIN = 10;
const FALLBACK_TOP = 56;

type PopoverPosition = { left: number; top: number; notchLeft: number };

type FocusPlanModalProps = {
  copy: AppTranslations;
  items: FocusPlanItem[];
  loading: boolean;
  onClose: () => void;
  onRunItem: (item: FocusPlanItem) => void;
};

const rankLabelKey: Record<FocusPlanItem['rank'], 'rankNow' | 'rankNext' | 'rankLater'> = {
  now: 'rankNow',
  next: 'rankNext',
  later: 'rankLater',
};

/** Minute estimate as a short secondary hint — never replaces the timing label. */
function estimateHint(item: FocusPlanItem, copy: AppTranslations): string | undefined {
  if (!item.estimateMinutes) return undefined;
  return copy.focusPlan.estimateMinutes.replace('{{minutes}}', String(item.estimateMinutes));
}

export default function FocusPlanModal({
  copy,
  items,
  loading,
  onClose,
  onRunItem,
}: FocusPlanModalProps) {
  const c = copy.focusPlan;
  const [primary, ...secondary] = items;
  const sectionRef = useRef<HTMLElement>(null);
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<PopoverPosition | null>(null);

  // Anchor the popover to the header warning icon: it drops just below the icon
  // (so it never covers it) and its notch sits exactly on the icon's centre.
  useLayoutEffect(() => {
    function measure() {
      const anchor = document.querySelector('[data-focus-plan-anchor]');
      if (!anchor) {
        setPos(null);
        return;
      }
      const rect = anchor.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const top = Math.min(rect.bottom + GAP_BELOW_ICON, window.innerHeight - EDGE_MARGIN);
      const maxLeft = window.innerWidth - MODAL_WIDTH - EDGE_MARGIN;
      const left = Math.max(EDGE_MARGIN, Math.min(centerX - NOTCH_FROM_LEFT, maxLeft));
      const notchLeft = Math.max(16, Math.min(centerX - left, MODAL_WIDTH - 16));
      setPos({ left, top, notchLeft });
    }
    measure();
    // Re-measure across a couple of frames and on resize so the icon-anchored
    // placement settles after layout/animation work without widening the panel.
    const raf1 = requestAnimationFrame(measure);
    const raf2 = requestAnimationFrame(() => requestAnimationFrame(measure));
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => primaryActionRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !sectionRef.current) return;
      const focusable = sectionRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [onClose]);

  const stop = useCallback((event: React.MouseEvent) => event.stopPropagation(), []);

  if (!primary) return null;

  const isClear = primary.source === 'clear';
  const top = pos?.top ?? FALLBACK_TOP;
  const maxHeight = `calc(100vh - ${top + EDGE_MARGIN}px)`;

  return (
    <div
      className="fixed inset-0 z-[68]"
      role="presentation"
      onClick={onClose}
    >
      <section
        ref={sectionRef}
        role="dialog"
        aria-modal="true"
        aria-label={c.title}
        onClick={stop}
        style={pos
          ? { position: 'fixed', left: pos.left, top, width: MODAL_WIDTH, maxHeight }
          : { position: 'fixed', right: EDGE_MARGIN, top, width: MODAL_WIDTH, maxHeight }}
        className="focus-plan-pop flex flex-col overflow-hidden rounded-[22px] rounded-tl-[9px] border border-[#eadbd4] bg-[#fffdf9] p-3.5 shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <span
          aria-hidden="true"
          style={{ left: pos?.notchLeft ?? NOTCH_FROM_LEFT }}
          className="absolute -top-1.5 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px] border-l border-t border-[#eadbd4] bg-[#fffdf9]"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9c735c]">
              {c.eyebrow}
            </p>
            <h2 className="mt-0.5 truncate text-[15px] font-semibold text-slate-950">
              {c.title}
            </h2>
          </div>
          <button
            type="button"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#eadbd4] bg-white text-slate-500 transition hover:border-[#d7b7a7] hover:bg-[#fff5f9] hover:text-[#7d5b4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef96b7]/60"
            aria-label={c.close}
            title={c.close}
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
              <path d="M15 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="clean-scrollbar mt-3 min-h-0 overflow-y-auto pr-1">
        {isClear ? (
          <article className="flex flex-col items-center rounded-[18px] border border-[#eadbd4] bg-[linear-gradient(145deg,#fffdf9_0%,#fff7f2_54%,#f8fbff_100%)] px-4 py-5 text-center">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf7ef] text-[#3f9d6b]" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                <path d="M5 12.5l4 4 10-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p className="mt-2 text-[14px] font-semibold text-slate-950">{primary.title}</p>
            <p className="mt-1 text-[11px] leading-4 text-slate-500">{primary.body}</p>
            <button
              ref={primaryActionRef}
              type="button"
              disabled={loading}
              className="mt-3 rounded-full bg-[#2f2926] px-4 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#463b35] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              onClick={() => onRunItem(primary)}
            >
              {primary.cta}
            </button>
          </article>
        ) : (
          <article className="rounded-[18px] border border-[#eadbd4] bg-[linear-gradient(145deg,#fffdf9_0%,#fff7f2_54%,#f8fbff_100%)] p-3.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9c735c]">
              {c[rankLabelKey[primary.rank]]}
            </p>
            <p className="mt-1 text-[14px] font-semibold leading-5 text-slate-950">{primary.title}</p>
            <p className="mt-1 line-clamp-3 text-[11px] leading-[1.5] text-slate-500">{primary.body}</p>
            <p className="mt-1 line-clamp-2 text-[10px] font-medium leading-4 text-[#9c735c]">{primary.reason}</p>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <InfoPill label={c.whereLabel} value={primary.whereLabel} />
              <InfoPill label={c.whenLabel} value={primary.whenLabel} hint={estimateHint(primary, copy)} />
            </div>
            <button
              ref={primaryActionRef}
              type="button"
              disabled={loading}
              className={[
                'mt-3 w-full rounded-full px-3 py-2 text-[12px] font-semibold shadow-[0_10px_20px_rgba(145,93,67,0.16)] transition active:scale-[0.99]',
                loading
                  ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                  : 'bg-[#2f2926] text-white hover:bg-[#463b35] motion-safe:animate-do-now-cta',
              ].join(' ')}
              onClick={() => onRunItem(primary)}
            >
              {primary.cta}
            </button>
          </article>
        )}

        {secondary.length > 0 ? (
          <div className="mt-2.5 space-y-2.5">
            {secondary.map(item => (
              <button
                key={item.id}
                type="button"
                disabled={loading}
                className="group w-full rounded-[18px] border border-[#eadbd4] bg-white/82 p-3 text-left transition hover:border-[#d7b7a7] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef96b7]/60 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => onRunItem(item)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      {c[rankLabelKey[item.rank]]}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[13px] font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-[1.45] text-slate-500">{item.body}</p>
                    <p className="mt-1 text-[10px] text-[#9c735c]">
                      {item.whereLabel} · {item.whenLabel}
                      {estimateHint(item, copy) ? ` · ${estimateHint(item, copy)}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-[#eadbd4] bg-[#fff7fa] px-2 py-1 text-[10px] font-semibold text-[#b54e77] transition group-hover:border-[#e7aac2]">
                    {item.cta}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : null}
        </div>
      </section>
    </div>
  );
}

function InfoPill({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[12px] border border-white/80 bg-white/72 px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
      <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <p className="mt-0.5 truncate text-[11px] font-medium text-slate-700">
        {value}
        {hint ? <span className="text-slate-400"> · {hint}</span> : null}
      </p>
    </div>
  );
}
