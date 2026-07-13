import { useMemo, useState } from 'react';
import type { SmartSuggestion } from './types';
import { SMART_CHIP_SCORE_THRESHOLD } from './types';

const SMART_CHIP_DISMISSED_KEY = 'replyAssistantSmartChipDismissedSession';

type ProactiveNudgeKind = 'none' | 'smart-chip' | 'cmd-k-hint';

type UseProactiveNudgeParams = {
  suggestions: SmartSuggestion[];
  hasDailyBrief: boolean;
  isCmdKHintEligible: boolean;
  composerEmpty: boolean;
  loading: boolean;
  hasActiveNextStep?: boolean;
};

export function useProactiveNudge(params: UseProactiveNudgeParams): {
  kind: ProactiveNudgeKind;
  topSuggestion: SmartSuggestion | null;
  dismissSmartChip: () => void;
  autoHideSmartChip: () => void;
} {
  const {
    suggestions,
    hasDailyBrief,
    isCmdKHintEligible,
    composerEmpty,
    loading,
    hasActiveNextStep = false,
  } = params;

  const [smartChipDismissed, setSmartChipDismissed] = useState(
    () => typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SMART_CHIP_DISMISSED_KEY) === '1',
  );
  const [smartChipAutoHidden, setSmartChipAutoHidden] = useState(false);

  const topSuggestion = suggestions[0] ?? null;

  const showSmartChip = useMemo(() => Boolean(
    !hasDailyBrief
    && composerEmpty
    && !loading
    && isCmdKHintEligible
    && topSuggestion
    && topSuggestion.kind !== 'add-contact'
    && topSuggestion.score >= SMART_CHIP_SCORE_THRESHOLD
    && !smartChipDismissed
    && !smartChipAutoHidden
    && !hasActiveNextStep,
  ), [
    composerEmpty,
    hasActiveNextStep,
    hasDailyBrief,
    isCmdKHintEligible,
    loading,
    smartChipAutoHidden,
    smartChipDismissed,
    topSuggestion,
  ]);

  const dismissSmartChip = () => {
    sessionStorage.setItem(SMART_CHIP_DISMISSED_KEY, '1');
    setSmartChipDismissed(true);
  };

  const autoHideSmartChip = () => {
    setSmartChipAutoHidden(true);
  };

  if (showSmartChip) {
    return {
      kind: 'smart-chip',
      topSuggestion,
      dismissSmartChip,
      autoHideSmartChip,
    };
  }

  if (isCmdKHintEligible && !hasActiveNextStep) {
    return {
      kind: 'cmd-k-hint',
      topSuggestion,
      dismissSmartChip,
      autoHideSmartChip,
    };
  }

  return {
    kind: 'none',
    topSuggestion,
    dismissSmartChip,
    autoHideSmartChip,
  };
}
