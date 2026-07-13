import type { ContactThread } from '../../config/contactThreads';

export type ContactMatchCandidate = {
  thread: ContactThread;
  score: number;
  reason: string;
  exactEmail: boolean;
};

export type ContactMatchDecision =
  | { kind: 'auto-select'; candidate: ContactMatchCandidate }
  | { kind: 'confirm'; candidates: ContactMatchCandidate[] }
  | { kind: 'no-match'; candidates: ContactMatchCandidate[] };

function extractEmailCandidates(text: string): string[] {
  const matches = text
    .toLowerCase()
    .match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g);
  return matches ? [...new Set(matches)] : [];
}

function scoreContactMatch(thread: ContactThread, text: string, selectedContactId: string | null): ContactMatchCandidate | null {
  const normalized = text.toLowerCase();
  const emails = extractEmailCandidates(text);
  let score = 0;
  let reason = '';
  let exactEmail = false;

  if (thread.email && emails.includes(thread.email.toLowerCase())) {
    score += 120;
    reason = `email ${thread.email}`;
    exactEmail = true;
  }

  const name = thread.name.trim().toLowerCase();
  if (name && normalized.includes(name)) {
    score += 65;
    reason ||= 'name match';
  }

  const company = thread.company.trim().toLowerCase();
  if (company && normalized.includes(company)) {
    score += 45;
    reason ||= 'company match';
  }

  if (thread.id === selectedContactId && text.trim().length > 0) {
    score += 18;
    reason ||= 'currently selected';
  }

  if (score < 35) return null;
  return { thread, score, reason, exactEmail };
}

export function getContactMatchCandidates(
  contactThreads: ContactThread[],
  text: string,
  selectedContactId: string | null,
): ContactMatchCandidate[] {
  return contactThreads
    .map(thread => scoreContactMatch(thread, text, selectedContactId))
    .filter((candidate): candidate is ContactMatchCandidate => Boolean(candidate))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export function decideContactMatch(candidates: ContactMatchCandidate[]): ContactMatchDecision {
  const exactEmailMatch = candidates.find(candidate => candidate.exactEmail && candidate.score >= 100);
  if (exactEmailMatch) {
    return { kind: 'auto-select', candidate: exactEmailMatch };
  }

  if (candidates.length > 0) {
    return { kind: 'confirm', candidates };
  }

  return { kind: 'no-match', candidates };
}
