import type { CSSProperties } from 'react';

type InlineGhostLayerProps = {
  value: string;
  /** Remaining characters of the predicted word (not the full word). */
  suffix: string;
  scrollLeft: number;
  scrollTop: number;
  className: string;
  suffixClassName?: string;
  style?: CSSProperties;
};

/**
 * Mirrors the textarea typography; keeps ghost suffix aligned with typed text while scrolling.
 */
export default function InlineGhostLayer({
  value,
  suffix,
  scrollLeft,
  scrollTop,
  className,
  suffixClassName = 'text-slate-400/75',
  style,
}: InlineGhostLayerProps) {
  if (!suffix) return null;

  return (
    <div
      aria-hidden="true"
      className={['pointer-events-none absolute z-0 overflow-hidden whitespace-pre-wrap break-words', className].join(' ')}
      style={{
        transform: `translate(${-scrollLeft}px, ${-scrollTop}px)`,
        ...style,
      }}
    >
      <span className="text-transparent">{value}</span>
      <span className={suffixClassName}>{suffix}</span>
    </div>
  );
}
