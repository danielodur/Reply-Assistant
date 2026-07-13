import { useState } from 'react';

import type {
  ReplyInsight,
  ReplyQuickAction,
  ReplyVariant,
  ReplyVariantId,
} from '../../workbench/generatedReplyTypes';
import type { BasedOnDetail } from '../../workbench/buildReplyBasedOnLines';
import type { ImpressionCheckResult } from '../../quality-guard/impressionCheck';
import type { VoiceMatchResult } from '../../quality-guard/voiceMatch';
import type { RecipientProfile } from '../../workbench/types';

/**
 * Owns every piece of state that lives on the generated-reply surface:
 * the active message + variants + insight, the modal open / edit flags,
 * the "Based on" lines, and the post-generation quality-guard outputs
 * (impression check, voice match, why details, high-stakes guard).
 *
 * Step 0 extraction from FloatingAssistant.tsx — pure state move. Field
 * names match the previous in-line `useState` declarations so destructuring
 * keeps every existing reference working.
 */
export function useGeneratedReplyState() {
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [generatedVariants, setGeneratedVariants] = useState<ReplyVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<ReplyVariantId>('safe');
  const [generatedInsight, setGeneratedInsight] = useState<ReplyInsight | null>(null);
  const [generatedQuickActions, setGeneratedQuickActions] = useState<ReplyQuickAction[]>([]);
  const [isGeneratedModalOpen, setIsGeneratedModalOpen] = useState(false);
  const [isEditingGenerated, setIsEditingGenerated] = useState(false);
  const [modalBasedOnLines, setModalBasedOnLines] = useState<string[]>([]);
  const [activeImpressionCheck, setActiveImpressionCheck] =
    useState<ImpressionCheckResult | null>(null);
  const [activeVoiceMatch, setActiveVoiceMatch] = useState<VoiceMatchResult | null>(null);
  const [activeWhyDetails, setActiveWhyDetails] = useState<BasedOnDetail[]>([]);
  const [activeRecipientSnapshot, setActiveRecipientSnapshot] =
    useState<RecipientProfile | null>(null);
  const [isHighStakesGuardOpen, setIsHighStakesGuardOpen] = useState(false);

  return {
    generatedMessage, setGeneratedMessage,
    generatedVariants, setGeneratedVariants,
    selectedVariantId, setSelectedVariantId,
    generatedInsight, setGeneratedInsight,
    generatedQuickActions, setGeneratedQuickActions,
    isGeneratedModalOpen, setIsGeneratedModalOpen,
    isEditingGenerated, setIsEditingGenerated,
    modalBasedOnLines, setModalBasedOnLines,
    activeImpressionCheck, setActiveImpressionCheck,
    activeVoiceMatch, setActiveVoiceMatch,
    activeWhyDetails, setActiveWhyDetails,
    activeRecipientSnapshot, setActiveRecipientSnapshot,
    isHighStakesGuardOpen, setIsHighStakesGuardOpen,
  };
}
