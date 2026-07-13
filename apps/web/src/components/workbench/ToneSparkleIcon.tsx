type ToneSparkleIconProps = {
  className?: string;
};

/** Outline sparkles — bright magenta on plum (matches reference asset). */
export default function ToneSparkleIcon({ className = 'h-[20px] w-[20px]' }: ToneSparkleIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <g transform="translate(12 12) scale(1.14) translate(-12 -12)">
        <path
          d="M12 13.4 13.15 16.35 16.1 17.2 13.15 18.05 12 21 10.85 18.05 7.9 17.2 10.85 16.35 12 13.4Z"
          stroke="currentColor"
          strokeWidth="2.35"
          strokeLinejoin="round"
        />
        <path
          d="M8 7.8 8.72 9.42 10.35 10.15 8.72 10.88 8 12.5 7.28 10.88 5.65 10.15 7.28 9.42 8 7.8Z"
          stroke="currentColor"
          strokeWidth="2.05"
          strokeLinejoin="round"
        />
        <path
          d="M16 7.8 16.72 9.42 18.35 10.15 16.72 10.88 16 12.5 15.28 10.88 13.65 10.15 15.28 9.42 16 7.8Z"
          stroke="currentColor"
          strokeWidth="2.05"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export function toneSparkleButtonClassName(compactMode: boolean): string {
  return [
    'flex items-center justify-center rounded-full transition',
    'border border-[#9a8490] bg-[#4a2f3f] text-[#ff6eb8]',
    'shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_8px_20px_rgba(74,47,63,0.45)]',
    'hover:border-[#d4a8bc] hover:bg-[#553545] hover:text-[#ff8ec8]',
    'hover:shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_10px_24px_rgba(232,92,139,0.28)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8ec8]/70',
    compactMode ? 'h-9 w-9' : 'h-10 w-10',
  ].join(' ');
}
