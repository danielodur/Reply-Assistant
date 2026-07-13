/**
 * CreateContactSuccessToast
 *
 * Slides in from the top-center when a contact is successfully created.
 * Displays "Contact name from company name successfully added".
 * Auto-dismisses after 5 seconds.
 */

import { useEffect, useState } from 'react';

type CreateContactSuccessToastProps = {
  contactName: string;
  companyName?: string;
  onDismiss: () => void;
};

const AUTO_DISMISS_MS = 5000;

export default function CreateContactSuccessToast({
  contactName,
  companyName,
  onDismiss,
}: CreateContactSuccessToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay so the CSS transition is visible
    const showTimer = window.setTimeout(() => setVisible(true), 30);

    // Auto-dismiss after 5s
    const hideTimer = window.setTimeout(() => {
      setVisible(false);
    }, AUTO_DISMISS_MS);

    const dismissTimer = window.setTimeout(() => {
      onDismiss();
    }, AUTO_DISMISS_MS + 350); // wait for fade-out

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  const message = companyName
    ? `${contactName} from ${companyName} successfully added`
    : `${contactName} successfully added`;

  const initial = contactName.charAt(0).toUpperCase();

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'pointer-events-auto absolute left-1/2 z-50 -translate-x-1/2 transition-all duration-300',
        visible ? 'top-3 opacity-100 scale-100' : '-top-16 opacity-0 scale-95',
      ].join(' ')}
    >
      <div className="flex items-center gap-3 rounded-[16px] border border-[#d4e9d4] bg-white px-4 py-3 shadow-[0_16px_40px_rgba(34,197,94,0.15)] min-w-[280px] max-w-[380px]">
        {/* Success checkmark in green circle */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
          <svg viewBox="0 0 16 16" className="h-5 w-5" fill="none">
            <path
              d="M13 4l-7 8-3-3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-green-700">{message}</p>
        </div>

        {/* Dismiss button */}
        <button
          type="button"
          aria-label="Dismiss"
          className="shrink-0 text-slate-400 transition hover:text-slate-600"
          onClick={() => {
            setVisible(false);
            window.setTimeout(() => onDismiss(), 300);
          }}
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
