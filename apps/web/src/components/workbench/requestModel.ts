import type { WorkMode, RecipientProfile } from './types';
import type { BusinessContext } from '../../config/businessContext';
import type { UploadContextSummary } from '../../uploads/uploadTypes';

export type GenerationSource =
  | 'composer'
  | 'paste-and-generate'
  | 'instant-ammo'
  | 'today-queue'
  | 'action-inbox'
  | 'smart-reply'
  | 'translate-draft';

export interface RequestSnippetMemory {
  title: string;
  text: string;
}

export interface RequestRecentReplyMemory {
  preview: string;
  mode: WorkMode;
  recipient: RecipientProfile;
  contactName?: string;
}

export interface RequestGenerationContext {
  source: GenerationSource;
  title?: string;
  body?: string;
}

/** Fully resolved language identifier */
export type ResolvedLanguage = string;

/** Numeric tone controls in [1, 5] range */
export interface ToneControls {
  formality: number;
  warmth: number;
  urgency: number;
  /** Only present when Silver rank unlocked */
  confidence: number;
}

/**
 * Optional cross-language signal. Populated only when the inbound message and
 * the chosen reply language differ, or when the user has explicitly entered
 * "Polish my English" mode. The backend can use these fields to bias prompt
 * construction; omitting the block preserves the existing behavior verbatim.
 */
/**
 * Optional voice profile (Phase 21a — "Write like me"). Populated only
 * when the user has accumulated enough accepted/edited reply samples to
 * make an honest claim about their voice. The backend can use these
 * fields to bias prompt construction; omitting the block preserves the
 * existing behavior verbatim.
 */
export interface VoiceProfileContext {
  /** Up to 3 typical greeting openers we have observed the user use. */
  openers: string[];
  /** Up to 3 typical sign-offs. */
  signoffs: string[];
  /** Median sentence length in characters across the observed samples. */
  medianSentenceLength: number;
  /** True when the observed samples include emoji. */
  usesEmoji: boolean;
  /** Sample size that produced the profile. */
  sampleSize: number;
}

export interface CrossLanguageContext {
  /** Locally detected language of the inbound text we are responding to. */
  inboundLanguage: 'zh' | 'en' | 'mixed' | 'unknown';
  /** Resolved language the reply should be generated in. */
  replyInLanguage: 'en' | 'zh';
  /** High-level register hint chosen by the local rule engine. */
  register: 'western-business' | 'chinese-business' | 'cross-cultural' | 'polish-english' | 'neutral';
  /** True when the user asked us to keep their original meaning intact (polish-english mode). */
  preserveMeaningOnly: boolean;
}

/**
 * The canonical request contract that will be passed to the AI generation
 * endpoint. Build this once before any generation call so the AI layer
 * receives a single, typed object rather than many loose arguments.
 */
export interface StructuredRequest {
  mode: WorkMode;
  recipient: RecipientProfile;
  textType: string;
  language: ResolvedLanguage;
  tone: ToneControls;
  /** Populated only when businessContext has at least one non-empty field */
  businessContext: BusinessContext | null;
  rawInput: string;
  snippetMemory: RequestSnippetMemory[];
  recentReplies: RequestRecentReplyMemory[];
  generationContext: RequestGenerationContext | null;
  attachmentContext: UploadContextSummary[];
  /** Optional — only present when the cross-language layer has something to say. */
  crossLanguage?: CrossLanguageContext;
  /** Optional — only present when buildVoiceProfile returned a profile. */
  voiceProfile?: VoiceProfileContext;
}

export interface BuildRequestParams {
  mode: WorkMode;
  recipient: RecipientProfile;
  textType: string;
  language: ResolvedLanguage;
  formality: number;
  warmth: number;
  urgency: number;
  confidence: number;
  businessContext: BusinessContext;
  rawInput: string;
  snippetMemory?: RequestSnippetMemory[];
  recentReplies?: RequestRecentReplyMemory[];
  generationContext?: RequestGenerationContext | null;
  attachmentContext?: UploadContextSummary[];
  crossLanguage?: CrossLanguageContext;
  voiceProfile?: VoiceProfileContext;
}

/** Returns null for businessContext when all fields are empty strings */
function resolveBusinessContext(ctx: BusinessContext): BusinessContext | null {
  const hasData = Object.values(ctx).some(v => typeof v === 'string' && v.trim().length > 0);
  return hasData ? { ...ctx } : null;
}

function resolveSnippetMemory(snippets?: RequestSnippetMemory[]): RequestSnippetMemory[] {
  if (!Array.isArray(snippets)) return [];

  return snippets
    .map(snippet => ({
      title: String(snippet?.title ?? '').trim(),
      text: String(snippet?.text ?? '').trim(),
    }))
    .filter(snippet => snippet.text.length > 0)
    .slice(0, 5);
}

function resolveRecentReplies(replies?: RequestRecentReplyMemory[]): RequestRecentReplyMemory[] {
  if (!Array.isArray(replies)) return [];

  return replies
    .map(reply => ({
      preview: String(reply?.preview ?? '').trim(),
      mode: reply.mode,
      recipient: reply.recipient,
      contactName: typeof reply?.contactName === 'string' ? reply.contactName.trim() : undefined,
    }))
    .filter(reply => reply.preview.length > 0)
    .slice(0, 5);
}

function resolveAttachmentContext(attachments?: UploadContextSummary[]): UploadContextSummary[] {
  if (!Array.isArray(attachments)) return [];

  const sourceCounts: Record<string, number> = {};
  const sourceLimits: Record<string, number> = {
    composer: 3,
    'business-context': 5,
    contact: 5,
  };

  return attachments
    .map(item => ({
      ...item,
      filename: String(item?.filename ?? '').trim(),
      extension: String(item?.extension ?? '').trim().toLowerCase(),
      mimeType: String(item?.mimeType ?? '').trim(),
      summary: String(item?.summary ?? '').trim(),
      extractedText: String(item?.extractedText ?? '').trim(),
      status: item.status,
      confidence: Number.isFinite(Number(item.confidence)) ? Number(item.confidence) : 0,
    }))
    .filter(item => item.filename && (item.summary || item.extractedText))
    .filter(item => {
      const limit = sourceLimits[item.source] ?? 0;
      if (!limit) return false;
      const current = sourceCounts[item.source] ?? 0;
      if (current >= limit) return false;
      sourceCounts[item.source] = current + 1;
      return true;
    });
}

/**
 * Builds a StructuredRequest from raw composer state.
 * Call this just before invoking any generation function.
 */
export function buildStructuredRequest(params: BuildRequestParams): StructuredRequest {
  const base: StructuredRequest = {
    mode: params.mode,
    recipient: params.recipient,
    textType: params.textType,
    language: params.language,
    tone: {
      formality: params.formality,
      warmth: params.warmth,
      urgency: params.urgency,
      confidence: params.confidence,
    },
    businessContext: resolveBusinessContext(params.businessContext),
    rawInput: params.rawInput.trim(),
    snippetMemory: resolveSnippetMemory(params.snippetMemory),
    recentReplies: resolveRecentReplies(params.recentReplies),
    generationContext: params.generationContext ?? null,
    attachmentContext: resolveAttachmentContext(params.attachmentContext),
  };

  if (params.crossLanguage) {
    base.crossLanguage = params.crossLanguage;
  }
  if (params.voiceProfile) {
    base.voiceProfile = params.voiceProfile;
  }

  return base;
}
