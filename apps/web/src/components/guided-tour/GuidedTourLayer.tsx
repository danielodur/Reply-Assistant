import { useEffect, useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { AppTranslations } from '../../i18n/translations';
import type { GuidedTourStep } from './useGuidedTour';
import { GUIDED_TOUR_STEPS } from './useGuidedTour';
import GuidedTourTooltip from './GuidedTourTooltip';

type GuidedTourLayerProps = {
  copy: AppTranslations;
  activeStep: GuidedTourStep | null;
  containerRef: RefObject<HTMLElement | null>;
  onNext: () => void;
  onSkip: () => void;
};

const ANCHOR_BY_STEP: Record<GuidedTourStep, string> = {
  'daily-brief': 'daily-brief-cta',
  'add-contact': 'add-contact',
  'quick-start': 'quick-start',
  'cmd-k': 'cmd-k',
};

const TOOLTIP_WIDTH = 240;
const VERTICAL_OFFSET = 12;
const SIDE_PADDING = 12;

type Position = { left: number; top: number; arrow: 'top' | 'bottom' };

/**
 * Picks the best position for the tooltip relative to the panel container:
 *  - Default below the anchor (arrow on top).
 *  - Flip above when below would overflow the panel bottom.
 *  - Clamp horizontally so the card never escapes the panel edges.
 */
function computePosition(anchor: DOMRect, container: DOMRect): Position {
  const tooltipHeight = 110; // approximate — enough for clamping
  const preferBelow = anchor.bottom + tooltipHeight + VERTICAL_OFFSET < container.bottom;

  const top = preferBelow
    ? anchor.bottom - container.top + VERTICAL_OFFSET
    : anchor.top - container.top - tooltipHeight - VERTICAL_OFFSET;

  const desiredLeft = anchor.left - container.left + anchor.width / 2 - TOOLTIP_WIDTH / 2;
  const maxLeft = container.width - TOOLTIP_WIDTH - SIDE_PADDING;
  const left = Math.max(SIDE_PADDING, Math.min(desiredLeft, maxLeft));

  return {
    left,
    top,
    arrow: preferBelow ? 'top' : 'bottom',
  };
}

/**
 * Overlay that anchors a single tooltip to whichever surface the current tour
 * step targets. Renders nothing when no step is active or when the anchor
 * is not currently mounted (e.g. tour shifts before the surface appears).
 */
export default function GuidedTourLayer({
  copy,
  activeStep,
  containerRef,
  onNext,
  onSkip,
}: GuidedTourLayerProps) {
  const [position, setPosition] = useState<Position | null>(null);

  // Recompute on step change, scroll, and resize.
  useLayoutEffect(() => {
    if (!activeStep) {
      setPosition(null);
      return;
    }
    const container = containerRef.current;
    if (!container) {
      setPosition(null);
      return;
    }

    const update = () => {
      const anchor = container.querySelector<HTMLElement>(
        `[data-tour-anchor="${ANCHOR_BY_STEP[activeStep]}"]`,
      );
      if (!anchor) {
        setPosition(null);
        return;
      }
      const anchorRect = anchor.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setPosition(computePosition(anchorRect, containerRect));
    };

    update();

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(container);
    window.addEventListener('resize', update);
    container.addEventListener('scroll', update, true);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', update);
      container.removeEventListener('scroll', update, true);
    };
  }, [activeStep, containerRef]);

  // Escape skips the entire tour.
  useEffect(() => {
    if (!activeStep) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onSkip();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeStep, onSkip]);

  if (!activeStep || !position) return null;

  const isLastStep = GUIDED_TOUR_STEPS.indexOf(activeStep) === GUIDED_TOUR_STEPS.length - 1;

  return (
    <div className="pointer-events-none absolute inset-0 z-[115]">
      <GuidedTourTooltip
        copy={copy}
        step={activeStep}
        position={position}
        arrow={position.arrow}
        isLastStep={isLastStep}
        onNext={onNext}
        onSkip={onSkip}
      />
    </div>
  );
}
