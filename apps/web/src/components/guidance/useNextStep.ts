import { useMemo } from 'react';
import type { NextStepId } from './NextStepProvider';

/**
 * Inputs the hook needs from FloatingAssistant to derive the single
 * active "what should the user do next" target.
 *
 * Rule of thumb: ring follows the user; never two rings; never a ring
 * during loading, modal overlays, or confirmation flows.
 */
export type UseNextStepInput = {
  hasInput: boolean;
  loading: boolean;
  hasContactSelected: boolean;
  generatedMessage: string;
  isGeneratedModalOpen: boolean;
  isContactConfirmationNeeded: boolean;
  hasContactMatchCandidates: boolean;
  isMoreFeaturesOpen: boolean;
  isActionCenterOpen: boolean;
  isToneComposeModalOpen: boolean;
  isCmdKOpen: boolean;
  showOnboarding: boolean;
  hasActiveMiniScreen: boolean;
};

export function useNextStep(input: UseNextStepInput): NextStepId | null {
  return useMemo(() => {
    // Any overlay or confirmation state means we hide the ring entirely —
    // the user is already focused on something specific.
    if (input.loading) return null;
    if (input.isCmdKOpen) return null;
    if (input.isMoreFeaturesOpen) return null;
    if (input.isActionCenterOpen) return null;
    if (input.isToneComposeModalOpen) return null;
    if (input.showOnboarding) return null;
    if (input.hasActiveMiniScreen) return null;
    if (input.isContactConfirmationNeeded) return null;
    if (input.hasContactMatchCandidates) return null;

    // 1. Inline generated draft is open → ring on Copy
    if (input.isGeneratedModalOpen && input.generatedMessage.trim().length > 0) {
      return 'copy';
    }

    // 2. A draft exists but the inline modal is closed — desktop path keeps
    //    the reply in a detached window. The main panel should fall quiet.
    if (input.generatedMessage.trim().length > 0) {
      return null;
    }

    // 3. Composer has captured content → ring on Generate
    if (input.hasInput) {
      return 'generate';
    }

    // 4. Otherwise → ring on the Daily brief CTA (pick / add / use contact)
    return 'pick-contact';
  }, [
    input.generatedMessage,
    input.hasActiveMiniScreen,
    input.hasContactMatchCandidates,
    input.hasContactSelected,
    input.hasInput,
    input.isActionCenterOpen,
    input.isCmdKOpen,
    input.isContactConfirmationNeeded,
    input.isGeneratedModalOpen,
    input.isMoreFeaturesOpen,
    input.isToneComposeModalOpen,
    input.loading,
    input.showOnboarding,
  ]);
}
