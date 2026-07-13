import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppTranslations } from '../../i18n/translations';
import { interpolate } from '../../i18n/translations';
import type { SmartSuggestion } from './types';

type SmartNextChipProps = {
  suggestion: SmartSuggestion;
  copy: AppTranslations;
  onActivate: (suggestion: SmartSuggestion) => void;
  onDismiss: () => void;
  onAutoHide: () => void;
};

const CHIP_VISIBLE_DURATION_MS = 10000;
const CHIP_FADE_MS = 450;

function chipLabel(suggestion: SmartSuggestion, copy: AppTranslations): string {
  switch (suggestion.kind) {
    case 'reply-contact':
      return interpolate(copy.floating.smartChipReplyTo, { name: suggestion.contactName ?? '' });
    case 'follow-up-contact':
      return interpolate(copy.floating.smartChipFollowUp, { name: suggestion.contactName ?? '' });
    case 'resume-contact':
      return interpolate(copy.floating.smartChipResume, { name: suggestion.contactName ?? '' });
    case 'paste-message':
      return copy.floating.smartChipPaste;
    case 'quick-scenario':
      if (suggestion.scenarioId && copy.instantAmmo.scenarios[suggestion.scenarioId]) {
        return copy.instantAmmo.scenarios[suggestion.scenarioId].label;
      }
      return copy.floating.smartChipPaste;
    default:
      return copy.floating.smartChipPaste;
  }
}

function suggestionKey(suggestion: SmartSuggestion): string {
  return [suggestion.kind, suggestion.contactId ?? '', suggestion.contactName ?? '', suggestion.scenarioId ?? ''].join('|');
}

export default function SmartNextChip({
  suggestion,
  copy,
  onActivate,
  onDismiss,
  onAutoHide,
}: SmartNextChipProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const hideTimerRef = useRef<number | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const suggestionIdentity = useMemo(() => suggestionKey(suggestion), [suggestion]);

  const clearTimers = () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (fadeTimerRef.current) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  };

  useEffect(() => {
    setIsVisible(true);
    setIsFading(false);
    clearTimers();

    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null;
      setIsFading(true);
      fadeTimerRef.current = window.setTimeout(() => {
        fadeTimerRef.current = null;
        setIsVisible(false);
        onAutoHide();
      }, CHIP_FADE_MS);
    }, CHIP_VISIBLE_DURATION_MS);

    return clearTimers;
  }, [onAutoHide, suggestionIdentity]);

  const handleDismiss = () => {
    clearTimers();
    setIsVisible(false);
    onDismiss();
  };

  const handleActivate = () => {
    clearTimers();
    setIsVisible(false);
    onActivate(suggestion);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`group/smart-chip mb-2 flex items-center justify-end gap-1 transition-opacity duration-[450ms] ease-out ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 rounded px-1 py-0.5 text-[11px] leading-none text-[#e88ab0]/70 opacity-0 transition-all duration-200 hover:text-[#c95682] group-hover/smart-chip:opacity-100"
        aria-label={copy.floating.smartChipDismiss}
      >
        ×
      </button>
      <button
        type="button"
        onClick={handleActivate}
        className="smart-chip-nudge inline-flex min-w-0 max-w-full items-center gap-1.5 text-left transition-colors hover:text-[#d86a94]"
      >
        <span className="smart-chip-label truncate text-[10px] font-medium text-[#e88ab0]">
          {chipLabel(suggestion, copy)}
        </span>
        <span className="smart-chip-chevrons shrink-0 text-[10px] font-semibold tracking-tight text-[#e88ab0]" aria-hidden="true">
          <span>&gt;</span>
          <span>&gt;</span>
          <span>&gt;</span>
        </span>
      </button>
    </div>
  );
}
