export type MiniScreenId =
  | 'today-queue'
  | 'action-inbox'
  | 'contact-threads'
  | 'settings'
  | 'customer-service'
  | 'refer-friends'
  | 'messages'
  | 'recent-replies'
  | 'snippet-library'
  | 'reset-data'
  | 'business-context'
  | 'weekly-recap'
  | 'generated-reply';

export type WorkMode = 'reply' | 'internal';
export type RecipientProfile = 'new-lead' | 'existing-client' | 'vip-client' | 'leader' | 'colleague' | 'others';
export type TonePreset = 'executive' | 'friendly' | 'urgent' | 'casual' | null;

export type ReplyHistoryItem = {
  id: string;
  preview: string;
  variant: 'balanced';
  mode: WorkMode;
  recipient: RecipientProfile;
  contactId?: string;
  contactName?: string;
  createdAt: number;
};
