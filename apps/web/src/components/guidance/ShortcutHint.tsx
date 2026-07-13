type ShortcutHintProps = {
  /** Pre-formatted shortcut text (e.g. "⌘↵" or "Ctrl+Enter"). */
  label: string;
  /** When true, the chip gently pulses to draw eyes to it. */
  pulsing?: boolean;
  className?: string;
};

/**
 * Tiny keyboard-shortcut chip rendered next to primary CTAs.
 * Calm by default; pulses only when the matching NextStepRing is active.
 *
 * Kept presentational — no state, no side effects.
 */
export default function ShortcutHint({ label, pulsing = false, className = '' }: ShortcutHintProps) {
  return (
    <kbd
      aria-hidden="true"
      className={[
        'pointer-events-none inline-flex items-center rounded-md bg-white/85 px-1 py-0.5 text-[8px] font-semibold leading-none tracking-tight text-[#7d5b4a] shadow-[0_2px_4px_rgba(15,23,42,0.08)]',
        pulsing ? 'next-step-shortcut-fade' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {label}
    </kbd>
  );
}

/** Returns the platform-correct shortcut for "Copy". */
export function copyShortcutLabel(isMacPlatform: boolean): string {
  return isMacPlatform ? '⌘⇧C' : 'Ctrl+Shift+C';
}

/** Returns the platform-correct shortcut for "Generate". */
export function generateShortcutLabel(isMacPlatform: boolean): string {
  return isMacPlatform ? '⌘↵' : 'Ctrl+↵';
}
