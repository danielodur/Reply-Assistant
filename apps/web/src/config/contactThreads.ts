import { buildMessageFollowUp, type ContactMessageFollowUpKind } from './contactFollowUp';
import { deriveRelationshipStats } from '../components/relationship-memory/deriveRelationshipStats';
import { buildRelationshipPromptBlock } from '../components/relationship-memory/buildRelationshipPromptBlock';

export type ContactStage = 'new-lead' | 'active-client' | 'vip-client' | 'follow-up' | 'closed' | 'internal';

export type ContactReplyEntry = {
  id: string;
  preview: string;
  createdAt: number;
  mode: 'reply' | 'internal';
  recipient: string;
};

export type ContactMessageDirection = 'inbound' | 'outbound' | 'note';

export type ContactMessageSource = 'paste' | 'email-sync' | 'manual-note' | 'generated-reply';

export type ContactMessageEntry = {
  id: string;
  direction: ContactMessageDirection;
  source: ContactMessageSource;
  text: string;
  summary: string;
  createdAt: number;
  sender: string;
  receiver: string;
  followUpKind: ContactMessageFollowUpKind;
  followUpSummary?: string;
};

export type ContactMemoryProfile = {
  role?: string;
  preferredLanguage?: string;
  channelPreference?: string;
  communicationStyle?: '' | 'formal' | 'warm' | 'direct' | 'concise';
  recurringTopics?: string;
  relationshipNotes?: string;
};

export type ContactTimelineDigest = {
  direction: ContactMessageDirection;
  source: ContactMessageSource;
  summary: string;
  createdAt: number;
};

export type PendingDraft = {
  message: string;
  basedOnLines: string[];
  /** Text of the inbound message that triggered the background draft */
  sourceInbound: string;
  createdAt: number;
};

export type ContactThreadSummary = {
  text: string;
  messageCount: number;
  latestMessageAt: number | null;
  updatedAt: number;
  /** True when the user manually edited the summary; auto-refresh preserves the text. */
  locked?: boolean;
};

export type ContactOpenCommitment = {
  id: string;
  kind: Extract<ContactMessageFollowUpKind, 'needs-reply' | 'promise'>;
  summary: string;
  sourceMessageId: string;
  direction: ContactMessageDirection;
  createdAt: number;
};

export type ContactReplyLearningSignal = {
  id: string;
  kind: 'accepted' | 'edited' | 'regenerated';
  preview: string;
  textType?: string;
  variantId?: string;
  createdAt: number;
};

export type ContactThread = {
  id: string;
  name: string;
  company: string;
  email?: string;
  stage: ContactStage;
  notes: string;
  lastReplyAt: number | null;
  replies: ContactReplyEntry[];
  messages: ContactMessageEntry[];
  createdAt: number;
  updatedAt: number;
  chatContext?: string;
  /** Structured relationship memory; edited from contact card only */
  memoryProfile?: ContactMemoryProfile;
  /** Background pre-draft generated after a new inbound arrived; cleared on copy */
  pendingDraft?: PendingDraft;
  /** Compact local summary for threads longer than the recent-message window. */
  threadSummary?: ContactThreadSummary;
  /** Promises, unanswered asks, or reply-needed signals detected from stored messages. */
  openCommitments?: ContactOpenCommitment[];
  /** Local outcome learning from accepted, edited, and regenerated drafts. */
  replyLearning?: ContactReplyLearningSignal[];
  /** sourceMessageIds the user marked done; auto-refresh keeps them out of openCommitments. */
  dismissedCommitmentIds?: string[];
};

const PENDING_DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function normalizePendingDraft(value: unknown): PendingDraft | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  const message = typeof raw.message === 'string' ? raw.message.trim() : '';
  if (!message) return undefined;
  const createdAt = typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt) ? raw.createdAt : 0;
  if (!createdAt || Date.now() - createdAt > PENDING_DRAFT_MAX_AGE_MS) return undefined;
  const basedOnLines = Array.isArray(raw.basedOnLines)
    ? raw.basedOnLines.map(line => String(line ?? '').trim()).filter(line => line.length > 0).slice(0, 8)
    : [];
  const sourceInbound = typeof raw.sourceInbound === 'string' ? raw.sourceInbound.trim() : '';
  return { message, basedOnLines, sourceInbound, createdAt };
}

