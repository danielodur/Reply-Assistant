import type { CSSProperties } from 'react';
import type { AppTranslations } from '../../i18n/translations';
import { interpolate } from '../../i18n/translations';
import type { GuidedTourStep } from './useGuidedTour';
import { GUIDED_TOUR_STEPS } from './useGuidedTour';

type GuidedTourTooltipProps = {
  copy: AppTranslations;
  step: GuidedTourStep;
  position: { left: number; top: number };
  arrow: 'top' | 'bottom';
  isLastStep: boolean;
  onNext: () => void;
  onSkip: () => void;
};

const TOOLTIP_WIDTH = 240;

/**
 * Calm pink tooltip card. Positioned by the layer; renders the step copy and
 * Next / Skip controls. The arrow points back at the anchor so the user
 * knows which surface the tip is talking about.
 */
export default function GuidedTourTooltip({
  copy,
  step,
  position,
  arrow,
  isLastStep,
  onNext,
  onSkip,
}: GuidedTourTooltipProps) {
  const stepCopy = copy.guidedTour.steps[step];
  const currentIndex = GUIDED_TOUR_STEPS.indexOf(step) + 1;
  const total = GUIDED_TOUR_STEPS.length;

  const style: CSSProperties = {
    width: `${TOOLTIP_WIDTH}px`,
    left: `${position.left}px`,
    top: `${position.top}px`,
  };

  return (
    <div
      className="pointer-events-auto absolute z-[120]"
      style={style}
      role="dialog"
      aria-modal="false"
      aria-label={stepCopy.title}
    >
      {arrow === 'top' ? <Arrow direction="top" /> : null}
      <div className="rounded-[14px] border border-[#f1c4d6] bg-white p-3 shadow-[0_20px_44px_rgba(15,23,42,0.18)]">
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#b85d83]">
          {interpolate(copy.guidedTour.stepCount, { current: String(currentIndex), total: String(total) })}
        </p>
        <p className="mt-1 text-[12px] font-semibold leading-snug text-slate-900">{stepCopy.title}</p>
        <p className="mt-1 text-[10.5px] leading-snug text-slate-500">{stepCopy.body}</p>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="text-[10px] font-medium text-slate-400 transition hover:text-[#c15480]"
          >
            {copy.guidedTour.skip}
          </button>
          <button
            type="button"
            onClick={onNext}
            className="rounded-full bg-[#E85C8B] px-3 py-1.5 text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(232,92,139,0.22)] transition hover:bg-[#d94f7f]"
          >
            {isLastStep ? copy.guidedTour.finish : copy.guidedTour.next}
          </button>
        </div>
      </div>
      {arrow === 'bottom' ? <Arrow direction="bottom" /> : null}
    </div>
  );
}

function Arrow({ direction }: { direction: 'top' | 'bottom' }) {
  const isTop = direction === 'top';
  return (
    <div
      aria-hidden="true"
      className={[
        'mx-auto h-3 w-3 rotate-45 border bg-white',
        isTop
          ? '-mb-2 border-t border-l border-[#f1c4d6]'
          : '-mt-2 border-b border-r border-[#f1c4d6]',
      ].join(' ')}
    />
  );
}
