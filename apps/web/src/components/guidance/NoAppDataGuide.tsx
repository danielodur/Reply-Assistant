import type { AppTranslations } from '../../i18n/translations';
import type { MiniScreenId } from '../workbench/types';

type NoAppDataGuideProps = {
  copy: AppTranslations;
  onOpenScreen: (screenId: MiniScreenId) => void;
  className?: string;
};

export default function NoAppDataGuide({ copy, onOpenScreen, className = '' }: NoAppDataGuideProps) {
  const guide = copy.noAppData;
  const contactsLabel = copy.moreFeatures.menuLabels['contact-threads'];
  const workContextLabel = copy.moreFeatures.menuLabels['business-context'];

  return (
    <div
      role="status"
      className={[
        'rounded-[16px] border border-dashed border-[#e7c4d4] bg-[linear-gradient(180deg,#fff8fb_0%,#ffffff_100%)] px-4 py-8 text-center',
        className,
      ].join(' ')}
    >
      <p className="text-[13px] font-semibold text-slate-900">{guide.title}</p>
      <p className="mt-2 text-[11px] leading-5 text-slate-600">{guide.body}</p>

      <div className="mt-5 space-y-2.5 text-left">
        <div className="rounded-[12px] border border-[#f1d5e1] bg-white px-3 py-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#cb5f89]">
            {guide.contactsHint}
          </p>
          <p className="mt-1 text-[10px] leading-4 text-slate-500">{guide.contactsLead}</p>
          <button
            type="button"
            className="mt-2.5 w-full rounded-full bg-[#E85C8B] px-3 py-2 text-[11px] font-semibold text-white shadow-[0_8px_18px_rgba(232,92,139,0.22)] transition hover:bg-[#d94f7f]"
            onClick={() => onOpenScreen('contact-threads')}
          >
            {contactsLabel}
          </button>
        </div>

        <div className="rounded-[12px] border border-slate-200 bg-white px-3 py-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            {guide.workContextHint}
          </p>
          <p className="mt-1 text-[10px] leading-4 text-slate-500">{guide.workContextLead}</p>
          <button
            type="button"
            className="mt-2.5 w-full rounded-full border border-[#edd7e0] bg-[#fff5f9] px-3 py-2 text-[11px] font-semibold text-[#b54e77] transition hover:border-[#e7aac2] hover:bg-[#fdeaf1]"
            onClick={() => onOpenScreen('business-context')}
          >
            {workContextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
