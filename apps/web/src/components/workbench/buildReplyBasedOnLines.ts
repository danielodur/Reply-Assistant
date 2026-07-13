import type { ContactThread } from '../../config/contactThreads';
import type { BusinessContext } from '../../config/businessContext';
import type { UploadContextSummary } from '../../uploads/uploadTypes';

const MAX_BASED_ON_LINES = 3;
/** Per-line cap so “Based on” stays a quick cue, not a second document. */
const MAX_LINE_CHARS = 58;

type BasedOnLabels = {
  latestMessage: string;
  relationshipMemory: string;
  businessContext: string;
  yourInput: string;
  recentTimeline: string;
  attachments: string;
  limitedContext: string;
};

type BuildReplyBasedOnLinesOptions = {
  businessContext?: BusinessContext;
  attachmentContext?: UploadContextSummary[];
  labels: BasedOnLabels;
};

function compactSnippet(text: string, maxLen: number): string {
  const s = text.replace(/\s+/g, ' ').trim();
  if (!s) return '';
  return s.length > maxLen ? `${s.slice(0, maxLen - 1)}…` : s;
}

/** Strip verbose “You -> Name:” preambles from pasted thread context. */
function stripChatContextPreamble(text: string): string {
  let s = text.replace(/\s+/g, ' ').trim();
  const arrow = /^you\s*->\s*[^:]+:\s*/i;
  s = s.replace(arrow, '').trim();
  return s;
}

function line(label: string, text: string): string {
  const prefix = `${label}: `;
  const budget = Math.max(12, MAX_LINE_CHARS - prefix.length);
  return `${prefix}${compactSnippet(text, budget)}`;
}

function summarizeBusinessContext(context: BusinessContext | undefined): string {
  if (!context) return '';
  const parts = [
    context.companyName,
    context.yourPosition,
    context.industry,
    context.productsServices,
    context.brandVoice,
    context.doNotSay ? `rules: ${context.doNotSay}` : '',
  ];
  return parts.map(part => part.trim()).filter(Boolean).join(' · ');
}

function summarizeMemory(thread: ContactThread | null): string {
  const mp = thread?.memoryProfile;
  if (!mp) return '';
  const parts = [
    mp.relationshipNotes,
    mp.role,
    mp.communicationStyle,
    mp.recurringTopics,
    mp.channelPreference,
    mp.preferredLanguage,
  ];
  return parts.map(part => (part || '').trim()).filter(Boolean).join(' · ');
}

/**
 * At most 3 short lines for the reply modal: real evidence only, or an honest limited-context cue.
 */
export function buildReplyBasedOnLines(
  thread: ContactThread | null,
  rawInput: string,
  options: BuildReplyBasedOnLinesOptions,
): string[] {
  const lines: string[] = [];
  const { labels, businessContext, attachmentContext } = options;

  const sortedMessages = thread?.messages?.length
    ? [...thread.messages].sort((a, b) => b.createdAt - a.createdAt)
    : [];
  const latestInbound = sortedMessages.find(m => m.direction === 'inbound');
  const latestTimeline = sortedMessages.find(m => m !== latestInbound);

  if (latestInbound) {
    const inboundText = latestInbound.summary || latestInbound.text;
    if (inboundText.trim()) lines.push(line(labels.latestMessage, inboundText));
  }

  const memory = summarizeMemory(thread);
  if (memory) {
    lines.push(line(labels.relationshipMemory, memory));
  }

  const business = summarizeBusinessContext(businessContext);
  if (business) {
    lines.push(line(labels.businessContext, business));
  }

  const attachmentEvidence = Array.isArray(attachmentContext)
    ? attachmentContext
        .filter(item => item.status === 'ready' && (item.summary.trim() || item.extractedText.trim()))
        .map(item => item.summary || item.extractedText || item.filename)
        .join(' · ')
    : '';
  if (attachmentEvidence) {
    lines.push(line(labels.attachments, attachmentEvidence));
  }

  const yourAsk = rawInput.trim();
  if (yourAsk) {
    lines.push(line(labels.yourInput, yourAsk));
  }

  if (latestTimeline) {
    const timelineText = latestTimeline.summary || latestTimeline.text;
    if (timelineText.trim()) lines.push(line(labels.recentTimeline, timelineText));
  } else if (thread?.chatContext?.trim()) {
    const stripped = stripChatContextPreamble(thread.chatContext);
    if (stripped) lines.push(line(labels.recentTimeline, stripped));
  }

  const uniqueLines = Array.from(new Set(lines)).slice(0, MAX_BASED_ON_LINES);
  if (uniqueLines.length) {
    return uniqueLines;
  }

  return [labels.limitedContext];
}

