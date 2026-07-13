import type { AppTranslations } from '../../i18n/translations';
import { REWRITE_MODES, type RewriteMode, type RewriteModeId } from './registry';

type RewriteModeStripProps = {
  copy: AppTranslations;
  onSelect: (mode: RewriteMode) => void;
  /** Disabled while the previous regenerate is still in flight. */
  loading?: boolean;
};

/**
 * Phase 18 — calm single-row rewrite affordance under the draft.
 *
 * Visual rules (anti-clutter):
 *   - One row, no wrap on the chips themselves (overflow scrolls subtly).
 *   - Eyebrow + chips share the same line — never two stacked rows.
 *   - Slate ghost styling so the strip reads as a quiet menu, not a banner.
 *   - Chips disabled (not hidden) while `loading` so the layout doesn't jump.
 */
export default function RewriteModeStrip({ copy, onSelect, loading = false }: RewriteModeStripProps) {
  const modesCopy = copy.rewriteModes;

  return (
    <div
      className="mt-3 flex items-center gap-2 overflow-x-auto rounded-[12px] border border-slate-200 bg-slate-50/60 px-3 py-2"
      data-rewrite-mode-strip="true"
    >
      <p className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.06em] text-slate-500">
        {modesCopy.eyebrow}
      </p>
      <div className="flex flex-1 items-center gap-1.5">
        {REWRITE_MODES.map(mode => (
          <button
            key={mode.id}
            type="button"
            disabled={loading}
            className={[
              'shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600 transition',
              'hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700',
              'disabled:cursor-not-allowed disabled:opacity-50',
            ].join(' ')}
            onClick={() => onSelect(mode)}
            data-rewrite-mode={mode.id}
          >
            {modesCopy[mode.id as RewriteModeId]}
          </button>
        ))}
      </div>
    </div>
  );
}
