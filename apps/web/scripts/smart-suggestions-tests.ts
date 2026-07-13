import type { ContactThread } from '../src/config/contactThreads';
import { buildContactPriority } from '../src/components/contacts/contactPriority';
import { buildSmartSuggestions, getPaletteSuggestions } from '../src/components/smart-suggestions/buildSmartSuggestions';
import { SMART_CHIP_SCORE_THRESHOLD } from '../src/components/smart-suggestions/types';

function makeThread(overrides: Partial<ContactThread> & Pick<ContactThread, 'id' | 'name'>): ContactThread {
  return {
    id: overrides.id,
    name: overrides.name,
    company: overrides.company ?? '',
    email: overrides.email ?? '',
    stage: overrides.stage ?? 'existing-client',
    notes: overrides.notes ?? '',
    lastReplyAt: overrides.lastReplyAt ?? null,
    replies: overrides.replies ?? [],
    messages: overrides.messages ?? [],
    createdAt: overrides.createdAt ?? Date.now(),
    updatedAt: overrides.updatedAt ?? Date.now(),
    chatContext: overrides.chatContext,
    memoryProfile: overrides.memoryProfile,
    pendingDraft: overrides.pendingDraft ?? null,
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const priorityRows = [
  {
    thread: makeThread({
      id: 'c1',
      name: 'Sarah',
      messages: [{
        id: 'm1',
        direction: 'inbound',
        source: 'paste',
        text: 'Can we meet tomorrow?',
        summary: 'Can we meet tomorrow?',
        createdAt: Date.now() - 3600000,
        sender: 'Sarah',
        receiver: 'You',
      }],
    }),
    priority: buildContactPriority(makeThread({
      id: 'c1',
      name: 'Sarah',
      messages: [{
        id: 'm1',
        direction: 'inbound',
        source: 'paste',
        text: 'Can we meet tomorrow?',
        summary: 'Can we meet tomorrow?',
        createdAt: Date.now() - 3600000,
        sender: 'Sarah',
        receiver: 'You',
      }],
    })),
  },
];

const suggestions = buildSmartSuggestions({
  contactThreads: priorityRows.map(row => row.thread),
  contactPriorityRows: priorityRows,
  selectedContactId: null,
  composerEmpty: true,
  rhythmEvents: [],
});

assert(suggestions.length > 0, 'expected suggestions for contacts');
assert(
  suggestions.some(item => item.kind === 'reply-contact' && item.contactName === 'Sarah'),
  'expected reply suggestion for Sarah',
);

const palette = getPaletteSuggestions(suggestions);
assert(palette.length <= 3, 'palette should cap at 3 suggestions');

const emptyContacts = buildSmartSuggestions({
  contactThreads: [],
  contactPriorityRows: [],
  selectedContactId: null,
  composerEmpty: true,
  rhythmEvents: [],
});
assert(emptyContacts[0]?.kind === 'add-contact', 'empty contacts should suggest add-contact');

assert(SMART_CHIP_SCORE_THRESHOLD >= 30, 'chip threshold should stay meaningful');

console.log('smart-suggestions tests OK');