export type ContactThreadContext = {
  id: string;
  name: string;
  company: string;
  email?: string;
  stage: ContactStage;
  notes: string;
  recentReplies: string[];
  chatContext?: string;
  /** Newest-first timeline snippets for the model */
  recentMessages?: ContactTimelineDigest[];
  /** Serialized memory for prompting */
  memorySummary?: string;
  threadSummary?: ContactThreadSummary;
  openCommitments?: ContactOpenCommitment[];
  replyLearning?: ContactReplyLearningSignal[];
};

export const CONTACT_THREADS_STORAGE_KEY = 'replyAssistantContactThreads';

const DEFAULT_STAGE: ContactStage = 'follow-up';

function toStringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toTimestamp(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeStage(value: unknown): ContactStage {
  switch (value) {
    case 'new-lead':
    case 'active-client':
    case 'vip-client':
    case 'follow-up':
    case 'closed':
    case 'internal':
      return value;
    default:
      return DEFAULT_STAGE;
  }
}

function normalizeReplyEntry(value: unknown): ContactReplyEntry | null {
  if (!value || typeof value !== 'object') return null;

  const item = value as Partial<ContactReplyEntry>;
  const id = toStringValue(item.id).trim();
  const preview = toStringValue(item.preview).trim();
  const createdAt = typeof item.createdAt === 'number' ? item.createdAt : Date.now();
  const mode = item.mode === 'internal' ? 'internal' : 'reply';
  const recipient = toStringValue(item.recipient).trim();

  if (!id || !preview) return null;

  return {
    id,
    preview,
    createdAt,
    mode,
    recipient,
  };
}

function normalizeMessageDirection(value: unknown): ContactMessageDirection {
  switch (value) {
    case 'inbound':
    case 'outbound':
    case 'note':
      return value;
    default:
      return 'note';
  }
}

function normalizeMessageSource(value: unknown): ContactMessageSource {
  switch (value) {
    case 'paste':
    case 'email-sync':
    case 'manual-note':
    case 'generated-reply':
      return value;
    default:
      return 'manual-note';
  }
}

function buildSummary(text: string): string {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (!compact) return '';
  return compact.length > 120 ? `${compact.slice(0, 117)}...` : compact;
}

function normalizeMessageEntry(value: unknown): ContactMessageEntry | null {
  if (!value || typeof value !== 'object') return null;

  const item = value as Partial<ContactMessageEntry>;
  const id = toStringValue(item.id).trim();
  const text = toStringValue(item.text).trim();
  const createdAt = typeof item.createdAt === 'number' ? item.createdAt : Date.now();

  if (!id || !text) return null;

  const summary = toStringValue(item.summary).trim() || buildSummary(text);
  const fallbackFollowUp = buildMessageFollowUp(normalizeMessageDirection(item.direction), text);

  return {
    id,
    direction: normalizeMessageDirection(item.direction),
    source: normalizeMessageSource(item.source),
    text,
    summary,
    createdAt,
    sender: toStringValue(item.sender).trim(),
    receiver: toStringValue(item.receiver).trim(),
    followUpKind: (() => {
      const raw = toStringValue((item as { followUpKind?: string }).followUpKind);
      if (raw === 'needs-reply' || raw === 'promise' || raw === 'none') return raw;
      return fallbackFollowUp.kind;
    })(),
    followUpSummary: toStringValue((item as { followUpSummary?: string }).followUpSummary).trim() || fallbackFollowUp.summary,
  };
}

function buildChatContextFromMessages(messages: ContactMessageEntry[]): string | undefined {
  if (!messages.length) return undefined;

  return messages
    .slice(0, 8)
    .reverse()
    .map(message => {
      const actor = message.direction === 'outbound'
        ? `You -> ${message.receiver || 'contact'}`
        : message.direction === 'inbound'
          ? `${message.sender || 'contact'} -> You`
          : 'Note';
      return `${actor}: ${message.text}`;
    })
    .join('\n');
}

function normalizeThread(value: unknown): ContactThread | null {
  if (!value || typeof value !== 'object') return null;

  const item = value as Partial<ContactThread>;
  const id = toStringValue(item.id).trim();
  const name = toStringValue(item.name).replace(/\s+/g, ' ').trim();
  const company = toStringValue(item.company).replace(/\s+/g, ' ').trim();
  const email = toStringValue(item.email).trim().toLowerCase();
  const notes = toStringValue(item.notes).trim();
  const replies = Array.isArray(item.replies)
    ? item.replies.map(normalizeReplyEntry).filter((entry): entry is ContactReplyEntry => Boolean(entry))
    : [];
  const messages = Array.isArray(item.messages)
    ? item.messages.map(normalizeMessageEntry).filter((entry): entry is ContactMessageEntry => Boolean(entry))
    : [];
  const createdAt = typeof item.createdAt === 'number' ? item.createdAt : Date.now();
  const updatedAt = typeof item.updatedAt === 'number' ? item.updatedAt : createdAt;

  if (!id || !name) return null;

  const memoryRaw = (item as { memoryProfile?: unknown }).memoryProfile;
  let memoryProfile: ContactMemoryProfile | undefined;
  if (memoryRaw && typeof memoryRaw === 'object') {
    const mp = memoryRaw as Record<string, unknown>;
    memoryProfile = {
      role: toStringValue(mp.role).trim() || undefined,
      preferredLanguage: toStringValue(mp.preferredLanguage).trim() || undefined,
      channelPreference: toStringValue(mp.channelPreference).trim() || undefined,
      communicationStyle: normalizeCommunicationStyle(mp.communicationStyle),
      recurringTopics: toStringValue(mp.recurringTopics).trim() || undefined,
      relationshipNotes: toStringValue(mp.relationshipNotes).trim() || undefined,
    };
    const empty = !memoryProfile.role && !memoryProfile.preferredLanguage && !memoryProfile.channelPreference
      && !memoryProfile.communicationStyle && !memoryProfile.recurringTopics && !memoryProfile.relationshipNotes;
    if (empty) memoryProfile = undefined;
  }

  return {
    id,
    name,
    company,
    email: email || undefined,
    stage: normalizeStage(item.stage),
    notes,
    lastReplyAt: toTimestamp(item.lastReplyAt),
    replies: replies.slice(0, 20),
    messages: messages
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 30),
    createdAt,
    updatedAt,
    chatContext: (() => {
      const explicit = typeof item.chatContext === 'string' ? item.chatContext.trim() : '';
      return explicit || buildChatContextFromMessages(messages) || undefined;
    })(),
    memoryProfile,
    pendingDraft: normalizePendingDraft((item as { pendingDraft?: unknown }).pendingDraft),
    threadSummary: normalizeThreadSummary((item as { threadSummary?: unknown }).threadSummary),
    openCommitments: normalizeOpenCommitments((item as { openCommitments?: unknown }).openCommitments),
    replyLearning: normalizeReplyLearning((item as { replyLearning?: unknown }).replyLearning),
    dismissedCommitmentIds: normalizeDismissedCommitmentIds(
      (item as { dismissedCommitmentIds?: unknown }).dismissedCommitmentIds,
    ),
  };
}

