import type { BusinessContext } from '../../config/businessContext';
import { buildStructuredRequest } from '../workbench/requestModel';
import { requestGeneratedOutput } from '../workbench/generateApiClient';
import type { RecipientProfile, WorkMode } from '../workbench/types';
import {
  formatTranslatePreserveBody,
  translateDraftSourceTitle,
  type DraftLanguage,
} from './draftLanguageToggle';
import { detectLanguage } from '../../lib/languageDetect';

export type TranslateGeneratedDraftParams = {
  draft: string;
  targetLanguage: DraftLanguage;
  preserveTerms: string[];
  mode: WorkMode;
  recipient: RecipientProfile;
  textType: string;
  formality: number;
  warmth: number;
  urgency: number;
  confidence: number;
  businessContext: BusinessContext;
};

export async function translateGeneratedDraft(params: TranslateGeneratedDraftParams): Promise<string> {
  const {
    draft,
    targetLanguage,
    preserveTerms,
    mode,
    recipient,
    textType,
    formality,
    warmth,
    urgency,
    confidence,
    businessContext,
  } = params;

  const trimmedDraft = draft.trim();
  if (!trimmedDraft) {
    return '';
  }

  const aiLanguageLabel = targetLanguage === 'zh' ? 'Chinese (Simplified)' : 'English';
  const inboundLanguage = detectLanguage(trimmedDraft);

  const structuredRequest = buildStructuredRequest({
    mode,
    recipient,
    textType,
    language: aiLanguageLabel,
    formality,
    warmth,
    urgency,
    confidence,
    businessContext,
    rawInput: trimmedDraft,
    snippetMemory: [],
    recentReplies: [],
    generationContext: {
      source: 'translate-draft',
      title: translateDraftSourceTitle(targetLanguage),
      body: formatTranslatePreserveBody(preserveTerms),
    },
    attachmentContext: [],
    crossLanguage: {
      inboundLanguage,
      replyInLanguage: targetLanguage,
      register: 'cross-cultural',
      preserveMeaningOnly: true,
    },
  });

  const apiData = await requestGeneratedOutput({
    ...structuredRequest,
    contactThread: null,
  });

  return apiData.output.trim();
}
