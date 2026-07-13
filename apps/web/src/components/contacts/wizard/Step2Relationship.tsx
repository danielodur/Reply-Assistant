import { useMemo } from 'react';
import type { AppTranslations } from '../../../i18n/translations';
import type { ContactStage } from '../../../config/contactThreads';
import StageDropdown from '../StageDropdown';
import type { WizardDraft } from './wizardTypes';

type Step2Props = {
  copy: AppTranslations;
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
};

export default function Step2Relationship({ copy, draft, onChange }: Step2Props) {
  const stageOptions = useMemo(
    () => Object.entries(copy.contactThreads.stageLabels) as Array<[ContactStage, string]>,
    [copy.contactThreads.stageLabels],
  );

  return (
    <div className="space-y-2.5">
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {copy.contactThreads.stageLabel}
        </p>
        <StageDropdown
          value={draft.stage}
          options={stageOptions}
          ariaLabel={copy.contactThreads.stageLabel}
          onChange={value => onChange({ stage: value })}
        />
      </div>
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {copy.contactThreads.wizardRoleLabel}
        </p>
        <input
          type="text"
          value={draft.role}
          onChange={event => onChange({ role: event.currentTarget.value })}
          placeholder={copy.contactThreads.wizardRolePlaceholder}
          className="w-full rounded-[10px] border border-[#edd7e0] bg-white px-3 py-2 text-[11px] text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}
