export const SUPPORT_ISSUE_IDS = [
  'account-auth',
  'contacts-memory',
  'reply-generation',
  'email-sync',
  'desktop-app',
  'notifications',
  'billing-account',
  'data-privacy',
  'other',
] as const;

export type SupportIssueId = (typeof SUPPORT_ISSUE_IDS)[number];

export function isSupportIssueId(value: string): value is SupportIssueId {
  return (SUPPORT_ISSUE_IDS as readonly string[]).includes(value);
}
