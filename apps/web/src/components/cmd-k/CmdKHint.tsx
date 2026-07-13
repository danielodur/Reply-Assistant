import { useEffect, useRef, useState } from 'react';
import type { AppTranslations } from '../../i18n/translations';
import { interpolate } from '../../i18n/translations';

type CmdKHintProps = {
  /** All conditions for the panel being calm/empty enough that a hint is welcome */
  isEligible: boolean;
  shortcutLabel: string;
  copy: AppTranslations;
  onActivate: () => void;
};

const HINT_DISMISSED_KEY = 'replyAssistantCmdKHintDismissedSession';
const HINT_VISIBLE_DURATION_MS = 10000;
const HINT_DEBOUNCE_MS = 4000;

export default function CmdKHint({ isEligible, shortcutLabel, copy, onActivate }: CmdKHintProps) {
  const [isDismissed, setIsDismissed] = useState(
    () => sessionStorage.getItem(HINT_DISMISSED_KEY) === '1',
  );
  const [isVisible, setIsVisible] = useState(false);
  const hasShownRef = useRef(false);
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (showTimerRef.current) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (isDismissed) return;

    if (!isEligible) {
      setIsVisible(false);
      clearTimers();
      return;
    }

    if (hasShownRef.current || showTimerRef.current) {
      return;
    }

    showTimerRef.current = window.setTimeout(() => {
      showTimerRef.current = null;
      hasShownRef.current = true;
      setIsVisible(true);
      hideTimerRef.current = window.setTimeout(() => {
        hideTimerRef.current = null;
        setIsVisible(false);
      }, HINT_VISIBLE_DURATION_MS);
    }, HINT_DEBOUNCE_MS);

    return clearTimers;
  }, [isEligible, isDismissed]);

  const handleDismiss = () => {
    sessionStorage.setItem(HINT_DISMISSED_KEY, '1');
    setIsDismissed(true);
    setIsVisible(false);
    clearTimers();
  };

  const handleActivate = () => {
    setIsVisible(false);
    clearTimers();
    onActivate();
  };

  if (isDismissed || !isVisible) {
    return null;
  }

  return (
    <div className="relative z-[5] flex justify-center px-1 py-1">
      <div className="cmdk-hint-pulse inline-flex items-center gap-2 rounded-full border border-[#eadbd4] bg-white/96 px-3 py-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.12)] backdrop-blur-sm">
        <button
          type="button"
          onClick={handleActivate}
          className="flex items-center gap-1.5 text-[10px] font-medium text-slate-600 hover:text-[#b85a82]"
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3 text-[#b85a82]" fill="none" aria-hidden="true">
            <path d="M9 4l1.5 4.5L15 10l-4.5 1.5L9 16l-1.5-4.5L3 10l4.5-1.5z" fill="currentColor" stroke="none" />
            <circle cx="18" cy="5" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="19" cy="18" r="1.5" fill="currentColor" stroke="none" />
          </svg>
          <span>{interpolate(copy.floating.cmdKHintLabel, { shortcut: shortcutLabel })}</span>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-[9px] font-medium text-slate-400 hover:text-slate-600"
          aria-label={copy.floating.cmdKHintDismiss}
        >
          ×
        </button>
      </div>
    </div>
  );
}
