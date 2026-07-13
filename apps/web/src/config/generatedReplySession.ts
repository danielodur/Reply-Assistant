import type { ReplyInsight } from '../components/workbench/generatedReplyTypes';
import type { RecipientProfile, WorkMode } from '../components/workbench/types';

export const GENERATED_REPLY_SESSION_KEY = 'replyAssistantGeneratedReplySession';

export type GeneratedReplySessionPayload = {
  generatedMessage: string;
  basedOnLines: string[];
  prioritizedEntities: string[];
  contactNames: string[];
  insight: ReplyInsight | null;
  mode: WorkMode;
  hasFollowUp: boolean;
  recipient: RecipientProfile;
  textType: string;
  formality: number;
  warmth: number;
  urgency: number;
  confidence: number;
};

export function writeGeneratedReplySession(payload: GeneratedReplySessionPayload): void {
  localStorage.setItem(GENERATED_REPLY_SESSION_KEY, JSON.stringify(payload));
}

export function readGeneratedReplySession(): GeneratedReplySessionPayload | null {
  try {
    const raw = localStorage.getItem(GENERATED_REPLY_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GeneratedReplySessionPayload;
    if (!parsed || typeof parsed.generatedMessage !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearGeneratedReplySession(): void {
  localStorage.removeItem(GENERATED_REPLY_SESSION_KEY);
}

export type GeneratedReplySurface = 'detached' | 'inline';

export function openGeneratedReplySurface(payload: GeneratedReplySessionPayload): GeneratedReplySurface {
  writeGeneratedReplySession(payload);
  if (window.desktopApp?.openChildScreen) {
    void window.desktopApp.openChildScreen('generated-reply');
    return 'detached';
  }
  return 'inline';
}
