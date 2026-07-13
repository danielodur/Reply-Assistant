/**
 * EmailNewMailToast
 *
 * Slides in from the top-center when the auto-sync poller finds genuinely
 * new inbound email from a known contact. Shows the contact's name and
 * a "Reply Now" shortcut that selects that contact in the main UI.
 *
 * Auto-dismisses after 8 seconds. Stacks: if more than one contact has
 * new mail, shows the first and queues the rest automatically.
 */

import { useEffect, useState } from 'react';
import type { NewEmailNotice } from '../hooks/useEmailAutoSync';

type EmailNewMailToastProps = {
  notices: NewEmailNotice[];
  onSelectContact: (contactId: string) => void;
  onDismiss: (contactId: string) => void;
  labelNewMail: string;       // e.g. "New email from"
  labelNeedsAction: string;   // e.g. "Needs action"
  labelReplyNow: string;      // e.g. "Reply Now"
  labelDismiss: string;       // e.g. "Dismiss"
};

const AUTO_DISMISS_MS = 8000;

export default function EmailNewMailToast({
  notices,
  onSelectContact,
  onDismiss,
  labelNewMail,
  labelNeedsAction,
  labelReplyNow,
  labelDismiss,
}: EmailNewMailToastProps) {
  const [visible, setVisible] = useState(false);

  // Show the first notice in the queue
  const current = notices[0] ?? null;

  useEffect(() => {
    if (!current) {
      setVisible(false);
      return;
    }

    // Small delay so the CSS transition is visible
    const showTimer = window.setTimeout(() => setVisible(true), 30);

    // Auto-dismiss after 8 s
    const hideTimer = window.setTimeout(() => {
      setVisible(false);
    }, AUTO_DISMISS_MS);

    const dismissTimer = window.setTimeout(() => {
      onDismiss(current.contactId);
    }, AUTO_DISMISS_MS + 350); // wait for fade-out

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [current, onDismiss]);

  if (!current) return null;

  const initial = current.contactName.charAt(0).toUpperCase();

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'pointer-events-auto absolute left-1/2 z-50 -translate-x-1/2 transition-all duration-300',
        visible ? 'top-3 opacity-100 scale-100' : '-top-16 opacity-0 scale-95',
      ].join(' ')}
    >
      <div className="flex items-center gap-3 rounded-[16px] border border-[#f4d7e1] bg-white px-4 py-3 shadow-[0_16px_40px_rgba(232,92,139,0.22)] min-w-[220px] max-w-[280px]">
        {/* Contact avatar */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fce8f0] text-[13px] font-semibold text-[#c15480]">
          {initial}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-500 leading-none mb-0.5">{labelNewMail}</p>
          <p className="text-[12px] font-semibold text-[#231f20] truncate">{current.contactName}</p>
          <p className="mt-1 inline-flex rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
            {labelNeedsAction}
          </p>
          {current.newCount > 1 && (
            <p className="text-[10px] text-[#b85a82]">+{current.newCount} messages</p>
          )}
        </div>

        {/* Reply Now */}
        <button
          type="button"
          className="shrink-0 rounded-full bg-[#E85C8B] px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_6px_14px_rgba(232,92,139,0.24)] transition hover:bg-[#d94f81] active:scale-[0.97]"
          onClick={() => {
            setVisible(false);
            window.setTimeout(() => {
              onSelectContact(current.contactId);
              onDismiss(current.contactId);
            }, 300);
          }}
        >
          {labelReplyNow}
        </button>

        {/* Dismiss */}
        <button
          type="button"
          aria-label={labelDismiss}
          className="shrink-0 text-slate-400 transition hover:text-slate-600"
          onClick={() => {
            setVisible(false);
            window.setTimeout(() => onDismiss(current.contactId), 300);
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
