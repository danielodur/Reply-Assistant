import type { ContactThread } from '../src/config/contactThreads.ts';
import { routeCmdKIntent } from '../src/components/cmd-k/intentRouter.ts';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const contacts: ContactThread[] = [
  {
    id: 'c1',
    name: 'John Smith',
    company: 'Acme Corp',
    stage: 'active-client',
    notes: '',
    lastReplyAt: null,
    replies: [],
    messages: [],
    createdAt: 1,
    updatedAt: 1,
  },
  {
    id: 'c2',
    name: 'Sarah Lee',
    company: 'Beta LLC',
    stage: 'active-client',
    notes: '',
    lastReplyAt: null,
    replies: [],
    messages: [],
    createdAt: 2,
    updatedAt: 2,
  },
];

const empty = routeCmdKIntent('', contacts);
assert(empty.kind === 'empty', 'empty query → empty intent');

const select = routeCmdKIntent('John Smith', contacts);
assert(select.kind === 'select-contact' && select.contact.id === 'c1', 'exact name → select-contact');

const followUp = routeCmdKIntent('follow up with Sarah', contacts);
assert(
  followUp.kind === 'follow-up' && followUp.contact.id === 'c2',
  'follow up with name → follow-up intent',
);

const draft = routeCmdKIntent('reply to John about pricing', contacts);
assert(
  draft.kind === 'draft-reply' && draft.contact.id === 'c1' && draft.prompt.toLowerCase().includes('pricing'),
  'reply to contact → draft-reply with remainder prompt',
);

const paste = routeCmdKIntent('Please send the invoice by Friday', contacts);
assert(paste.kind === 'paste-into-composer', 'unknown text → paste-into-composer');

console.log('cmd-k intent router tests OK');
