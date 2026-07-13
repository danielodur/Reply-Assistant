import type { ContactMessageDirection } from './contactThreads';

export type ContactMessageFollowUpKind = 'none' | 'needs-reply' | 'promise';

export type ContactMessageFollowUp = {
  kind: ContactMessageFollowUpKind;
  summary?: string;
};

function normalizeSummary(text: string, maxLength = 80): string {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (!compact) return '';
  return compact.length > maxLength ? `${compact.slice(0, maxLength - 3)}...` : compact;
}

function extractCommitmentSummary(text: string): string | null {
  const normalized = normalizeSummary(text, 240);
  if (!normalized) return null;

  const patterns = [
    /(?:i['’]?ll|i will|we['’]?ll|we will)\s+([^.!?]+)/i,
    /let me\s+([^.!?]+)/i,
    /can you\s+([^.!?]+)/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return normalizeSummary(match[1]);
    }
  }

  if (/send|share|confirm|update|follow up|revert|reply|quote|proposal/i.test(normalized)) {
    return normalizeSummary(normalized);
  }

  return null;
}

export function buildMessageFollowUp(direction: ContactMessageDirection, text: string): ContactMessageFollowUp {
  if (direction === 'inbound') {
    return {
      kind: 'needs-reply',
      summary: normalizeSummary(text),
    };
  }

  if (direction === 'outbound') {
    const commitment = extractCommitmentSummary(text);
    if (commitment) {
      return {
        kind: 'promise',
        summary: commitment,
      };
    }
  }

  return { kind: 'none' };
}