import type { ActionInboxItem } from './types';

export function buildDelegateDraft(item: ActionInboxItem): string {
  return [
    `Hi team, can someone take ownership of this follow-up?`,
    '',
    `Intent: ${item.intentLabel}`,
    `Risk: ${item.riskLevel.toUpperCase()}`,
    `Recommended action: ${item.body}`,
    `Timing: ${item.followUp}`,
    '',
    'Please post a short update once sent.',
  ].join('\n');
}