function normalizeThreadSummary(value: unknown): ContactThreadSummary | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  const text = toStringValue(raw.text).trim();
  if (!text) return undefined;
  return {
    text: text.slice(0, 700),
    messageCount: Number.isFinite(Number(raw.messageCount)) ? Math.max(0, Math.round(Number(raw.messageCount))) : 0,
    latestMessageAt: toTimestamp(raw.latestMessageAt),
    updatedAt: typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt) ? raw.updatedAt : Date.now(),
    locked: raw.locked === true ? true : undefined,
  };
}

function normalizeDismissedCommitmentIds(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const ids = value
    .map(item => toStringValue(item).trim())
    .filter(id => id.length > 0);
  if (!ids.length) return undefined;
  return Array.from(new Set(ids)).slice(0, 200);
}

function normalizeOpenCommitments(value: unknown): ContactOpenCommitment[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map(item => {
      if (!item || typeof item !== 'object') return null;
      const raw = item as Record<string, unknown>;
      const kind = raw.kind === 'needs-reply' || raw.kind === 'promise' ? raw.kind : null;
      const summary = toStringValue(raw.summary).trim();
      const sourceMessageId = toStringValue(raw.sourceMessageId).trim();
      const id = toStringValue(raw.id).trim() || sourceMessageId;
      if (!kind || !summary || !sourceMessageId) return null;
      return {
        id,
        kind,
        summary: summary.slice(0, 220),
        sourceMessageId,
        direction: normalizeMessageDirection(raw.direction),
        createdAt: typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
      };
    })
    .filter((item): item is ContactOpenCommitment => Boolean(item))
    .slice(0, 8);
  return items.length ? items : undefined;
}

