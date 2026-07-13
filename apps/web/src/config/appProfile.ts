export type AppProfile = {
  displayName: string;
  userId: string;
  referralCode: string;
};

export type AppProfileKey = keyof AppProfile;

export const APP_PROFILE_STORAGE_KEY = 'replyAssistantProfile';
const DISPLAY_NAME_MAX_LENGTH = 24;

function generateUserId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${timestamp}${random}`;
}

const DEFAULT_PROFILE: AppProfile = {
  displayName: 'New User',
  userId: '',
  referralCode: 'RA-5266-95051',
};

function normalize(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function normalizeDisplayName(value: unknown): string {
  const normalized = normalize(value, DEFAULT_PROFILE.displayName).replace(/\s+/g, ' ').trim();
  return normalized.slice(0, DISPLAY_NAME_MAX_LENGTH);
}

function getEnvProfile(): AppProfile {
  const env = import.meta.env;

  return {
    displayName: normalizeDisplayName(env.VITE_APP_PROFILE_NAME),
    userId: normalize(env.VITE_APP_PROFILE_USER_ID, DEFAULT_PROFILE.userId),
    referralCode: normalize(env.VITE_APP_PROFILE_REFERRAL_CODE, DEFAULT_PROFILE.referralCode),
  };
}

function loadStoredProfile(): Partial<AppProfile> {
  try {
    const raw = localStorage.getItem(APP_PROFILE_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Partial<AppProfile>;
    return {
      displayName: parsed.displayName,
      userId: parsed.userId,
      referralCode: parsed.referralCode,
    };
  } catch {
    return {};
  }
}

export function getAppProfile(): AppProfile {
  const envProfile = getEnvProfile();
  const storedProfile = loadStoredProfile();

  // Auto-generate userId on first use and persist it
  let userId = normalize(storedProfile.userId, envProfile.userId);
  if (!userId) {
    userId = generateUserId();
    const current = loadStoredProfile();
    localStorage.setItem(APP_PROFILE_STORAGE_KEY, JSON.stringify({ ...current, userId }));
  }

  return {
    displayName: normalizeDisplayName(storedProfile.displayName ?? envProfile.displayName),
    userId,
    referralCode: normalize(storedProfile.referralCode, envProfile.referralCode),
  };
}

export function saveAppProfile(profile: AppProfile): void {
  localStorage.setItem(APP_PROFILE_STORAGE_KEY, JSON.stringify(profile));
}
