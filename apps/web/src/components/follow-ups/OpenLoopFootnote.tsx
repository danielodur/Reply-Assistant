import type { AppTranslations } from '../../i18n/translations';
import type { OpenLoop } from './detectOpenLoops';
import { formatOpenLoopHint } from './formatOpenLoopHint';

type OpenLoopFootnoteProps = {
  copy: AppTranslations;
  loop: OpenLoop | null;
  onSelectContact?: (contactId: string) => void;
};

/**
 * Phase 19 — calm footnote inside DailyBriefCard.
 *
 * Renders the single most overdue open loop as a tiny clickable hint
 * below the card body. Returns `null` when no loop is present so the
 * card height never grows unexpectedly. Tapping selects that contact
 * via the existing handler — no new navigation surface.
 */
export default function OpenLoopFootnote({ copy, loop, onSelectContact }: OpenLoopFootnoteProps) {
  if (!loop) return null;
  const hint = formatOpenLoopHint(loop, copy.followUps);
  const eyebrow = copy.followUps.eyebrow;

  return (
    <button
      type="button"
      onClick={() => onSelectContact?.(loop.contactId)}
      className="mt-2 inline-flex max-w-full items-center gap-1.5 truncate text-left text-[10px] text-slate-500 transition hover:text-[#b85d83] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef96b7]/60"
      data-open-loop-footnote={loop.contactId}
    >
      <span className="font-semibold uppercase tracking-[0.06em] text-slate-400">{eyebrow}:</span>
      <span className="truncate">{hint}</span>
    </button>
  );
}
