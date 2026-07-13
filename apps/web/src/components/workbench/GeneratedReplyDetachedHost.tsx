import { useCallback, useEffect, useMemo, useState } from 'react';
import { clearGeneratedReplySession, readGeneratedReplySession } from '../../config/generatedReplySession';
import { getTranslations, resolveLanguage, type AppLanguage } from '../../i18n/translations';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useBusinessContext } from '../../hooks/useBusinessContext';
import GeneratedReplyModal from './GeneratedReplyModal';
import { NextStepProvider } from '../guidance/NextStepProvider';
import { applyBusinessIdentityToGeneratedMessage } from './generation';
import {
  collectPreserveTerms,
  resolveDisplayLanguageForToggle,
  targetLanguageForToggle,
  type DraftLanguage,
} from '../cross-language/draftLanguageToggle';
import { translateGeneratedDraft } from '../cross-language/translateGeneratedDraft';
import type { RecipientProfile } from './types';

function sendChildAction(action: unknown) {
  if (window.desktopApp?.sendChildAction) {
    void window.desktopApp.sendChildAction(action);
  }
}

const FALLBACK_RECIPIENT: RecipientProfile = 'existing-client';

export default function GeneratedReplyDetachedHost() {
  const { settings } = useAppSettings();
  const { context: businessContext } = useBusinessContext();
  const copy = useMemo(
    () => getTranslations(settings.defaultLanguage as AppLanguage),
    [settings.defaultLanguage],
  );
  const session = useMemo(() => readGeneratedReplySession(), []);
  const [generatedMessage, setGeneratedMessage] = useState(session?.generatedMessage ?? '');
  const [isEditingGenerated, setIsEditingGenerated] = useState(false);
  const [draftLanguageCache, setDraftLanguageCache] = useState<Partial<Record<DraftLanguage, string>>>(() => {
    if (!session?.generatedMessage.trim()) return {};
    const appDefault: DraftLanguage = resolveLanguage(settings.defaultLanguage) === 'zh' ? 'zh' : 'en';
    const lang = resolveDisplayLanguageForToggle(session.generatedMessage, appDefault);
    return { [lang]: session.generatedMessage };
  });
  const [isTranslatingDraft, setIsTranslatingDraft] = useState(false);

  useEffect(() => {
    if (!session) {
      if (window.desktopApp?.closeChildScreen) {
        void window.desktopApp.closeChildScreen('generated-reply');
      }
    }
  }, [session]);

  const draftDisplayLanguage = useMemo((): DraftLanguage => {
    const appDefault: DraftLanguage = resolveLanguage(settings.defaultLanguage) === 'zh' ? 'zh' : 'en';
    return resolveDisplayLanguageForToggle(generatedMessage, appDefault);
  }, [generatedMessage, settings.defaultLanguage]);

  const handleToggleDraftLanguage = useCallback(async () => {
    if (!session) return;
    const trimmed = generatedMessage.trim();
    if (!trimmed || isTranslatingDraft) return;

    const appDefault: DraftLanguage = resolveLanguage(settings.defaultLanguage) === 'zh' ? 'zh' : 'en';
    const currentLang = resolveDisplayLanguageForToggle(trimmed, appDefault);
    const targetLang = targetLanguageForToggle(currentLang);
    const cached = draftLanguageCache[targetLang];
    if (cached?.trim()) {
      setGeneratedMessage(cached);
      sendChildAction({ type: 'update-generated-reply', message: cached });
      return;
    }

    setIsTranslatingDraft(true);
    try {
      const preserveTerms = collectPreserveTerms({
        prioritizedEntities: session.prioritizedEntities,
        contactNames: session.contactNames,
        businessContext,
        draft: trimmed,
      });
      let translated = await translateGeneratedDraft({
        draft: trimmed,
        targetLanguage: targetLang,
        preserveTerms,
        mode: session.mode,
        recipient: session.recipient ?? FALLBACK_RECIPIENT,
        textType: session.textType ?? 'balanced',
        formality: session.formality ?? 3,
        warmth: session.warmth ?? 3,
        urgency: session.urgency ?? 3,
        confidence: session.confidence ?? 3,
        businessContext,
      });
      translated = applyBusinessIdentityToGeneratedMessage(translated, {
        businessContext,
        textType: session.textType ?? 'balanced',
        formality: session.formality ?? 3,
      });
      setDraftLanguageCache(prev => ({
        ...prev,
        [currentLang]: trimmed,
        [targetLang]: translated,
      }));
      setGeneratedMessage(translated);
      sendChildAction({ type: 'update-generated-reply', message: translated });
    } catch (error) {
      console.warn('Draft translation failed in detached window:', error);
    } finally {
      setIsTranslatingDraft(false);
    }
  }, [
    businessContext,
    draftLanguageCache,
    generatedMessage,
    isTranslatingDraft,
    session,
    settings.defaultLanguage,
  ]);

  if (!session) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white px-6 text-center text-[12px] text-slate-500">
        {copy.modal.subtitle}
      </div>
    );
  }

  const handleClose = () => {
    clearGeneratedReplySession();
    if (window.desktopApp?.closeChildScreen) {
      void window.desktopApp.closeChildScreen('generated-reply');
      return;
    }
    window.close();
  };

  return (
    <NextStepProvider activeStep="copy">
      <GeneratedReplyModal
        surface="window"
        copy={copy}
        isEditingGenerated={isEditingGenerated}
        generatedMessage={generatedMessage}
        contactNames={session.contactNames}
        basedOnLines={session.basedOnLines}
        prioritizedEntities={session.prioritizedEntities}
        insight={session.insight}
        mode={session.mode}
        onToggleEditing={() => setIsEditingGenerated(prev => !prev)}
        onClose={handleClose}
        onMessageChange={value => {
          setGeneratedMessage(value);
          const appDefault: DraftLanguage = resolveLanguage(settings.defaultLanguage) === 'zh' ? 'zh' : 'en';
          const displayLang = resolveDisplayLanguageForToggle(value, appDefault);
          setDraftLanguageCache({ [displayLang]: value });
          sendChildAction({ type: 'update-generated-reply', message: value });
        }}
        onCopy={() => {
          sendChildAction({ type: 'copy-generated-reply', message: generatedMessage });
        }}
        onAddToQueue={
          session.hasFollowUp
            ? () => {
              sendChildAction({ type: 'add-generated-follow-up' });
            }
            : undefined
        }
        copyNextStepHint={copy.floating.nextStepCopyHint}
        draftDisplayLanguage={draftDisplayLanguage}
        onToggleDraftLanguage={() => {
          void handleToggleDraftLanguage();
        }}
        isTranslatingDraft={isTranslatingDraft}
      />
    </NextStepProvider>
  );
}
