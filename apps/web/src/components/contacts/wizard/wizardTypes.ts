import type { ContactMemoryProfile, ContactStage } from '../../../config/contactThreads';

/** Reply language picked in step 3. Mirrors lib/replyLanguagePreference values. */
export type WizardReplyLanguage = 'auto' | 'en' | 'zh';

export type WizardDraft = {
  name: string;
  company: string;
  email: string;
  stage: ContactStage;
  role: string;
  communicationStyle: NonNullable<ContactMemoryProfile['communicationStyle']> | '';
  replyLanguage: WizardReplyLanguage;
  dosAndDonts: string;
};

export type WizardSavePayload = {
  name: string;
  company: string;
  email: string;
  stage: ContactStage;
  notes: string;
  memoryProfile: ContactMemoryProfile | undefined;
  replyLanguage: WizardReplyLanguage;
};

export const TOTAL_WIZARD_STEPS = 4;

export function createBlankDraft(stage: ContactStage = 'follow-up'): WizardDraft {
  return {
    name: '',
    company: '',
    email: '',
    stage,
    role: '',
    communicationStyle: '',
    replyLanguage: 'auto',
    dosAndDonts: '',
  };
}

export function draftToSavePayload(draft: WizardDraft): WizardSavePayload {
  const memoryProfile: ContactMemoryProfile = {
    role: draft.role.trim() || undefined,
    communicationStyle: draft.communicationStyle || undefined,
    preferredLanguage: replyLanguageToMemoryLabel(draft.replyLanguage),
    relationshipNotes: draft.dosAndDonts.trim() || undefined,
  };
  const profileIsEmpty = !memoryProfile.role
    && !memoryProfile.communicationStyle
    && !memoryProfile.preferredLanguage
    && !memoryProfile.relationshipNotes;

  return {
    name: draft.name.trim(),
    company: draft.company.trim(),
    email: draft.email.trim(),
    stage: draft.stage,
    notes: draft.dosAndDonts.trim(),
    memoryProfile: profileIsEmpty ? undefined : memoryProfile,
    replyLanguage: draft.replyLanguage,
  };
}

function replyLanguageToMemoryLabel(language: WizardReplyLanguage): string | undefined {
  if (language === 'en') return 'English';
  if (language === 'zh') return 'Chinese';
  return undefined;
}