export type BasedOnDetailGroup =
  | 'latest-message'
  | 'relationship-memory'
  | 'business-context'
  | 'your-input'
  | 'recent-timeline'
  | 'attachments';

export type BasedOnDetail = {
  group: BasedOnDetailGroup;
  /** Pre-formatted lines for this group, untruncated. */
  bullets: string[];
};

type BuildReplyBasedOnDetailsOptions = {
  businessContext?: BusinessContext;
  attachmentContext?: UploadContextSummary[];
};

/**
 * Expanded counterpart of `buildReplyBasedOnLines` for the "see full evidence"
 * panel. Returns grouped bullets without the 58-char per-line cap so the user
 * can audit exactly what the model leaned on.
 */
export function buildReplyBasedOnDetails(
  thread: ContactThread | null,
  rawInput: string,
  options: BuildReplyBasedOnDetailsOptions,
): BasedOnDetail[] {
  const groups: BasedOnDetail[] = [];
  const { businessContext, attachmentContext } = options;

  const sortedMessages = thread?.messages?.length
    ? [...thread.messages].sort((a, b) => b.createdAt - a.createdAt)
    : [];
  const latestInbound = sortedMessages.find(m => m.direction === 'inbound');
  const latestTimeline = sortedMessages.find(m => m !== latestInbound);

  if (latestInbound) {
    const inboundText = (latestInbound.text || latestInbound.summary || '').trim();
    if (inboundText) groups.push({ group: 'latest-message', bullets: [inboundText] });
  }

  const memoryProfile = thread?.memoryProfile;
  if (memoryProfile) {
    const bullets = [
      memoryProfile.relationshipNotes,
      memoryProfile.role,
      memoryProfile.communicationStyle,
      memoryProfile.recurringTopics,
      memoryProfile.channelPreference,
      memoryProfile.preferredLanguage,
    ]
      .map(value => (value || '').trim())
      .filter(Boolean);
    if (bullets.length) groups.push({ group: 'relationship-memory', bullets });
  }

  if (businessContext) {
    const bullets = [
      businessContext.companyName,
      businessContext.yourPosition,
      businessContext.industry,
      businessContext.productsServices,
      businessContext.brandVoice,
      businessContext.doNotSay ? `rules: ${businessContext.doNotSay}` : '',
    ]
      .map(value => (value || '').trim())
      .filter(Boolean);
    if (bullets.length) groups.push({ group: 'business-context', bullets });
  }

  const yourAsk = rawInput.trim();
  if (yourAsk) {
    groups.push({ group: 'your-input', bullets: [yourAsk] });
  }

  if (latestTimeline) {
    const timelineText = (latestTimeline.text || latestTimeline.summary || '').trim();
    if (timelineText) groups.push({ group: 'recent-timeline', bullets: [timelineText] });
  } else if (thread?.chatContext?.trim()) {
    const stripped = stripChatContextPreamble(thread.chatContext);
    if (stripped) groups.push({ group: 'recent-timeline', bullets: [stripped] });
  }

  if (Array.isArray(attachmentContext)) {
    const bullets = attachmentContext
      .filter(item => item.status === 'ready')
      .map(item => {
        const label = item.filename || item.summary || item.extractedText;
        const note = (item.summary || item.extractedText || '').trim();
        return note ? `${label}: ${note}` : label;
      })
      .filter(Boolean);
    if (bullets.length) groups.push({ group: 'attachments', bullets });
  }

  return groups;
}
