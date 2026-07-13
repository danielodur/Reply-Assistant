import type { AppTranslations } from '../../../i18n/translations';
import type { WizardDraft } from './wizardTypes';

type Step1Props = {
  copy: AppTranslations;
  draft: WizardDraft;
  hasPendingCapture: boolean;
  onChange: (patch: Partial<WizardDraft>) => void;
};

export default function Step1Identity({ copy, draft, hasPendingCapture, onChange }: Step1Props) {
  return (
    <div className="space-y-2.5">
      {hasPendingCapture ? (
        <p className="rounded-[10px] border border-[#f1d7e0] bg-[#fff7fa] px-3 py-2 text-[10px] leading-4 text-[#8a5a70]">
          {copy.contactThreads.pendingCaptureHint}
        </p>
      ) : null}
      <input
        type="text"
        value={draft.name}
        onChange={event => onChange({ name: event.currentTarget.value })}
        placeholder={copy.contactThreads.namePlaceholder}
        className="w-full rounded-[10px] border border-[#edd7e0] bg-white px-3 py-2 text-[11px] text-slate-700 outline-none placeholder:text-slate-400"
        autoFocus
      />
      <input
        type="text"
        value={draft.company}
        onChange={event => onChange({ company: event.currentTarget.value })}
        placeholder={copy.contactThreads.companyPlaceholder}
        className="w-full rounded-[10px] border border-[#edd7e0] bg-white px-3 py-2 text-[11px] text-slate-700 outline-none placeholder:text-slate-400"
      />
      <input
        type="email"
        value={draft.email}
        onChange={event => onChange({ email: event.currentTarget.value })}
        placeholder={copy.contactThreads.emailPlaceholder}
        className="w-full rounded-[10px] border border-[#edd7e0] bg-white px-3 py-2 text-[11px] text-slate-700 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}
