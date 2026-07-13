import type { BusinessContext } from '../../config/businessContext';
import { detectLanguage } from '../../lib/languageDetect';

export type DraftLanguage = 'en' | 'zh';

const EMAIL_REGEX = /[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/g;
const URL_REGEX = /https?:\/\/\S+/gi;

export const TRANSLATE_DRAFT_SOURCE_TITLE_PREFIX = 'translate-language:';

export function translateDraftSourceTitle(target: DraftLanguage): `${typeof TRANSLATE_DRAFT_SOURCE_TITLE_PREFIX}${DraftLanguage}` {
  return `${TRANSLATE_DRAFT_SOURCE_TITLE_PREFIX}${target}`;
}

export function isTranslateDraftSourceTitle(title: string | undefined): title is `${typeof TRANSLATE_DRAFT_SOURCE_TITLE_PREFIX}${DraftLanguage}` {
  return title === `${TRANSLATE_DRAFT_SOURCE_TITLE_PREFIX}en` || title === `${TRANSLATE_DRAFT_SOURCE_TITLE_PREFIX}zh`;
}

/** Resolved display language for the draft toggle label (Auth uses the same flip logic). */
export function resolveDisplayLanguageForToggle(draft: string, appDefault: DraftLanguage): DraftLanguage {
  const detected = detectLanguage(draft);
  if (detected === 'zh') return 'zh';
  if (detected === 'en') return 'en';
  return appDefault;
}

export function targetLanguageForToggle(displayLanguage: DraftLanguage): DraftLanguage {
  return displayLanguage === 'zh' ? 'en' : 'zh';
}

export function draftLanguageToggleLabel(displayLanguage: DraftLanguage): string {
  return displayLanguage === 'zh' ? 'En' : '中文';
}

export function draftLanguageToggleAriaLabel(displayLanguage: DraftLanguage): string {
  return displayLanguage === 'zh' ? 'Switch to English' : '切换到中文';
}

/**
 * Terms that must stay verbatim during draft translation — contact identity,
 * business signature fields, emails, and URLs found in the draft.
 */
export function collectPreserveTerms(args: {
  prioritizedEntities: string[];
  contactNames: string[];
  businessContext: BusinessContext;
  draft: string;
}): string[] {
  const unique = new Map<string, string>();

  const add = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) return;
    unique.set(trimmed.toLowerCase(), trimmed);
  };

  for (const value of [...args.prioritizedEntities, ...args.contactNames]) {
    add(value);
  }

  for (const value of [
    args.businessContext.yourName,
    args.businessContext.companyName,
    args.businessContext.yourPosition,
    args.businessContext.productsServices,
  ]) {
    add(value);
  }

  for (const match of args.draft.matchAll(EMAIL_REGEX)) {
    add(match[0]);
  }

  for (const match of args.draft.matchAll(URL_REGEX)) {
    add(match[0]);
  }

  return [...unique.values()].sort((left, right) => right.length - left.length);
}

export function formatTranslatePreserveBody(terms: string[]): string {
  if (terms.length === 0) return '';
  return ['PRESERVE_VERBATIM:', ...terms.map(term => `- ${term}`)].join('\n');
}
