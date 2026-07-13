import { getAppProfile, saveAppProfile } from '../config/appProfile';
import { displayNameFromAuthUser } from './profileSync';

export const PROFILE_SYNC_EVENT = 'reply-assistant-profile-sync';

const ONBOARDING_DONE_PREFIX = 'replyAssistantOnboardingDone:';

export function firstNameFromDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0];
}

export function isOnboardingDoneForUser(authUserId: string): boolean {
  return localStorage.getItem(`${ONBOARDING_DONE_PREFIX}${authUserId}`) === '1';
}

export function markOnboardingDoneForUser(authUserId: string): void {
  localStorage.setItem(`${ONBOARDING_DONE_PREFIX}${authUserId}`, '1');
}

export function applyVerifiedAuthUserToProfile(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): string {
  const authName = displayNameFromAuthUser(user);
  const profile = getAppProfile();
  const nextProfile = {
    ...profile,
    displayName: authName || profile.displayName,
  };
  saveAppProfile(nextProfile);
  window.dispatchEvent(new CustomEvent(PROFILE_SYNC_EVENT));
  return nextProfile.displayName;
}
