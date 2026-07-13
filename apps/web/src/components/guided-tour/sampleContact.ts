import type { AppTranslations } from '../../i18n/translations';
import {
  buildContactMessageEntry,
  buildContactThread,
  type ContactThread,
} from '../../config/contactThreads';

/**
 * Distinct ID prefix so consumers can identify and offer to clean up the
 * sample contact whenever they want — including from the reset flow.
 */
export const SAMPLE_CONTACT_ID = 'sample-contact-tour';
export const SAMPLE_CONTACT_SEEDED_KEY = 'replyAssistantSampleContactSeeded';

/**
 * Returns true when the sample contact has been seeded in this localStorage
 * profile. We persist the flag separately from the contact list so manually
 * deleting the sample contact doesn't trigger a re-seed.
 */
export function hasSeededSampleContact(): boolean {
  try {
    return localStorage.getItem(SAMPLE_CONTACT_SEEDED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markSampleContactSeeded(): void {
  try {
    localStorage.setItem(SAMPLE_CONTACT_SEEDED_KEY, '1');
  } catch {
    // Storage quota — best-effort.
  }
}

export function clearSampleContactSeeded(): void {
  try {
    localStorage.removeItem(SAMPLE_CONTACT_SEEDED_KEY);
  } catch {
    // ignore
  }
}

/**
 * Builds the sample contact thread. Includes a single inbound message so
 * Smart Reply can fire on it without any further user action.
 */
export function buildSampleContact(copy: AppTranslations): ContactThread {
  const inboundText = copy.guidedTour.sampleInboundText;
  const inbound = buildContactMessageEntry({
    direction: 'inbound',
    source: 'paste',
    text: inboundText,
    sender: copy.guidedTour.sampleContactName,
    receiver: 'You',
  });

  const base = buildContactThread({
    name: copy.guidedTour.sampleContactName,
    company: copy.guidedTour.sampleContactCompany,
    stage: 'active-client',
    notes: copy.guidedTour.sampleContactNotes,
    memoryProfile: {
      role: copy.guidedTour.sampleContactRole,
      communicationStyle: 'warm',
      preferredLanguage: copy.guidedTour.sampleContactPreferredLanguage,
      relationshipNotes: copy.guidedTour.sampleContactRelationshipNotes,
    },
  });

  return {
    ...base,
    id: SAMPLE_CONTACT_ID,
    messages: [inbound],
    chatContext: `${inbound.sender || base.name} -> You: ${inbound.text}`,
  };
}
