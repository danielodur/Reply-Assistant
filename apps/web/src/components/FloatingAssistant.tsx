import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  firstNameFromDisplayName,
  isOnboardingDoneForUser,
  markOnboardingDoneForUser,
} from '../auth/authProfileBridge';
import { useAuth } from '../auth/AuthProvider';
import { getTranslations, interpolate, resolveLanguage, type AppLanguage } from '../i18n/translations';
import { useAppProfile } from '../hooks/useAppProfile';
import { useAppSettings } from '../hooks/useAppSettings';
import { useRankUnlocks } from '../hooks/useRankUnlocks';
import { useBusinessContext } from '../hooks/useBusinessContext';
import { useTodayQueue } from '../hooks/useTodayQueue';
import { useInsightTasks } from '../hooks/useInsightTasks';
import { useActionInbox } from '../hooks/useActionInbox';
import { useMilestone, type MilestoneRank } from '../hooks/useMilestone';
import {
  buildContactMessageEntry,
  buildContactThreadContext,
  isRecentDuplicateInbound,
  mergeThreadChatContext,
  type ContactThread,
} from '../config/contactThreads';
import { useContactThreads } from '../hooks/useContactThreads';
import { useEmailAutoSync, type NewEmailNotice } from '../hooks/useEmailAutoSync';
import { useProductAnnouncements } from '../hooks/useProductAnnouncements';

import ComposerPanel from './workbench/ComposerPanel';
import RememberedContextDock, { getRememberedContextCounts } from './workbench/RememberedContextDock';
import { RECIPIENT_PROFILES_BY_MODE, TEXT_TYPE_IDS } from './workbench/constants';
import { computeStreak, incrementTodayCount, loadTodayCount } from './workbench/activity';
import GeneratedReplyModal from './workbench/GeneratedReplyModal';
import { applyBusinessIdentityToGeneratedMessage, buildVariantOutput } from './workbench/generation';
import type { GenerateApiResponse, ReplyInsight, ReplyQuickAction, ReplyVariant, ReplyVariantId } from './workbench/generatedReplyTypes';
import { requestGeneratedOutput } from './workbench/generateApiClient';
import { buildStructuredRequest, type RequestGenerationContext, type RequestSnippetMemory } from './workbench/requestModel';
import { buildReplyBasedOnLines } from './workbench/buildReplyBasedOnLines';
import { saveGeneratedReplyAsSnippet } from './workbench/snippetStorage';
import ToneComposeModal from './workbench/ToneComposeModal';
import ToneSparkleButton from './workbench/ToneSparkleButton';
import { deleteToneProfile, saveToneProfile, type ToneProfileData } from './workbench/toneProfiles';
import { useToneState } from './floating-assistant/state/useToneState';
import { useUiOverlayState } from './floating-assistant/state/useUiOverlayState';
import { useGeneratedReplyState } from './floating-assistant/state/useGeneratedReplyState';
import type { MiniScreenId, RecipientProfile, ReplyHistoryItem, TonePreset, WorkMode } from './workbench/types';
import WorkbenchHeader from './workbench/WorkbenchHeader';
import MoreFeatures, { MORE_FEATURES_DRAWER_TRANSITION_MS } from './more-features';
import ReferFriends from './refer-friends';
import { type AmmoScenario } from './InstantAmmo';
import { getScenarioById } from './scenarios/scenarioRegistry';
import ContextualQuickStart from './smart-suggestions/ContextualQuickStart';
import DailyBriefCard from './command-center/DailyBriefCard';
import FocusPlanModal from './command-center/FocusPlanModal';
import DesktopWindowDragRegion from './DesktopWindowDragRegion';
import { useCommandCenterPrimary } from './command-center/useCommandCenterPrimary';
import { findUploadNeedingReview } from './command-center/workbenchRecommendation';
import { useFocusPlan } from './command-center/useFocusPlan';
import { getLatestInboundText } from './command-center/contactHelpers';
import { buildSmartSuggestions, getPaletteSuggestions } from './smart-suggestions/buildSmartSuggestions';
import { appendWorkRhythmEvent } from './smart-suggestions/workRhythmStore';
import SmartNextChip from './smart-suggestions/SmartNextChip';
import { useProactiveNudge } from './smart-suggestions/useProactiveNudge';
import type { SmartSuggestion } from './smart-suggestions/types';
import MiniScreenHost from './mini-screens/MiniScreenHost';
import { openMiniScreen as openMiniScreenHelper } from './mini-screens/openMiniScreen';
import MilestoneToast from './MilestoneToast';
import EmailNewMailToast from './EmailNewMailToast';
import OnboardingModal from './OnboardingModal';
import TodayQueue, { buildTodayQueueTasks, type TodayQueueAction } from './TodayQueue';
import type { ActionInboxItem } from './action-inbox/types';
import ContactPicker from './contacts/ContactPicker';
import { isContactCompatibleWithMode, requiredWorkModeForContact } from './contacts/contactFiltering';
import { decideContactMatch, getContactMatchCandidates, type ContactMatchCandidate } from './contacts/contactMatch';
import { savePendingCaptureDraft } from './contacts/pendingCaptureDraft';
import { readSelectedContactId, subscribeSelectedContactId, writeSelectedContactId } from '../config/selectedContactPersistence';
import { openGeneratedReplySurface } from '../config/generatedReplySession';
import {
  domainIncludesCompanionSignals,
  domainIncludesDraftMemory,
  onDataReset,
} from '../config/resetAppData';
import { appendContactStyleFromEdit, getContactStyleSamples, styleHintsAsSnippetMemory } from '../lib/contactStyleMemory';
import { buildVoiceProfile } from './voice-profile/buildVoiceProfile';
import { buildContactFollowUpInboxEntries, buildContactFollowUpTasks } from './contacts/followUpTasks';
import { useComposerAttachments } from '../uploads/useComposerAttachments';
import { useBusinessUploads } from '../uploads/useBusinessUploads';
import { useContactUploads } from '../uploads/useContactUploads';
import CmdKPalette from './cmd-k/CmdKPalette';
import CmdKHint from './cmd-k/CmdKHint';
import type { CmdKIntent } from './cmd-k/intentRouter';
import { suggestionToIntent } from './cmd-k/intentRouter';
import { NextStepProvider } from './guidance/NextStepProvider';
import { useNextStep } from './guidance/useNextStep';
import { useSmartReply } from './smart-reply/useSmartReply';
import { useReplyLanguage } from './cross-language/useReplyLanguage';
import {
  collectPreserveTerms,
  resolveDisplayLanguageForToggle,
  targetLanguageForToggle,
  type DraftLanguage,
} from './cross-language/draftLanguageToggle';
import { translateGeneratedDraft } from './cross-language/translateGeneratedDraft';
import { resolveCulturalTip, type CulturalTipKey } from './cross-language/culturalTip';
import { detectLanguage } from '../lib/languageDetect';
import { autoSoftenIntentFor, isHighStakesRecipient, runImpressionCheck, type AutoSoftenIntent, type ImpressionCheckResult } from './quality-guard/impressionCheck';
import { computeVoiceMatch, type VoiceMatchResult } from './quality-guard/voiceMatch';
import HighStakesGuard from './quality-guard/HighStakesGuard';
import { useComposeCoach } from './quality-guard/useComposeCoach';
import type { ComposeCoachWarning } from './quality-guard/composeCoach';
import { deriveRelationshipStats } from './relationship-memory/deriveRelationshipStats';
import { useDetectedIntent } from './intent/useDetectedIntent';
import type { RewriteMode } from './rewrite-modes/registry';
import { detectOpenLoops } from './follow-ups/detectOpenLoops';
import { deriveSendTimingHint } from './timing-intelligence/deriveSendTimingHint';
import { buildReplyBasedOnDetails, type BasedOnDetail } from './workbench/buildReplyBasedOnLines';
import {
  dispatchDesktopNotification,
  setDesktopBadgeCount,
  subscribeToNotificationActions,
} from '../lib/desktopNotifications';
import GuidedTourLayer from './guided-tour/GuidedTourLayer';
import { useGuidedTour } from './guided-tour/useGuidedTour';
import {
  buildSampleContact,
  hasSeededSampleContact,
  markSampleContactSeeded,
} from './guided-tour/sampleContact';

function detectIsMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  const platform = (navigator as { userAgentData?: { platform?: string }; platform?: string }).userAgentData?.platform
    ?? navigator.platform ?? '';
  return /Mac|iPhone|iPod|iPad/i.test(platform);
}

const MAX_NEW_MAIL_TOAST_CONTACTS = 3;
const REFERRAL_NUDGE_DISMISSED_KEY = 'replyAssistantReferralNudgeDismissed';
const REFERRAL_NUDGE_COPY_THRESHOLD = 5;
const ATTENTION_TOAST_TTL_MS = 6500;
const MORE_FEATURES_EXIT_MS = MORE_FEATURES_DRAWER_TRANSITION_MS;

type StoredSnippet = {
  id: string;
  title: string;
  text: string;
};

type DetachedChildAction =
  | { type: 'open-screen'; screenId: MiniScreenId }
  | { type: 'select-contact'; contactId: string | null }
  | { type: 'compose-from-contact'; contactId: string; text: string }
  | { type: 'use-recent-reply'; value: string }
  | { type: 'use-snippet'; value: string }
  | { type: 'run-today-task'; action: TodayQueueAction }
  | { type: 'run-action-inbox-item'; item: ActionInboxItem }
  | { type: 'update-generated-reply'; message: string }
  | { type: 'copy-generated-reply'; message: string }
  | { type: 'add-generated-follow-up' }
  | { type: 'smart-reply-contact'; contactId: string }
  | { type: 'sign-out' };

function isDetachedChildAction(value: unknown): value is DetachedChildAction {
  if (!value || typeof value !== 'object') return false;
  const type = (value as { type?: unknown }).type;
  return typeof type === 'string' && [
    'open-screen',
    'select-contact',
    'compose-from-contact',
    'use-recent-reply',
    'use-snippet',
    'run-today-task',
    'run-action-inbox-item',
    'update-generated-reply',
    'copy-generated-reply',
    'add-generated-follow-up',
    'smart-reply-contact',
    'sign-out',
  ].includes(type);
}

function buildInviteMessage(template: string, referralCode: string): string {
  return template.replace('{{code}}', referralCode);
}

function loadSnippetMemory(defaultSnippets: StoredSnippet[], storageKey: string): RequestSnippetMemory[] {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as StoredSnippet[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .map(snippet => ({
            title: String(snippet?.title ?? '').trim(),
            text: String(snippet?.text ?? '').trim(),
          }))
          .filter(snippet => snippet.text.length > 0)
          .slice(0, 5);
      }
    }
  } catch {
    // Ignore malformed snippet storage and fall back to defaults.
  }

  return defaultSnippets
    .map(snippet => ({ title: snippet.title, text: snippet.text }))
    .slice(0, 5);
}

