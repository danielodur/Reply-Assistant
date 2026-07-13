import type { AppTranslations } from '../../../i18n/translations';
import AssistedNotesTextarea from '../../AssistedNotesTextarea';
import type { WizardDraft } from './wizardTypes';

type Step4Props = {
  copy: AppTranslations;
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
};

export default function Step4DosAndDonts({ copy, draft, onChange }: Step4Props) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {copy.contactThreads.wizardDosAndDontsLabel}
      </p>
      <AssistedNotesTextarea
        value={draft.dosAndDonts}
        onChange={value => onChange({ dosAndDonts: value })}
        placeholder={copy.contactThreads.wizardDosAndDontsPlaceholder}
        assistBankKey="create-contact-wizard-dos-donts"
        ghostMirrorClassName="px-3 py-2 text-[11px] leading-4.5"
        textareaClassName="min-h-[88px] w-full rounded-[10px] border border-[#edd7e0] bg-white px-3 py-2 text-[11px] leading-4.5 text-slate-700 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}
