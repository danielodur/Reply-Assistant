import { saveBusinessContext } from './businessContext';
import { saveContactThreads } from './contactThreads';
import { writeSelectedContactId } from './selectedContactPersistence';
import { clearGeneratedReplySession } from './generatedReplySession';
import { clearProductAnnouncementsStorage } from './productAnnouncements';
import { WORK_RHYTHM_STORAGE_KEY } from '../components/smart-suggestions/workRhythmStore';

export type ResetDataDomain =
  | 'contacts'
  | 'workContext'
  | 'draftMemory'
  | 'queues'
  | 'companionSignals';

export const RESET_DATA_DOMAINS: ResetDataDomain[] = [
  'contacts',
  'workContext',
  'draftMemory',
  'queues',
  'companionSignals',
];

export const RESET_DATA_EVENT = 'replyAssistantDataReset';
export const RESET_BROADCAST_KEY = 'replyAssistantDataResetBroadcast';

const CONTACT_UPLOADS_KEY = 'replyAssistantContactUploads';
const BUSINESS_UPLOADS_KEY = 'replyAssistantBusinessUploads';
const ACTION_INBOX_KEY = 'replyAssistantActionInbox';
const SNIPPETS_KEY = 'replyAssistantSnippets';
const RECENT_REPLIES_KEY = 'replyAssistantRecentReplies';
const CONTACT_DAILY_FOCUS_KEY = 'replyAssistantContactDailyFocus';
const PENDING_CAPTURE_DRAFT_KEY = 'replyAssistantPendingCaptureDraft';
const USAGE_COUNT_KEY = 'replyAssistantUsageCount';
const COPIED_REPLY_COUNT_KEY = 'replyAssistantCopiedReplyCount';
const MILESTONES_KEY = 'replyAssistantMilestonesAchieved';
const TONE_PROFILES_KEY = 'replyAssistantToneProfiles';
const REFERRAL_NUDGE_KEY = 'replyAssistantReferralNudgeDismissed';
const ONBOARDING_KEY = 'replyAssistantOnboardingDone';
const CONTACT_STYLE_PREFIX = 'replyAssistantContactStyle:';
const TODAY_QUEUE_PREFIX = 'replyAssistantTodayQueue_';
const INSIGHT_TASKS_PREFIX = 'replyAssistantInsightTasks_';
const DAILY_ACTIVITY_PREFIX = 'replyAssistantDaily_';
const ACTIVE_DAYS_KEY = 'replyAssistantActiveDays';

const EMPTY_ACTION_INBOX = {
  items: [],
  analytics: { created: 0, done: 0, deferred: 0, delegated: 0 },
};

function removeKeysWithPrefix(prefix: string): void {
  Object.keys(localStorage)
    .filter(key => key.startsWith(prefix))
    .forEach(key => localStorage.removeItem(key));
}

function resetContactsDomain(): void {
  saveContactThreads([]);
  writeSelectedContactId(null);
  localStorage.removeItem(CONTACT_UPLOADS_KEY);
  localStorage.removeItem(CONTACT_DAILY_FOCUS_KEY);
  localStorage.removeItem(PENDING_CAPTURE_DRAFT_KEY);
  removeKeysWithPrefix(CONTACT_STYLE_PREFIX);
  window.dispatchEvent(new Event('replyAssistantContactUploadsChanged'));
}

function resetWorkContextDomain(): void {
  saveBusinessContext({
    yourName: '',
    companyName: '',
    yourPosition: '',
    industry: '',
    productsServices: '',
    brandVoice: '',
    commonObjections: '',
    doNotSay: '',
  });
  localStorage.removeItem(BUSINESS_UPLOADS_KEY);
  window.dispatchEvent(new Event('replyAssistantBusinessUploadsChanged'));
}

function resetDraftMemoryDomain(): void {
  localStorage.removeItem(SNIPPETS_KEY);
  localStorage.removeItem(RECENT_REPLIES_KEY);
  clearProductAnnouncementsStorage();
}

function resetQueuesDomain(): void {
  localStorage.setItem(ACTION_INBOX_KEY, JSON.stringify(EMPTY_ACTION_INBOX));
  removeKeysWithPrefix(TODAY_QUEUE_PREFIX);
  removeKeysWithPrefix(INSIGHT_TASKS_PREFIX);
  removeKeysWithPrefix(DAILY_ACTIVITY_PREFIX);
  localStorage.removeItem(ACTIVE_DAYS_KEY);
}

function resetCompanionSignalsDomain(): void {
  localStorage.removeItem(WORK_RHYTHM_STORAGE_KEY);
  localStorage.removeItem(USAGE_COUNT_KEY);
  localStorage.removeItem(COPIED_REPLY_COUNT_KEY);
  localStorage.removeItem(MILESTONES_KEY);
  localStorage.removeItem(TONE_PROFILES_KEY);
  localStorage.removeItem(REFERRAL_NUDGE_KEY);
  localStorage.removeItem(ONBOARDING_KEY);
  clearGeneratedReplySession();
  sessionStorage.removeItem('replyAssistantCmdKHintDismissedSession');
  sessionStorage.removeItem('replyAssistantSmartChipDismissedSession');
}

const DOMAIN_RESETTERS: Record<ResetDataDomain, () => void> = {
  contacts: resetContactsDomain,
  workContext: resetWorkContextDomain,
  draftMemory: resetDraftMemoryDomain,
  queues: resetQueuesDomain,
  companionSignals: resetCompanionSignalsDomain,
};

export function applyResetDomains(domains: ResetDataDomain[]): ResetDataDomain[] {
  const unique = RESET_DATA_DOMAINS.filter(domain => domains.includes(domain));
  unique.forEach(domain => DOMAIN_RESETTERS[domain]());
  return unique;
}

export function notifyDataReset(domains: ResetDataDomain[]): void {
  window.dispatchEvent(new CustomEvent(RESET_DATA_EVENT, { detail: { domains } }));
  try {
    localStorage.setItem(RESET_BROADCAST_KEY, JSON.stringify({ at: Date.now(), domains }));
  } catch {
    // ignore quota errors
  }
}

export function resetAppData(domains: ResetDataDomain[]): ResetDataDomain[] {
  const applied = applyResetDomains(domains);
  notifyDataReset(applied);
  return applied;
}

export function onDataReset(callback: (domains: ResetDataDomain[]) => void): () => void {
  const handleEvent = (event: Event) => {
    const domains = (event as CustomEvent<{ domains?: ResetDataDomain[] }>).detail?.domains;
    callback(Array.isArray(domains) ? domains : RESET_DATA_DOMAINS);
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== RESET_BROADCAST_KEY || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue) as { domains?: ResetDataDomain[] };
      callback(Array.isArray(parsed.domains) ? parsed.domains : RESET_DATA_DOMAINS);
    } catch {
      callback(RESET_DATA_DOMAINS);
    }
  };

  window.addEventListener(RESET_DATA_EVENT, handleEvent);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(RESET_DATA_EVENT, handleEvent);
    window.removeEventListener('storage', handleStorage);
  };
}

export function domainIncludesContacts(domains: ResetDataDomain[]): boolean {
  return domains.includes('contacts');
}

export function domainIncludesWorkContext(domains: ResetDataDomain[]): boolean {
  return domains.includes('workContext');
}

export function domainIncludesDraftMemory(domains: ResetDataDomain[]): boolean {
  return domains.includes('draftMemory');
}

export function domainIncludesQueues(domains: ResetDataDomain[]): boolean {
  return domains.includes('queues');
}

export function domainIncludesCompanionSignals(domains: ResetDataDomain[]): boolean {
  return domains.includes('companionSignals');
}
