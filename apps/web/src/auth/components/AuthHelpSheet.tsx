import type { AppTranslations } from '../../i18n/translations';
import FaqAccordion from '../../components/help-center/FaqAccordion';

type AuthHelpSheetProps = {
  copy: AppTranslations;
  open: boolean;
  onClose: () => void;
};

function HeadphoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M4 14v-2a8 8 0 0116 0v2M4 14a2 2 0 002 2h1v-5H5a1 1 0 00-1 1v2zm16 0a2 2 0 01-2 2h-1v-5h2a1 1 0 011 1v2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AuthHelpSheet({ copy, open, onClose }: AuthHelpSheetProps) {
  if (!open) return null;

  const cs = copy.customerService;

  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-[#0f172a]/40 p-4">
      <div
        className="w-full max-w-[340px] rounded-[16px] border border-[#f0dbe3] bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.18)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-help-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-[#b04a70]">
            <HeadphoneIcon />
            <p id="auth-help-title" className="text-[13px] font-semibold text-slate-900">
              {cs.frameLabel}
            </p>
          </div>
          <button
            type="button"
            className="text-[11px] font-medium text-slate-400 hover:text-slate-600"
            onClick={onClose}
          >
            {copy.settings.cancel}
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-600">{cs.cardBody}</p>

        <div className="mt-3 max-h-[280px] overflow-y-auto clean-scrollbar">
          <FaqAccordion copy={cs} compact maxItems={4} showSearch={false} />
        </div>

        <p className="mt-3 text-[10px] leading-relaxed text-slate-500">{cs.authHelpMoreHint}</p>
      </div>
    </div>
  );
}
