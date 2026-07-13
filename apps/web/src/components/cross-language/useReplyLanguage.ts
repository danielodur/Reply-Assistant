import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ContactThread } from '../../config/contactThreads';
import { getLatestInboundText } from '../command-center/contactHelpers';
import { detectLanguage, recommendReplyLanguage, type DetectedLanguage } from '../../lib/languageDetect';
import {
  readReplyLanguagePreference,
  writeReplyLanguagePreference,
  type ReplyLanguagePreference,
} from '../../lib/replyLanguagePreference';
import type { AppLanguage } from '../../i18n/translations';

export type ResolvedReplyLanguage = 'en' | 'zh';

type UseReplyLanguageParams = {
  selectedContactThread: ContactThread | null;
  composerInput: string;
  appDefaultLanguage: AppLanguage;
  currentLanguage: AppLanguage;
};

export type UseReplyLanguageResult = {
  inboundLanguage: DetectedLanguage;
  preference: ReplyLanguagePreference;
  recommendedLanguage: ResolvedReplyLanguage;
  resolvedReplyLanguage: ResolvedReplyLanguage;
  /**
   * True only when our recommendation disagrees with the user's currently
   * selected language. Drives the LanguageRecommendationChip visibility.
   */
  recommendationDiffers: boolean;
  savePreference: (preference: ReplyLanguagePreference) => void;
};

function appDefaultToBinary(language: AppLanguage): ResolvedReplyLanguage {
  if (language === 'en') return 'en';
  if (language === 'zh') return 'zh';
  return 'en';
}

export function useReplyLanguage(params: UseReplyLanguageParams): UseReplyLanguageResult {
  const { selectedContactThread, composerInput, appDefaultLanguage, currentLanguage } = params;
  const contactId = selectedContactThread?.id ?? null;

  const [preferenceVersion, setPreferenceVersion] = useState(0);

  // Cross-window sync: react to other windows changing the preference store.
  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key === 'replyAssistantReplyLanguagePreferences') {
        setPreferenceVersion(prev => prev + 1);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const preference = useMemo(
    () => readReplyLanguagePreference(contactId),
    // re-read when the contact or the underlying record changes
    [contactId, preferenceVersion],
  );

  const inboundLanguage = useMemo<DetectedLanguage>(() => {
    if (composerInput.trim().length > 0) {
      return detectLanguage(composerInput);
    }
    if (selectedContactThread) {
      const latestInbound = getLatestInboundText(selectedContactThread);
      if (latestInbound) return detectLanguage(latestInbound);
    }
    return 'unknown';
  }, [composerInput, selectedContactThread]);

  const appDefaultBinary = appDefaultToBinary(appDefaultLanguage);

  const recommendedLanguage = useMemo<ResolvedReplyLanguage>(() => {
    if (preference !== 'auto') return preference;
    return recommendReplyLanguage(inboundLanguage, appDefaultBinary);
  }, [appDefaultBinary, inboundLanguage, preference]);

  const resolvedReplyLanguage = useMemo<ResolvedReplyLanguage>(() => {
    if (currentLanguage === 'en' || currentLanguage === 'zh') {
      return currentLanguage;
    }
    return recommendedLanguage;
  }, [currentLanguage, recommendedLanguage]);

  const recommendationDiffers = useMemo(() => {
    if (!selectedContactThread) return false;
    return recommendedLanguage !== resolvedReplyLanguage;
  }, [recommendedLanguage, resolvedReplyLanguage, selectedContactThread]);

  const savePreference = useCallback((next: ReplyLanguagePreference) => {
    if (!contactId) return;
    writeReplyLanguagePreference(contactId, next);
    setPreferenceVersion(prev => prev + 1);
  }, [contactId]);

  return {
    inboundLanguage,
    preference,
    recommendedLanguage,
    resolvedReplyLanguage,
    recommendationDiffers,
    savePreference,
  };
}