export default function FloatingAssistant() {
  const { user, signOut } = useAuth();
  const { settings, toggle: toggleSetting, set: setSetting } = useAppSettings();
  const { profile, setField: setProfileField } = useAppProfile();
  const { context: businessContext, setField: setBusinessContextField } = useBusinessContext();
  const {
    threads: contactThreads,
    createContact,
    addReplyToContact,
    addMessageToContact,
    removeContact,
    updateChatContext,
    applyChatContextUpdates,
    updateContactMemory,
    syncLatestGeneratedReply,
    recordReplyLearning,
    dismissCommitment,
    updateThreadSummary,
    setPendingDraft,
  } = useContactThreads();
  const todayQueue = useTodayQueue();
  const { insightTasks, addInsightTask } = useInsightTasks();
  const actionInbox = useActionInbox();

  const historyStorageKey = 'replyAssistantRecentReplies';
  const snippetStorageKey = 'replyAssistantSnippets';
  const usageStorageKey = 'replyAssistantUsageCount';

  const [input, setInput] = useState('');
  const [workMode, setWorkMode] = useState<WorkMode>('reply');
  const [recipientProfileByMode, setRecipientProfileByMode] = useState<Record<WorkMode, RecipientProfile>>({
    reply: 'existing-client',
    internal: 'colleague',
  });
  const {
    formality, setFormality,
    warmth, setWarmth,
    urgency, setUrgency,
    confidence, setConfidence,
    activeTonePreset, setActiveTonePreset,
    savedToneProfiles, setSavedToneProfiles,
  } = useToneState();
  const {
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
  } = useGeneratedReplyState();
  const [recentReplies, setRecentReplies] = useState<ReplyHistoryItem[]>([]);
  const [language, setLanguage] = useState<AppLanguage>(settings.defaultLanguage);
  const [textType, setTextType] = useState(TEXT_TYPE_IDS[0]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(() => readSelectedContactId());
  const {
    isLanguageOpen, setIsLanguageOpen,
    isTextTypeOpen, setIsTextTypeOpen,
    isActionCenterOpen, setIsActionCenterOpen,
    isRememberedContextOpen, setIsRememberedContextOpen,
    isReferralModalOpen, setIsReferralModalOpen,
    isMoreFeaturesOpen, setIsMoreFeaturesOpen,
    activeMiniScreen, setActiveMiniScreen,
    isToneComposeModalOpen, setIsToneComposeModalOpen,
  } = useUiOverlayState();
  const [showHeaderAlert, setShowHeaderAlert] = useState(false);
  const [headerAlertLabel, setHeaderAlertLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [copiedReplyCount, setCopiedReplyCount] = useState(() => Number.parseInt(localStorage.getItem('replyAssistantCopiedReplyCount') ?? '0', 10) || 0);
  const [dataResetVersion, setDataResetVersion] = useState(0);
  const [showReferralNudge, setShowReferralNudge] = useState(() => !localStorage.getItem(REFERRAL_NUDGE_DISMISSED_KEY));
  const [isMoreFeaturesClosing, setIsMoreFeaturesClosing] = useState(false);
  const isMoreFeaturesVisible = isMoreFeaturesOpen || isMoreFeaturesClosing;
  const [todayCount, setTodayCount] = useState(loadTodayCount);
  const [streak, setStreak] = useState(computeStreak);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const textTypeDropdownRef = useRef<HTMLDivElement>(null);
  const inputTextareaRef = useRef<HTMLTextAreaElement>(null);
  const recipientScrollRef = useRef<HTMLDivElement>(null);
  const headerAlertTimerRef = useRef<number | null>(null);
  const resetAfterCopyTimerRef = useRef<number | null>(null);
  const contactBootstrapRef = useRef(false);
  const [hasLeftRecipientFade, setHasLeftRecipientFade] = useState(false);
  const [hasRightRecipientFade, setHasRightRecipientFade] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState<MilestoneRank | null>(null);
  const [newMailNotices, setNewMailNotices] = useState<NewEmailNotice[]>([]);
  const [contactMatchCandidates, setContactMatchCandidates] = useState<ContactMatchCandidate[]>([]);
  const [lastCaptureSource, setLastCaptureSource] = useState<'paste' | 'typed' | null>(null);
  const [isContactConfirmationNeeded, setIsContactConfirmationNeeded] = useState(false);
  const [attentionToast, setAttentionToast] = useState<{
    key: string;
    title: string;
    body: string;
    actLabel: string;
    onAct: () => void;
  } | null>(null);
  const attentionSeenKeysRef = useRef<Set<string>>(new Set());
  const attentionDismissTimerRef = useRef<number | null>(null);
  const attentionBootstrappedRef = useRef(false);
  const generateDraftRef = useRef<(contact: ContactThread, inboundText: string) => Promise<void>>(async () => {});
  const inflightDraftKeysRef = useRef<Set<string>>(new Set());
  const runSmartReplyRef = useRef<(contact: ContactThread) => void>(() => {});
  const handleEscapeRef = useRef<(event: KeyboardEvent) => void>(() => {});
  const [isCmdKOpen, setIsCmdKOpen] = useState(false);
  const [draftLanguageCache, setDraftLanguageCache] = useState<Partial<Record<DraftLanguage, string>>>({});
  const [isTranslatingDraft, setIsTranslatingDraft] = useState(false);
  const isMacPlatform = useMemo(() => detectIsMacPlatform(), []);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const guidedTour = useGuidedTour();
  const panelRootRef = useRef<HTMLDivElement | null>(null);
  const composerAttachments = useComposerAttachments();
  const businessUploads = useBusinessUploads();
  const contactUploads = useContactUploads();

  const copy = useMemo(() => getTranslations(language), [language]);
  const {
    announcements: productAnnouncements,
    readMessageIds,
    unreadMessageCount,
    markRead: handleMarkMessageRead,
    isLoading: productAnnouncementsLoading,
    refresh: refreshProductAnnouncements,
  } = useProductAnnouncements(language);
  const welcomeFirstName = useMemo(
    () => firstNameFromDisplayName(profile.displayName),
    [profile.displayName],
  );
  const cmdKShortcutLabel = isMacPlatform ? copy.floating.cmdKShortcutMac : copy.floating.cmdKShortcutWin;

  useEffect(() => {
    if (!user?.id || !user.email_confirmed_at) {
      setShowOnboarding(false);
      return;
    }
    setShowOnboarding(!isOnboardingDoneForUser(user.id));
  }, [user?.id, user?.email_confirmed_at]);

  const handleQuit = useCallback(() => {
    setIsMoreFeaturesOpen(false);
    void window.desktopApp?.quitApp?.();
  }, []);

  const handleSignOutFromApp = useCallback(async () => {
    setIsMoreFeaturesOpen(false);
    setActiveMiniScreen(null);
    setIsActionCenterOpen(false);
    await window.desktopApp?.closeChildScreen?.();
    await signOut();
  }, [signOut]);

  useEffect(() => {
    actionInbox.syncContactFollowUps(buildContactFollowUpInboxEntries(contactThreads, copy));
  }, [actionInbox.syncContactFollowUps, contactThreads, copy]);

  // First-run seed: drop a clearly-labelled sample contact into storage so the
  // guided tour has something real to demonstrate Smart Reply on.
  useEffect(() => {
    if (hasSeededSampleContact()) return;
    if (contactThreads.length > 0) {
      markSampleContactSeeded();
      return;
    }
    const sample = buildSampleContact(copy);
    createContact({
      name: sample.name,
      company: sample.company,
      email: sample.email,
      stage: sample.stage,
      notes: sample.notes,
      memoryProfile: sample.memoryProfile,
    });
    if (sample.messages[0]) {
      addMessageToContact(sample.id, sample.messages[0]);
    }
    markSampleContactSeeded();
  }, [contactThreads.length, copy, createContact, addMessageToContact]);

  // Auto-launch the tour once the welcome modal is dismissed, unless the user
  // already finished or explicitly skipped it.
  useEffect(() => {
    if (showOnboarding) return;
    if (guidedTour.isActive || guidedTour.isCompleted) return;
    guidedTour.start();
  }, [guidedTour, showOnboarding]);

  const handleAutoSyncNotices = (notices: NewEmailNotice[]) => {
    const byContact = new Map<string, NewEmailNotice>();
    for (const notice of notices) {
      const existing = byContact.get(notice.contactId);
      if (existing) {
        byContact.set(notice.contactId, {
          ...existing,
          newCount: existing.newCount + notice.newCount,
        });
      } else {
        byContact.set(notice.contactId, notice);
      }
    }

    const condensed = [...byContact.values()];

    setNewMailNotices(prev => {
      const merged = new Map(prev.map(item => [item.contactId, item] as const));
      for (const notice of condensed) {
        const existing = merged.get(notice.contactId);
        if (existing) {
          merged.set(notice.contactId, {
            ...existing,
            newCount: existing.newCount + notice.newCount,
          });
        } else {
          merged.set(notice.contactId, notice);
        }
      }
      return [...merged.values()].slice(0, MAX_NEW_MAIL_TOAST_CONTACTS);
    });

    for (const notice of condensed) {
      const prompt = copy.contactThreads.autoSyncReplyPrompt
        .replace('{name}', notice.contactName);

      actionInbox.addEmailAction({
        contactId: notice.contactId,
        contactName: notice.contactName,
        newCount: notice.newCount,
        title: copy.contactThreads.autoSyncActionCardTitle.replace('{name}', notice.contactName),
        body: copy.contactThreads.autoSyncActionCardBody.replace('{count}', String(notice.newCount)),
        prompt,
      });

      // Background pre-draft: fire-and-forget so the toast can later say "Draft ready".
      // Skipped when the user opted out of Smart Reply auto-drafting (lazyMode === false).
      if (settings.lazyMode && notice.latestInboundText) {
        const contact = contactThreads.find(t => t.id === notice.contactId);
        if (contact) {
          void generateDraftRef.current(contact, notice.latestInboundText);
        }
      }

      dispatchDesktopNotification(
        {
          kind: 'new-mail',
          title: interpolate(copy.floating.notificationNewMailTitle, { name: notice.contactName }),
          body: copy.floating.notificationNewMailBody,
          contactId: notice.contactId,
          tag: `new-mail:${notice.contactId}`,
        },
        settings,
      );
    }
  };

  // Background email poller — fires silently every 5 min when credentials are saved
  useEmailAutoSync({
    contacts: contactThreads,
    onApplyUpdates: applyChatContextUpdates,
    onNewMessages: handleAutoSyncNotices,
  });

  const textTypeOptions = copy.textTypes;
  const selectedTextTypeLabel = textTypeOptions.find(item => item.id === textType)?.label ?? textTypeOptions[0].label;
  const selectedContactThread = contactThreads.find(thread => thread.id === selectedContactId) ?? null;
  const rememberedContextCounts = useMemo(
    () => getRememberedContextCounts(selectedContactThread),
    [selectedContactThread],
  );

  /** Prefer this over raw setSelectedContactId so work mode + localStorage stay aligned with contact.stage. */
  const applySelectedContactId = useCallback(
    (contactId: string | null, threadHint?: ContactThread | null, workModeOverride?: WorkMode) => {
      setSelectedContactId(contactId);
      writeSelectedContactId(contactId);
      if (contactId) {
        const thread = threadHint ?? contactThreads.find(t => t.id === contactId);
        if (thread) {
          if (workModeOverride) {
            setWorkMode(workModeOverride);
          } else {
            setWorkMode(requiredWorkModeForContact(thread));
          }
        }
        appendWorkRhythmEvent({ kind: 'contact-selected', contactId });
      }
    },
    [contactThreads],
  );

  const openMiniScreen = useCallback((screenId: MiniScreenId) => {
    openMiniScreenHelper(screenId, setActiveMiniScreen);
  }, []);

  const focusComposer = useCallback(() => {
    window.requestAnimationFrame(() => {
      inputTextareaRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      inputTextareaRef.current?.focus();
    });
  }, []);

  const resolveContactMatches = useCallback(
    (text: string) => {
      const candidates = getContactMatchCandidates(contactThreads, text, selectedContactId);

      setContactMatchCandidates(candidates);
    },
    [contactThreads, selectedContactId],
  );

  useEffect(() => {
    if (contactBootstrapRef.current) return;
    if (!contactThreads.length) return;
    contactBootstrapRef.current = true;
    const stored = readSelectedContactId();
    if (!stored) return;
    const thread = contactThreads.find(t => t.id === stored);
    if (thread) {
      applySelectedContactId(stored, thread);
      return;
    }
    setSelectedContactId(null);
    writeSelectedContactId(null);
  }, [applySelectedContactId, contactThreads]);

  const finalizeCopiedReply = useCallback(
    (finalMessage: string) => {
      if (!selectedContactThread) return;
      syncLatestGeneratedReply(selectedContactThread.id, finalMessage);
      const baseline = generatedVariants.find(variant => variant.id === selectedVariantId)?.message ?? '';
      const wasEdited = finalMessage.trim() !== baseline.trim();
      if (wasEdited) {
        appendContactStyleFromEdit(selectedContactThread.id, finalMessage);
      }
      recordReplyLearning(selectedContactThread.id, {
        kind: wasEdited ? 'edited' : 'accepted',
        preview: finalMessage,
        textType,
        variantId: selectedVariantId,
      });
      if (selectedContactThread.pendingDraft) {
        setPendingDraft(selectedContactThread.id, null);
      }
    },
    [generatedVariants, recordReplyLearning, selectedContactThread, selectedVariantId, setPendingDraft, syncLatestGeneratedReply, textType],
  );

  const generatedReplyCopyLabel = useCallback(
    (kind: 'manual' | 'auto') => {
      const name = selectedContactThread?.name?.trim();
      if (name) {
        const template =
          kind === 'auto'
            ? copy.floating.autoCopiedSavedToContact
            : copy.floating.copiedGeneratedReplySavedToContact;
        return interpolate(template, { name });
      }
      return kind === 'auto' ? copy.floating.autoCopied : copy.floating.copiedGeneratedReply;
    },
    [copy.floating, selectedContactThread],
  );

  const contactNames = useMemo(() => {
    const uniqueNames = new Map<string, string>();

    contactThreads.forEach(thread => {
      const trimmedName = thread.name.trim();
      if (!trimmedName) return;
      uniqueNames.set(trimmedName.toLowerCase(), trimmedName);

      const trimmedCompany = thread.company.trim();
      if (trimmedCompany) {
        uniqueNames.set(trimmedCompany.toLowerCase(), trimmedCompany);
      }
    });

    return Array.from(uniqueNames.values());
  }, [contactThreads]);

  const { goldUnlocked } = useRankUnlocks(usageCount);

  useMilestone(usageCount, (rank) => {
    setActiveMilestone(rank);
  });

  const recipientOptions = RECIPIENT_PROFILES_BY_MODE[workMode];
  const recipientProfile = recipientProfileByMode[workMode];

  useEffect(() => {
    const validIds = RECIPIENT_PROFILES_BY_MODE[workMode].map(option => option.id);
    if (validIds.includes(recipientProfileByMode[workMode])) {
      return;
    }
    setRecipientProfileByMode(prev => ({
      ...prev,
      [workMode]: workMode === 'reply' ? 'existing-client' : 'colleague',
    }));
  }, [workMode, recipientProfileByMode]);
  const toneSummary = useMemo(() => {
    const toneChunks = [
      `${copy.toneControlLabels.formality} ${formality}/5`,
      `${copy.toneControlLabels.warmth} ${warmth}/5`,
      `${copy.toneControlLabels.urgency} ${urgency}/5`,
    ];
    return toneChunks.join(' | ');
  }, [copy.toneControlLabels.formality, copy.toneControlLabels.urgency, copy.toneControlLabels.warmth, formality, urgency, warmth]);

  const currentModePlaceholder = useMemo(
    () =>
      workMode === 'reply'
        ? copy.placeholders.reply
        : copy.placeholders.internal,
    [copy.placeholders.internal, copy.placeholders.reply, workMode],
  );

  useEffect(() => {
    setLanguage(settings.defaultLanguage);
  }, [settings.defaultLanguage]);

  useEffect(() => {
    return subscribeSelectedContactId(contactId => {
      setSelectedContactId(contactId);
      if (!contactId) return;
      const thread = contactThreads.find(item => item.id === contactId);
      if (thread) {
        setWorkMode(requiredWorkModeForContact(thread));
      }
    });
  }, [contactThreads]);

  // Keep localStorage in sync; align work mode to the selected contact if they disagree.
  // Invariant: never clear selectedContactId just because workMode mismatched contact.stage—
  // that caused "Use now" / picker selections to vanish. Only clear when the contact row is gone.
  useEffect(() => {
    if (selectedContactId && !contactThreads.some(thread => thread.id === selectedContactId)) {
      setSelectedContactId(null);
      writeSelectedContactId(null);
      return;
    }

    if (selectedContactId) {
      const selectedThread = contactThreads.find(thread => thread.id === selectedContactId);
      if (selectedThread && !isContactCompatibleWithMode(selectedThread, workMode)) {
        setWorkMode(requiredWorkModeForContact(selectedThread));
      }
    }
  }, [contactThreads, selectedContactId, workMode]);

  const updateRecipientFade = () => {
    const container = recipientScrollRef.current;
    if (!container) {
      setHasLeftRecipientFade(false);
      setHasRightRecipientFade(false);
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
    setHasLeftRecipientFade(scrollLeft > 2);
    setHasRightRecipientFade(scrollLeft < maxScrollLeft - 2);
  };

  useEffect(() => {
    const savedCount = Number.parseInt(localStorage.getItem(usageStorageKey) ?? '0', 10);
    const savedReplies = localStorage.getItem(historyStorageKey);

    if (!Number.isNaN(savedCount) && savedCount >= 0) {
      setUsageCount(savedCount);
    }

    if (savedReplies) {
      try {
        const parsed = JSON.parse(savedReplies) as ReplyHistoryItem[];
        if (Array.isArray(parsed)) {
          setRecentReplies(parsed.slice(0, 12));
        }
      } catch {
        setRecentReplies([]);
      }
    }
  }, []);

  useEffect(() => {
    if (activeMiniScreen === 'messages') {
      void refreshProductAnnouncements(true);
    }
  }, [activeMiniScreen, refreshProductAnnouncements]);

  useEffect(() => {
    return onDataReset(domains => {
      if (domainIncludesDraftMemory(domains)) {
        setRecentReplies([]);
      }
      if (domainIncludesCompanionSignals(domains)) {
        setUsageCount(0);
        setCopiedReplyCount(0);
        setShowReferralNudge(true);
        setShowOnboarding(true);
      }
      setIsMoreFeaturesOpen(false);
      setActiveMiniScreen(null);
      setDataResetVersion(prev => prev + 1);
    });
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLanguageOpen(false);
      }

      if (
        textTypeDropdownRef.current &&
        !textTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTextTypeOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [setIsLanguageOpen, setIsTextTypeOpen]);

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      if (target.isContentEditable) {
        return true;
      }

      const tag = target.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    };

    const handleEscapeBase = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isCmdKOpen) {
          setIsCmdKOpen(false);
          window.requestAnimationFrame(() => inputTextareaRef.current?.focus());
          return;
        }
        setIsLanguageOpen(false);
        setIsTextTypeOpen(false);
        setIsGeneratedModalOpen(false);
      }

      // Cmd+K (macOS) / Ctrl+K (Windows/Linux) — open the command palette
      const isCmdK = event.key.toLowerCase() === 'k'
        && (isMacPlatform ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey)
        && !event.altKey
        && !event.shiftKey;
      if (isCmdK) {
        event.preventDefault();
        setIsCmdKOpen(prev => !prev);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        const target = event.target;
        if (isTypingTarget(target) && target !== inputTextareaRef.current) {
          return;
        }
        event.preventDefault();
        if (!loading && input.trim()) {
          void handleGenerate();
        }
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        if (generatedMessage) {
          if (shouldHighStakesGuardRef.current()) {
            setIsHighStakesGuardOpen(true);
            return;
          }
          const finalMessage = generatedMessage;
          void (async () => {
            await copyWithLabel(finalMessage, generatedReplyCopyLabel('manual'), { resetAfterCopy: true });
            finalizeCopiedReply(finalMessage);
          })();
        }
      }
    };

    handleEscapeRef.current = handleEscapeBase;
  });

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => handleEscapeRef.current(event);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (window.desktopApp?.setPanelOpen) {
      const open = isMoreFeaturesOpen || activeMiniScreen !== null || isActionCenterOpen || isRememberedContextOpen;
      void window.desktopApp.setPanelOpen(open);
    }
  }, [activeMiniScreen, isMoreFeaturesOpen, isActionCenterOpen, isRememberedContextOpen]);

  useEffect(() => {
    if (isMoreFeaturesOpen) {
      setIsMoreFeaturesClosing(false);
      return;
    }
    if (!isMoreFeaturesClosing) return;
    const timer = window.setTimeout(() => setIsMoreFeaturesClosing(false), MORE_FEATURES_EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [isMoreFeaturesClosing, isMoreFeaturesOpen]);

  useEffect(() => {
    if (!isRememberedContextOpen) return;
    if (isMoreFeaturesOpen || activeMiniScreen !== null || rememberedContextCounts.count === 0) {
      setIsRememberedContextOpen(false);
    }
  }, [
    activeMiniScreen,
    isMoreFeaturesOpen,
    isRememberedContextOpen,
    rememberedContextCounts.count,
    setIsRememberedContextOpen,
  ]);

  useEffect(() => {
    updateRecipientFade();

    const handleResize = () => {
      updateRecipientFade();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [workMode]);

  useEffect(() => {
    return () => {
      if (headerAlertTimerRef.current) {
        window.clearTimeout(headerAlertTimerRef.current);
      }
      if (resetAfterCopyTimerRef.current) {
        window.clearTimeout(resetAfterCopyTimerRef.current);
      }
      if (attentionDismissTimerRef.current) {
        window.clearTimeout(attentionDismissTimerRef.current);
      }
    };
  }, []);

  const dismissAttentionToast = useCallback(() => {
    if (attentionDismissTimerRef.current) {
      window.clearTimeout(attentionDismissTimerRef.current);
      attentionDismissTimerRef.current = null;
    }
    setAttentionToast(null);
  }, []);

  const presentAttentionToast = useCallback(
    (toast: { key: string; title: string; body: string; actLabel: string; onAct: () => void }) => {
      if (attentionSeenKeysRef.current.has(toast.key)) return;
      attentionSeenKeysRef.current.add(toast.key);
      if (attentionDismissTimerRef.current) {
        window.clearTimeout(attentionDismissTimerRef.current);
      }
      setAttentionToast(toast);
      attentionDismissTimerRef.current = window.setTimeout(() => {
        setAttentionToast(null);
        attentionDismissTimerRef.current = null;
      }, ATTENTION_TOAST_TTL_MS);
    },
    [],
  );

  const resetComposeWorkspace = () => {
    setInput('');
    setGeneratedMessage('');
    setGeneratedVariants([]);
    setGeneratedInsight(null);
    setGeneratedQuickActions([]);
    setModalBasedOnLines([]);
    setActiveCulturalTipKey(null);
    setActiveImpressionCheck(null);
    setActiveVoiceMatch(null);
    setActiveWhyDetails([]);
    setActiveRecipientSnapshot(null);
    setIsHighStakesGuardOpen(false);
    setIsEditingGenerated(false);
    setIsGeneratedModalOpen(false);
    composerAttachments.clearAttachments();
    window.requestAnimationFrame(() => {
      inputTextareaRef.current?.focus();
    });
  };

  const showHeaderStatusAlert = (label: string) => {
    if (headerAlertTimerRef.current) {
      window.clearTimeout(headerAlertTimerRef.current);
    }

    setHeaderAlertLabel(label);
    setShowHeaderAlert(true);

    headerAlertTimerRef.current = window.setTimeout(() => {
      setShowHeaderAlert(false);
    }, 1300);
  };

  const handleSelectContactFromThreads = useCallback((contactId: string | null) => {
    const thread = contactId ? contactThreads.find(item => item.id === contactId) ?? null : null;
    applySelectedContactId(contactId, thread);
    if (contactId) {
      showHeaderStatusAlert(copy.floating.contactInComposer);
    }
  }, [applySelectedContactId, contactThreads, copy.floating.contactInComposer]);

  const copyWithLabel = async (value: string, label: string, options?: { resetAfterCopy?: boolean }) => {
    if (!value.trim()) {
      return;
    }

    await navigator.clipboard.writeText(value);
    showHeaderStatusAlert(label);

    if (options?.resetAfterCopy) {
      resetAfterCopyTimerRef.current = window.setTimeout(() => {
        resetComposeWorkspace();
      }, 650);
    }
  };

  const recordCopiedReplyValue = () => {
    appendWorkRhythmEvent({
      kind: 'reply-copied',
      contactId: selectedContactThread?.id,
    });
    setCopiedReplyCount(prev => {
      const next = prev + 1;
      localStorage.setItem('replyAssistantCopiedReplyCount', String(next));
      return next;
    });
  };

  const buildLocalFallback = (
    textToGenerate: string,
    options?: {
      workModeOverride?: WorkMode;
      recipientOverride?: RecipientProfile;
      textTypeOverride?: string;
    },
  ) => {
    const modeForGeneration = options?.workModeOverride ?? workMode;
    const recipientForGeneration = options?.recipientOverride ?? recipientProfile;
    const textTypeForGeneration = options?.textTypeOverride ?? textType;

    const toneDescriptor = toneSummary.toLowerCase();
    const resolvedLang = resolveLanguage(language);
    const languageLabel = resolvedLang === 'zh' ? 'Chinese (Simplified)' : 'English';
    const textTypeLabel = textTypeOptions.find(item => item.id === textTypeForGeneration)?.label ?? textTypeOptions[0].label;
    const recipientLabel = copy.recipientLabels[recipientForGeneration] ?? recipientForGeneration;

    return buildVariantOutput(textToGenerate, {
      mode: modeForGeneration,
      recipient: recipientLabel,
      tone: toneDescriptor,
      language: languageLabel,
      textType: textTypeLabel,
      template: copy.generatedOutput,
      senderName: businessContext.yourName,
      senderPosition: businessContext.yourPosition,
      senderCompany: businessContext.companyName,
      formality,
    });
  };

  const handleGenerate = async (
    inputOverride?: string,
    options?: {
      workModeOverride?: WorkMode;
      recipientOverride?: RecipientProfile;
      textTypeOverride?: string;
      sourceContext?: RequestGenerationContext;
      contactThreadOverride?: ContactThread | null;
    },
  ): Promise<boolean> => {
    const textToGenerate = (inputOverride ?? input).trim();
    if (!textToGenerate) return false;

    const modeForGeneration = options?.workModeOverride ?? workMode;
    const recipientForGeneration = options?.recipientOverride ?? recipientProfile;
    const textTypeForGeneration = options?.textTypeOverride ?? textType;
    const resolvedLangForGenerate = resolveLanguage(language);
    const aiLanguageLabel = resolvedLangForGenerate === 'zh' ? 'Chinese (Simplified)' : 'English';

    const generationSource = options?.sourceContext?.source ?? 'composer';
    const hasContactOverride = Object.prototype.hasOwnProperty.call(options ?? {}, 'contactThreadOverride');
    const activeContactThread = hasContactOverride
      ? options?.contactThreadOverride ?? null
      : selectedContactThread;
    let threadForPayload: ContactThread | null = activeContactThread;
    if (
      activeContactThread &&
      generationSource !== 'translate-draft' &&
      (generationSource === 'composer' || generationSource === 'paste-and-generate') &&
      !isRecentDuplicateInbound(activeContactThread, textToGenerate)
    ) {
      const inboundMessage = buildContactMessageEntry({
        direction: 'inbound',
        source: generationSource === 'paste-and-generate' ? 'paste' : 'manual-note',
        text: textToGenerate,
        sender: activeContactThread.name,
        receiver: profile.displayName || 'You',
      });
      const nextMessages = [inboundMessage, ...activeContactThread.messages].slice(0, 30);
      threadForPayload = {
        ...activeContactThread,
        messages: nextMessages,
        updatedAt: inboundMessage.createdAt,
        chatContext: mergeThreadChatContext(nextMessages, activeContactThread.chatContext),
      };
      addMessageToContact(activeContactThread.id, inboundMessage);
    }

    const styleSnippets = activeContactThread
      ? styleHintsAsSnippetMemory(activeContactThread.id)
      : [];
    const generationAttachments = [
      ...composerAttachments.attachmentContext,
      ...businessUploads.uploads,
      ...(activeContactThread ? contactUploads.uploadsByContact[activeContactThread.id] ?? [] : []),
    ];
    const replyLanguageBinary: 'en' | 'zh' = resolvedLangForGenerate === 'zh' ? 'zh' : 'en';
    const inboundForDetection = textToGenerate
      || (activeContactThread ? styleHintsAsSnippetMemory(activeContactThread.id).map(s => s.text).join(' ') : '');
    const detectedInbound = detectLanguage(inboundForDetection);
    const tipResolution = resolveCulturalTip({
      inboundLanguage: detectedInbound,
      replyLanguage: replyLanguageBinary,
      recipient: recipientForGeneration,
      textType: textTypeForGeneration,
    });
    const crossLanguageBlock = tipResolution
      ? {
        inboundLanguage: detectedInbound,
        replyInLanguage: replyLanguageBinary,
        register: tipResolution.register,
        preserveMeaningOnly: textTypeForGeneration === 'polish-english',
      }
      : undefined;

    const structuredRequest = buildStructuredRequest({
      mode: modeForGeneration,
      recipient: recipientForGeneration,
      textType: textTypeForGeneration,
      language: aiLanguageLabel,
      formality,
      warmth,
      urgency,
      confidence,
      businessContext,
      rawInput: textToGenerate,
      snippetMemory: [...snippetMemory, ...styleSnippets],
      recentReplies: recentReplies.map(reply => ({
        preview: reply.preview,
        mode: reply.mode,
        recipient: reply.recipient,
        contactName: reply.contactName,
      })),
      generationContext: options?.sourceContext ?? { source: 'composer' },
      attachmentContext: generationAttachments,
      crossLanguage: crossLanguageBlock,
      voiceProfile: (() => {
        // Phase 21a — "Write like me". Per-contact samples win when present;
        // otherwise fall back to the most recent global accepted replies so
        // a new contact still benefits from the user's overall voice.
        const contactSamples = activeContactThread
          ? getContactStyleSamples(activeContactThread.id)
          : [];
        const samples = contactSamples.length > 0
          ? contactSamples
          : recentReplies.slice(0, 3).map(r => r.preview).filter(Boolean);
        return buildVoiceProfile(samples) ?? undefined;
      })(),
    });
    const requestPayload = {
      ...structuredRequest,
      contactThread: threadForPayload ? buildContactThreadContext(threadForPayload) : null,
    };

    setLoading(true);

    try {
      let message = '';
      let variants: ReplyVariant[] = [];
      let insight: ReplyInsight | null = null;
      let quickActions: ReplyQuickAction[] = [];

      try {
        const apiData = await requestGeneratedOutput(requestPayload);
        message = apiData.output.trim();
        variants = Array.isArray(apiData.variants) ? apiData.variants : [];
        insight = apiData.insight ?? null;
        quickActions = Array.isArray(apiData.quickActions)
          ? apiData.quickActions.filter(action => action && action.id && action.label)
          : [];
      } catch (apiError) {
        console.warn('AI backend unavailable, using local fallback generation:', apiError);
        message = buildLocalFallback(textToGenerate, options);
      }

      message = applyBusinessIdentityToGeneratedMessage(message, {
        businessContext,
        textType: textTypeForGeneration,
        formality,
      });

      const normalizedVariants = (variants.length > 0 ? variants : [
        {
          id: 'safe' as const,
          title: 'Safe',
          message,
          rationale: 'Balanced option optimized for clarity and low-friction responses.',
        },
      ]).map(variant => ({
        ...variant,
        message: applyBusinessIdentityToGeneratedMessage(variant.message, {
          businessContext,
          textType: textTypeForGeneration,
          formality,
        }),
      }));

      const initialVariant = normalizedVariants.find(variant => variant.id === 'safe') ?? normalizedVariants[0];

      setGeneratedVariants(normalizedVariants);
      setSelectedVariantId(initialVariant.id);
      setGeneratedInsight(insight);
      setGeneratedQuickActions(quickActions);

      setGeneratedMessage(initialVariant.message);
      const initialDraftLang = resolveDisplayLanguageForToggle(
        initialVariant.message,
        resolvedLangForGenerate === 'zh' ? 'zh' : 'en',
      );
      setDraftLanguageCache({ [initialDraftLang]: initialVariant.message });
      const basedOnLines = buildReplyBasedOnLines(threadForPayload, textToGenerate, {
        businessContext,
        attachmentContext: generationAttachments,
        labels: {
          latestMessage: copy.modal.basedOnLatestMessage,
          relationshipMemory: copy.modal.basedOnRelationshipMemory,
          businessContext: copy.modal.basedOnBusinessContext,
          yourInput: copy.modal.basedOnYourInput,
          recentTimeline: copy.modal.basedOnRecentTimeline,
          attachments: copy.modal.basedOnAttachments,
          limitedContext: copy.modal.basedOnLimitedContext,
        },
      });
      setModalBasedOnLines(basedOnLines);
      setActiveCulturalTipKey(tipResolution?.key ?? null);

      const impressionResult = runImpressionCheck({
        message: initialVariant.message,
        mode: modeForGeneration,
        recipient: recipientForGeneration,
        textType: textTypeForGeneration,
        formality,
      });
      setActiveImpressionCheck(impressionResult);
      setActiveVoiceMatch(computeVoiceMatch(activeContactThread?.id ?? null, initialVariant.message));
      setActiveWhyDetails(buildReplyBasedOnDetails(threadForPayload, textToGenerate, {
        businessContext,
        attachmentContext: generationAttachments,
      }));
      setActiveRecipientSnapshot(recipientForGeneration);
      const replySurface = openGeneratedReplySurface({
        generatedMessage: initialVariant.message,
        basedOnLines,
        prioritizedEntities: [
          activeContactThread?.name ?? '',
          activeContactThread?.company ?? '',
        ],
        contactNames,
        insight,
        mode: modeForGeneration,
        hasFollowUp: Boolean(insight),
        recipient: recipientForGeneration,
        textType: textTypeForGeneration,
        formality,
        warmth,
        urgency,
        confidence,
      });
      if (replySurface === 'inline') {
        setIsGeneratedModalOpen(true);
      }
      setIsEditingGenerated(false);

      if (settings.autoCopy) {
        void copyWithLabel(initialVariant.message, generatedReplyCopyLabel('auto'));
      }

      const nextHistory: ReplyHistoryItem[] = [
        {
          id: `${Date.now()}`,
          preview: initialVariant.message,
          variant: 'balanced' as const,
          mode: modeForGeneration,
          recipient: recipientForGeneration,
          contactId: activeContactThread?.id,
          contactName: activeContactThread?.name,
          createdAt: Date.now(),
        },
        ...recentReplies,
      ].slice(0, 12);
      setRecentReplies(nextHistory);
      localStorage.setItem(historyStorageKey, JSON.stringify(nextHistory));

      if (activeContactThread) {
        addReplyToContact(activeContactThread.id, {
          id: `${Date.now()}-contact-reply`,
          preview: initialVariant.message,
          createdAt: Date.now(),
          mode: modeForGeneration,
          recipient: recipientForGeneration,
        });
        if (activeContactThread.pendingDraft) {
          setPendingDraft(activeContactThread.id, null);
        }
      }

      setUsageCount(prevCount => {
        const nextCount = prevCount + 1;
        localStorage.setItem(usageStorageKey, String(nextCount));
        return nextCount;
      });

      const nextToday = incrementTodayCount();
      setTodayCount(nextToday);
      setStreak(computeStreak());
      appendWorkRhythmEvent({
        kind: 'generate',
        contactId: activeContactThread?.id,
        textType: textTypeForGeneration,
      });
      return true;
    } finally {
      setLoading(false);
    }
  };

  const handleCmdKIntent = (intent: CmdKIntent) => {
    setIsCmdKOpen(false);
    setIsMoreFeaturesOpen(false);
    setActiveMiniScreen(null);
    setIsActionCenterOpen(false);

    if (intent.kind !== 'empty') {
      appendWorkRhythmEvent({
        kind: 'cmd-k',
        intentKind: intent.kind,
        contactId: intent.kind === 'select-contact' || intent.kind === 'draft-reply' || intent.kind === 'follow-up'
          ? intent.contact.id
          : undefined,
      });
    }

    switch (intent.kind) {
      case 'select-contact':
        applySelectedContactId(intent.contact.id, intent.contact);
        setContactMatchCandidates([]);
        setIsContactConfirmationNeeded(false);
        window.requestAnimationFrame(() => inputTextareaRef.current?.focus());
        break;
      case 'draft-reply':
        applySelectedContactId(intent.contact.id, intent.contact, 'reply');
        setRecipientProfileByMode(prev => ({ ...prev, reply: 'existing-client' }));
        setInput(intent.prompt);
        setLastCaptureSource('typed');
        setContactMatchCandidates([]);
        setIsContactConfirmationNeeded(false);
        void handleGenerate(intent.prompt, {
          workModeOverride: 'reply',
          contactThreadOverride: intent.contact,
        });
        break;
      case 'follow-up':
        applySelectedContactId(intent.contact.id, intent.contact, 'reply');
        setRecipientProfileByMode(prev => ({ ...prev, reply: 'existing-client' }));
        setTextType('follow-up');
        setInput(intent.prompt);
        setLastCaptureSource('typed');
        setContactMatchCandidates([]);
        setIsContactConfirmationNeeded(false);
        void handleGenerate(intent.prompt, {
          workModeOverride: 'reply',
          recipientOverride: 'existing-client',
          textTypeOverride: 'follow-up',
          contactThreadOverride: intent.contact,
        });
        break;
      case 'paste-into-composer':
        setInput(intent.text);
        setLastCaptureSource('typed');
        if (intent.text.trim().length >= 8) {
          resolveContactMatches(intent.text);
        } else {
          setContactMatchCandidates([]);
        }
        window.requestAnimationFrame(() => inputTextareaRef.current?.focus());
        break;
      case 'empty':
        break;
    }
  };

  const handleSaveToneProfile = () => {
    const name = `Profile ${savedToneProfiles.length + 1}`;
    const profile: ToneProfileData = {
      id: `tone-${Date.now()}`,
      name,
      formality,
      warmth,
      urgency,
      confidence,
    };
    const next = saveToneProfile(profile);
    setSavedToneProfiles(next);
    void copyWithLabel(copy.rankUnlocks.profileSaved, copy.rankUnlocks.profileSaved);
  };

  const handleLoadToneProfile = (profile: ToneProfileData) => {
    setFormality(profile.formality);
    setWarmth(profile.warmth);
    setUrgency(profile.urgency);
    setConfidence(profile.confidence);
    setActiveTonePreset(null);
  };

  const handleDeleteToneProfile = (id: string) => {
    const next = deleteToneProfile(id);
    setSavedToneProfiles(next);
  };

  const handleAutoSoften = useCallback(() => {
    if (!activeImpressionCheck || !activeRecipientSnapshot) return;
    const intent: AutoSoftenIntent | null = autoSoftenIntentFor(activeImpressionCheck);
    if (!intent) return;
    void handleGenerate(input || generatedMessage, {
      workModeOverride: workMode,
      recipientOverride: activeRecipientSnapshot,
      textTypeOverride: textType,
      sourceContext: {
        source: 'composer',
        title: `auto-soften:${intent}`,
        body: generatedMessage,
      },
    });
  }, [
    activeImpressionCheck,
    activeRecipientSnapshot,
    generatedMessage,
    input,
    textType,
    workMode,
  ]);

  const performCopy = useCallback(async () => {
    if (!generatedMessage) return;
    const finalMessage = generatedMessage;
    await copyWithLabel(finalMessage, generatedReplyCopyLabel('manual'), { resetAfterCopy: true });
    recordCopiedReplyValue();
    finalizeCopiedReply(finalMessage);
  }, [copyWithLabel, finalizeCopiedReply, generatedMessage, generatedReplyCopyLabel, recordCopiedReplyValue]);

  const shouldHighStakesGuard = useCallback(() => (
    settings.highStakesGuard
    && Boolean(activeRecipientSnapshot)
    && isHighStakesRecipient(activeRecipientSnapshot as RecipientProfile)
  ), [activeRecipientSnapshot, settings.highStakesGuard]);

  const shouldHighStakesGuardRef = useRef(shouldHighStakesGuard);
  useEffect(() => {
    shouldHighStakesGuardRef.current = shouldHighStakesGuard;
  }, [shouldHighStakesGuard]);

  const handleCopy = async () => {
    if (!generatedMessage) return;
    if (shouldHighStakesGuard()) {
      setIsHighStakesGuardOpen(true);
      return;
    }
    await performCopy();
  };

  const handleCopySubject = async (subject: string) => {
    if (!subject.trim()) {
      return;
    }

    await copyWithLabel(subject, copy.modal.subjectCopied, { resetAfterCopy: false });
  };

  const handleSelectGeneratedVariant = (variantId: ReplyVariantId) => {
    const selected = generatedVariants.find(variant => variant.id === variantId);
    if (!selected) return;

    setSelectedVariantId(variantId);
    setGeneratedMessage(selected.message);
    setIsEditingGenerated(false);
  };

  const applyDraftDisplayUpdate = useCallback((value: string) => {
    setGeneratedMessage(value);
    setGeneratedVariants(prev => prev.map(variant =>
      variant.id === selectedVariantId ? { ...variant, message: value } : variant,
    ));
    if (activeRecipientSnapshot) {
      setActiveImpressionCheck(runImpressionCheck({
        message: value,
        mode: workMode,
        recipient: activeRecipientSnapshot,
        textType,
        formality,
      }));
      setActiveVoiceMatch(computeVoiceMatch(selectedContactThread?.id ?? null, value));
    }
  }, [
    activeRecipientSnapshot,
    formality,
    selectedContactThread?.id,
    selectedVariantId,
    setGeneratedMessage,
    setGeneratedVariants,
    textType,
    workMode,
  ]);

  const handleGeneratedMessageChange = (value: string) => {
    applyDraftDisplayUpdate(value);
    const appDefault: DraftLanguage = resolveLanguage(language) === 'zh' ? 'zh' : 'en';
    const displayLang = resolveDisplayLanguageForToggle(value, appDefault);
    setDraftLanguageCache({ [displayLang]: value });
  };

  const handleSelectWorkMode = useCallback(
    (nextWorkMode: WorkMode) => {
      if (selectedContactThread && !isContactCompatibleWithMode(selectedContactThread, nextWorkMode)) {
        applySelectedContactId(null);
      }
      setWorkMode(nextWorkMode);
    },
    [applySelectedContactId, selectedContactThread],
  );

  const handlePasteAndGenerate = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) return;
      appendWorkRhythmEvent({ kind: 'paste-start' });
      const trimmed = text.trim();
      setInput(trimmed);
      setLastCaptureSource('paste');
      const candidates = getContactMatchCandidates(contactThreads, trimmed, selectedContactId);
      setContactMatchCandidates(candidates);
      const decision = decideContactMatch(candidates);

      if (decision.kind === 'auto-select') {
        applySelectedContactId(decision.candidate.thread.id, decision.candidate.thread);
        setContactMatchCandidates([]);
        setIsContactConfirmationNeeded(false);
        window.requestAnimationFrame(() => inputTextareaRef.current?.focus());
        return;
      }

      setIsContactConfirmationNeeded(true);
    } catch {
      // clipboard permission denied or empty — silently ignore
    }
  };

  const handleGenerateWithSelectedContact = () => {
    const trimmed = input.trim();
    if (!trimmed || !selectedContactThread) return;
    setIsContactConfirmationNeeded(false);
    setContactMatchCandidates([]);
    void handleGenerate(trimmed, {
      sourceContext: { source: 'paste-and-generate' },
      contactThreadOverride: selectedContactThread,
    });
  };

  const handleGenerateWithoutContact = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setIsContactConfirmationNeeded(false);
    setContactMatchCandidates([]);
    void handleGenerate(trimmed, {
      sourceContext: { source: 'paste-and-generate' },
      contactThreadOverride: null,
    });
  };

  const handleSelectTonePreset = (preset: Exclude<TonePreset, null>) => {
    switch (preset) {
      case 'executive':
        setFormality(4);
        setWarmth(2);
        setUrgency(4);
        break;
      case 'friendly':
        setFormality(3);
        setWarmth(4);
        setUrgency(2);
        break;
      case 'urgent':
        setFormality(2);
        setWarmth(2);
        setUrgency(5);
        break;
      case 'casual':
        setFormality(2);
        setWarmth(5);
        setUrgency(1);
        break;
      default:
        break;
    }

    setActiveTonePreset(preset);
  };

  const handleToneControlChange = (key: 'formality' | 'warmth' | 'urgency' | 'confidence', value: number) => {
    if (key === 'formality') {
      setFormality(value);
    }

    if (key === 'warmth') {
      setWarmth(value);
    }

    if (key === 'urgency') {
      setUrgency(value);
    }

    if (key === 'confidence') {
      setConfidence(value);
    }

    setActiveTonePreset(null);
  };

  const handleAmmoSelect = (scenario: AmmoScenario) => {
    const prompt = scenario.prompt;
    appendWorkRhythmEvent({ kind: 'quick-start', scenarioId: scenario.id });
    setInput(prompt);
    setWorkMode(scenario.workMode);
    setRecipientProfileByMode(prev => ({ ...prev, [scenario.workMode]: scenario.recipient }));
    setTextType(scenario.textType);
    void handleGenerate(prompt, { sourceContext: { source: 'instant-ammo', title: scenario.id } });
  };

  const snippetCount = useMemo(() => {
    try {
      const raw = localStorage.getItem(snippetStorageKey);
      if (!raw) {
        return copy.snippetLibrary.defaultSnippets.length;
      }

      const parsed = JSON.parse(raw) as Array<{ id: string }>;
      if (!Array.isArray(parsed)) {
        return copy.snippetLibrary.defaultSnippets.length;
      }

      return parsed.length;
    } catch {
      return copy.snippetLibrary.defaultSnippets.length;
    }
  }, [activeMiniScreen, copy.snippetLibrary.defaultSnippets.length, dataResetVersion, snippetStorageKey]);

  const contactFollowUpTasks = useMemo(
    () => buildContactFollowUpTasks(contactThreads, copy),
    [contactThreads, copy],
  );
  const snippetMemory = useMemo(
    () => loadSnippetMemory(copy.snippetLibrary.defaultSnippets, snippetStorageKey),
    [activeMiniScreen, copy.snippetLibrary.defaultSnippets, dataResetVersion, snippetStorageKey],
  );

  const generateDraftForContact = useCallback(
    async (contact: ContactThread, inboundText: string) => {
      const trimmed = inboundText.trim();
      if (!trimmed) return;
      const inflightKey = `${contact.id}:${trimmed.slice(0, 60)}`;
      if (inflightDraftKeysRef.current.has(inflightKey)) return;
      // Skip if a fresh draft already exists for this contact
      if (contact.pendingDraft && contact.pendingDraft.sourceInbound === trimmed) return;
      inflightDraftKeysRef.current.add(inflightKey);

      try {
        const resolvedLang = resolveLanguage(language);
        const aiLanguageLabel = resolvedLang === 'zh' ? 'Chinese (Simplified)' : 'English';
        const styleSnippets = styleHintsAsSnippetMemory(contact.id);
        const draftAttachments = [
          ...businessUploads.uploads,
          ...(contactUploads.uploadsByContact[contact.id] ?? []),
        ];
        const structuredRequest = buildStructuredRequest({
          mode: 'reply',
          recipient: 'existing-client',
          textType: 'shorter-reply',
          language: aiLanguageLabel,
          formality,
          warmth,
          urgency,
          confidence,
          businessContext,
          rawInput: trimmed,
          snippetMemory: [...snippetMemory, ...styleSnippets],
          recentReplies: recentReplies.map(reply => ({
            preview: reply.preview,
            mode: reply.mode,
            recipient: reply.recipient,
            contactName: reply.contactName,
          })),
          generationContext: { source: 'composer' },
          attachmentContext: draftAttachments,
        });
        const payload = {
          ...structuredRequest,
          contactThread: buildContactThreadContext(contact),
        };

        const apiData = await requestGeneratedOutput(payload);
        const rawMessage = apiData.output.trim();
        if (!rawMessage) return;
        const message = applyBusinessIdentityToGeneratedMessage(rawMessage, {
          businessContext,
          textType: 'shorter-reply',
          formality,
        });
        const basedOnLines = buildReplyBasedOnLines(contact, trimmed, {
          businessContext,
          attachmentContext: draftAttachments,
          labels: {
            latestMessage: copy.modal.basedOnLatestMessage,
            relationshipMemory: copy.modal.basedOnRelationshipMemory,
            businessContext: copy.modal.basedOnBusinessContext,
            yourInput: copy.modal.basedOnYourInput,
            recentTimeline: copy.modal.basedOnRecentTimeline,
            attachments: copy.modal.basedOnAttachments,
            limitedContext: copy.modal.basedOnLimitedContext,
          },
        });
        setPendingDraft(contact.id, {
          message,
          basedOnLines,
          sourceInbound: trimmed,
          createdAt: Date.now(),
        });
      } catch {
        // Background draft is best-effort; silent failure preserves trust.
      } finally {
        inflightDraftKeysRef.current.delete(inflightKey);
      }
    },
    [
      businessContext,
      businessUploads.uploads,
      confidence,
      contactUploads.uploadsByContact,
      copy.modal,
      formality,
      language,
      recentReplies,
      setPendingDraft,
      snippetMemory,
      urgency,
      warmth,
    ],
  );

  useEffect(() => {
    generateDraftRef.current = generateDraftForContact;
  }, [generateDraftForContact]);

  const pendingTodayQueueCount = useMemo(() => {
    const tasks = buildTodayQueueTasks({
      copy,
      unreadMessageCount,
      snippetCount,
      recentRepliesCount: recentReplies.length,
      context: businessContext,
    });

    const allTasks = [...contactFollowUpTasks, ...insightTasks, ...tasks];
    return allTasks.filter(task => !todayQueue.isDone(task.id) && !todayQueue.isSnoozed(task.id)).length;
  }, [
    businessContext,
    contactFollowUpTasks,
    copy,
    insightTasks,
    recentReplies.length,
    snippetCount,
    todayQueue,
    unreadMessageCount,
  ]);

  const handleAddToQueue = () => {
    if (!generatedInsight) return;

    const recipientLabel = copy.recipientLabels[recipientProfile] ?? copy.recipientLabels['existing-client'];
    actionInbox.addFromInsight({
      insight: generatedInsight,
      recipientLabel,
      prompt: copy.contactThreads.insightFollowUpPrompt
        .replace('{recipient}', recipientLabel)
        .replace('{intent}', generatedInsight.intentLabel)
        .replace('{goal}', generatedInsight.nextAction)
        .replace('{timing}', generatedInsight.followUp),
    });

    addInsightTask({
      id: `insight-${Date.now()}`,
      title: `Follow up: ${generatedInsight.intentLabel}`,
      body: generatedInsight.nextAction,
      estMinutes: 3,
      action: { kind: 'open-screen', screenId: 'messages' },
      meta: { riskLevel: generatedInsight.riskLevel, followUpTiming: generatedInsight.followUp },
    });
  };

  const handleGeneratedQuickAction = async (actionId: string) => {
    if (actionId === 'send-now') {
      const finalMessage = generatedMessage;
      await copyWithLabel(finalMessage, generatedReplyCopyLabel('manual'), { resetAfterCopy: false });
      recordCopiedReplyValue();
      finalizeCopiedReply(finalMessage);
      setIsGeneratedModalOpen(false);
      setIsEditingGenerated(false);
      return;
    }

    if (actionId === 'save-reply') {
      const saved = saveGeneratedReplyAsSnippet(generatedMessage);
      showHeaderStatusAlert(saved ? 'Saved to snippets' : 'Already in snippets');
      return;
    }

    if (actionId === 'add-task' && generatedInsight) {
      handleAddToQueue();
    }
  };

  const handleTodayQueueAction = async (action: TodayQueueAction) => {
    if (action.kind === 'open-screen') {
      openMiniScreen(action.screenId);
      return;
    }

    setWorkMode(action.workMode);
    setRecipientProfileByMode(prev => ({ ...prev, [action.workMode]: action.recipient }));
    setTextType(action.textType);
    setInput(action.input);
    setActiveMiniScreen(null);
    inputTextareaRef.current?.focus();

    await handleGenerate(action.input, {
      workModeOverride: action.workMode,
      recipientOverride: action.recipient,
      textTypeOverride: action.textType,
      sourceContext: {
        source: 'today-queue',
        title: action.textType,
        body: action.input,
      },
    });
  };

  const isCmdKHintEligible = useMemo(
    () => (
      !isCmdKOpen
      && !loading
      && !input.trim()
      && !isGeneratedModalOpen
      && !isReferralModalOpen
      && !showOnboarding
      && !isMoreFeaturesVisible
      && activeMiniScreen == null
      && !isActionCenterOpen
      && !isToneComposeModalOpen
      && contactMatchCandidates.length === 0
      && !isContactConfirmationNeeded
      && !guidedTour.isActive
    ),
    [
      activeMiniScreen,
      contactMatchCandidates.length,
      guidedTour.isActive,
      input,
      isActionCenterOpen,
      isCmdKOpen,
      isContactConfirmationNeeded,
      isGeneratedModalOpen,
      isMoreFeaturesVisible,
      isReferralModalOpen,
      isToneComposeModalOpen,
      loading,
      showOnboarding,
    ],
  );

  const handleActionInboxDoNow = async (item: ActionInboxItem) => {
    setWorkMode('reply');
    setRecipientProfileByMode(prev => ({ ...prev, reply: 'existing-client' }));
    setTextType('follow-up');
    setInput(item.prompt);
    if (item.relatedContactId) {
      applySelectedContactId(item.relatedContactId, null, 'reply');
    }
    setActiveMiniScreen(null);
    inputTextareaRef.current?.focus();

    const ok = await handleGenerate(item.prompt, {
      workModeOverride: 'reply',
      recipientOverride: 'existing-client',
      textTypeOverride: 'follow-up',
      sourceContext: {
        source: 'action-inbox',
        title: item.title,
        body: item.body,
      },
    });
    if (ok) {
      actionInbox.markDone(item.id);
    }
  };

  useEffect(() => {
    if (!window.desktopApp?.onChildScreenClosed) return undefined;

    return window.desktopApp.onChildScreenClosed(screenId => {
      if (screenId === 'generated-reply') {
        setIsGeneratedModalOpen(false);
        setIsEditingGenerated(false);
        window.requestAnimationFrame(() => inputTextareaRef.current?.focus());
      }
    });
  }, []);

  const onChildActionRef = useRef((action: DetachedChildAction) => {});
  useEffect(() => {
    onChildActionRef.current = (action) => {
      if (action.type === 'sign-out') {
        void handleSignOutFromApp();
        return;
      }

      if (action.type === 'open-screen') {
        openMiniScreen(action.screenId);
        return;
      }

      if (action.type === 'select-contact') {
        const thread = action.contactId
          ? contactThreads.find(item => item.id === action.contactId) ?? null
          : null;
        applySelectedContactId(action.contactId, thread);
        if (action.contactId) {
          showHeaderStatusAlert(copy.floating.contactInComposer);
        }
        return;
      }

      if (action.type === 'compose-from-contact') {
        applySelectedContactId(action.contactId);
        setInput(action.text);
        setIsMoreFeaturesOpen(false);
        setActiveMiniScreen(null);
        window.requestAnimationFrame(() => inputTextareaRef.current?.focus());
        return;
      }

      if (action.type === 'use-recent-reply' || action.type === 'use-snippet') {
        setInput(action.value);
        setIsMoreFeaturesOpen(false);
        setActiveMiniScreen(null);
        window.requestAnimationFrame(() => inputTextareaRef.current?.focus());
        return;
      }

      if (action.type === 'run-today-task') {
        void handleTodayQueueAction(action.action);
        return;
      }

      if (action.type === 'run-action-inbox-item') {
        void handleActionInboxDoNow(action.item);
        return;
      }

      if (action.type === 'update-generated-reply') {
        handleGeneratedMessageChange(action.message);
        return;
      }

      if (action.type === 'copy-generated-reply') {
        if (!action.message.trim()) return;
        if (shouldHighStakesGuardRef.current()) {
          setIsHighStakesGuardOpen(true);
          return;
        }
        void (async () => {
          await copyWithLabel(action.message, generatedReplyCopyLabel('manual'), { resetAfterCopy: true });
          recordCopiedReplyValue();
          finalizeCopiedReply(action.message);
        })();
        return;
      }

      if (action.type === 'add-generated-follow-up') {
        handleAddToQueue();
        return;
      }

      if (action.type === 'smart-reply-contact') {
        const contact = contactThreads.find(item => item.id === action.contactId);
        if (contact) {
          runSmartReplyRef.current(contact);
        }
      }
    };
  });

  useEffect(() => {
    if (!window.desktopApp?.onChildAction) return undefined;

    return window.desktopApp.onChildAction(action => {
      if (!isDetachedChildAction(action)) return;
      onChildActionRef.current(action);
    });
  }, []);

  const topActionInboxItem = actionInbox.pendingItems[0] ?? null;
  const pendingActionInboxCount = actionInbox.pendingCount;

  const openPendingDraft = useCallback((contact: ContactThread) => {
    const draft = contact.pendingDraft;
    if (!draft) return;
    applySelectedContactId(contact.id, contact);
    setWorkMode('reply');
    setRecipientProfileByMode(prev => ({ ...prev, reply: 'existing-client' }));
    setInput(draft.sourceInbound);
    setLastCaptureSource('typed');
    setContactMatchCandidates([]);
    setIsContactConfirmationNeeded(false);
    setGeneratedMessage(draft.message);
    setGeneratedVariants([
      { id: 'safe', title: 'Safe', message: draft.message, rationale: 'Background draft' },
    ]);
    setSelectedVariantId('safe');
    setGeneratedInsight(null);
    setGeneratedQuickActions([]);
    setModalBasedOnLines(draft.basedOnLines);
    const replySurface = openGeneratedReplySurface({
      generatedMessage: draft.message,
      basedOnLines: draft.basedOnLines,
      prioritizedEntities: [contact.name ?? '', contact.company ?? ''],
      contactNames,
      insight: null,
      mode: 'reply',
      hasFollowUp: false,
      recipient: 'existing-client',
      textType,
      formality,
      warmth,
      urgency,
      confidence,
    });
    if (replySurface === 'inline') {
      setIsGeneratedModalOpen(true);
    }
    setIsEditingGenerated(false);
  }, [applySelectedContactId, confidence, contactNames, formality, textType, urgency, warmth]);

  const contactWithFreshDraft = useMemo(
    () => contactThreads.find(t => Boolean(t.pendingDraft)) ?? null,
    [contactThreads],
  );
  const uploadNeedingReview = useMemo(() => {
    const selectedContactUploads = selectedContactThread
      ? contactUploads.uploadsByContact[selectedContactThread.id] ?? []
      : [];
    return findUploadNeedingReview([
      ...composerAttachments.attachmentContext,
      ...selectedContactUploads,
      ...businessUploads.uploads,
    ]);
  }, [
    businessUploads.uploads,
    composerAttachments.attachmentContext,
    contactUploads.uploadsByContact,
    selectedContactThread,
  ]);

  const runSmartReply = useSmartReply({
    applySelectedContactId,
    setWorkMode,
    setRecipientProfileByMode,
    setInput,
    setLastCaptureSource,
    setContactMatchCandidates: () => setContactMatchCandidates([]),
    setIsContactConfirmationNeeded,
    setIsActionCenterOpen,
    openPendingDraft,
    handleGenerate,
    focusComposer,
  });

  useEffect(() => {
    runSmartReplyRef.current = runSmartReply;
  }, [runSmartReply]);

  useEffect(() => {
    return subscribeToNotificationActions(action => {
      if (!action || !action.contactId) return;
      const contact = contactThreads.find(thread => thread.id === action.contactId);
      if (!contact) return;
      setIsMoreFeaturesOpen(false);
      setActiveMiniScreen(null);
      runSmartReplyRef.current(contact);
    });
  }, [contactThreads]);

  const handleReviewUploadFromBrief = useCallback((upload: NonNullable<typeof uploadNeedingReview>) => {
    setIsActionCenterOpen(false);
    setIsMoreFeaturesOpen(false);
    showHeaderStatusAlert(copy.floating.reviewFileHeader);

    if (upload.source === 'business-context') {
      openMiniScreen('business-context');
      return;
    }

    if (upload.source === 'contact') {
      const contact = upload.contactId
        ? contactThreads.find(thread => thread.id === upload.contactId)
        : selectedContactThread;
      if (contact) {
        applySelectedContactId(contact.id, contact);
      }
      openMiniScreen('contact-threads');
      return;
    }

    setActiveMiniScreen(null);
    focusComposer();
  }, [
    applySelectedContactId,
    contactThreads,
    copy.floating.reviewFileHeader,
    focusComposer,
    openMiniScreen,
    selectedContactThread,
    showHeaderStatusAlert,
  ]);

  const handleAskForContactDetail = useCallback((contact: ContactThread) => {
    applySelectedContactId(contact.id, contact, 'reply');
    setWorkMode('reply');
    setRecipientProfileByMode(prev => ({ ...prev, reply: 'existing-client' }));
    setInput('');
    setLastCaptureSource('typed');
    setContactMatchCandidates([]);
    setIsContactConfirmationNeeded(false);
    setIsActionCenterOpen(false);
    setActiveMiniScreen(null);
    showHeaderStatusAlert(copy.floating.addDetailHeader);
    focusComposer();
  }, [
    applySelectedContactId,
    copy.floating.addDetailHeader,
    focusComposer,
    showHeaderStatusAlert,
  ]);

  const {
    contactPriorityRows,
    contactNeedingReply,
    commandCenterPrimary,
    hasDailyBrief,
  } = useCommandCenterPrimary({
    contactThreads,
    selectedContactThread,
    recentRepliesCount: recentReplies.length,
    composerEmpty: !input.trim(),
    topActionInboxItem,
    pendingActionInboxCount,
    copy,
    applySelectedContactId,
    handleActionInboxDoNow,
    openMiniScreen,
    setWorkMode,
    setRecipientProfileByMode,
    setInput,
    setTextType,
    setLastCaptureSource,
    setContactMatchCandidates: () => setContactMatchCandidates([]),
    setIsContactConfirmationNeeded,
    setIsActionCenterOpen,
    showHeaderStatusAlert,
    focusComposer,
    onDailyBriefCta: source => {
      appendWorkRhythmEvent({ kind: 'daily-brief-cta', source });
    },
    lazyMode: settings.lazyMode,
    contactWithFreshDraft,
    reviewUpload: uploadNeedingReview,
    onReviewUpload: handleReviewUploadFromBrief,
    onAskForContactDetail: handleAskForContactDetail,
    runSmartReply,
    welcomeFirstName,
  });

  useEffect(() => {
    const draftCount = contactWithFreshDraft ? 1 : 0;
    const needsReplyCount = contactNeedingReply ? 1 : 0;
    setDesktopBadgeCount(pendingActionInboxCount + needsReplyCount + draftCount);
  }, [contactNeedingReply, contactWithFreshDraft, pendingActionInboxCount]);

  const smartSuggestions = useMemo(
    () => buildSmartSuggestions({
      contactThreads,
      contactPriorityRows,
      selectedContactId,
      composerEmpty: !input.trim(),
    }),
    [contactPriorityRows, contactThreads, input, selectedContactId],
  );

  const paletteSuggestions = useMemo(
    () => getPaletteSuggestions(smartSuggestions),
    [smartSuggestions],
  );

  const activeNextStep = useNextStep({
    hasInput: Boolean(input.trim()),
    loading,
    hasContactSelected: Boolean(selectedContactThread),
    generatedMessage,
    isGeneratedModalOpen,
    isContactConfirmationNeeded,
    hasContactMatchCandidates: contactMatchCandidates.length > 0,
    isMoreFeaturesOpen: isMoreFeaturesVisible,
    isActionCenterOpen,
    isToneComposeModalOpen,
    isCmdKOpen,
    showOnboarding,
    hasActiveMiniScreen: activeMiniScreen !== null,
  });

  const proactiveNudge = useProactiveNudge({
    suggestions: smartSuggestions,
    hasDailyBrief,
    isCmdKHintEligible,
    composerEmpty: !input.trim(),
    loading,
    hasActiveNextStep: activeNextStep !== null,
  });

  const replyLanguage = useReplyLanguage({
    selectedContactThread,
    composerInput: input,
    appDefaultLanguage: settings.defaultLanguage,
    currentLanguage: language,
  });

  const [activeCulturalTipKey, setActiveCulturalTipKey] = useState<CulturalTipKey | null>(null);

  // Phase 17 — Compose Coach. Pure heuristics on the composer input, debounced
  // in useComposeCoach. Suppressed while any modal/tour/match-confirm owns the
  // user's attention so we never stack two prompts.
  const composeCoachContactStats = useMemo(
    () => (selectedContactThread ? deriveRelationshipStats(selectedContactThread.messages) : null),
    [selectedContactThread],
  );
  const composeCoachWarnings = useComposeCoach(input, {
    contactStats: composeCoachContactStats,
    recipientProfile,
  });
  const composeCoachSuppressed =
    loading
    || isGeneratedModalOpen
    || isToneComposeModalOpen
    || isMoreFeaturesVisible
    || isReferralModalOpen
    || activeMiniScreen !== null
    || isCmdKOpen
    || showOnboarding
    || guidedTour.isActive
    || contactMatchCandidates.length > 0;
  // Phase 14 — Intent detection. Same debounce as the coach so they recompute
  // in lockstep and never visually compete. The chip itself is suppressed by
  // WorkbenchHeader whenever the language-recommendation chip is showing.
  const detectedIntent = useDetectedIntent(input);
  const intentChipSuppressed = composeCoachSuppressed;

  const handleComposeCoachFix = useCallback(
    (warning: ComposeCoachWarning) => {
      if (!warning.intentForFix) return;
      void handleGenerate(undefined, {
        sourceContext: {
          source: 'composer',
          title: `compose-coach:${warning.intentForFix}`,
          body: input,
        },
      });
    },
    [handleGenerate, input],
  );

  // Phase 19 — Open loops + send-timing. Both are pure derivations from
  // existing data. The open loop selected for the Daily Brief footnote
  // excludes the currently-selected contact (no point telling the user
  // they are waiting on the contact already loaded in the composer).
  const dailyBriefOpenLoop = useMemo(() => {
    const loops = detectOpenLoops(contactThreads);
    return loops.find(loop => loop.contactId !== selectedContactId) ?? null;
  }, [contactThreads, selectedContactId]);
  const selectedContactPriority = useMemo(
    () => selectedContactThread
      ? contactPriorityRows.find(row => row.thread.id === selectedContactThread.id)?.priority ?? null
      : null,
    [contactPriorityRows, selectedContactThread],
  );
  const focusPlanTasks = useMemo(() => {
    const baseTasks = buildTodayQueueTasks({
      copy,
      unreadMessageCount,
      snippetCount,
      recentRepliesCount: recentReplies.length,
      context: businessContext,
    });
    return [...contactFollowUpTasks, ...insightTasks, ...baseTasks]
      .filter(task => !todayQueue.isDone(task.id) && !todayQueue.isSnoozed(task.id));
  }, [
    businessContext,
    contactFollowUpTasks,
    copy,
    insightTasks,
    recentReplies.length,
    snippetCount,
    todayQueue,
    unreadMessageCount,
  ]);
  const focusPlanUploadPool = useMemo(() => {
    const selectedContactUploads = selectedContactThread
      ? contactUploads.uploadsByContact[selectedContactThread.id] ?? []
      : [];
    return [
      ...composerAttachments.attachmentContext,
      ...selectedContactUploads,
      ...businessUploads.uploads,
    ];
  }, [
    businessUploads.uploads,
    composerAttachments.attachmentContext,
    contactUploads.uploadsByContact,
    selectedContactThread,
  ]);

  const runFollowUpContact = useCallback((contactId: string, prompt: string) => {
    const contact = contactThreads.find(thread => thread.id === contactId);
    if (contact) applySelectedContactId(contact.id, contact, 'reply');
    setWorkMode('reply');
    setRecipientProfileByMode(prev => ({ ...prev, reply: 'existing-client' }));
    setTextType('follow-up');
    setInput(prompt);
    setLastCaptureSource('typed');
    setContactMatchCandidates([]);
    setIsContactConfirmationNeeded(false);
    setActiveMiniScreen(null);
    showHeaderStatusAlert(copy.floating.contactInComposer);
    focusComposer();
  }, [
    applySelectedContactId,
    contactThreads,
    copy.floating.contactInComposer,
    focusComposer,
    setActiveMiniScreen,
    setContactMatchCandidates,
    setInput,
    setIsContactConfirmationNeeded,
    setLastCaptureSource,
    setRecipientProfileByMode,
    setTextType,
    setWorkMode,
    showHeaderStatusAlert,
  ]);

  const focusPlan = useFocusPlan({
    copy,
    contactWithFreshDraft,
    topActionInboxItem,
    reviewUpload: uploadNeedingReview,
    contactNeedingReply,
    selectedContactThread,
    selectedPriority: selectedContactPriority,
    openLoop: dailyBriefOpenLoop,
    contactThreads,
    actionInboxPendingItems: actionInbox.pendingItems,
    uploadPool: focusPlanUploadPool,
    todayTasks: focusPlanTasks,
    closePlan: () => setIsActionCenterOpen(false),
    openPendingDraft,
    handleActionInboxDoNow,
    onReviewUpload: handleReviewUploadFromBrief,
    runSmartReply,
    handleAskForContactDetail,
    onFollowUpContact: runFollowUpContact,
    handleTodayQueueAction,
    openContacts: () => openMiniScreen('contact-threads'),
  });
  const focusPlanItems = focusPlan.items;
  const sendTimingHint = useMemo(() => {
    if (!selectedContactThread) return null;
    return deriveSendTimingHint(selectedContactThread.messages, new Date().getHours());
  }, [selectedContactThread]);

  // Phase 18 — rewrite-mode regenerate. Same source-context channel as
  // auto-soften and compose-coach so we never grow new prompt vocabulary
  // without an explicit contract update. The current generated draft is
  // sent as the body so the prompt builder can ground the rewrite in the
  // existing reply rather than starting blind from the original input.
  const handleRewriteMode = useCallback(
    (mode: RewriteMode) => {
      if (selectedContactThread && generatedMessage.trim()) {
        recordReplyLearning(selectedContactThread.id, {
          kind: 'regenerated',
          preview: generatedMessage,
          textType,
          variantId: selectedVariantId,
        });
      }
      void handleGenerate(undefined, {
        sourceContext: {
          source: 'composer',
          title: mode.sourceTitle,
          body: generatedMessage,
        },
      });
    },
    [generatedMessage, handleGenerate, recordReplyLearning, selectedContactThread, selectedVariantId, textType],
  );

  const draftDisplayLanguage = useMemo((): DraftLanguage => {
    const appDefault: DraftLanguage = resolveLanguage(language) === 'zh' ? 'zh' : 'en';
    return resolveDisplayLanguageForToggle(generatedMessage, appDefault);
  }, [generatedMessage, language]);

  const handleToggleDraftLanguage = useCallback(async () => {
    const trimmed = generatedMessage.trim();
    if (!trimmed || isTranslatingDraft || loading) return;

    const appDefault: DraftLanguage = resolveLanguage(language) === 'zh' ? 'zh' : 'en';
    const currentLang = resolveDisplayLanguageForToggle(trimmed, appDefault);
    const targetLang = targetLanguageForToggle(currentLang);

    const cached = draftLanguageCache[targetLang];
    if (cached?.trim()) {
      applyDraftDisplayUpdate(cached);
      return;
    }

    setIsTranslatingDraft(true);
    try {
      const preserveTerms = collectPreserveTerms({
        prioritizedEntities: [
          selectedContactThread?.name ?? '',
          selectedContactThread?.company ?? '',
        ],
        contactNames,
        businessContext,
        draft: trimmed,
      });
      let translated = await translateGeneratedDraft({
        draft: trimmed,
        targetLanguage: targetLang,
        preserveTerms,
        mode: workMode,
        recipient: activeRecipientSnapshot ?? recipientProfile,
        textType,
        formality,
        warmth,
        urgency,
        confidence,
        businessContext,
      });
      translated = applyBusinessIdentityToGeneratedMessage(translated, {
        businessContext,
        textType,
        formality,
      });
      setDraftLanguageCache(prev => ({
        ...prev,
        [currentLang]: trimmed,
        [targetLang]: translated,
      }));
      applyDraftDisplayUpdate(translated);
    } catch (error) {
      console.warn('Draft translation failed:', error);
      showHeaderStatusAlert(copy.floating.draftTranslateFailed);
    } finally {
      setIsTranslatingDraft(false);
    }
  }, [
    activeRecipientSnapshot,
    applyDraftDisplayUpdate,
    businessContext,
    confidence,
    contactNames,
    draftLanguageCache,
    formality,
    generatedMessage,
    isTranslatingDraft,
    language,
    loading,
    recipientProfile,
    selectedContactThread?.company,
    selectedContactThread?.name,
    showHeaderStatusAlert,
    textType,
    copy.floating.draftTranslateFailed,
    urgency,
    warmth,
    workMode,
  ]);

  const activateSmartSuggestion = useCallback((suggestion: SmartSuggestion) => {
    if (suggestion.kind === 'add-contact') {
      openMiniScreen('contact-threads');
      return;
    }

    if (suggestion.kind === 'quick-scenario' && suggestion.scenarioId) {
      const scenarioLabel = copy.instantAmmo.scenarios[suggestion.scenarioId];
      const metadata = getScenarioById(suggestion.scenarioId);
      if (!scenarioLabel || !metadata) return;
      handleAmmoSelect({
        id: metadata.id,
        emoji: metadata.emoji,
        label: scenarioLabel.label,
        prompt: scenarioLabel.prompt,
        recipient: metadata.recipient,
        textType: metadata.textType,
        workMode: metadata.workMode,
      });
      return;
    }

    if (suggestion.kind === 'paste-message') {
      focusComposer();
      return;
    }

    const intent = suggestionToIntent(suggestion, contactThreads);
    if (intent.kind === 'empty') return;
    handleCmdKIntent(intent);
  }, [contactThreads, copy.instantAmmo.scenarios, focusComposer, handleAmmoSelect, handleCmdKIntent, openMiniScreen]);

  // Referral is intentionally excluded from the action count — the header badge
  // only ever reflects real Focus Plan work, never growth nudges.
  const shouldShowReferralNudge = false;
  const actionCenterCount = focusPlan.actionableCount;
  // The warning button only exists while there is real work to do. Once every
  // item is handled the count hits zero and the button smoothly fades out.
  const shouldShowActionButton = focusPlan.actionableCount > 0;

  useEffect(() => {
    // First mount: mark everything currently surfaced as "seen" so we don't pop a wall of toasts.
    if (!attentionBootstrappedRef.current) {
      attentionBootstrappedRef.current = true;
      if (topActionInboxItem) {
        attentionSeenKeysRef.current.add(`action:${topActionInboxItem.id}`);
      }
      if (contactNeedingReply) {
        attentionSeenKeysRef.current.add(`needs-reply:${contactNeedingReply.id}:${contactNeedingReply.updatedAt}`);
      }
      if (contactWithFreshDraft?.pendingDraft) {
        attentionSeenKeysRef.current.add(`draft:${contactWithFreshDraft.id}:${contactWithFreshDraft.pendingDraft.createdAt}`);
      }
      return;
    }

    if (attentionToast) return;

    if (contactWithFreshDraft?.pendingDraft) {
      const key = `draft:${contactWithFreshDraft.id}:${contactWithFreshDraft.pendingDraft.createdAt}`;
      if (!attentionSeenKeysRef.current.has(key)) {
        presentAttentionToast({
          key,
          title: interpolate(copy.floating.attentionToastDraftReady, { name: contactWithFreshDraft.name }),
          body: copy.floating.attentionToastDraftReadyBody,
          actLabel: copy.floating.attentionToastDraftReadyOpen,
          onAct: () => {
            dismissAttentionToast();
            openPendingDraft(contactWithFreshDraft);
          },
        });
        dispatchDesktopNotification(
          {
            kind: 'draft-ready',
            title: interpolate(copy.floating.notificationDraftReadyTitle, { name: contactWithFreshDraft.name }),
            body: copy.floating.notificationDraftReadyBody,
            contactId: contactWithFreshDraft.id,
            tag: `draft-ready:${contactWithFreshDraft.id}`,
          },
          settings,
        );
        return;
      }
    }

    if (topActionInboxItem) {
      const key = `action:${topActionInboxItem.id}`;
      if (!attentionSeenKeysRef.current.has(key)) {
        presentAttentionToast({
          key,
          title: copy.floating.attentionToastActionWaiting,
          body: topActionInboxItem.body,
          actLabel: copy.floating.attentionToastAct,
          onAct: () => {
            dismissAttentionToast();
            void handleActionInboxDoNow(topActionInboxItem);
          },
        });
        return;
      }
    }

    if (contactNeedingReply) {
      const key = `needs-reply:${contactNeedingReply.id}:${contactNeedingReply.updatedAt}`;
      if (!attentionSeenKeysRef.current.has(key)) {
        const latest = contactNeedingReply.messages.find(m => m.direction === 'inbound') ?? contactNeedingReply.messages[0];
        presentAttentionToast({
          key,
          title: interpolate(copy.floating.attentionToastNeedsReply, { name: contactNeedingReply.name }),
          body: latest?.summary || latest?.text || contactNeedingReply.company || copy.floating.clientFallbackBody,
          actLabel: copy.floating.attentionToastAct,
          onAct: () => {
            dismissAttentionToast();
            applySelectedContactId(contactNeedingReply.id, contactNeedingReply);
            setWorkMode('reply');
            setRecipientProfileByMode(prev => ({ ...prev, reply: 'existing-client' }));
            const latestInboundText = getLatestInboundText(contactNeedingReply);
            if (latestInboundText) {
              setInput(latestInboundText);
              setLastCaptureSource('typed');
              setContactMatchCandidates([]);
              setIsContactConfirmationNeeded(false);
            }
            window.requestAnimationFrame(() => inputTextareaRef.current?.focus());
          },
        });
      }
    }
  }, [
    applySelectedContactId,
    attentionToast,
    contactNeedingReply,
    contactWithFreshDraft,
    copy,
    dismissAttentionToast,
    handleActionInboxDoNow,
    openPendingDraft,
    presentAttentionToast,
    topActionInboxItem,
  ]);

  return (
    <NextStepProvider activeStep={activeNextStep}>
    <div className="animate-fade-in relative h-full w-full overflow-visible text-slate-900">
      <DesktopWindowDragRegion className="z-20 w-[390px] rounded-t-[18px] bg-white" />

      <div className="relative h-full w-full overflow-hidden">
        <MoreFeatures
          open={isMoreFeaturesOpen}
          visible={isMoreFeaturesVisible}
          onClose={() => {
            setIsMoreFeaturesClosing(true);
            setIsMoreFeaturesOpen(false);
            setActiveMiniScreen(null);
          }}
          onQuit={handleQuit}
          onOpenScreen={openMiniScreen}
          usageCount={usageCount}
          unreadMessageCount={unreadMessageCount}
          pendingTodayQueueCount={pendingTodayQueueCount}
          actionInboxCount={pendingActionInboxCount}
          profile={profile}
          copy={copy}
        />

        <div
          ref={panelRootRef}
          className={[
            'relative z-10 h-full bg-white shadow-[0_14px_40px_rgba(15,23,42,0.12)] transition-[border-radius] duration-300 ease-out',
            'w-[390px]',
            isGeneratedModalOpen ? 'overflow-visible' : 'overflow-hidden',
            isMoreFeaturesVisible ? 'rounded-l-[18px] rounded-r-[4px]' : 'rounded-[18px]',
          ].join(' ')}
        >
          <GuidedTourLayer
            copy={copy}
            activeStep={guidedTour.activeStep}
            containerRef={panelRootRef}
            onNext={guidedTour.advance}
            onSkip={guidedTour.skip}
          />
          <CmdKPalette
            open={isCmdKOpen}
            copy={copy}
            contacts={contactThreads}
            suggestions={paletteSuggestions}
            shortcutLabel={cmdKShortcutLabel}
            onClose={() => setIsCmdKOpen(false)}
            onDispatch={handleCmdKIntent}
            onSelectSuggestion={suggestion => {
              setIsCmdKOpen(false);
              activateSmartSuggestion(suggestion);
            }}
          />
          <div className={`flex h-full min-h-0 flex-col ${settings.compactMode ? 'px-3' : 'px-4'}`}>
            <div className={`shrink-0 bg-white ${settings.compactMode ? 'pt-12 pb-2' : 'pt-14 pb-2'}`}>
            <WorkbenchHeader
              copy={copy}
              compactMode={settings.compactMode}
              language={language}
              isLanguageOpen={isLanguageOpen}
              isTextTypeOpen={isTextTypeOpen}
              languageDropdownRef={languageDropdownRef}
              textTypeDropdownRef={textTypeDropdownRef}
              selectedTextTypeLabel={selectedTextTypeLabel}
              textType={textType}
              textTypeOptions={textTypeOptions}
              showActionButton={shouldShowActionButton}
              actionCount={actionCenterCount}
              actionLabel={copy.focusPlan.open}
              showRememberedContextButton={rememberedContextCounts.count > 0 && !isMoreFeaturesVisible && !activeMiniScreen}
              rememberedContextCount={rememberedContextCounts.count}
              rememberedContextHasPendingAction={rememberedContextCounts.hasPendingAction}
              rememberedContextOpen={isRememberedContextOpen}
              rememberedContextLabel={copy.floating.memoryCueButtonAria}
              headerStatusLabel={headerAlertLabel}
              showHeaderStatus={showHeaderAlert}
              onToggleLanguageDropdown={() => {
                setIsLanguageOpen(prev => {
                  const next = !prev;
                  if (next) {
                    setIsTextTypeOpen(false);
                  }
                  return next;
                });
              }}
              onSelectLanguage={value => {
                setLanguage(value);
                setSetting('defaultLanguage', value);
                setIsLanguageOpen(false);
                if (selectedContactId && (value === 'en' || value === 'zh')) {
                  replyLanguage.savePreference(value);
                }
              }}
              onToggleTextTypeDropdown={() => {
                setIsTextTypeOpen(prev => {
                  const next = !prev;
                  if (next) {
                    setIsLanguageOpen(false);
                  }
                  return next;
                });
              }}
              onSelectTextType={value => {
                setTextType(value);
                setIsTextTypeOpen(false);
              }}
              onOpenActions={() => {
                setIsLanguageOpen(false);
                setIsTextTypeOpen(false);
                setActiveMiniScreen(null);
                setIsRememberedContextOpen(false);
                setIsActionCenterOpen(true);
              }}
              onToggleRememberedContext={() => {
                setIsLanguageOpen(false);
                setIsTextTypeOpen(false);
                setActiveMiniScreen(null);
                setIsActionCenterOpen(false);
                setIsRememberedContextOpen(prev => !prev);
              }}
              onToggleMoreFeatures={() => {
                setIsLanguageOpen(false);
                setIsTextTypeOpen(false);
                setIsActionCenterOpen(false);
                setIsRememberedContextOpen(false);
                setIsMoreFeaturesOpen(prev => {
                  const next = !prev;
                  if (!next) {
                    setIsMoreFeaturesClosing(true);
                  }
                  if (!next) {
                    setActiveMiniScreen(null);
                  }
                  return next;
                });
              }}
              recommendedReplyLanguage={replyLanguage.recommendedLanguage}
              showLanguageRecommendation={replyLanguage.recommendationDiffers}
              onApplyLanguageRecommendation={() => {
                const next = replyLanguage.recommendedLanguage;
                setLanguage(next);
                setSetting('defaultLanguage', next);
                if (selectedContactId) {
                  replyLanguage.savePreference(next);
                }
              }}
              detectedIntent={detectedIntent}
              intentChipSuppressed={intentChipSuppressed}
            />
            </div>

            <div className={`clean-scrollbar flex-1 overflow-y-auto overflow-x-hidden ${settings.compactMode ? 'pb-6' : 'pb-8'}`}>
            {!activeMiniScreen && !isMoreFeaturesVisible ? (
              <DailyBriefCard
                primary={commandCenterPrimary}
                loading={loading}
                nextStepHint={activeNextStep === 'pick-contact' ? copy.floating.nextStepPickContactHint : undefined}
                copy={copy}
                openLoop={dailyBriefOpenLoop}
                onSelectOpenLoopContact={handleSelectContactFromThreads}
              />
            ) : null}


            <section className={`mb-2 rounded-[14px] border border-[#f4d7e1] bg-[#fff7fa] ${settings.compactMode ? 'p-2' : 'p-2.5'}`}>
              <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#b85a82]">
                {copy.floating.targetLabel}
              </p>
              <div className={`relative rounded-[10px] bg-white ${settings.compactMode ? 'p-0.5' : 'p-1'}`}>
                <div className="relative grid grid-cols-2 gap-1">
                  {(['reply', 'internal'] as const).map(modeId => (
                    <button
                      key={modeId}
                      type="button"
                      className={[
                        'rounded-[8px] font-semibold transition-colors duration-200',
                        settings.compactMode ? 'px-2 py-1 text-[9px]' : 'px-2.5 py-1.5 text-[10px]',
                        workMode === modeId
                          ? 'bg-[#E85C8B] text-white shadow-[0_4px_10px_rgba(232,92,139,0.25)]'
                          : 'text-slate-600 hover:bg-slate-50',
                      ].join(' ')}
                      onClick={() => handleSelectWorkMode(modeId)}
                    >
                      {copy.workModes[modeId]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1">
                <div className="relative min-w-0 overflow-hidden">
                  {workMode === 'reply' ? (
                    <>
                      <div
                        className={[
                          'pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-gradient-to-r from-[#fff7fa] via-[#fff7fa]/90 to-transparent transition-opacity duration-200',
                          hasLeftRecipientFade ? 'opacity-100' : 'opacity-0',
                        ].join(' ')}
                      />
                      <div
                        className={[
                          'pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-gradient-to-l from-[#fff7fa] via-[#fff7fa]/90 to-transparent transition-opacity duration-200',
                          hasRightRecipientFade ? 'opacity-100' : 'opacity-0',
                        ].join(' ')}
                      />
                    </>
                  ) : null}
                  <div
                    ref={workMode === 'reply' ? recipientScrollRef : undefined}
                    className="clean-scrollbar overflow-x-auto overflow-y-hidden"
                    onScroll={workMode === 'reply' ? updateRecipientFade : undefined}
                  >
                    <div
                      className="flex flex-nowrap items-center gap-1 pr-5"
                      style={{ width: 'max-content' }}
                    >
                      {workMode === 'reply'
                        ? recipientOptions.map(option => (
                          <button
                            key={option.id}
                            type="button"
                            className={[
                              'shrink-0 whitespace-nowrap rounded-full border transition',
                              settings.compactMode ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]',
                              recipientProfile === option.id
                                ? 'border-[#e88ab0] bg-[#fde9f2] text-[#b84f79]'
                                : 'border-[#edd7e0] bg-white text-slate-500 hover:border-[#e7aac2]',
                            ].join(' ')}
                            onClick={() => setRecipientProfileByMode(prev => ({ ...prev, reply: option.id }))}
                          >
                            {copy.recipientLabels[option.id] ?? option.id}
                          </button>
                        ))
                        : null}
                    </div>
                  </div>
                </div>
                <div className="relative min-w-0 overflow-hidden">
                  <div
                    className={[
                      'flex flex-nowrap items-center gap-1',
                      workMode === 'internal' ? 'justify-end' : 'min-h-0',
                    ].join(' ')}
                  >
                    {workMode === 'internal'
                      ? recipientOptions.map(option => (
                        <button
                          key={option.id}
                          type="button"
                          className={[
                            'shrink-0 whitespace-nowrap rounded-full border transition',
                            settings.compactMode ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]',
                            recipientProfile === option.id
                              ? 'border-[#e88ab0] bg-[#fde9f2] text-[#b84f79]'
                              : 'border-[#edd7e0] bg-white text-slate-500 hover:border-[#e7aac2]',
                          ].join(' ')}
                          onClick={() => setRecipientProfileByMode(prev => ({ ...prev, internal: option.id }))}
                        >
                          {copy.recipientLabels[option.id] ?? option.id}
                        </button>
                      ))
                      : null}
                  </div>
                </div>
              </div>
            </section>

            <ComposerPanel
              copy={copy}
              compactMode={settings.compactMode}
              workMode={workMode}
              recipientOptions={recipientOptions}
              recipientProfile={recipientProfile}
              hasLeftRecipientFade={hasLeftRecipientFade}
              hasRightRecipientFade={hasRightRecipientFade}
              recipientScrollRef={recipientScrollRef}
              inputTextareaRef={inputTextareaRef}
              showModeAndRecipient={false}
              contactPicker={
                <ContactPicker
                  copy={copy}
                  threads={contactThreads}
                  selectedContactId={selectedContactId}
                  workMode={workMode}
                  recipientProfile={recipientProfile}
                  onSelectContact={handleSelectContactFromThreads}
                />
              }
              currentModePlaceholder={currentModePlaceholder}
              input={input}
              loading={loading}
              onSelectWorkMode={handleSelectWorkMode}
              onSelectRecipient={value => {
                setRecipientProfileByMode(prev => ({
                  ...prev,
                  [workMode]: value,
                }));
              }}
              onRecipientScroll={updateRecipientFade}
              onInputChange={value => {
                setInput(value);
                setLastCaptureSource(value.trim() ? 'typed' : null);
                if (value.trim().length >= 8) {
                  resolveContactMatches(value);
                } else {
                  setContactMatchCandidates([]);
                }
              }}
              attachments={composerAttachments.attachments}
              attachmentProcessing={composerAttachments.processing}
              onAttachFiles={files => {
                void composerAttachments.attachFiles(files).then(attached => {
                  showHeaderStatusAlert(attached ? copy.floating.attachmentsAdded : copy.floating.attachmentUploadFailed);
                }).catch(() => {
                  showHeaderStatusAlert(copy.floating.attachmentUploadFailed);
                });
              }}
              onRemoveAttachment={composerAttachments.removeAttachment}
              onGenerate={() => {
                void handleGenerate();
              }}
              isMacPlatform={isMacPlatform}
              generateNextStepHint={activeNextStep === 'generate' ? copy.floating.nextStepGenerateHint : undefined}
              coachWarnings={composeCoachWarnings}
              coachSuppressed={composeCoachSuppressed}
              onCoachFix={handleComposeCoachFix}
            />

            {!activeMiniScreen && !isMoreFeaturesVisible && (contactMatchCandidates.length > 0 || isContactConfirmationNeeded) && lastCaptureSource ? (
                  <div className="mt-3 mb-1 rounded-[15px] border border-[#e8d5cd] bg-white/78 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold text-[#725444]">
                        {isContactConfirmationNeeded ? copy.floating.contactMatchConfirmTitle : copy.floating.contactMatchPossibleTitle}
                      </p>
                      <button
                        type="button"
                        className="text-[9px] font-medium text-slate-400 hover:text-slate-600"
                        onClick={() => {
                          setContactMatchCandidates([]);
                          setIsContactConfirmationNeeded(false);
                        }}
                      >
                        {copy.floating.hide}
                      </button>
                    </div>
                    {isContactConfirmationNeeded ? (
                      <p className="mt-1 text-[9px] leading-3 text-slate-500">
                        {copy.floating.contactMatchPausedBody}
                      </p>
                    ) : null}
                    {contactMatchCandidates.length > 0 ? (
                      <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-0.5">
                        {contactMatchCandidates.map(candidate => (
                          <button
                            key={candidate.thread.id}
                            type="button"
                            className={[
                              'min-w-[104px] rounded-[12px] border px-2 py-1.5 text-left transition',
                              selectedContactId === candidate.thread.id
                                ? 'border-[#9f6b52] bg-[#fff4ee] text-[#6d432f]'
                                : 'border-[#eadbd4] bg-white text-slate-600 hover:border-[#d7b7a7]',
                            ].join(' ')}
                            onClick={() => {
                              applySelectedContactId(candidate.thread.id, candidate.thread);
                              setContactMatchCandidates([]);
                              setIsContactConfirmationNeeded(false);
                              void handleGenerate(input, {
                                sourceContext: { source: 'paste-and-generate' },
                                contactThreadOverride: candidate.thread,
                              });
                            }}
                          >
                            <p className="truncate text-[10px] font-semibold">{candidate.thread.name}</p>
                            <p className="mt-0.5 truncate text-[8px] text-slate-400">{candidate.reason}</p>
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {isContactConfirmationNeeded ? (
                      <div className="mt-2 flex gap-1.5">
                        {selectedContactThread ? (
                          <button
                            type="button"
                            className="rounded-full border border-[#d8c1b6] bg-white px-2.5 py-1 text-[9px] font-semibold text-[#6d4a3a] transition hover:border-[#c9a896]"
                            onClick={handleGenerateWithSelectedContact}
                          >
                            {copy.floating.useSelectedContact}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="rounded-full border border-[#eadbd4] bg-white px-2.5 py-1 text-[9px] font-semibold text-[#7d5b4a] transition hover:border-[#d7b7a7]"
                          onClick={() => {
                            savePendingCaptureDraft(input);
                            setContactMatchCandidates([]);
                            setIsContactConfirmationNeeded(false);
                            openMiniScreen('contact-threads');
                          }}
                        >
                          {copy.floating.searchContacts}
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-transparent bg-[#2f241f] px-2.5 py-1 text-[9px] font-semibold text-white transition hover:bg-[#1f1815]"
                          onClick={handleGenerateWithoutContact}
                        >
                          {copy.floating.useWithoutContact}
                        </button>
                      </div>
                    ) : null}
                  </div>
            ) : null}

            {!selectedContactThread && !input.trim() ? (
              <ContextualQuickStart
                title={copy.instantAmmo.title}
                scenarioLabels={copy.instantAmmo.scenarios}
                suggestions={smartSuggestions}
                onSelect={handleAmmoSelect}
                disabled={loading}
              />
            ) : null}

            {proactiveNudge.kind === 'smart-chip' && proactiveNudge.topSuggestion ? (
              <SmartNextChip
                suggestion={proactiveNudge.topSuggestion}
                copy={copy}
                onActivate={activateSmartSuggestion}
                onDismiss={proactiveNudge.dismissSmartChip}
                onAutoHide={proactiveNudge.autoHideSmartChip}
              />
            ) : null}

            {proactiveNudge.kind === 'cmd-k-hint' ? (
              <CmdKHint
                isEligible
                shortcutLabel={cmdKShortcutLabel}
                copy={copy}
                onActivate={() => setIsCmdKOpen(true)}
              />
            ) : null}

            <div className={`flex justify-end ${settings.compactMode ? 'mt-2 mb-2' : 'mt-2.5 mb-2.5'}`}>
              <ToneSparkleButton
                compactMode={settings.compactMode}
                ariaLabel={copy.floating.openToneComposer}
                onClick={() => setIsToneComposeModalOpen(true)}
              />
            </div>

            <div className="h-5 shrink-0" aria-hidden="true" />

            </div>
          </div>
        </div>

        {!activeMiniScreen && !isMoreFeaturesVisible ? (
          <RememberedContextDock
            contact={selectedContactThread}
            copy={copy.floating}
            open={isRememberedContextOpen}
            suppressed={composeCoachSuppressed}
            onOpenChange={setIsRememberedContextOpen}
            onActNow={focusComposer}
            onDismissCommitment={dismissCommitment}
            onUpdateThreadSummary={updateThreadSummary}
          />
        ) : null}

        <MilestoneToast
          rank={activeMilestone}
          rankLabel={activeMilestone ? copy.moreFeatures.rankLabels[activeMilestone] : ''}
          congratulations={copy.milestones.congratulations}
          unlocked={copy.milestones.unlocked}
          onDismiss={() => setActiveMilestone(null)}
        />

        <EmailNewMailToast
          notices={newMailNotices}
          labelNewMail={copy.contactThreads.autoSyncNewMailFrom}
          labelNeedsAction={copy.contactThreads.autoSyncNeedsAction}
          labelReplyNow={copy.contactThreads.autoSyncReplyNow}
          labelDismiss={copy.contactThreads.autoSyncDismiss}
          onSelectContact={contactId => {
            applySelectedContactId(contactId);
          }}
          onDismiss={(contactId) =>
            setNewMailNotices(prev => prev.filter(n => n.contactId !== contactId))
          }
        />

        <div
          className={[
            'pointer-events-none absolute left-1/2 top-[104px] z-[88] w-[342px] -translate-x-1/2 transition-all duration-300 ease-out',
            attentionToast ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0',
          ].join(' ')}
          aria-live="polite"
        >
          {attentionToast ? (
            <div className="pointer-events-auto rounded-[16px] border border-[#f1d7e0] bg-white/96 px-3 py-2.5 shadow-[0_18px_42px_rgba(15,23,42,0.18)] backdrop-blur-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#b85d83]">
                    {attentionToast.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-slate-500">
                    {attentionToast.body}
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-full bg-[#2f2926] px-2.5 py-1 text-[10px] font-semibold text-white transition hover:bg-[#463b35]"
                  onClick={attentionToast.onAct}
                >
                  {attentionToast.actLabel}
                </button>
              </div>
              <button
                type="button"
                className="mt-1 text-[9px] font-medium text-slate-400 hover:text-slate-600"
                onClick={dismissAttentionToast}
              >
                {copy.floating.attentionToastDismiss}
              </button>
            </div>
          ) : null}
        </div>

        <ToneComposeModal
          open={isToneComposeModalOpen}
          copy={copy}
          compactMode={settings.compactMode}
          activeTonePreset={activeTonePreset}
          formality={formality}
          warmth={warmth}
          urgency={urgency}
          showSaveProfile={goldUnlocked}
          savedProfiles={savedToneProfiles}
          onClose={() => setIsToneComposeModalOpen(false)}
          onSelectPreset={handleSelectTonePreset}
          onChangeControl={handleToneControlChange}
          onSaveProfile={handleSaveToneProfile}
          onLoadProfile={handleLoadToneProfile}
          onDeleteProfile={handleDeleteToneProfile}
        />

        {showOnboarding && (
          <OnboardingModal
            copy={copy}
            welcomeName={welcomeFirstName}
            onDismiss={() => {
              if (user?.id) {
                markOnboardingDoneForUser(user.id);
              }
              setShowOnboarding(false);
            }}
          />
        )}

        {isGeneratedModalOpen && (
          <GeneratedReplyModal
            copy={copy}
            isEditingGenerated={isEditingGenerated}
            generatedMessage={generatedMessage}
            contactNames={contactNames}
            basedOnLines={modalBasedOnLines}
            prioritizedEntities={[
              selectedContactThread?.name ?? '',
              selectedContactThread?.company ?? '',
            ]}
            insight={generatedInsight}
            mode={workMode}
            onToggleEditing={() => setIsEditingGenerated(prev => !prev)}
            onClose={() => {
              setIsGeneratedModalOpen(false);
              setIsEditingGenerated(false);
            }}
            onMessageChange={handleGeneratedMessageChange}
            onCopy={() => {
              void handleCopy();
            }}
            onAddToQueue={generatedInsight ? handleAddToQueue : undefined}
            isMacPlatform={isMacPlatform}
            copyNextStepHint={activeNextStep === 'copy' ? copy.floating.nextStepCopyHint : undefined}
            culturalTipKey={activeCulturalTipKey}
            impressionCheck={activeImpressionCheck}
            voiceMatch={activeVoiceMatch}
            whyDetails={activeWhyDetails}
            onAutoSoften={activeImpressionCheck && autoSoftenIntentFor(activeImpressionCheck) ? handleAutoSoften : undefined}
            onRewriteMode={handleRewriteMode}
            loading={loading}
            sendTimingHint={sendTimingHint}
            draftDisplayLanguage={draftDisplayLanguage}
            onToggleDraftLanguage={() => {
              void handleToggleDraftLanguage();
            }}
            isTranslatingDraft={isTranslatingDraft}
          />
        )}

        <HighStakesGuard
          open={isHighStakesGuardOpen}
          copy={copy}
          recipient={activeRecipientSnapshot ?? recipientProfile}
          impression={activeImpressionCheck}
          onCancel={() => setIsHighStakesGuardOpen(false)}
          onConfirm={() => {
            setIsHighStakesGuardOpen(false);
            void performCopy();
          }}
        />

        {isActionCenterOpen && shouldShowActionButton ? (
          <FocusPlanModal
            copy={copy}
            items={focusPlanItems}
            loading={loading}
            onClose={() => setIsActionCenterOpen(false)}
            onRunItem={focusPlan.onRunItem}
          />
        ) : null}

        {isReferralModalOpen && (
          <div className="absolute inset-0 z-[69] flex items-start justify-center bg-[#0f172a]/12 px-3 pt-20">
            <ReferFriends
              onClose={() => setIsReferralModalOpen(false)}
              profile={profile}
              copy={copy}
              compact
            />
          </div>
        )}

        {activeMiniScreen && (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-50 w-[574px]">
            <button
              type="button"
              aria-label={copy.miniScreen.back}
              className={[
                'pointer-events-auto absolute inset-0 transition-opacity duration-200',
                settings.focusMode === 'strong'
                  ? 'bg-[#0f172a]/20 backdrop-blur-[5px]'
                  : 'bg-[#0f172a]/12 backdrop-blur-[3px]',
              ].join(' ')}
              onClick={() => setActiveMiniScreen(null)}
            />
            <div className="pointer-events-auto absolute inset-0 flex items-start justify-center p-4 pb-4 pt-12">
              <MiniScreenHost
                screenId={activeMiniScreen}
                copy={copy}
                onClose={() => setActiveMiniScreen(null)}
                onOpenScreen={openMiniScreen}
                unreadMessageCount={unreadMessageCount}
                snippetCount={snippetCount}
                recentReplies={recentReplies}
                businessContext={businessContext}
                contactFollowUpTasks={contactFollowUpTasks}
                insightTasks={insightTasks}
                onRunTodayTask={handleTodayQueueAction}
                todayQueue={todayQueue}
                contactThreads={contactThreads}
                selectedContactId={selectedContactId}
                onSelectContact={handleSelectContactFromThreads}
                onCreateContact={input => {
                  const nextThread = createContact(input);
                  applySelectedContactId(nextThread.id, nextThread);
                  return nextThread;
                }}
                onRemoveContact={removeContact}
                onAddMessage={(contactId, text) => {
                  addMessageToContact(contactId, thread => buildContactMessageEntry({
                    direction: 'inbound',
                    source: 'paste',
                    text,
                    createdAt: Date.now(),
                    sender: thread.name.trim() || 'Contact',
                    receiver: (profile.displayName || '').trim() || 'You',
                  }));
                }}
                onUpdateChatContext={updateChatContext}
                onSaveMemory={updateContactMemory}
                onSaveAndCompose={(contactId, text) => {
                  applySelectedContactId(contactId);
                  setInput(text);
                }}
                inputTextareaRef={inputTextareaRef}
                actionInbox={actionInbox}
                onActionInboxDoNow={handleActionInboxDoNow}
                settings={settings}
                profile={profile}
                onToggleSetting={toggleSetting}
                onSetSetting={setSetting}
                onSetProfileField={setProfileField}
                onApplyChatContextUpdates={applyChatContextUpdates}
                productAnnouncements={productAnnouncements}
                readMessageIds={readMessageIds}
                onMarkMessageRead={handleMarkMessageRead}
                productAnnouncementsLoading={productAnnouncementsLoading}
                onUseComposerText={setInput}
                onSetBusinessContextField={setBusinessContextField}
                onSmartReply={runSmartReply}
                onReplayTour={guidedTour.restart}
              />
            </div>
          </div>
        )}
      </div>
    </div>
    </NextStepProvider>
  );
}
