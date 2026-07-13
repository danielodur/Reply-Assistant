export type ActionInboxRiskLevel = 'low' | 'medium' | 'high';

export type ActionInboxItem = {
  id: string;
  title: string;
  body: string;
  intentLabel: string;
  riskLevel: ActionInboxRiskLevel;
  followUp: string;
  priority: number;
  prompt: string;
  createdAt: number;
  source?: 'insight' | 'email-sync' | 'contact-follow-up';
  relatedContactId?: string;
  newEmailCount?: number;
  deferUntil?: string;
  status: 'pending' | 'done' | 'delegated';
};

export type ActionInboxAnalytics = {
  created: number;
  done: number;
  deferred: number;
  delegated: number;
};

export type ActionInboxState = {
  items: ActionInboxItem[];
  analytics: ActionInboxAnalytics;
};
