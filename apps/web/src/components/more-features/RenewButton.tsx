import { useState } from 'react';
import type { AppTranslations } from '../../i18n/translations';
import { runRenewCheck } from '../../lib/appRenewal';

type RenewButtonProps = {
  copy: AppTranslations;
};

export default function RenewButton({ copy }: RenewButtonProps) {
  const mf = copy.moreFeatures;
  const [checking, setChecking] = useState(false);

  const handleClick = async () => {
    if (checking) return;
    setChecking(true);
    try {
      await runRenewCheck(mf);
    } finally {
      setChecking(false);
    }
  };

  return (
    <button
      type="button"
      disabled={checking}
      className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#b04a70] shadow-[0_8px_18px_rgba(232,92,139,0.12)] transition hover:scale-[1.01] hover:shadow-[0_10px_20px_rgba(232,92,139,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef96b7]/70 disabled:cursor-not-allowed disabled:opacity-70"
      onClick={() => {
        void handleClick();
      }}
      aria-busy={checking}
    >
      {checking ? (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 animate-spin text-[#8f8a8d]" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
          <path d="M12 3a9 9 0 019 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#8f8a8d]" fill="none" aria-hidden="true">
          <path d="M18.5 8.5V5.5h-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18 11.5a6 6 0 1 1-1.76-4.24L18.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {checking ? mf.renewChecking : mf.renew}
    </button>
  );
}
