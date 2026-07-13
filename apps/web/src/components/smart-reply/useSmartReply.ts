import { useCallback } from 'react';
import type { ContactThread } from '../../config/contactThreads';
import type { RecipientProfile, WorkMode } from '../workbench/types';
import { getLatestInboundText } from '../command-center/contactHelpers';
import { appendWorkRhythmEvent } from '../smart-suggestions/workRhythmStore';
import { canSmartReply } from './canSmartReply';

type GenerateFn = (
  inputOverride?: string,
  options?: {
    workModeOverride?: WorkMode;
    recipientOverride?: RecipientProfile;
    textTypeOverride?: string;
    sourceContext?: { source: 'composer' | 'paste-and-generate' | 'instant-ammo' | 'today-queue' | 'action-inbox' | 'smart-reply'; title?: string; body?: string };
    contactThreadOverride?: ContactThread | null;
  },
) => Promise<boolean>;

type Deps = {
  applySelectedContactId: (contactId: string | null, threadHint?: ContactThread | null, workModeOverride?: WorkMode) => void;
  setWorkMode: (value: WorkMode) => void;
  setRecipientProfileByMode: React.Dispatch<React.SetStateAction<Record<WorkMode, RecipientProfile>>>;
  setInput: (value: string) => void;
  setLastCaptureSource: (value: 'paste' | 'typed' | null) => void;
  setContactMatchCandidates: (value: []) => void;
  setIsContactConfirmationNeeded: (value: boolean) => void;
  setIsActionCenterOpen: (value: boolean) => void;
  openPendingDraft: (contact: ContactThread) => void;
  handleGenerate: GenerateFn;
  focusComposer: () => void;
};

export type RunSmartReply = (contact: ContactThread) => void;

/**
 * Returns a single-tap "Smart Reply" runner for a contact.
 *
 * Behavior:
 *   - If a fresh pendingDraft exists -> open it immediately (no regeneration).
 *   - Else if latest inbound text exists -> select contact, set reply mode,
 *     fill composer with the inbound text, and fire handleGenerate end-to-end.
 *   - Else -> no-op (UI should not surface the button in that case).
 */
export function useSmartReply(deps: Deps): RunSmartReply {
  const {
    applySelectedContactId,
    setWorkMode,
    setRecipientProfileByMode,
    setInput,
    setLastCaptureSource,
    setContactMatchCandidates,
    setIsContactConfirmationNeeded,
    setIsActionCenterOpen,
    openPendingDraft,
    handleGenerate,
    focusComposer,
  } = deps;

  return useCallback((contact: ContactThread) => {
    const mode = canSmartReply(contact);
    if (mode === 'unavailable') return;

    if (mode === 'open-draft') {
      appendWorkRhythmEvent({
        kind: 'smart-reply',
        contactId: contact.id,
      });
      setIsActionCenterOpen(false);
      openPendingDraft(contact);
      return;
    }

    // mode === 'generate-from-inbound'
    const inboundText = getLatestInboundText(contact);
    if (!inboundText) return;

    appendWorkRhythmEvent({
      kind: 'smart-reply',
      contactId: contact.id,
    });

    applySelectedContactId(contact.id, contact, 'reply');
    setWorkMode('reply');
    setRecipientProfileByMode(prev => ({ ...prev, reply: 'existing-client' }));
    setInput(inboundText);
    setLastCaptureSource('typed');
    setContactMatchCandidates([]);
    setIsContactConfirmationNeeded(false);
    setIsActionCenterOpen(false);
    focusComposer();

    void handleGenerate(inboundText, {
      workModeOverride: 'reply',
      recipientOverride: 'existing-client',
      contactThreadOverride: contact,
      sourceContext: { source: 'smart-reply' },
    });
  }, [
    applySelectedContactId,
    focusComposer,
    handleGenerate,
    openPendingDraft,
    setContactMatchCandidates,
    setInput,
    setIsActionCenterOpen,
    setIsContactConfirmationNeeded,
    setLastCaptureSource,
    setRecipientProfileByMode,
    setWorkMode,
  ]);
}
