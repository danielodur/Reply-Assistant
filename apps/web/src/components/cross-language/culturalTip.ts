import type { DetectedLanguage } from '../../lib/languageDetect';
import type { RecipientProfile } from '../workbench/types';

/**
 * Static, deterministic mapping from (inbound × reply × recipient × textType)
 * to a tip the user sees above their generated reply. No LLM call.
 *
 * Returning `null` means "no advisory needed" — same-language replies, or
 * cases where a tip would just be noise.
 */
export type CulturalRegister =
  | 'western-business'
  | 'chinese-business'
  | 'cross-cultural'
  | 'polish-english'
  | 'neutral';

export type CulturalTipKey =
  | 'zh-to-en-prospect'
  | 'zh-to-en-vip'
  | 'zh-to-en-default'
  | 'en-to-zh-default'
  | 'en-to-zh-leader'
  | 'mixed-clarity'
  | 'polish-english';

export type CulturalTipInput = {
  inboundLanguage: DetectedLanguage;
  replyLanguage: 'en' | 'zh';
  recipient: RecipientProfile;
  textType: string;
};

export type CulturalTipResolution = {
  key: CulturalTipKey;
  register: CulturalRegister;
};

export function resolveCulturalTip(input: CulturalTipInput): CulturalTipResolution | null {
  const { inboundLanguage, replyLanguage, recipient, textType } = input;

  // "Polish my English" always shows its dedicated tip — it's an explicit mode.
  if (textType === 'polish-english') {
    return { key: 'polish-english', register: 'polish-english' };
  }

  if (inboundLanguage === replyLanguage) return null;

  if (inboundLanguage === 'zh' && replyLanguage === 'en') {
    if (recipient === 'new-lead') {
      return { key: 'zh-to-en-prospect', register: 'western-business' };
    }
    if (recipient === 'vip-client') {
      return { key: 'zh-to-en-vip', register: 'western-business' };
    }
    return { key: 'zh-to-en-default', register: 'western-business' };
  }

  if (inboundLanguage === 'en' && replyLanguage === 'zh') {
    if (recipient === 'leader') {
      return { key: 'en-to-zh-leader', register: 'chinese-business' };
    }
    return { key: 'en-to-zh-default', register: 'chinese-business' };
  }

  if (inboundLanguage === 'mixed') {
    return { key: 'mixed-clarity', register: 'cross-cultural' };
  }

  return null;
}
