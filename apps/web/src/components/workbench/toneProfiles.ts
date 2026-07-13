const STORAGE_KEY = 'replyAssistantToneProfiles';

export type ToneProfileData = {
  id: string;
  name: string;
  formality: number;
  warmth: number;
  urgency: number;
  confidence: number;
};

export function loadToneProfiles(): ToneProfileData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as ToneProfileData[];
    return [];
  } catch {
    return [];
  }
}

export function saveToneProfile(profile: ToneProfileData): ToneProfileData[] {
  const existing = loadToneProfiles();
  const next = [profile, ...existing.filter(p => p.id !== profile.id)].slice(0, 8);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function deleteToneProfile(id: string): ToneProfileData[] {
  const next = loadToneProfiles().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
