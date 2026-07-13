import type { CSSProperties } from 'react';

type SmartWritingReminderProps = {
  label: string;
  onApply: () => void;
  onDismiss: () => void;
  className?: string;
  style?: CSSProperties;
};

/**
 * Compact slate correction chip under the word (Tab, Space, or click label to apply).
 */
export default function SmartWritingReminder({
  label,
  onApply,
  onDismiss,
  className,
  style,
}: SmartWritingReminderProps) {
  return (
    <div
      className={className ?? 'pointer-events-auto absolute right-2 top-2 z-20'}
      style={style}
    >
      <div
        className={[
          'inline-flex max-w-[min(100%,220px)] items-stretch overflow-hidden rounded-[11px]',
          'border border-slate-500/20 bg-[#9ca3af] text-white',
          'shadow-[0_3px_10px_rgba(15,23,42,0.10)]',
        ].join(' ')}
      >
        <button
          type="button"
          title="Apply suggestion (Tab, Space, click word, or tap here)"
          className="min-w-0 flex-1 px-1.5 py-0.5 text-left text-[10px] font-semibold leading-snug tracking-[-0.01em] transition active:bg-white/14"
          onClick={onApply}
        >
          <span className="line-clamp-2 break-words">{label}</span>
        </button>
        <span className="my-0.5 w-px shrink-0 bg-white/30" aria-hidden="true" />
        <button
          type="button"
          aria-label="Dismiss suggestion"
          className="flex w-6 shrink-0 items-center justify-center text-[11px] font-medium leading-none text-white/90 transition hover:bg-white/10 active:bg-white/16"
          onClick={onDismiss}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
