import type { RecipientProfile, WorkMode } from './types';

export const TEXT_TYPE_IDS = [
  'shorter-reply',
  'longer-detailed',
  'persuasive',
  'apologetic-polite',
  'casual-friendly',
  'formal-professional',
  'follow-up',
  'suggestion',
  'simplify',
  'improve',
  'polish-english',
];

export const WORK_MODES: Array<{ id: WorkMode }> = [
  { id: 'reply' },
  { id: 'internal' },
];

export const RECIPIENT_PROFILES_BY_MODE: Record<WorkMode, Array<{ id: RecipientProfile }>> = {
  reply: [
    { id: 'new-lead' },
    { id: 'existing-client' },
    { id: 'vip-client' },
    { id: 'others' },
  ],
  internal: [
    { id: 'colleague' },
    { id: 'leader' },
    { id: 'others' },
  ],
};
