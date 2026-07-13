import { useState } from 'react';

import type { MiniScreenId } from '../../workbench/types';

/**
 * Owns the floating-assistant's transient overlay flags: which dropdowns
 * are open, which modal/sheet is active, and which mini-screen is mounted.
 *
 * Step 0 extraction from FloatingAssistant.tsx — pure state move. Field
 * names match the previous in-line `useState` declarations so destructuring
 * keeps every existing reference working.
 */
export function useUiOverlayState() {
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isTextTypeOpen, setIsTextTypeOpen] = useState(false);
  const [isActionCenterOpen, setIsActionCenterOpen] = useState(false);
  const [isRememberedContextOpen, setIsRememberedContextOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isMoreFeaturesOpen, setIsMoreFeaturesOpen] = useState(false);
  const [activeMiniScreen, setActiveMiniScreen] = useState<MiniScreenId | null>(null);
  const [isToneComposeModalOpen, setIsToneComposeModalOpen] = useState(false);

  return {
    isLanguageOpen,
    setIsLanguageOpen,
    isTextTypeOpen,
    setIsTextTypeOpen,
    isActionCenterOpen,
    setIsActionCenterOpen,
    isRememberedContextOpen,
    setIsRememberedContextOpen,
    isReferralModalOpen,
    setIsReferralModalOpen,
    isMoreFeaturesOpen,
    setIsMoreFeaturesOpen,
    activeMiniScreen,
    setActiveMiniScreen,
    isToneComposeModalOpen,
    setIsToneComposeModalOpen,
  };
}
