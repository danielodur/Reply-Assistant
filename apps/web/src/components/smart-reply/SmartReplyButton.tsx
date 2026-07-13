import type { AppTranslations } from '../../i18n/translations';
import type { ContactThread } from '../../config/contactThreads';
import { canSmartReply } from './canSmartReply';

type SmartReplyButtonProps = {
  thread: ContactThread;
  copy: AppTranslations;
  onSmartReply: (contact: ContactThread) => void;
  /** Compact uses a 28px-tall chip; default uses the standard CTA size. */
  variant?: 'compact' | 'cta';
  className?: string;
};

/**
 * One-tap Smart Reply trigger. Renders nothing when the contact has no
 * inbound message and no pending draft — we never want a disabled-looking
 * dead button on a contact card.
 */
export default function SmartReplyButton({
  thread,
  copy,
  onSmartReply,
  variant = 'compact',
  className = '',
}: SmartReplyButtonProps) {
  const mode = canSmartReply(thread);
  if (mode === 'unavailable') return null;

  const label = mode === 'open-draft' ? copy.floating.openDraft : (
    variant === 'compact' ? copy.floating.smartReplyShort : copy.floating.smartReplyLabel
  );

  const sizeClass = variant === 'compact'
    ? 'h-7 px-2.5 text-[10px]'
    : 'h-9 px-3.5 text-[11px]';

  return (
    <button
      type="button"
      className={[
        'inline-flex shrink-0 items-center gap-1 rounded-full bg-[#E85C8B] font-semibold text-white shadow-[0_8px_18px_rgba(232,92,139,0.22)] transition active:scale-[0.98] hover:bg-[#d94f7f]',
        sizeClass,
        className,
      ].filter(Boolean).join(' ')}
      onClick={() => onSmartReply(thread)}
      title={copy.floating.smartReplyHint}
      aria-label={`${label} — ${thread.name}`}
    >
      <SparkIcon className="h-3 w-3" />
      <span>{label}</span>
    </button>
  );
}

function SparkIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8L12 3z"
        fill="currentColor"
      />
    </svg>
  );
}
