import type { AppTranslations } from '../../i18n/translations';
import type { SyncServer } from './syncServerMeta';
import { getSyncServerGuide } from './syncServerGuide';

type SyncGuideModalProps = {
  open: boolean;
  server: SyncServer | null;
  copy: AppTranslations;
  onClose: () => void;
  onContinue: () => void;
};

export default function SyncGuideModal({
  open,
  server,
  copy,
  onClose,
  onContinue,
}: SyncGuideModalProps) {
  if (!open || !server) {
    return null;
  }

  const guide = getSyncServerGuide(copy, server);

  async function handleCopyGuide() {
    const payload = [guide.title, ...guide.steps].join('\n');

    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      // Keep UI minimal; ignore clipboard errors silently.
    }
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#0f172a]/25 px-3 backdrop-blur-[3px]">
      <section className="w-full max-w-[332px] rounded-[16px] border border-[#f0dbe3] bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.20)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] font-semibold text-slate-900">{guide.title}</p>
          <button
            type="button"
            aria-label={copy.settings.cancel}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#edd7e0] text-[14px] leading-none text-slate-500 transition hover:border-[#e7aac2] hover:text-[#c15480]"
            onClick={onClose}
          >
            x
          </button>
        </div>

        <div className="relative mt-3 rounded-[12px] border border-[#f0dbe3] bg-[#fffafb] p-3 pb-9">
          <div className="space-y-2">
            {guide.steps.map(step => (
              <p key={step} className="text-[11px] leading-5 text-slate-600">
                {step}
              </p>
            ))}
          </div>

          <button
            type="button"
            aria-label={copy.contactThreads.emailProviderHelpTitle}
            className="absolute bottom-2 right-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#edd7e0] bg-white text-slate-500 transition hover:border-[#e7aac2] hover:text-[#c15480]"
            onClick={() => {
              void handleCopyGuide();
            }}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
              <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-full border border-[#edd7e0] bg-white px-3 py-1.5 text-[10px] font-medium text-slate-500 transition hover:border-[#e7aac2] hover:text-[#c15480]"
            onClick={onClose}
          >
            {copy.settings.cancel}
          </button>
          <button
            type="button"
            className="rounded-full bg-[#E85C8B] px-3 py-1.5 text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(232,92,139,0.24)] transition hover:bg-[#d94f81]"
            onClick={onContinue}
          >
            {guide.continueLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
