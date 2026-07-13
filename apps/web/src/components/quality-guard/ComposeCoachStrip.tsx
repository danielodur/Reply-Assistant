import { useEffect, useRef, useState } from 'react';
import type { AppTranslations } from '../../i18n/translations';
import type { ComposeCoachWarning, ComposeCoachWarningId } from './composeCoach';

type ComposeCoachStripProps = {
  copy: AppTranslations;
  warnings: ComposeCoachWarning[];
  /**
   * True when something heavier should own the user's attention — a modal,
   * an active next-step ring, the guided tour, an open match-confirm strip.
   * The coach yields silently to honor the one-calm-nudge invariant.
   */
  suppressed: boolean;
  /**
   * Triggered when the user taps "Fix" on a warning whose `intentForFix`
   * is non-null. The caller routes to the matching regenerate flow.
   */
  onFix: (warning: ComposeCoachWarning) => void;
};

const WARNING_COPY_KEY: Record<ComposeCoachWarningId, keyof AppTranslations['floating']['coach']> = {
  missingAsk: 'missingAsk',
  confrontational: 'confrontational',
  tooLong: 'tooLong',
  allCaps: 'allCaps',
};

const EXIT_MS = 220;

/**
 * Anti-clutter, dismissible coach toast.
 *
 * Visual rules:
 *   - Floats over the top of the composer box as a dull-grey contrast pill.
 *   - Zoom-in entry (scale + opacity + tiny translate-y), zoom-out exit.
 *   - One warning at a time, never a stacked list. Compact, single-row.
 *   - Renders nothing when there are no warnings, when `suppressed` is true,
 *     or when the user has dismissed every current warning id.
 *   - "Fix" only appears for warnings with a non-null `intentForFix`.
 *   - Close (×) lets the user acknowledge and clear the toast. Dismissed
 *     ids reset automatically once that warning leaves the active set.
 */
export default function ComposeCoachStrip({
  copy,
  warnings,
  suppressed,
  onFix,
}: ComposeCoachStripProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<'idle' | 'entering' | 'visible' | 'exiting'>('idle');
  const exitTimerRef = useRef<number | null>(null);
  const currentIdRef = useRef<string | null>(null);

  const activeWarning = !suppressed
    ? warnings.find(warning => !dismissedIds.has(warning.id)) ?? null
    : null;

  useEffect(() => {
    const liveIds = new Set(warnings.map(warning => warning.id));
    setDismissedIds(prev => {
      let changed = false;
      const next = new Set<string>();
      prev.forEach(id => {
        if (liveIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [warnings]);

  useEffect(() => {
    const nextId = activeWarning?.id ?? null;
    if (nextId === currentIdRef.current) return;
    currentIdRef.current = nextId;
    if (!nextId) {
      setPhase('idle');
      return;
    }
    setPhase('entering');
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => setPhase('visible'));
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
    };
  }, [activeWarning?.id]);

  useEffect(() => () => {
    if (exitTimerRef.current != null) {
      window.clearTimeout(exitTimerRef.current);
    }
  }, []);

  if (!activeWarning) return null;

  const coach = copy.floating.coach;
  const isVisible = phase === 'visible';

  const handleDismiss = () => {
    const id = activeWarning.id;
    setPhase('exiting');
    if (exitTimerRef.current != null) {
      window.clearTimeout(exitTimerRef.current);
    }
    exitTimerRef.current = window.setTimeout(() => {
      setDismissedIds(prev => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      exitTimerRef.current = null;
    }, EXIT_MS);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 bottom-[5rem] z-30 flex justify-center px-3"
      data-compose-coach="true"
    >
      <div
        key={activeWarning.id}
        className={[
          'pointer-events-auto inline-flex max-w-full items-center gap-2',
          'rounded-full border border-amber-200',
          'bg-white',
          'px-3 py-2 shadow-[0_20px_44px_-10px_rgba(218,143,73,0.32),0_2px_8px_rgba(31,24,18,0.08)]',
          'transition-[opacity,transform] duration-[480ms] will-change-transform',
          isVisible
            ? 'scale-100 opacity-100 translate-y-0 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
            : 'scale-[0.55] opacity-0 translate-y-4 ease-out',
        ].join(' ')}
      >
        <span
          aria-hidden="true"
          className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold leading-none text-white shadow-[0_2px_6px_rgba(218,143,73,0.45)]"
        >
          !
        </span>
        <span className="flex min-w-0 items-baseline gap-1.5">
          <span className="hidden text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-700 sm:inline">
            {coach.eyebrow}
          </span>
          <span className="min-w-0 truncate text-[11px] font-medium leading-4 text-[#1f1812]">
            {coach[WARNING_COPY_KEY[activeWarning.id]]}
          </span>
        </span>
        {activeWarning.intentForFix ? (
          <button
            type="button"
            className="flex-none rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 transition hover:border-amber-400 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            onClick={() => onFix(activeWarning)}
            data-compose-coach-fix={activeWarning.id}
          >
            {coach.fix}
          </button>
        ) : null}
        <button
          type="button"
          aria-label={coach.dismiss}
          title={coach.dismiss}
          className="flex h-5 w-5 flex-none items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          onClick={handleDismiss}
          data-compose-coach-dismiss="true"
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