function normalizeReplyLearning(value: unknown): ContactReplyLearningSignal[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map(item => {
      if (!item || typeof item !== 'object') return null;
      const raw = item as Record<string, unknown>;
      const kind = raw.kind === 'accepted' || raw.kind === 'edited' || raw.kind === 'regenerated' ? raw.kind : null;
      const preview = toStringValue(raw.preview).trim();
      const id = toStringValue(raw.id).trim();
      if (!kind || !preview) return null;
      return {
        id: id || `learning-${Date.now()}`,
        kind,
        preview: preview.slice(0, 260),
        textType: toStringValue(raw.textType).trim() || undefined,
        variantId: toStringValue(raw.variantId).trim() || undefined,
        createdAt: typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
      };
    })
    .filter((item): item is ContactReplyLearningSignal => Boolean(item))
    .slice(0, 12);
  return items.length ? items : undefined;
}

function normalizeCommunicationStyle(value: unknown): ContactMemoryProfile['communicationStyle'] {
  const s = toStringValue(value).trim().toLowerCase();
  if (s === 'formal' || s === 'warm' || s === 'direct' || s === 'concise') return s;
  return '';
}

export function loadContactThreads(): ContactThread[] {
  try {
    const raw = localStorage.getItem(CONTACT_THREADS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeThread)
      .filter((thread): thread is ContactThread => Boolean(thread))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveContactThreads(threads: ContactThread[]): void {
  localStorage.setItem(CONTACT_THREADS_STORAGE_KEY, JSON.stringify(threads));
}

export function buildContactThread(input: {
  name: string;
  company?: string;
  email?: string;
  stage?: ContactStage;
  notes?: string;
  memoryProfile?: ContactMemoryProfile;
}): ContactThread {
  const now = Date.now();
  const memoryProfile = sanitizeMemoryProfile(input.memoryProfile);
  const thread: ContactThread = {
    id: `contact-${now}`,
    name: input.name.replace(/\s+/g, ' ').trim(),
    company: toStringValue(input.company).replace(/\s+/g, ' ').trim(),
    email: toStringValue(input.email).trim().toLowerCase() || undefined,
    stage: input.stage ?? DEFAULT_STAGE,
    notes: toStringValue(input.notes).trim(),
    lastReplyAt: null,
    replies: [],
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  if (memoryProfile) {
    thread.memoryProfile = memoryProfile;
  }
  return thread;
}

function sanitizeMemoryProfile(profile: ContactMemoryProfile | undefined): ContactMemoryProfile | undefined {
  if (!profile) return undefined;
  const next: ContactMemoryProfile = {
    role: profile.role?.trim() || undefined,
    preferredLanguage: profile.preferredLanguage?.trim() || undefined,
    channelPreference: profile.channelPreference?.trim() || undefined,
    communicationStyle: normalizeCommunicationStyle(profile.communicationStyle),
    recurringTopics: profile.recurringTopics?.trim() || undefined,
    relationshipNotes: profile.relationshipNotes?.trim() || undefined,
  };
  const empty = !next.role && !next.preferredLanguage && !next.channelPreference
    && !next.communicationStyle && !next.recurringTopics && !next.relationshipNotes;
  return empty ? undefined : next;
}

function buildMemorySummary(profile: ContactMemoryProfile | undefined): string | undefined {
  if (!profile) return undefined;
  const lines: string[] = [];
  if (profile.role?.trim()) lines.push(`Role/relationship: ${profile.role.trim()}`);
  if (profile.preferredLanguage?.trim()) lines.push(`Preferred language: ${profile.preferredLanguage.trim()}`);
  if (profile.channelPreference?.trim()) lines.push(`Channel preference: ${profile.channelPreference.trim()}`);
  if (profile.communicationStyle) lines.push(`Communication style: ${profile.communicationStyle}`);
  if (profile.recurringTopics?.trim()) lines.push(`Recurring topics: ${profile.recurringTopics.trim()}`);
  if (profile.relationshipNotes?.trim()) lines.push(`Relationship notes: ${profile.relationshipNotes.trim()}`);
  return lines.length ? lines.join('\n') : undefined;
}

export function buildContactThreadContext(thread: ContactThread): ContactThreadContext {
  const sorted = [...thread.messages].sort((a, b) => b.createdAt - a.createdAt);
  const recentMessages: ContactTimelineDigest[] = sorted.slice(0, 8).map(m => ({
    direction: m.direction,
    source: m.source,
    summary: (m.summary || m.text).trim().slice(0, 200),
    createdAt: m.createdAt,
  }));
  const manualMemorySummary = buildMemorySummary(thread.memoryProfile) ?? '';
  const relationshipBlock = buildRelationshipPromptBlock(
    deriveRelationshipStats(thread.messages),
  );
  // Manual memory wins on conflict: keep it on top; append derived block only
  // when at least one stat passed its threshold (function returns null otherwise).
  const memorySummary = [manualMemorySummary, relationshipBlock]
    .filter(part => typeof part === 'string' && part.length > 0)
    .join('\n\n');

  return {
    id: thread.id,
    name: thread.name,
    company: thread.company,
    email: thread.email,
    stage: thread.stage,
    notes: thread.notes,
    recentReplies: thread.replies.slice(0, 5).map(reply => reply.preview),
    chatContext: thread.chatContext?.trim() || undefined,
    recentMessages,
    memorySummary,
    threadSummary: thread.threadSummary,
    openCommitments: thread.openCommitments?.slice(0, 5),
    replyLearning: thread.replyLearning?.slice(0, 5),
  };
}

export function refreshContactContinuity(thread: ContactThread): ContactThread {
  const sortedNewest = [...thread.messages].sort((a, b) => b.createdAt - a.createdAt);
  const sortedOldest = [...sortedNewest].reverse();
  const latestMessageAt = sortedNewest[0]?.createdAt ?? null;
  const autoText = sortedOldest
    .map(message => {
      const actor = message.direction === 'outbound' ? 'You' : message.direction === 'inbound' ? thread.name : 'Note';
      return `${actor}: ${message.summary || buildSummary(message.text)}`;
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 700);
  const existingSummary = thread.threadSummary;
  const threadSummary: ContactThreadSummary | undefined = sortedNewest.length > 8
    ? existingSummary?.locked
      ? {
          ...existingSummary,
          messageCount: sortedNewest.length,
          latestMessageAt,
        }
      : {
          text: autoText,
          messageCount: sortedNewest.length,
          latestMessageAt,
          updatedAt: Date.now(),
        }
    : existingSummary?.locked
      ? existingSummary
      : undefined;

  const dismissed = new Set(thread.dismissedCommitmentIds ?? []);
  const openCommitments = sortedNewest
    .filter(message => message.followUpKind === 'needs-reply' || message.followUpKind === 'promise')
    .filter(message => !dismissed.has(message.id))
    .map(message => ({
      id: `commitment-${message.id}`,
      kind: message.followUpKind as ContactOpenCommitment['kind'],
      summary: (message.followUpSummary || message.summary || buildSummary(message.text)).slice(0, 220),
      sourceMessageId: message.id,
      direction: message.direction,
      createdAt: message.createdAt,
    }))
    .slice(0, 8);

  return {
    ...thread,
    threadSummary,
    openCommitments: openCommitments.length ? openCommitments : undefined,
  };
}

export function dismissContactCommitment(thread: ContactThread, sourceMessageId: string): ContactThread {
  const id = sourceMessageId.trim();
  if (!id) return thread;
  const existing = new Set(thread.dismissedCommitmentIds ?? []);
  if (existing.has(id)) return thread;
  existing.add(id);
  const next: ContactThread = {
    ...thread,
    dismissedCommitmentIds: Array.from(existing).slice(0, 200),
    updatedAt: Date.now(),
  };
  return refreshContactContinuity(next);
}

export function updateContactThreadSummary(thread: ContactThread, text: string): ContactThread {
  const trimmed = text.replace(/\s+/g, ' ').trim().slice(0, 700);
  const now = Date.now();
  const latestMessageAt = thread.messages.reduce<number | null>(
    (latest, message) => (latest === null || message.createdAt > latest ? message.createdAt : latest),
    null,
  );
  if (!trimmed) {
    if (!thread.threadSummary) return thread;
    const { threadSummary: _drop, ...rest } = thread;
    return { ...rest, updatedAt: now };
  }
  return {
    ...thread,
    threadSummary: {
      text: trimmed,
      messageCount: thread.messages.length,
      latestMessageAt,
      updatedAt: now,
      locked: true,
    },
    updatedAt: now,
  };
}

export function appendReplyLearningSignal(
  thread: ContactThread,
  signal: Omit<ContactReplyLearningSignal, 'id' | 'createdAt'> & { createdAt?: number },
): ContactThread {
  const createdAt = signal.createdAt ?? Date.now();
  const preview = signal.preview.trim().slice(0, 260);
  if (!preview) return thread;
  const nextSignal: ContactReplyLearningSignal = {
    id: `learning-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    kind: signal.kind,
    preview,
    textType: signal.textType,
    variantId: signal.variantId,
    createdAt,
  };
  return {
    ...thread,
    replyLearning: [nextSignal, ...(thread.replyLearning ?? [])]
      .filter((item, index, list) => list.findIndex(other => other.kind === item.kind && other.preview === item.preview) === index)
      .slice(0, 12),
    updatedAt: createdAt,
  };
}

/** True if the newest timeline entry is a duplicate inbound paste within the window (avoids double-logging on regenerate). */
export function isRecentDuplicateInbound(thread: ContactThread, text: string, windowMs = 120_000): boolean {
  const head = thread.messages[0];
  if (!head || head.direction !== 'inbound') return false;
  if (head.text.trim() !== text.trim()) return false;
  return Date.now() - head.createdAt < windowMs;
}

/** Prefer the contact with the most recent inbound message; tie-break by thread activity. */
export function pickDefaultContactId(threads: ContactThread[]): string | null {
  if (!threads.length) return null;
  const scored = threads.map(t => {
    const latestInbound = t.messages
      .filter(m => m.direction === 'inbound')
      .reduce((max, m) => Math.max(max, m.createdAt), 0);
    return { id: t.id, latestInbound, updatedAt: t.updatedAt };
  });
  scored.sort((a, b) => {
    if (b.latestInbound !== a.latestInbound) return b.latestInbound - a.latestInbound;
    return b.updatedAt - a.updatedAt;
  });
  return scored[0]?.id ?? null;
}

/** After the user edits the draft, align the newest generated-reply outbound line + reply preview with what they actually sent. */
export function patchLatestGeneratedOutbound(thread: ContactThread, newText: string): ContactThread {
  const trimmed = newText.trim();
  if (!trimmed || !thread.replies.length) return thread;
  const [latestReply, ...restReplies] = thread.replies;
  const nextReplies = [{ ...latestReply, preview: trimmed }, ...restReplies];
  const latestMsg = thread.messages[0];
  let nextMessages = thread.messages;
  if (latestMsg?.direction === 'outbound' && latestMsg?.source === 'generated-reply') {
    const followUp = buildMessageFollowUp('outbound', trimmed);
    nextMessages = [
      {
        ...latestMsg,
        text: trimmed,
        summary: buildSummary(trimmed),
        followUpKind: followUp.kind,
        followUpSummary: followUp.summary,
      },
      ...thread.messages.slice(1),
    ];
  }
  return {
    ...thread,
    replies: nextReplies,
    messages: nextMessages,
    chatContext: mergeThreadChatContext(nextMessages, thread.chatContext),
    updatedAt: Date.now(),
  };
}

export function getContactFollowUpAgeDays(thread: ContactThread): number | null {
  if (!thread.lastReplyAt) return null;
  return Math.max(1, Math.floor((Date.now() - thread.lastReplyAt) / 86400000));
}

export function buildContactMessageEntry(input: {
  direction: ContactMessageDirection;
  source: ContactMessageSource;
  text: string;
  sender?: string;
  receiver?: string;
  createdAt?: number;
}): ContactMessageEntry {
  const createdAt = input.createdAt ?? Date.now();
  const text = toStringValue(input.text).trim();
  const followUp = buildMessageFollowUp(input.direction, text);

  return {
    id: `message-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    direction: input.direction,
    source: input.source,
    text,
    summary: buildSummary(text),
    createdAt,
    sender: toStringValue(input.sender).trim(),
    receiver: toStringValue(input.receiver).trim(),
    followUpKind: followUp.kind,
    followUpSummary: followUp.summary,
  };
}

export function mergeThreadChatContext(messages: ContactMessageEntry[], manualContext?: string): string | undefined {
  const generated = buildChatContextFromMessages(messages);
  const trimmedManual = typeof manualContext === 'string' ? manualContext.trim() : '';

  if (generated && trimmedManual) {
    return `${generated}\n${trimmedManual}`.trim();
  }

  return generated || trimmedManual || undefined;
}

export function hasContactEmailNeedsAction(thread: ContactThread): boolean {
  const latestInboundEmailAt = thread.messages
    .filter(message => message.direction === 'inbound' && message.source === 'email-sync')
    .reduce<number | null>((latest, message) => {
      if (latest === null || message.createdAt > latest) return message.createdAt;
      return latest;
    }, null);

  const latestOutboundAt = thread.messages
    .filter(message => message.direction === 'outbound')
    .reduce<number | null>((latest, message) => {
      if (latest === null || message.createdAt > latest) return message.createdAt;
      return latest;
    }, null);

  return latestInboundEmailAt !== null && (latestOutboundAt === null || latestOutboundAt < latestInboundEmailAt);
}
