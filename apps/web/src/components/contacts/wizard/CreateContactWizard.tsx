import { useCallback, useEffect, useState } from 'react';
import type { AppTranslations } from '../../../i18n/translations';
import { interpolate } from '../../../i18n/translations';
import Step1Identity from './Step1Identity';
import Step2Relationship from './Step2Relationship';
import Step3Communication from './Step3Communication';
import Step4DosAndDonts from './Step4DosAndDonts';
import {
  TOTAL_WIZARD_STEPS,
  createBlankDraft,
  draftToSavePayload,
  type WizardDraft,
  type WizardSavePayload,
} from './wizardTypes';

type CreateContactWizardProps = {
  copy: AppTranslations;
  open: boolean;
  initialNotes?: string;
  onClose: () => void;
  onSubmit: (payload: WizardSavePayload) => void;
};

/**
 * 4-step contact onboarding wizard. Identity (required) → Relationship →
 * Communication preference → Do's & don'ts. Every step after Step 1 is
 * skippable; clicking "Save and add the rest later" from any step commits
 * what's already filled in. The wizard owns its draft state internally so
 * the parent only needs to wire `onSubmit` and `onClose`.
 */
export default function CreateContactWizard({
  copy,
  open,
  initialNotes = '',
  onClose,
  onSubmit,
}: CreateContactWizardProps) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<WizardDraft>(() => {
    const blank = createBlankDraft();
    return initialNotes ? { ...blank, dosAndDonts: initialNotes } : blank;
  });

  useEffect(() => {
    if (!open) {
      setStep(1);
      setDraft(prev => (initialNotes ? { ...createBlankDraft(), dosAndDonts: initialNotes } : { ...createBlankDraft(), dosAndDonts: prev.dosAndDonts }));
    }
  }, [initialNotes, open]);

  useEffect(() => {
    if (open && initialNotes) {
      setDraft(prev => (prev.dosAndDonts ? prev : { ...prev, dosAndDonts: initialNotes }));
    }
  }, [initialNotes, open]);

  const handleChange = useCallback((patch: Partial<WizardDraft>) => {
    setDraft(prev => ({ ...prev, ...patch }));
  }, []);

  const handleSave = useCallback(() => {
    if (!draft.name.trim()) {
      setStep(1);
      return;
    }
    onSubmit(draftToSavePayload(draft));
    setDraft(createBlankDraft());
    setStep(1);
    onClose();
  }, [draft, onClose, onSubmit]);

  if (!open) return null;

  const canAdvance = step === 1 ? draft.name.trim().length > 0 : true;
  const stepHeader = stepTitle(step, copy);
  const stepDescription = stepDescriptionFor(step, copy);
  const hasPendingCapture = Boolean(initialNotes.trim());

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#0f172a]/25 px-3 backdrop-blur-[3px]">
      <section className="w-full max-w-[324px] rounded-[16px] border border-[#f0dbe3] bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.20)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#b85d83]">
              {interpolate(copy.contactThreads.wizardStepCount, { current: String(step), total: String(TOTAL_WIZARD_STEPS) })}
            </p>
            <p className="mt-1 text-[13px] font-semibold leading-tight text-slate-900">{stepHeader}</p>
            <p className="mt-1 text-[10px] leading-snug text-slate-500">{stepDescription}</p>
          </div>
          <button
            type="button"
            aria-label={copy.settings.cancel}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#edd7e0] text-[14px] leading-none text-slate-500 transition hover:border-[#e7aac2] hover:text-[#c15480]"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="mt-3 flex gap-1.5" aria-hidden="true">
          {Array.from({ length: TOTAL_WIZARD_STEPS }).map((_, index) => {
            const isPast = index + 1 < step;
            const isCurrent = index + 1 === step;
            return (
              <span
                key={`progress-${index}`}
                className={[
                  'h-1 flex-1 rounded-full transition-colors',
                  isCurrent ? 'bg-[#E85C8B]' : isPast ? 'bg-[#f6b3ca]' : 'bg-slate-200',
                ].join(' ')}
              />
            );
          })}
        </div>

        <div className="mt-3">
          {step === 1 ? (
            <Step1Identity copy={copy} draft={draft} hasPendingCapture={hasPendingCapture} onChange={handleChange} />
          ) : step === 2 ? (
            <Step2Relationship copy={copy} draft={draft} onChange={handleChange} />
          ) : step === 3 ? (
            <Step3Communication copy={copy} draft={draft} onChange={handleChange} />
          ) : (
            <Step4DosAndDonts copy={copy} draft={draft} onChange={handleChange} />
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {step > 1 ? (
              <button
                type="button"
                className="rounded-full border border-[#edd7e0] bg-white px-3 py-2 text-[10px] font-semibold text-slate-500 transition hover:border-[#e7aac2] hover:text-[#c15480]"
                onClick={() => setStep(value => Math.max(1, value - 1))}
              >
                {copy.contactThreads.wizardBack}
              </button>
            ) : null}
            <div className="flex-1" />
            {step < TOTAL_WIZARD_STEPS ? (
              <button
                type="button"
                disabled={!canAdvance}
                className="rounded-full bg-[#E85C8B] px-4 py-2 text-[11px] font-semibold text-white shadow-[0_10px_24px_rgba(232,92,139,0.24)] transition hover:bg-[#d94f81] disabled:opacity-60"
                onClick={() => setStep(value => Math.min(TOTAL_WIZARD_STEPS, value + 1))}
              >
                {copy.contactThreads.wizardNext}
              </button>
            ) : (
              <button
                type="button"
                disabled={!draft.name.trim()}
                className="rounded-full bg-[#E85C8B] px-4 py-2 text-[11px] font-semibold text-white shadow-[0_10px_24px_rgba(232,92,139,0.24)] transition hover:bg-[#d94f81] disabled:opacity-60"
                onClick={handleSave}
              >
                {copy.contactThreads.wizardSaveAndFinish}
              </button>
            )}
          </div>
          {step > 1 && step < TOTAL_WIZARD_STEPS ? (
            <button
              type="button"
              className="self-end text-[10px] font-medium text-slate-400 transition hover:text-[#c15480]"
              onClick={handleSave}
            >
              {copy.contactThreads.wizardSkipForNow}
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function stepTitle(step: number, copy: AppTranslations): string {
  const ct = copy.contactThreads;
  if (step === 1) return ct.wizardStep1Title;
  if (step === 2) return ct.wizardStep2Title;
  if (step === 3) return ct.wizardStep3Title;
  return ct.wizardStep4Title;
}

function stepDescriptionFor(step: number, copy: AppTranslations): string {
  const ct = copy.contactThreads;
  if (step === 1) return ct.wizardStep1Description;
  if (step === 2) return ct.wizardStep2Description;
  if (step === 3) return ct.wizardStep3Description;
  return ct.wizardStep4Description;
}
