import type { AppTranslations } from '../../../i18n/translations';
import type { ContactMemoryProfile } from '../../../config/contactThreads';
import type { WizardDraft, WizardReplyLanguage } from './wizardTypes';

type Step3Props = {
  copy: AppTranslations;
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
};

type StyleOption = {
  id: NonNullable<ContactMemoryProfile['communicationStyle']> | '';
  label: (c: AppTranslations['contactThreads']) => string;
};

const STYLE_OPTIONS: StyleOption[] = [
  { id: '', label: c => c.wizardCommunicationStyleNone },
  { id: 'formal', label: c => c.memoryStyleFormal },
  { id: 'warm', label: c => c.memoryStyleWarm },
  { id: 'direct', label: c => c.memoryStyleDirect },
  { id: 'concise', label: c => c.memoryStyleConcise },
];

const LANGUAGE_OPTIONS: Array<{ id: WizardReplyLanguage; label: (c: AppTranslations['contactThreads']) => string }> = [
  { id: 'auto', label: c => c.wizardPreferredLanguageAuto },
  { id: 'en', label: c => c.wizardPreferredLanguageEn },
  { id: 'zh', label: c => c.wizardPreferredLanguageZh },
];

export default function Step3Communication({ copy, draft, onChange }: Step3Props) {
  const ct = copy.contactThreads;
  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {ct.wizardCommunicationStyleLabel}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {STYLE_OPTIONS.map(option => {
            const isActive = draft.communicationStyle === option.id;
            return (
              <button
                key={option.id || 'none'}
                type="button"
                onClick={() => onChange({ communicationStyle: option.id })}
                className={[
                  'rounded-full border px-2.5 py-1 text-[10px] transition',
                  isActive
                    ? 'border-[#e88ab0] bg-[#fde9f2] font-semibold text-[#b84f79]'
                    : 'border-[#edd7e0] bg-white text-slate-500 hover:border-[#e7aac2]',
                ].join(' ')}
              >
                {option.label(ct)}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {ct.wizardPreferredLanguageLabel}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGE_OPTIONS.map(option => {
            const isActive = draft.replyLanguage === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange({ replyLanguage: option.id })}
                className={[
                  'rounded-full border px-2.5 py-1 text-[10px] transition',
                  isActive
                    ? 'border-[#e88ab0] bg-[#fde9f2] font-semibold text-[#b84f79]'
                    : 'border-[#edd7e0] bg-white text-slate-500 hover:border-[#e7aac2]',
                ].join(' ')}
              >
                {option.label(ct)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
