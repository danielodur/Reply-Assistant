import type { ContactThread } from '../../config/contactThreads';
import type { SmartSuggestion } from '../smart-suggestions/types';

/**
 * Pattern-based intent routing for the Cmd+K palette.
 *
 * No AI call — pure string analysis against the contact list. Predictable,
 * instant, easy to iterate. The router classifies the typed query into one
 * of a small number of actions that the floating assistant already knows
 * how to perform.
 */

export type CmdKIntent =
  | { kind: 'select-contact'; contact: ContactThread }
  | { kind: 'draft-reply'; contact: ContactThread; prompt: string }
  | { kind: 'follow-up'; contact: ContactThread; prompt: string }
  | { kind: 'paste-into-composer'; text: string }
  | { kind: 'empty' };

const DRAFT_VERBS = ['draft', 'reply', 'write', 'tell', 'ask', 'send', 'email', 'message'];
const FOLLOWUP_VERBS = ['follow up', 'follow-up', 'followup', 'ping', 'check in', 'check-in', 'nudge'];

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function findContactByName(query: string, contacts: ContactThread[]): ContactThread | null {
  const normalizedQuery = normalizeName(query);
  if (!normalizedQuery) return null;

  // Exact name or company match first
  for (const contact of contacts) {
    if (normalizeName(contact.name) === normalizedQuery) return contact;
    if (contact.company && normalizeName(contact.company) === normalizedQuery) return contact;
  }

  const firstWord = normalizedQuery.split(/\s+/).filter(Boolean)[0] ?? '';
  if (firstWord.length >= 2) {
    const wordHits = contacts.filter(contact => {
      const nameParts = normalizeName(contact.name).split(/\s+/).filter(Boolean);
      return nameParts.some(part => part === firstWord || part.startsWith(firstWord) || firstWord.startsWith(part));
    });
    if (wordHits.length === 1) return wordHits[0];
    if (wordHits.length > 1) {
      return wordHits.sort((a, b) => normalizeName(a.name).length - normalizeName(b.name).length)[0];
    }
  }

  // Substring match — longest contact name wins so "John Smith" beats "John"
  const candidates = contacts.filter(contact => {
    const name = normalizeName(contact.name);
    const company = normalizeName(contact.company || '');
    const nameMatches = Boolean(name && (normalizedQuery.includes(name) || name.includes(normalizedQuery)));
    const companyMatches = Boolean(company && (normalizedQuery.includes(company) || company.includes(normalizedQuery)));
    return nameMatches || companyMatches;
  });

  if (!candidates.length) return null;

  return candidates.sort((a, b) => normalizeName(b.name).length - normalizeName(a.name).length)[0];
}

function stripVerbPrefix(text: string, verbs: string[]): string {
  const lower = text.toLowerCase();
  for (const verb of verbs) {
    if (lower.startsWith(verb + ' ') || lower === verb) {
      return text.slice(verb.length).trim();
    }
  }
  return text;
}

function stripContactName(text: string, contact: ContactThread): string {
  const name = normalizeName(contact.name);
  const company = normalizeName(contact.company || '');
  let cleaned = text;
  const lower = cleaned.toLowerCase();

  for (const candidate of [name, company]) {
    if (!candidate) continue;
    const idx = lower.indexOf(candidate);
    if (idx >= 0) {
      cleaned = (cleaned.slice(0, idx) + cleaned.slice(idx + candidate.length)).trim();
      cleaned = cleaned.replace(/^(about|that|to|for|on|with|re:?)\s+/i, '').trim();
      break;
    }
  }

  return cleaned;
}

export function routeCmdKIntent(rawQuery: string, contacts: ContactThread[]): CmdKIntent {
  const query = rawQuery.trim();
  if (!query) return { kind: 'empty' };

  const lower = query.toLowerCase();

  // Follow-up verbs take precedence — "follow up with John" is unambiguous
  const isFollowUp = FOLLOWUP_VERBS.some(verb => lower.startsWith(verb));
  if (isFollowUp) {
    const remainder = stripVerbPrefix(query, FOLLOWUP_VERBS);
    const cleaned = remainder.replace(/^(with|on)\s+/i, '').trim();
    const contact = findContactByName(cleaned, contacts);
    if (contact) {
      const prompt = stripContactName(cleaned, contact);
      return { kind: 'follow-up', contact, prompt: prompt || `Follow up with ${contact.name}.` };
    }
  }

  // Draft verbs: "tell sarah", "reply to john about pricing", "write to acme"
  const isDraft = DRAFT_VERBS.some(verb => lower.startsWith(verb + ' '));
  if (isDraft) {
    const remainder = stripVerbPrefix(query, DRAFT_VERBS);
    const cleaned = remainder.replace(/^(to|for)\s+/i, '').trim();
    const contact = findContactByName(cleaned, contacts);
    if (contact) {
      const prompt = stripContactName(cleaned, contact) || cleaned;
      return { kind: 'draft-reply', contact, prompt };
    }
  }

  // Bare name or "@name": select the contact
  const atMatch = query.match(/^@(.+)$/);
  if (atMatch) {
    const contact = findContactByName(atMatch[1], contacts);
    if (contact) return { kind: 'select-contact', contact };
  }

  // Bare contact name match (entire query equals a known contact name/company)
  const exactContact = findContactByName(query, contacts);
  if (exactContact && normalizeName(exactContact.name) === normalizeName(query)) {
    return { kind: 'select-contact', contact: exactContact };
  }
  if (exactContact && exactContact.company && normalizeName(exactContact.company) === normalizeName(query)) {
    return { kind: 'select-contact', contact: exactContact };
  }

  // Query contains a known contact name plus more text → draft for them
  if (exactContact) {
    const remainder = stripContactName(query, exactContact);
    if (remainder.length > 2) {
      return { kind: 'draft-reply', contact: exactContact, prompt: remainder };
    }
    return { kind: 'select-contact', contact: exactContact };
  }

  // Fallback: drop into the composer as if it were pasted text
  return { kind: 'paste-into-composer', text: query };
}

export function suggestionToIntent(suggestion: SmartSuggestion, contacts: ContactThread[]): CmdKIntent {
  switch (suggestion.kind) {
    case 'reply-contact':
    case 'resume-contact': {
      const contact = contacts.find(item => item.id === suggestion.contactId);
      if (!contact) return { kind: 'empty' };
      return { kind: 'select-contact', contact };
    }
    case 'follow-up-contact': {
      const contact = contacts.find(item => item.id === suggestion.contactId);
      if (!contact) return { kind: 'empty' };
      return {
        kind: 'follow-up',
        contact,
        prompt: suggestion.promptSeed || `Follow up with ${contact.name}.`,
      };
    }
    case 'paste-message':
      return { kind: 'paste-into-composer', text: '' };
    case 'add-contact':
      return { kind: 'empty' };
    case 'quick-scenario':
      return { kind: 'empty' };
    default:
      return { kind: 'empty' };
  }
}

export function describeIntent(intent: CmdKIntent): string {
  switch (intent.kind) {
    case 'select-contact':
      return `Open ${intent.contact.name}`;
    case 'draft-reply':
      return `Draft a reply to ${intent.contact.name}`;
    case 'follow-up':
      return `Follow up with ${intent.contact.name}`;
    case 'paste-into-composer':
      return 'Use as message';
    case 'empty':
      return '';
  }
}
