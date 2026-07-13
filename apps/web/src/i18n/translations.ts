export type AppLanguage = 'auto' | 'en' | 'zh';
export type ResolvedLanguage = 'en' | 'zh';

type WorkMode = 'reply' | 'internal';

type TranslationBundle = {
  languageOptions: Array<{ value: AppLanguage; label: string }>;
  textTypes: Array<{ id: string; label: string }>;
  workModes: Record<WorkMode, string>;
  recipientLabels: Record<string, string>;
  tonePresetLabels: Record<'executive' | 'friendly' | 'urgent' | 'casual', string>;
  toneControlLabels: {
    composer: string;
    formality: string;
    warmth: string;
    urgency: string;
    confidence: string;
  };
  rankUnlocks: {
    confidenceHint: string;
    saveToneProfile: string;
    savedProfiles: string;
    noSavedProfiles: string;
    mirrorMode: string;
    mirrorModeDesc: string;
    profileSaved: string;
    silverHint: string;
    goldHint: string;
    platinumHint: string;
  };
  placeholders: {
    reply: string;
    internal: string;
  };
  floating: {
    openMoreFeatures: string;
    pasteAndGo: string;
    pasteAndGenerate: string;
    attachFiles: string;
    attachmentsAdded: string;
    attachmentUploadFailed: string;
    uploadLimitReached: string;
    removeLastLearningFileTitle: string;
    removeLastLearningFileBody: string;
    removeLastLearningFileConfirm: string;
    removeLastLearningFileKeep: string;
    removeLastLearningFileAction: string;
    generate: string;
    generating: string;
    generateShortcut: string;
    repliesOne: string;
    repliesMany: string;
    dayShort: string;
    copiedToClipboard: string;
    copiedGeneratedReply: string;
    /** When a contact thread is selected; {{name}} = contact name */
    copiedGeneratedReplySavedToContact: string;
    autoCopied: string;
    autoCopiedSavedToContact: string;
    systemSnapshotTitle: string;
    systemSnapshotSummary: string;
    systemSnapshotPreferred: string;
    systemSnapshotRefresh: string;
    systemSnapshotChecking: string;
    /** Single-line home nudge for top Action Inbox item */
    nextUpLabel: string;
    openActionCenter: string;
    closeActionCenter: string;
    dailyBriefLabel: string;
    justNow: string;
    minutesAgoShort: string;
    hoursAgoShort: string;
    daysAgoShort: string;
    actionsWaitingOne: string;
    actionsWaitingMany: string;
    needsYourReply: string;
    activeClient: string;
    clientFallbackBody: string;
    memoryCueTitle: string;
    memoryCueCommitment: string;
    memoryCueLearning: string;
    memoryCueExpandAria: string;
    memoryCueCollapseAria: string;
    memoryCueBasedOnMessages: string;
    memoryCueOpenCommitmentsHeading: string;
    memoryCueThreadSummaryHeading: string;
    memoryCueReplyLearningHeading: string;
    memoryCueDoneAria: string;
    memoryCueEditAria: string;
    memoryCueSaveLabel: string;
    memoryCueCancelLabel: string;
    memoryCueSummaryPlaceholder: string;
    memoryCueKindPromise: string;
    memoryCueKindNeedsReply: string;
    memoryCueKindAccepted: string;
    memoryCueKindEdited: string;
    memoryCueKindRegenerated: string;
    memoryCueButtonAria: string;
    memoryCueStackClose: string;
    memoryCueGuideHeading: string;
    memoryCueActReply: string;
    memoryCueActFollowUp: string;
    memoryCueDoneLabel: string;
    memoryCueLearnedHeading: string;
    actionInboxContactReason: string;
    actionInboxPriorityReason: string;
    latestInboundReason: string;
    selectedClientReason: string;
    draftReadyReason: string;
    addDetailReason: string;
    followUpReason: string;
    reviewFileTitle: string;
    reviewFileBody: string;
    reviewFileCta: string;
    reviewFileReason: string;
    reviewFileHeader: string;
    addDetailMicroAsk: string;
    addDetailMicroAskCta: string;
    addDetailHeader: string;
    clearTitle: string;
    clearBody: string;
    clearReason: string;
    reviewContactsCta: string;
    replyNow: string;
    useContact: string;
    addDetailCta: string;
    followUpCta: string;
    contactInComposer: string;
    startClientMemoryTitle: string;
    startClientMemoryBody: string;
    startClientMemoryReason: string;
    addContact: string;
    referralNudgeTitle: string;
    referralNudgeBody: string;
    referralNudgeInvite: string;
    referralNudgeDismiss: string;
    commandNeedsReply: string;
    commandWaiting: string;
    commandCaptured: string;
    commandDrafts: string;
    contactMatchConfirmTitle: string;
    contactMatchPossibleTitle: string;
    hide: string;
    contactMatchPausedBody: string;
    searchContacts: string;
    useSelectedContact: string;
    useWithoutContact: string;
    commandCapture: string;
    commandContacts: string;
    commandQueue: string;
    commandReplies: string;
    addFollowUp: string;
    addedToQueue: string;
    /** Accessible label for tone sparkle button (no visible text) */
    openToneComposer: string;
    toneComposerModalTitle: string;
    toneComposerModalSubtitle: string;
    toneComposerDone: string;
    toneComposerClose: string;
    targetLabel: string;
    attentionToastNeedsReply: string;
    attentionToastActionWaiting: string;
    attentionToastNewMail: string;
    attentionToastDraftReady: string;
    attentionToastDraftReadyBody: string;
    attentionToastDraftReadyOpen: string;
    attentionToastAct: string;
    attentionToastDismiss: string;
    cmdKPlaceholder: string;
    cmdKHintLabel: string;
    cmdKHintDismiss: string;
    cmdKEmptyState: string;
    cmdKActionOpenContact: string;
    cmdKActionDraftReply: string;
    cmdKActionFollowUp: string;
    cmdKActionUseAsMessage: string;
    cmdKShortcutMac: string;
    cmdKShortcutWin: string;
    cmdKForYouLabel: string;
    cmdKSuggestReply: string;
    cmdKSuggestFollowUp: string;
    cmdKSuggestResume: string;
    cmdKSuggestPaste: string;
    smartChipReplyTo: string;
    smartChipFollowUp: string;
    smartChipResume: string;
    smartChipPaste: string;
    smartChipDismiss: string;
    dailyBriefMorning: string;
    dailyBriefAfternoon: string;
    nextStepPickContactHint: string;
    nextStepGenerateHint: string;
    nextStepCopyHint: string;
    smartReplyLabel: string;
    smartReplyShort: string;
    smartReplyHint: string;
    openDraft: string;
    draftReadyEyebrow: string;
    draftReadyBody: string;
    smartReplyUnavailable: string;
    replyInEn: string;
    replyInZh: string;
    draftTranslateFailed: string;
    languageRecommendChip: string;
    languageRecommendApply: string;
    languageRecommendTitle: string;
    culturalTipEyebrow: string;
    culturalTipZhToEnProspect: string;
    culturalTipZhToEnVip: string;
    culturalTipZhToEnDefault: string;
    culturalTipEnToZhDefault: string;
    culturalTipEnToZhLeader: string;
    culturalTipMixedClarity: string;
    culturalTipPolishEnglish: string;
    impressionCheckTitle: string;
    impressionFormalityLabel: string;
    impressionToneLabel: string;
    impressionLengthLabel: string;
    impressionStatusOk: string;
    impressionStatusWarn: string;
    impressionAutoSoften: string;
    impressionReasonFormalityTooCasualForVip: string;
    impressionReasonFormalityTooCasualForLeader: string;
    impressionReasonFormalityTooStiffForCasual: string;
    impressionReasonToneAggressive: string;
    impressionReasonTonePassive: string;
    impressionReasonToneOverpromise: string;
    impressionReasonLengthTooBrief: string;
    impressionReasonLengthTooLong: string;
    voiceMatchLearning: string;
    voiceMatchSimilar: string;
    voiceMatchDifferent: string;
    voiceMatchUnknown: string;
    voiceMatchSampleCount: string;
    highStakesGuardEyebrow: string;
    highStakesGuardTitleVip: string;
    highStakesGuardTitleLeader: string;
    highStakesGuardBody: string;
    highStakesGuardConfirm: string;
    highStakesGuardCancel: string;
    whyExpandLabel: string;
    whyCollapseLabel: string;
    whyDetailLatestMessage: string;
    whyDetailRelationshipMemory: string;
    whyDetailBusinessContext: string;
    whyDetailYourInput: string;
    whyDetailRecentTimeline: string;
    whyDetailAttachments: string;
    whyDetailNothingGrounded: string;
    notificationNewMailTitle: string;
    notificationNewMailBody: string;
    notificationDraftReadyTitle: string;
    notificationDraftReadyBody: string;
    coach: {
      eyebrow: string;
      missingAsk: string;
      confrontational: string;
      tooLong: string;
      allCaps: string;
      fix: string;
      dismiss: string;
    };
  };
  focusPlan: {
    eyebrow: string;
    title: string;
    open: string;
    close: string;
    rankNow: string;
    rankNext: string;
    rankLater: string;
    whereLabel: string;
    whenLabel: string;
    estimateMinutes: string;
    whenNow: string;
    whenNext: string;
    whenToday: string;
    whenBeforeDrafting: string;
    whenWhenReady: string;
    whenAround: string;
    clockTime: string;
    timeAm: string;
    timePm: string;
    whereDraft: string;
    whereActionInbox: string;
    whereComposer: string;
    whereBusinessContext: string;
    whereContactMemory: string;
    whereTodayQueue: string;
    whereContacts: string;
    draftTitle: string;
    draftBody: string;
    replyTitle: string;
    detailTitle: string;
    followUpTitle: string;
    openLoopTitle: string;
    openLoopBody: string;
    todayTaskReason: string;
    promiseTitle: string;
    promiseReason: string;
  };
  modal: {
    title: string;
    subtitle: string;
    confidenceReadyVoice: string;
    confidenceReview: string;
    confidenceVoiceOff: string;
    confidenceThin: string;
    editReply: string;
    doneEditing: string;
    suggestedNamesLabel: string;
    close: string;
    copyReply: string;
    copySubject: string;
    insertSubject: string;
    subjectInserted: string;
    subjectCopied: string;
    subjectPrefix: string;
    intelligenceTitle: string;
    intelligenceSubtitle: string;
    riskTypeLabel: string;
    intentLabel: string;
    subjectLineLabel: string;
    nextActionLabel: string;
    followUpLabel: string;
    basedOnTitle: string;
    basedOnLatestMessage: string;
    basedOnRelationshipMemory: string;
    basedOnBusinessContext: string;
    basedOnYourInput: string;
    basedOnRecentTimeline: string;
    basedOnAttachments: string;
    basedOnLimitedContext: string;
    lowRisk: string;
    mediumRisk: string;
    highRisk: string;
  };
  generatedOutput: {
    replyContext: string;
    internalContext: string;
    summaryLine: string;
    footer: string;
  };
  auth: {
    signInTitle: string;
    signInSubtitle: string;
    signInAction: string;
    signUpTitle: string;
    signUpSubtitle: string;
    signUpAction: string;
    emailLabel: string;
    passwordLabel: string;
    confirmPasswordLabel: string;
    nameLabel: string;
    newPasswordLabel: string;
    forgotPassword: string;
    forgotPasswordTitle: string;
    forgotPasswordSubtitle: string;
    resetPassword: string;
    resetEmailSent: string;
    changePasswordTitle: string;
    changePasswordSubtitle: string;
    changePasswordAction: string;
    verifyEmailTitle: string;
    verifyEmailBody: string;
    backToSignIn: string;
    createAccount: string;
    signOut: string;
    welcomeBack: string;
    welcomeName: string;
    passwordUpdated: string;
    working: string;
    showPassword: string;
    hidePassword: string;
    weakPasswordHint: string;
    strongPasswordHint: string;
    passwordsMatchHint: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
    signInLink: string;
    signUpLink: string;
    needHelp: string;
    verifyEmailSentTo: string;
    verifyEmailMissingEmail: string;
    resendIn: string;
    resendLink: string;
    resendResetLink: string;
    resendSuccess: string;
    resendTooSoon: string;
    errors: {
      required: string;
      invalidCredentials: string;
      emailNotConfirmed: string;
      weakPassword: string;
      passwordMismatch: string;
      generic: string;
      invalidEmail: string;
      invalidFullName: string;
    };
  };
  settings: {
    frameLabel: string;
    frameTitle: string;
    autoCopyTitle: string;
    autoCopyDesc: string;
    compactModeTitle: string;
    compactModeDesc: string;
    focusModeTitle: string;
    focusModeDesc: string;
    focusModeSoft: string;
    focusModeStrong: string;
    lazyModeTitle: string;
    lazyModeDesc: string;
    highStakesGuardTitle: string;
    highStakesGuardDesc: string;
    nativeNotificationsTitle: string;
    nativeNotificationsDesc: string;
    quietHoursTitle: string;
    quietHoursDesc: string;
    quietHoursStartLabel: string;
    quietHoursEndLabel: string;
    defaultLanguageTitle: string;
    defaultLanguageDesc: string;
    profileEditorTitle: string;
    profileEditorDesc: string;
    displayNameLabel: string;
    userIdLabel: string;
    referralCodeLabel: string;
    editDisplayName: string;
    done: string;
    cancel: string;
    copyReferralCode: string;
    nameLimitLabel: string;
    displayNamePlaceholder: string;
    userIdPlaceholder: string;
    referralCodePlaceholder: string;
    profileTitle: string;
    profileDesc: string;
    aiProviderTitle: string;
    aiProviderDesc: string;
    syncedServersTitle: string;
    syncedServersDesc: string;
    /** One line under sync card: local-first vs what sync does */
    syncPrivacyFootnote: string;
    /** Single muted line; avoid extra UI chrome */
    keyboardHintsFootnote: string;
    accountTitle: string;
    accountDesc: string;
    accountEmailLabel: string;
    changePassword: string;
    signOut: string;
  };
  accountSettings: {
    frameLabel: string;
    frameTitle: string;
    profileSection: string;
    accountSection: string;
    sessionSection: string;
    dangerSection: string;
    profileDetails: string;
    phoneNumber: string;
    phoneNotSet: string;
    phonePlaceholder: string;
    phoneNationalPlaceholder: string;
    phoneSearchPlaceholder: string;
    phoneSelectCountry: string;
    phoneNoResults: string;
    phoneInvalid: string;
    phoneTooShort: string;
    phoneEmpty: string;
    phoneNonsense: string;
    phoneLooksValid: string;
    phoneSaveFailed: string;
    changePassword: string;
    signOut: string;
    deleteAccount: string;
    edit: string;
    save: string;
    emailLabel: string;
    openAccountSettings: string;
    signOutConfirmTitle: string;
    signOutConfirmBody: string;
  };
  deleteAccount: {
    frameLabel: string;
    frameTitle: string;
    body: string;
    acknowledgeLabel: string;
    confirmButton: string;
    working: string;
    success: string;
    errorGeneric: string;
    errorOffline: string;
  };
  moreFeatures: {
    copied: string;
    workMenuTitle: string;
    secondaryMenuTitle: string;
    menuLabels: Record<string, string>;
    rankLabels: {
      starter: string;
      silver: string;
      gold: string;
      platinum: string;
    };
    repliesGenerated: string;
    userIdLabel: string;
    copyUserId: string;
    renew: string;
    renewChecking: string;
    renewLatestTitle: string;
    renewLatestBody: string;
    quit: string;
    version: string;
    toNextRank: string;
    maxRank: string;
  };
  messages: {
    frameLabel: string;
    frameTitle: string;
    show: string;
    hide: string;
    read: string;
    unread: string;
    /** One line: announcements vs main composer / contact-grounded drafting */
    companionNote: string;
    focusHint: string;
    loading: string;
    emptyTitle: string;
    emptyBody: string;
  };
  customerService: {
    frameLabel: string;
    frameTitle: string;
    cardTitle: string;
    cardBody: string;
    faqTitle: string;
    faqSearchPlaceholder: string;
    faqEmpty: string;
    faqItems: Array<{ id: string; question: string; answer: string }>;
    authHelpMoreHint: string;
    stillNeedHelpTitle: string;
    stillNeedHelpBody: string;
    formNameLabel: string;
    formPhoneLabel: string;
    formEmailLabel: string;
    formIssueLabel: string;
    formIssuePlaceholder: string;
    formMessageLabel: string;
    formMessageCounter: string;
    formSubmit: string;
    formSubmitting: string;
    errorNameRequired: string;
    errorEmailInvalid: string;
    errorIssueRequired: string;
    errorMessageRequired: string;
    errorMessageTooLong: string;
    errorPhoneInvalid: string;
    formSuccessTitle: string;
    formSuccessBody: string;
    formErrorGeneric: string;
    formErrorOffline: string;
    issueCategories: {
      'account-auth': string;
      'contacts-memory': string;
      'reply-generation': string;
      'email-sync': string;
      'desktop-app': string;
      'notifications': string;
      'billing-account': string;
      'data-privacy': string;
      other: string;
    };
  };
  referFriends: {
    frameLabel: string;
    frameTitle: string;
    heroTitle: string;
    heroBody: string;
    referralCodeTitle: string;
    copyReferralCode: string;
    copiedToClipboard: string;
    inviteFriends: string;
    inviteCopied: string;
    inviteMessage: string;
    offers: Array<{ title: string; desc: string }>;
    emptyRewards: string;
  };
  recentReplies: {
    frameLabel: string;
    frameTitle: string;
    emptyText: string;
    reuseInInput: string;
    searchPlaceholder: string;
    noResults: string;
    modeLabels: Record<'reply' | 'internal', string>;
    variantLabels: Record<'short' | 'balanced' | 'persuasive', string>;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
  };
  contactThreads: {
    frameLabel: string;
    frameTitle: string;
    intro: string;
    selectedLabel: string;
    manageLabel: string;
    emptyTitle: string;
    emptyBody: string;
    nameLabel: string;
    namePlaceholder: string;
    companyLabel: string;
    companyPlaceholder: string;
    emailPlaceholder: string;
    stageLabel: string;
    notesLabel: string;
    notesPlaceholder: string;
    pendingCaptureHint: string;
    addContactAction: string;
    createContact: string;
    openContact: string;
    useContact: string;
    selectedContact: string;
    removeContact: string;
    removeContactTitle: string;
    removeContactConfirm: string;
    removeContactAction: string;
    unassigned: string;
    pickerPlaceholder: string;
    searchPlaceholder: string;
    internalSearchPlaceholder: string;
    clearSelectionLabel: string;
    noSearchResults: string;
    contactFilterLabel: string;
    contactFilterNeedsAction: string;
    contactFilterAll: string;
    contactFilterNeedsActionEmptyTitle: string;
    contactFilterNeedsActionEmptyBody: string;
    priorityStripTitle: string;
    priorityStripBody: string;
    priorityStripReviewAction: string;
    priorityRiskActionNow: string;
    priorityRiskDueToday: string;
    priorityRiskWatchlist: string;
    priorityLastActivity: string;
    priorityNoActivity: string;
    morningFocusTitle: string;
    morningFocusEta: string;
    markDoneAction: string;
    snoozeUntilTomorrow: string;
    useContactActionShort: string;
    focusDoneState: string;
    focusSnoozedState: string;
    dailyImpactFooter: string;
    contactInsightsTitle: string;
    messagesFromCountLabel: string;
    messagesToCountLabel: string;
    chatTypeLabel: string;
    lastReceivedLabel: string;
    lastSentLabel: string;
    noLastReceived: string;
    noLastSent: string;
    callToActionLabel: string;
    callToActionReply: string;
    callToActionFollowUp: string;
    priorityReasonLabel: string;
    priorityReasons: Record<string, string>;
    sourcePasteLabel: string;
    sourceEmailSyncLabel: string;
    sourceManualNoteLabel: string;
    sourceGeneratedReplyLabel: string;
    replyCount: string;
    messageCount: string;
    lastReplyNone: string;
    lastReplyToday: string;
    lastReplyDays: string;
    chatContextLabel: string;
    chatContextPlaceholder: string;
    chatContextSave: string;
    chatContextSaved: string;
    chatContextHint: string;
    addChatContext: string;
    chatHubTitle: string;
    chatHubSubtitle: string;
    chatHubOpenButton: string;
    chatHubFilterLabel: string;
    chatHubAllContacts: string;
    chatHubTimelineEmpty: string;
    chatHubAllNotesHint: string;
    chatContextExtraLabel: string;
    chatHubPerContactAction: string;
    /** Main chat hub: saves nothing, closes modal */
    chatHubSaveAndClose: string;
    /** Opened from a card but thread row is gone */
    chatHubContactUnavailable: string;
    chatExtraNotesScreenSubtitle: string;
    emailSyncTitle: string;
    syncServersLabel: string;
    syncServerEmail: string;
    syncServerDingTalk: string;
    syncServerWeChat: string;
    syncServerWhatsApp: string;
    syncServerTelegram: string;
    syncGuides: Record<'email' | 'dingtalk' | 'wechat' | 'whatsapp' | 'telegram', {
      title: string;
      continueLabel: string;
      steps: string[];
    }>;
    syncServerComingSoonSuffix: string;
    syncServerComingSoonBody: string;
    emailSyncHint: string;
    emailSyncAction: string;
    emailSyncRunning: string;
    emailSyncDiagnosticsRunning: string;
    emailSyncDiagnosticsSuccess: string;
    autoSyncNewMailFrom: string;
    autoSyncReplyNow: string;
    autoSyncDismiss: string;
    autoSyncNeedsAction: string;
    autoSyncActionCardTitle: string;
    autoSyncActionCardBody: string;
    autoSyncAttentionTitle: string;
    autoSyncAttentionBody: string;
    autoSyncReplyPrompt: string;
    emailSyncReady: string;
    emailSyncConnectedTitle: string;
    emailSyncConnectedAs: string;
    emailSyncConnectedBody: string;
    emailSyncReconnectHint: string;
    emailSyncNowAction: string;
    emailSyncUseAnotherEmail: string;
    emailSyncDisconnect: string;
    emailSyncDisconnected: string;
    emailSyncApplied: string;
    emailSyncFailed: string;
    emailSyncNeedContactEmail: string;
    emailSyncSummary: string;
    emailHostPlaceholder: string;
    emailUsernamePlaceholder: string;
    emailPasswordPlaceholder: string;
    emailShowPassword: string;
    emailHidePassword: string;
    emailSyncPasswordHintGeneric: string;
    emailSyncPasswordHintAppPassword: string;
    emailSyncPasswordHintChinaCode: string;
    emailSyncErrorInvalidEmail: string;
    emailSyncErrorAddressMissing: string;
    emailSyncErrorCodeMissing: string;
    emailSyncErrorProviderMismatch: string;
    emailSyncErrorAuth: string;
    emailSyncErrorServer: string;
    emailSyncErrorTimeout: string;
    emailSyncErrorGeneric: string;
    emailProviderHelpTitle: string;
    emailProviderHelpGeneric: string;
    emailProviderHelpItems: Record<'qq' | '163' | '126' | 'sina' | 'sohu' | 'gmail' | 'outlook' | 'yahoo' | 'icloud' | 'aol' | 'zoho', string>;
    emailSinceDaysLabel: string;
    emailMaxMessagesLabel: string;
    socialSyncNoContacts: string;
    socialSyncTargetContact: string;
    socialSyncTargetRequired: string;
    socialSyncSummary: string;
    socialSyncWebhookEndpoint: string;
    socialSyncGenericFailed: string;
    telegramSyncHint: string;
    telegramBotTokenPlaceholder: string;
    telegramChatIdPlaceholder: string;
    telegramSyncAction: string;
    telegramBotTokenRequired: string;
    dingTalkSyncHint: string;
    dingTalkAppKeyPlaceholder: string;
    dingTalkSyncCodePlaceholder: string;
    dingTalkSyncAction: string;
    dingTalkAppKeyRequired: string;
    dingTalkSyncCodeRequired: string;
    dingTalkConnectedHint: string;
    dingTalkReconnectHint: string;
    dingTalkWebhookPath: string;
    whatsAppSyncHint: string;
    whatsAppPhoneNumberIdPlaceholder: string;
    whatsAppSyncCodePlaceholder: string;
    whatsAppSyncAction: string;
    whatsAppPhoneNumberIdRequired: string;
    whatsAppSyncCodeRequired: string;
    whatsAppWebhookPath: string;
    weChatNoApiTitle: string;
    weChatNoApiBody: string;
    weChatPasteTitle: string;
    weChatPasteBody: string;
    weChatWorkSectionTitle: string;
    weChatWorkSectionBody: string;
    weChatSyncHint: string;
    weChatWorkspaceIdPlaceholder: string;
    weChatSyncCodePlaceholder: string;
    weChatSyncAction: string;
    weChatWorkspaceIdRequired: string;
    weChatSyncCodeRequired: string;
    weChatWebhookPath: string;
    smartCaptureTitle: string;
    smartCaptureHintPrefix: string;
    smartCaptureHintSuffix: string;
    smartCaptureAction: string;
    smartCaptureCollapsed: string;
    smartCapturePlaceholder: string;
    messageFromLabel: string;
    messagesLabel: string;
    expandMessageAria: string;
    collapseMessageAria: string;
    pasteFromClipboard: string;
    saveInboundMessage: string;
    saveAndCompose: string;
    captureSaved: string;
    captureError: string;
    capturedTimelineTitle: string;
    capturedTimelineEmpty: string;
    timelineInbound: string;
    timelineOutbound: string;
    timelineNote: string;
    /** Shown on chat hub timeline rows; placeholders {sender}, {receiver} */
    timelinePartiesLine: string;
    memoryPanelTitle: string;
    memoryPanelSubtitle: string;
    memoryRolePlaceholder: string;
    memoryTopicsPlaceholder: string;
    memoryNotesPlaceholder: string;
    memoryStyleLabel: string;
    memoryStyleFormal: string;
    memoryStyleWarm: string;
    memoryStyleDirect: string;
    memoryStyleConcise: string;
    memorySave: string;
    companyFilesTitle: string;
    companyFilesHint: string;
    waitingOnYouLabel: string;
    waitingOnThemLabel: string;
    /** Body when synced email is waiting for outbound reply */
    syncedEmailNeedsReplyBody: string;
    syncedEmailNeedsReplyIntent: string;
    waitingOnYouBody: string;
    waitingOnThemBody: string;
    waitingOnThemFallback: string;
    followUpTaskPrompt: string;
    promiseCheckTaskPrompt: string;
    insightFollowUpPrompt: string;
    followUpTaskTitle: string;
    followUpTaskBody: string;
    wizardStepCount: string;
    wizardNext: string;
    wizardBack: string;
    wizardSkipForNow: string;
    wizardSaveAndFinish: string;
    wizardStep1Title: string;
    wizardStep1Description: string;
    wizardStep2Title: string;
    wizardStep2Description: string;
    wizardStep3Title: string;
    wizardStep3Description: string;
    wizardStep4Title: string;
    wizardStep4Description: string;
    wizardRoleLabel: string;
    wizardRolePlaceholder: string;
    wizardCommunicationStyleLabel: string;
    wizardCommunicationStyleNone: string;
    wizardPreferredLanguageLabel: string;
    wizardPreferredLanguageAuto: string;
    wizardPreferredLanguageEn: string;
    wizardPreferredLanguageZh: string;
    wizardDosAndDontsLabel: string;
    wizardDosAndDontsPlaceholder: string;
    stageLabels: Record<'new-lead' | 'active-client' | 'vip-client' | 'follow-up' | 'closed' | 'internal', string>;
  };
  snippetLibrary: {
    frameLabel: string;
    frameTitle: string;
    addSnippet: string;
    searchPlaceholder: string;
    noResults: string;
    titlePlaceholder: string;
    textPlaceholder: string;
    save: string;
    cancel: string;
    insertIntoInput: string;
    deleteSnippet: string;
    removeSnippetTitle: string;
    removeSnippetConfirm: string;
    removeSnippetAction: string;
    defaultSnippets: Array<{ id: string; title: string; text: string }>;
  };
  resetData: {
    frameLabel: string;
    frameTitle: string;
    intro: string;
    selectAll: string;
    clearSelection: string;
    reviewReset: string;
    keepNote: string;
    confirmTitle: string;
    confirmBody: string;
    confirmAcknowledge: string;
    confirmAction: string;
    successMessage: string;
    domains: Record<
      'contacts' | 'workContext' | 'draftMemory' | 'queues' | 'companionSignals',
      { title: string; description: string }
    >;
  };
  miniScreen: {
    back: string;
  };
  businessContext: {
    frameLabel: string;
    frameTitle: string;
    intro: string;
    editHint: string;
    done: string;
    cancel: string;
    yourNameLabel: string;
    yourNamePlaceholder: string;
    companyNameLabel: string;
    companyNamePlaceholder: string;
    yourPositionLabel: string;
    yourPositionPlaceholder: string;
    industryLabel: string;
    industryPlaceholder: string;
    productsServicesLabel: string;
    productsServicesPlaceholder: string;
    brandVoiceLabel: string;
    brandVoicePlaceholder: string;
    commonObjectionsLabel: string;
    commonObjectionsPlaceholder: string;
    doNotSayLabel: string;
    doNotSayPlaceholder: string;
    companyFilesTitle: string;
    companyFilesHint: string;
  };
  todayQueue: {
    frameLabel: string;
    frameTitle: string;
    intro: string;
    taskLabel: string;
    useNow: string;
    snooze: string;
    markDone: string;
    estMinutes: string;
    dailyImpactSummary: string;
    emptyTitle: string;
    emptyBody: string;
    celebrateTitle: string;
    celebrateBody: string;
    clearUnreadTitle: string;
    clearUnreadBody: string;
    followUpTitle: string;
    followUpBody: string;
    warmupTitle: string;
    warmupBody: string;
    enrichContextTitle: string;
    enrichContextBody: string;
    buildSnippetsTitle: string;
    buildSnippetsBody: string;
    followUpPrompt: string;
    warmupPrompt: string;
  };
  actionInbox: {
    frameLabel: string;
    frameTitle: string;
    intro: string;
    createdLabel: string;
    completedLabel: string;
    completionRateLabel: string;
    emptyTitle: string;
    emptyBody: string;
    highRisk: string;
    mediumRisk: string;
    lowRisk: string;
    priorityLabel: string;
    followUpLabel: string;
    doNow: string;
    defer: string;
    delegate: string;
    removeActionTitle: string;
    removeActionConfirm: string;
    removeActionButton: string;
  };
  systemHealth: {
    frameLabel: string;
    frameTitle: string;
    intro: string;
    preferredProvider: string;
    lastChecked: string;
    refresh: string;
    refreshing: string;
    errorPrefix: string;
    configured: string;
    latency: string;
    model: string;
    reason: string;
    yes: string;
    no: string;
    empty: string;
  };
  instantAmmo: {
    title: string;
    scenarios: Record<string, { label: string; prompt: string }>;
  };
  milestones: {
    congratulations: string;
    unlocked: string;
  };
  weeklyRecap: {
    frameLabel: string;
    frameTitle: string;
    /** Short subtitle under the screen title */
    introLine: string;
    thisWeek: string;
    repliesLabel: string;
    streakLabel: string;
    timeSavedLabel: string;
    timeSavedUnit: string;
    topRecipientLabel: string;
    needsReplyLabel: string;
    followUpsDueLabel: string;
    noDataTitle: string;
    noDataBody: string;
    days: string[];
    queueSparklineLabel: string;
  };
  noAppData: {
    title: string;
    body: string;
    contactsHint: string;
    contactsLead: string;
    workContextHint: string;
    workContextLead: string;
  };
  onboarding: {
    next: string;
    getStarted: string;
    skip: string;
    hotkeyKeysMac: string[];
    hotkeyKeysWin: string[];
    rankThresholds: string[];
    quickStartPreview: string[];
    steps: Array<{ title: string; body: string; hint?: string }>;
  };
  guidedTour: {
    next: string;
    finish: string;
    skip: string;
    stepCount: string;
    sampleContactName: string;
    sampleContactCompany: string;
    sampleContactRole: string;
    sampleContactNotes: string;
    sampleContactRelationshipNotes: string;
    sampleContactPreferredLanguage: string;
    sampleInboundText: string;
    steps: Record<'daily-brief' | 'add-contact' | 'quick-start' | 'cmd-k', {
      title: string;
      body: string;
    }>;
    replayTitle: string;
    replayDescription: string;
    replayButton: string;
  };
  relationshipMemory: {
    eyebrow: string;
    repliesWithinMinutes: string;
    repliesWithinHours: string;
    repliesWithinOneDay: string;
    repliesWithinDays: string;
    prefersShort: string;
    prefersLong: string;
    formalBias: string;
    casualBias: string;
    separator: string;
  };
  intent: {
    eyebrow: string;
    request: string;
    approval: string;
    negotiation: string;
    followUp: string;
    escalation: string;
    apology: string;
    scheduling: string;
    feedback: string;
    statusUpdate: string;
    reminder: string;
    urgencyHigh: string;
    urgencyMedium: string;
    separator: string;
  };
  rewriteModes: {
    eyebrow: string;
    diplomatic: string;
    leadership: string;
    negotiation: string;
    customerSupport: string;
    recruiting: string;
    voiceLikeMe: string;
  };
  outcomeSignals: {
    eyebrow: string;
    clarity: string;
    hasClearCTA: string;
    professional: string;
  };
  followUps: {
    eyebrow: string;
    waitingOn: string;
    overdueMinutes: string;
    overdueHours: string;
    overdueOneDay: string;
    overdueDays: string;
    separator: string;
  };
  sendTiming: {
    eyebrow: string;
    recommendedTime: string;
  };
};

const EN: TranslationBundle = {
  languageOptions: [
    { value: 'auto', label: 'Auto' },
    { value: 'en', label: 'English' },
    { value: 'zh', label: 'Chinese' },
  ],
  textTypes: [
    { id: 'shorter-reply', label: 'Shorter Reply' },
    { id: 'longer-detailed', label: 'Longer / Detailed Reply' },
    { id: 'persuasive', label: 'More Persuasive' },
    { id: 'apologetic-polite', label: 'Apologetic / Polite' },
    { id: 'casual-friendly', label: 'Casual / Friendly' },
    { id: 'formal-professional', label: 'Formal / Professional' },
    { id: 'follow-up', label: 'Follow-Up Message' },
    { id: 'suggestion', label: 'Suggestion' },
    { id: 'simplify', label: 'Simplify' },
    { id: 'improve', label: 'Improve' },
    { id: 'polish-english', label: 'Polish my English' },
  ],
  workModes: {
    reply: 'External',
    internal: 'Internal',
  },
  recipientLabels: {
    'new-lead': 'New Lead',
    'existing-client': 'Existing Client',
    'vip-client': 'VIP Client',
    leader: 'Leader',
    colleague: 'Colleague',
    others: 'Others',
  },
  tonePresetLabels: {
    executive: 'Executive',
    friendly: 'Friendly',
    urgent: 'Urgent',
    casual: 'Casual',
  },
  toneControlLabels: {
    composer: 'Tone composer',
    formality: 'Formality',
    warmth: 'Warmth',
    urgency: 'Urgency',
    confidence: 'Confidence',
  },
  rankUnlocks: {
    confidenceHint: 'Silver: Confidence slider unlocked',
    saveToneProfile: 'Save tone profile',
    savedProfiles: 'Saved profiles',
    noSavedProfiles: 'No saved profiles yet',
    mirrorMode: 'Mirror mode',
    mirrorModeDesc: 'Auto-fill input with generated reply',
    profileSaved: 'Tone profile saved',
    silverHint: 'Reach Silver (30 replies) to unlock',
    goldHint: 'Reach Gold (70 replies) to unlock',
    platinumHint: 'Reach Platinum (120 replies) to unlock',
  },
  placeholders: {
    reply: 'Paste their message—generation uses the contact and thread you selected, not a blank chat box.',
    internal: 'Paste your internal note—the draft uses your saved work context instead of open-ended chat.',
  },
  floating: {
    openMoreFeatures: 'Open more features',
    pasteAndGo: 'Paste & Go',
    pasteAndGenerate: 'Paste from clipboard and generate',
    attachFiles: 'Attach files',
    attachmentsAdded: 'Files attached',
    attachmentUploadFailed: 'Unable to attach files',
    uploadLimitReached: 'Upload limit reached',
    removeLastLearningFileTitle: 'Remove your last learning file?',
    removeLastLearningFileBody: 'Pictures, PDFs, spreadsheets, and docs you attach here help Reply Assistant learn your real business context and draft more accurate replies. Removing the last file clears that learned context.',
    removeLastLearningFileConfirm: 'Are you sure you want to remove it?',
    removeLastLearningFileKeep: 'Keep file',
    removeLastLearningFileAction: 'Remove anyway',
    generate: 'Generate',
    generating: 'Generating...',
    generateShortcut: 'Generate (Cmd/Ctrl + Enter)',
    repliesOne: 'reply',
    repliesMany: 'replies',
    dayShort: 'd',
    copiedToClipboard: 'Copied to clipboard',
    copiedGeneratedReply: 'Copied generated reply',
    copiedGeneratedReplySavedToContact: 'Copied · saved to {{name}}',
    autoCopied: 'Auto-copied to clipboard',
    autoCopiedSavedToContact: 'Auto-copied · saved to {{name}}',
    systemSnapshotTitle: 'Connection status',
    systemSnapshotSummary: '{{healthy}} of {{total}} connections ready',
    systemSnapshotPreferred: 'Primary',
    systemSnapshotRefresh: 'Check again',
    systemSnapshotChecking: 'Checking…',
    nextUpLabel: 'Next up',
    openActionCenter: 'Open actions',
    closeActionCenter: 'Close',
    dailyBriefLabel: 'Daily brief',
    justNow: 'Just now',
    minutesAgoShort: '{{count}}m ago',
    hoursAgoShort: '{{count}}h ago',
    daysAgoShort: '{{count}}d ago',
    actionsWaitingOne: '1 action waiting',
    actionsWaitingMany: '{{count}} actions waiting',
    needsYourReply: '{{name}} needs your reply',
    activeClient: '{{name}} is your active client',
    clientFallbackBody: 'Open this client and continue from their saved context.',
    memoryCueTitle: 'Remembered context',
    memoryCueCommitment: 'Open commitment',
    memoryCueLearning: 'Learned preference',
    memoryCueExpandAria: 'Show all remembered context',
    memoryCueCollapseAria: 'Hide remembered context',
    memoryCueBasedOnMessages: 'Based on {{count}} messages',
    memoryCueOpenCommitmentsHeading: 'Open commitments',
    memoryCueThreadSummaryHeading: 'Thread summary',
    memoryCueReplyLearningHeading: 'Reply learning',
    memoryCueDoneAria: 'Mark commitment done',
    memoryCueEditAria: 'Edit thread summary',
    memoryCueSaveLabel: 'Save',
    memoryCueCancelLabel: 'Cancel',
    memoryCueSummaryPlaceholder: 'What this thread is about...',
    memoryCueKindPromise: 'Promise',
    memoryCueKindNeedsReply: 'Needs reply',
    memoryCueKindAccepted: 'Accepted',
    memoryCueKindEdited: 'Edited',
    memoryCueKindRegenerated: 'Regenerated',
    memoryCueButtonAria: 'Show remembered context',
    memoryCueStackClose: 'Close remembered context',
    memoryCueGuideHeading: 'Handle with {{name}}',
    memoryCueActReply: 'Reply now',
    memoryCueActFollowUp: 'Follow up',
    memoryCueDoneLabel: 'Mark done',
    memoryCueLearnedHeading: 'Learned',
    actionInboxContactReason: 'Why: this is tied to a contact that needs a reply.',
    actionInboxPriorityReason: 'Why: this is the highest-priority item in your action inbox.',
    latestInboundReason: 'Why: their latest inbound message has no newer outbound reply.',
    selectedClientReason: 'Why: this is your selected or most recent client thread.',
    draftReadyReason: 'Why: a grounded draft is already waiting.',
    addDetailReason: 'Why: this contact needs one detail before drafting confidently.',
    followUpReason: 'Why: you are waiting on them and it is time to follow up.',
    reviewFileTitle: 'Review {{filename}}',
    reviewFileBody: 'One attached file needs a quick check before I use it as evidence.',
    reviewFileCta: 'Review file',
    reviewFileReason: 'Why: low-confidence extraction should be checked before drafting.',
    reviewFileHeader: 'Review the attached file first',
    addDetailMicroAsk: 'Paste the latest message or add one quick note for this contact.',
    addDetailMicroAskCta: 'Paste detail',
    addDetailHeader: 'Paste the detail I should remember',
    clearTitle: "You're clear for now",
    clearBody: 'No saved client thread needs you right now. Review contacts when you want to prepare the next move.',
    clearReason: 'Why: no current client action is overdue.',
    reviewContactsCta: 'Review contacts',
    replyNow: 'Reply now',
    useContact: 'Use Contact',
    addDetailCta: 'Add detail',
    followUpCta: 'Follow up',
    contactInComposer: 'Contact in composer',
    startClientMemoryTitle: 'Start by creating one client memory',
    startClientMemoryBody: 'Add a contact or paste a client message so replies can be grounded in a real relationship.',
    startClientMemoryReason: 'Why: client memory is the moat that generic chatbots do not have.',
    addContact: 'Add contact',
    referralNudgeTitle: 'This is working for you',
    referralNudgeBody: 'You have copied {{count}} replies. Share this workflow with a sales friend when it feels useful.',
    referralNudgeInvite: 'Invite',
    referralNudgeDismiss: 'Not now',
    commandNeedsReply: 'Needs reply',
    commandWaiting: 'Waiting',
    commandCaptured: 'Captured',
    commandDrafts: 'Drafts',
    contactMatchConfirmTitle: 'Confirm client context',
    contactMatchPossibleTitle: 'Possible contact match',
    hide: 'Hide',
    contactMatchPausedBody: 'Paste & Go paused so this reply is not built on the wrong client memory.',
    searchContacts: 'Search contacts',
    useSelectedContact: 'Use selected contact',
    useWithoutContact: 'Use without contact',
    commandCapture: 'Capture',
    commandContacts: 'Contacts',
    commandQueue: 'Queue',
    commandReplies: 'Replies',
    addFollowUp: '+ Add follow-up',
    addedToQueue: 'Added to queue',
    openToneComposer: 'Open tone composer',
    toneComposerModalTitle: 'Tone composer',
    toneComposerModalSubtitle: 'Shape formality, warmth, and urgency before you generate.',
    toneComposerDone: 'Apply tone',
    toneComposerClose: 'Close',
    targetLabel: 'Target',
    attentionToastNeedsReply: '{{name}} needs your reply',
    attentionToastActionWaiting: 'New action ready',
    attentionToastNewMail: 'New message from {{name}}',
    attentionToastDraftReady: 'Draft ready for {{name}}',
    attentionToastDraftReadyBody: 'I wrote a reply while you were away — review and copy in one click.',
    attentionToastDraftReadyOpen: 'Open draft',
    attentionToastAct: 'Open',
    attentionToastDismiss: 'Later',
    cmdKPlaceholder: 'Name someone, ask for a reply, or paste a message…',
    cmdKHintLabel: 'Need help? Press {{shortcut}}',
    cmdKHintDismiss: 'Hide',
    cmdKEmptyState: 'Or pick one of the suggestions below.',
    cmdKActionOpenContact: 'Open {{name}}',
    cmdKActionDraftReply: 'Draft a reply to {{name}}',
    cmdKActionFollowUp: 'Follow up with {{name}}',
    cmdKActionUseAsMessage: 'Use as a new message',
    cmdKShortcutMac: '⌘K',
    cmdKShortcutWin: 'Ctrl+K',
    cmdKForYouLabel: 'For you right now',
    cmdKSuggestReply: 'Reply to {{name}}',
    cmdKSuggestFollowUp: 'Check in with {{name}}',
    cmdKSuggestResume: 'Continue with {{name}}',
    cmdKSuggestPaste: 'Paste a message to start',
    smartChipReplyTo: '{{name}} is waiting for a reply',
    smartChipFollowUp: 'Time to check in with {{name}}',
    smartChipResume: 'Continue with {{name}}',
    smartChipPaste: 'Paste your latest message here',
    smartChipDismiss: 'Not now',
    dailyBriefMorning: 'Good morning',
    dailyBriefAfternoon: 'Good afternoon',
    nextStepPickContactHint: 'Start here',
    nextStepGenerateHint: 'Press to generate',
    nextStepCopyHint: 'Copy to send',
    smartReplyLabel: 'Smart Reply',
    smartReplyShort: 'Reply',
    smartReplyHint: 'One tap — pulls their latest message and drafts the reply',
    openDraft: 'Open draft',
    draftReadyEyebrow: 'Draft ready',
    draftReadyBody: 'I wrote a reply while you were away — review and copy in one click.',
    smartReplyUnavailable: 'No new inbound message yet',
    replyInEn: 'Reply in EN',
    replyInZh: 'Reply in 中文',
    draftTranslateFailed: 'Could not translate draft. Try again.',
    languageRecommendChip: '→ {{label}}',
    languageRecommendApply: 'Switch reply language to {{label}}',
    languageRecommendTitle: 'Their last message looks like {{label}}',
    culturalTipEyebrow: 'Cross-language note',
    culturalTipZhToEnProspect: 'Western prospect — opening with a direct value statement reads more confident than a long greeting.',
    culturalTipZhToEnVip: 'High-stakes VIP — staying formal and concise lands better than warm small-talk.',
    culturalTipZhToEnDefault: 'Reply uses direct, professional English. Avoid literal translations of Chinese set phrases.',
    culturalTipEnToZhDefault: '回复采用稳重、得体的中文表达，避免英文中常见的直白措辞。',
    culturalTipEnToZhLeader: '回复对领导更加委婉、尊重，并以请示语收尾。',
    culturalTipMixedClarity: 'Inbound mixes Chinese and English — reply keeps each idea in one language so meaning stays clear.',
    culturalTipPolishEnglish: 'Polishing your English without changing the meaning. Keep your original facts; the reply will refine grammar, tone, and flow.',
    impressionCheckTitle: 'Impression check',
    impressionFormalityLabel: 'Formality match',
    impressionToneLabel: 'Tone risk',
    impressionLengthLabel: 'Length',
    impressionStatusOk: 'OK',
    impressionStatusWarn: 'Review',
    impressionAutoSoften: 'Auto-soften',
    impressionReasonFormalityTooCasualForVip: 'Reads too casual for a VIP client.',
    impressionReasonFormalityTooCasualForLeader: 'Reads too casual for a leader.',
    impressionReasonFormalityTooStiffForCasual: 'Reads too stiff for a casual-friendly note.',
    impressionReasonToneAggressive: 'Some phrasing may come across aggressive.',
    impressionReasonTonePassive: 'Sounds hesitant — could weaken your point.',
    impressionReasonToneOverpromise: 'Promises something we cannot guarantee.',
    impressionReasonLengthTooBrief: 'Shorter than the usual length for this reply type.',
    impressionReasonLengthTooLong: 'Longer than the usual length for this reply type.',
    voiceMatchLearning: 'Learning your voice',
    voiceMatchSimilar: 'Sounds like you',
    voiceMatchDifferent: 'Different from your usual voice — review tone.',
    voiceMatchUnknown: 'No voice baseline yet',
    voiceMatchSampleCount: 'based on {{count}} past replies',
    highStakesGuardEyebrow: 'Final check',
    highStakesGuardTitleVip: 'Send to VIP client?',
    highStakesGuardTitleLeader: 'Send to your leader?',
    highStakesGuardBody: 'High-stakes recipient — review the impression check before copying.',
    highStakesGuardConfirm: 'Copy and send',
    highStakesGuardCancel: 'Keep editing',
    whyExpandLabel: 'See full evidence',
    whyCollapseLabel: 'Hide details',
    whyDetailLatestMessage: 'Latest inbound message',
    whyDetailRelationshipMemory: 'Relationship memory',
    whyDetailBusinessContext: 'Business context',
    whyDetailYourInput: 'Your input',
    whyDetailRecentTimeline: 'Recent timeline',
    whyDetailAttachments: 'Attachments',
    whyDetailNothingGrounded: 'No grounded evidence — draft is based on general request only.',
    notificationNewMailTitle: 'New message from {{name}}',
    notificationNewMailBody: 'Open Reply Assistant to capture the latest message and draft a reply.',
    notificationDraftReadyTitle: 'Draft ready for {{name}}',
    notificationDraftReadyBody: 'A grounded reply is waiting — open Reply Assistant to review and copy.',
    coach: {
      eyebrow: 'Coach',
      missingAsk: 'Add a clear ask or next step before sending.',
      confrontational: 'May read as confrontational — rephrase the blame.',
      tooLong: 'Longer than your usual reply to this contact.',
      allCaps: 'Reads as shouting — drop the all-caps emphasis.',
      fix: 'Fix',
      dismiss: 'Dismiss',
    },
  },
  focusPlan: {
    eyebrow: 'Focus plan',
    title: 'Next best work',
    open: 'Open plan',
    close: 'Close plan',
    rankNow: 'Start here',
    rankNext: 'Next',
    rankLater: 'Later',
    whereLabel: 'Where',
    whenLabel: 'When',
    estimateMinutes: '~{{minutes}} min',
    whenNow: 'Now',
    whenNext: 'Next',
    whenToday: 'Today',
    whenBeforeDrafting: 'Before drafting',
    whenWhenReady: 'When ready',
    whenAround: 'Best around {{time}}',
    clockTime: '{{hour}} {{period}}',
    timeAm: 'AM',
    timePm: 'PM',
    whereDraft: 'Draft review',
    whereActionInbox: 'Action Inbox',
    whereComposer: 'Composer',
    whereBusinessContext: 'Business context',
    whereContactMemory: 'Contact memory',
    whereTodayQueue: 'Today Queue',
    whereContacts: 'Contacts',
    draftTitle: 'Draft ready for {{name}}',
    draftBody: 'A grounded reply is already waiting for review.',
    replyTitle: 'Reply to {{name}}',
    detailTitle: 'Add context for {{name}}',
    followUpTitle: 'Follow up with {{name}}',
    openLoopTitle: '{{name}} may be waiting',
    openLoopBody: 'Their latest message has no newer reply from you.',
    todayTaskReason: 'Why: this quick task improves your next work session.',
    promiseTitle: 'Keep your promise to {{name}}',
    promiseReason: 'Why: you said you would follow up — close the loop.',
  },
  modal: {
    title: 'Generated reply',
    subtitle: 'Ready to copy and send',
    confidenceReadyVoice: 'Sounds like you — ready to send.',
    confidenceReview: 'Worth a quick read before you send.',
    confidenceVoiceOff: 'Reads a little unlike your usual voice — worth a look.',
    confidenceThin: 'Add one more detail to sharpen this.',
    editReply: 'Edit reply',
    doneEditing: 'Done editing',
    suggestedNamesLabel: 'Suggested names',
    close: 'Close',
    copyReply: 'Copy reply',
    copySubject: 'Copy subject',
    insertSubject: 'Insert above reply',
    subjectInserted: 'Subject inserted into reply',
    subjectCopied: 'Subject copied to clipboard',
    subjectPrefix: 'Subject',
    intelligenceTitle: 'Reply intelligence',
    intelligenceSubtitle: 'Context behind this draft',
    riskTypeLabel: 'Type of risk',
    intentLabel: 'Intent',
    subjectLineLabel: 'Suggested subject',
    nextActionLabel: 'Next action',
    followUpLabel: 'Follow-up',
    basedOnTitle: 'Based on',
    basedOnLatestMessage: 'Latest message',
    basedOnRelationshipMemory: 'Relationship memory',
    basedOnBusinessContext: 'Business context',
    basedOnYourInput: 'Your input',
    basedOnRecentTimeline: 'Recent timeline',
    basedOnAttachments: 'Attached files',
    basedOnLimitedContext: 'Limited context: add contact memory for a more certain draft.',
    lowRisk: 'Low risk',
    mediumRisk: 'Medium risk',
    highRisk: 'High risk',
  },
  generatedOutput: {
    replyContext: 'Thanks for your message. Here is a client-ready response draft.',
    internalContext: 'Team update draft prepared for internal coordination.',
    summaryLine: 'Tone: {{tone}}. Recipient: {{recipient}}. Preferred language: {{language}}. Intent: {{textType}}.',
    footer: 'Please let me know if you would like this adapted to a more formal or concise style before sending.',
  },
  auth: {
    signInTitle: 'Sign in',
    signInSubtitle: 'Use your work email to open your Reply Assistant workspace.',
    signInAction: 'Sign in',
    signUpTitle: 'Create account',
    signUpSubtitle: 'We will email you a verification link before opening the workbench.',
    signUpAction: 'Create account',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    confirmPasswordLabel: 'Confirm password',
    nameLabel: 'Full Name',
    newPasswordLabel: 'New password',
    forgotPassword: 'Forgot password?',
    forgotPasswordTitle: 'Reset password',
    forgotPasswordSubtitle: 'Enter your email and we will send a reset link.',
    resetPassword: 'Send reset link',
    resetEmailSent: 'Check your inbox for the reset link.',
    changePasswordTitle: 'Change password',
    changePasswordSubtitle: 'Choose a new password for your account.',
    changePasswordAction: 'Update password',
    verifyEmailTitle: 'Check your inbox',
    verifyEmailBody: 'We sent a verification link. Open it on this device, then return here.',
    backToSignIn: 'Back to sign in',
    createAccount: 'Create account',
    signOut: 'Sign out',
    welcomeBack: 'Welcome back',
    welcomeName: 'Welcome, {{name}}',
    passwordUpdated: 'Password updated.',
    working: 'Working…',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    weakPasswordHint: 'Weak password',
    strongPasswordHint: 'Strong password',
    passwordsMatchHint: 'Passwords match',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    signInLink: 'Sign in',
    signUpLink: 'Create account',
    needHelp: 'Need help?',
    verifyEmailSentTo: 'We sent a verification link to {{email}}.',
    verifyEmailMissingEmail: 'Sign in again with your email to resend the verification link.',
    resendIn: 'Resend available in {{time}}',
    resendLink: 'Resend verification link',
    resendResetLink: 'Resend reset link',
    resendSuccess: 'Link sent again. Check your inbox.',
    resendTooSoon: 'Please wait before requesting another email.',
    errors: {
      required: 'This field is required.',
      invalidCredentials: 'Email or password is incorrect.',
      emailNotConfirmed: 'Confirm your email before signing in.',
      weakPassword: 'Weak password',
      passwordMismatch: 'Passwords do not match.',
      generic: 'Something went wrong. Try again.',
      invalidEmail: 'Enter a valid email address.',
      invalidFullName: 'Enter your full name.',
    },
  },
  settings: {
    frameLabel: 'Settings',
    frameTitle: 'Preferences',
    autoCopyTitle: 'Auto-copy reply',
    autoCopyDesc: 'Copy generated response immediately after creation',
    compactModeTitle: 'Compact mode',
    compactModeDesc: 'Use a tighter workspace layout',
    focusModeTitle: 'Focus blur intensity',
    focusModeDesc: 'Control how strongly background screens are softened while a panel is open',
    focusModeSoft: 'Soft',
    focusModeStrong: 'Strong',
    lazyModeTitle: 'Smart Reply auto-draft',
    lazyModeDesc: 'When on, Reply Assistant pre-drafts a reply the moment a new message arrives and lets you send it in one tap. Turn off to draft every reply yourself.',
    highStakesGuardTitle: 'High-stakes send guard',
    highStakesGuardDesc: 'Show a final-check confirmation before copying replies to VIP clients and leaders. Recommended for sales and executive communication.',
    nativeNotificationsTitle: 'Desktop notifications',
    nativeNotificationsDesc: 'Fire native macOS and Windows notifications on new mail and ready drafts. The in-app attention toast still appears regardless.',
    quietHoursTitle: 'Quiet hours',
    quietHoursDesc: 'Pause native notifications during this window. The dock badge and Daily Brief continue to update.',
    quietHoursStartLabel: 'From',
    quietHoursEndLabel: 'Until',
    defaultLanguageTitle: 'Default language',
    defaultLanguageDesc: 'Pre-select this language every time you open the app',
    profileEditorTitle: 'Profile details',
    profileEditorDesc: 'Fields auto-save as you type.',
    displayNameLabel: 'USER NAME',
    userIdLabel: 'User ID',
    referralCodeLabel: 'Referral code',
    editDisplayName: 'Edit display name',
    done: 'Done',
    cancel: 'Cancel',
    copyReferralCode: 'Copy referral code',
    nameLimitLabel: 'characters max',
    displayNamePlaceholder: 'New User',
    userIdPlaceholder: '526695051',
    referralCodePlaceholder: 'RA-5266-95051',
    profileTitle: 'Workspace profile',
    profileDesc:
      'Drafts stay tied to this contact: timeline and memory in one workspace—not a generic chat thread. Preferences and contacts stay on this device unless you connect sync.',
    aiProviderTitle: 'Reply engine',
    aiProviderDesc: 'Choose the writing connection the app tries first. Other connections stay available if needed.',
    syncedServersTitle: 'Connect your messages',
    syncedServersDesc: 'Bring email and work messages into the right contact so replies stay grounded.',
    syncPrivacyFootnote:
      'Contacts and timelines stay on this device by default. Email is the reliable sync path; social channels use paste, import, or webhook capture unless official APIs are connected.',
    keyboardHintsFootnote:
      '⌘ or Ctrl + Enter — generate from the composer. ⌘ or Ctrl + Shift + C — copy the latest reply when focus is outside a text field.',
    accountTitle: 'Account',
    accountDesc: 'Signed-in identity for this desktop workspace.',
    accountEmailLabel: 'Email',
    changePassword: 'Change password',
    signOut: 'Sign out',
  },
  accountSettings: {
    frameLabel: 'Account',
    frameTitle: 'Account settings',
    profileSection: 'Profile',
    accountSection: 'Account',
    sessionSection: 'Session',
    dangerSection: 'Danger zone',
    profileDetails: 'Profile details',
    phoneNumber: 'Phone number',
    phoneNotSet: 'Not set',
    phonePlaceholder: 'Add your mobile number',
    phoneNationalPlaceholder: 'Mobile number',
    phoneSearchPlaceholder: 'Search country or code',
    phoneSelectCountry: 'Select country',
    phoneNoResults: 'No countries match your search',
    phoneInvalid: 'Enter a valid mobile number for the selected country.',
    phoneTooShort: 'This number looks too short.',
    phoneEmpty: 'Enter your mobile number or leave the field empty.',
    phoneNonsense: 'This does not look like a real phone number.',
    phoneLooksValid: 'Number looks valid',
    phoneSaveFailed: 'Could not save your phone number. Try again.',
    changePassword: 'Change password',
    signOut: 'Sign out',
    deleteAccount: 'Delete account',
    edit: 'Edit',
    save: 'Save',
    emailLabel: 'Email',
    openAccountSettings: 'Open account settings',
    signOutConfirmTitle: 'Sign out?',
    signOutConfirmBody: 'You will be asked to sign in again in order to use the services. Are you sure?',
  },
  deleteAccount: {
    frameLabel: 'Account',
    frameTitle: 'Delete account',
    body: 'This permanently removes your sign-in account. Local contacts and drafts on this device stay until you reset app data separately.',
    acknowledgeLabel: 'I understand this cannot be undone',
    confirmButton: 'Delete my account',
    working: 'Deleting account…',
    success: 'Account deleted.',
    errorGeneric: 'Could not delete your account. Try again.',
    errorOffline: 'Could not reach the server. Check your connection and try again.',
  },
  moreFeatures: {
    copied: 'Copied',
    workMenuTitle: 'Client work',
    secondaryMenuTitle: 'Utilities',
    menuLabels: {
      'today-queue': 'Today Queue',
      'action-inbox': 'Action Inbox',
      'contact-threads': 'Contacts',
      settings: 'Settings',
      messages: 'Messages',
      'customer-service': 'Need Help',
      'refer-friends': 'Refer Friends',
      'recent-replies': 'Recent Replies',
      'snippet-library': 'Snippet Library',
      'reset-data': 'Reset Data',
      'business-context': 'Work Context',
      'system-health': 'Connection Check',
      'weekly-recap': 'Weekly Recap',
    },
    rankLabels: {
      starter: 'Starter',
      silver: 'Silver',
      gold: 'Gold',
      platinum: 'Platinum',
    },
    repliesGenerated: 'replies generated',
    userIdLabel: 'ID',
    copyUserId: 'Copy user ID',
    renew: 'Renew',
    renewChecking: 'Checking for updates…',
    renewLatestTitle: 'Up to date',
    renewLatestBody: 'You are already on the latest version. No new updates available.',
    quit: 'Quit',
    version: 'Version',
    toNextRank: 'to unlock',
    maxRank: '💎 Platinum achieved',
  },
  messages: {
    frameLabel: 'Messages',
    frameTitle: 'Inbox and alerts',
    show: 'Show',
    hide: 'Hide',
    read: 'Read',
    unread: 'Unread',
    companionNote:
      'Product announcements only—day-to-day drafts stay in the main workspace, grounded in each contact you select.',
    focusHint: 'Focus mode: scroll to the next block, then tap Show to read details.',
    loading: 'Loading announcements…',
    emptyTitle: 'No announcements yet',
    emptyBody: 'Product updates and billing notices will appear here when your team publishes them.',
  },
  customerService: {
    frameLabel: 'Need Help',
    frameTitle: 'Support center',
    cardTitle: 'Help center',
    cardBody: 'Browse common questions or send us a short message — we read every request.',
    faqTitle: 'Frequently asked questions',
    faqSearchPlaceholder: 'Search questions…',
    faqEmpty: 'No questions match your search.',
    faqItems: [
      {
        id: 'getting-started',
        question: 'How do I get started?',
        answer:
          'Sign in, add a contact from the composer, and tap Generate. Your contacts and memory stay on this device unless you choose to sync later.',
      },
      {
        id: 'contacts-memory',
        question: 'Where are my contacts and memory stored?',
        answer:
          'Contacts, notes, and conversation memory are stored locally on your device first. The app works offline for core features; cloud sign-in is for your account identity only.',
      },
      {
        id: 'generate-replies',
        question: 'How does reply generation work?',
        answer:
          'Pick a contact, add context if you like, and tap Generate. The assistant drafts a reply using your tone settings. You can edit before sending.',
      },
      {
        id: 'email-sync',
        question: 'Does the app read my email automatically?',
        answer:
          'No. Email sync is optional and honest about what it can access. You control when to connect an inbox; we do not silently scrape mail.',
      },
      {
        id: 'sign-in',
        question: 'Why do I need to sign in?',
        answer:
          'Sign-in keeps your account secure and lets you recover access. Your day-to-day contacts and drafts remain local-first on this device.',
      },
      {
        id: 'desktop-updates',
        question: 'How do I update the desktop app?',
        answer:
          'Open More Features and tap Renew to check for updates. When a new version is available, you will be guided to install it.',
      },
      {
        id: 'data-privacy',
        question: 'What data leaves my device?',
        answer:
          'Support requests and account actions you submit go to our secure backend. Contacts and memory stay local unless a future sync feature is enabled and you opt in.',
      },
      {
        id: 'delete-account',
        question: 'How do I delete my account?',
        answer:
          'Go to Account Settings → Delete account. This removes your cloud profile; local data on this device can be cleared separately in settings.',
      },
      {
        id: 'billing',
        question: 'Billing and referrals',
        answer:
          'Plans and referral rewards are rolling out gradually. Your current tier and usage appear under More Features; we will not charge without clear notice.',
      },
    ],
    authHelpMoreHint:
      'For the full help center and support form, open More Features → Need Help after you sign in.',
    stillNeedHelpTitle: 'Still need help?',
    stillNeedHelpBody: 'Send a short message and we will get back to you by email.',
    formNameLabel: 'Name',
    formPhoneLabel: 'Phone (optional)',
    formEmailLabel: 'Email',
    formIssueLabel: 'Issue',
    formIssuePlaceholder: 'Select a category',
    formMessageLabel: 'Message',
    formMessageCounter: '{{count}} / {{max}} characters',
    formSubmit: 'Send request',
    formSubmitting: 'Sending…',
    errorNameRequired: 'Enter your full name (2–80 characters).',
    errorEmailInvalid: 'Enter a valid email address.',
    errorIssueRequired: 'Select an issue category.',
    errorMessageRequired: 'Enter a message (at least 10 characters).',
    errorMessageTooLong: 'Message must be 200 characters or fewer.',
    errorPhoneInvalid: 'Enter a valid phone number or leave the field empty.',
    formSuccessTitle: 'We received your request',
    formSuccessBody: 'Thank you. We will reply to your email soon. Submitted at {{time}}.',
    formErrorGeneric: 'Could not send your request. Please try again.',
    formErrorOffline: 'You appear to be offline. Check your connection and try again.',
    issueCategories: {
      'account-auth': 'Sign-in, password, or account access',
      'contacts-memory': 'Contacts, memory, or local data',
      'reply-generation': 'Generating or editing replies',
      'email-sync': 'Email connection or sync',
      'desktop-app': 'Desktop app install or updates',
      notifications: 'Notifications or alerts',
      'billing-account': 'Billing, plan, or referrals',
      'data-privacy': 'Privacy or data on this device',
      other: 'Other',
    },
  },
  referFriends: {
    frameLabel: 'Refer Friends',
    frameTitle: 'Rewards and gifts',
    heroTitle: 'Refer friends, get rewards',
    heroBody: 'After a friend joins using your referral code, both of you unlock pink-tier discounts, gifts, and renewal bonuses.',
    referralCodeTitle: 'Your referral code',
    copyReferralCode: 'Copy referral code',
    copiedToClipboard: 'Copied to clipboard',
    inviteFriends: 'Invite friends',
    inviteCopied: 'Invite message copied',
    inviteMessage: 'I have been using Business Reply Assistant to handle client messages faster. It keeps client context, drafts replies, and reminds me who needs attention. Use my referral code {{code}} if you want to try it.',
    offers: [
      { title: 'Invite reward', desc: 'Give a friend 15% off and unlock 15% off your next renewal.' },
      { title: 'Gift access', desc: 'Send 7 days of premium access to a new user.' },
      { title: 'Team discount', desc: 'Invite 3 colleagues and unlock a business bundle offer.' },
    ],
    emptyRewards: 'No referral rewards yet. Invite friends to unlock discounts and gifts.',
  },
  recentReplies: {
    frameLabel: 'Recent Replies',
    frameTitle: 'Reply history',
    emptyText: 'No replies yet. Generate your first response to build reusable history.',
    reuseInInput: 'Reuse',
    searchPlaceholder: 'Search replies...',
    noResults: 'No replies match your search.',
    modeLabels: {
      reply: 'Reply',
      internal: 'Internal',
    },
    variantLabels: {
      short: 'Short',
      balanced: 'Balanced',
      persuasive: 'Persuasive',
    },
    minutesAgo: 'm ago',
    hoursAgo: 'h ago',
    daysAgo: 'd ago',
  },
  contactThreads: {
    frameLabel: 'Contacts',
    frameTitle: 'Contact threads',
    intro: 'Contacts anchor each draft: thread, timeline, and memory for that person—stored on this device.',
    selectedLabel: 'Current thread',
    manageLabel: 'Manage',
    emptyTitle: 'No contacts saved yet',
    emptyBody: 'Create a contact to start building relationship memory and follow-up reminders.',
    nameLabel: 'Full Name',
    namePlaceholder: 'Sarah Chen',
    companyLabel: 'Company',
    companyPlaceholder: 'Acme Corp',
    emailPlaceholder: 'name@company.com',
    stageLabel: 'Stage',
    notesLabel: 'Notes',
    notesPlaceholder: 'Decision maker, prefers concise replies, budget review in May...',
    pendingCaptureHint: 'Captured message will be saved to this contact and opened in the composer.',
    addContactAction: '+ Add Contact',
    createContact: 'Add',
    openContact: 'Open',
    useContact: 'Use Contact',
    selectedContact: 'Selected',
    removeContact: 'Remove contact',
    removeContactTitle: 'Remove this contact?',
    removeContactConfirm: 'Are you sure you want to remove this contact?',
    removeContactAction: 'Remove',
    unassigned: 'No contact linked',
    pickerPlaceholder: 'Choose a contact',
    searchPlaceholder: 'Quick search contacts...',
    internalSearchPlaceholder: 'Quick search internal contacts...',
    clearSelectionLabel: 'No contact selected',
    noSearchResults: 'No contacts match this search.',
    contactFilterLabel: 'Contact view',
    contactFilterNeedsAction: 'Needs action',
    contactFilterAll: 'All',
    contactFilterNeedsActionEmptyTitle: 'No urgent contacts',
    contactFilterNeedsActionEmptyBody: 'Everything is up to date. Switch to All to review all contacts.',
    priorityStripTitle: 'Daily contact focus',
    priorityStripBody: '{needs} need attention • {overdue} overdue follow-ups',
    priorityStripReviewAction: 'Review now',
    priorityRiskActionNow: 'Action now',
    priorityRiskDueToday: 'Due today',
    priorityRiskWatchlist: 'Watchlist',
    priorityLastActivity: 'Last activity: {time}',
    priorityNoActivity: 'No activity yet',
    morningFocusTitle: 'Morning focus',
    morningFocusEta: '~{minutes} min',
    markDoneAction: 'Done',
    snoozeUntilTomorrow: 'Snooze',
    useContactActionShort: 'Use now',
    focusDoneState: 'Completed for today.',
    focusSnoozedState: 'Snoozed until tomorrow.',
    dailyImpactFooter: '{done} handled today • {snoozed} snoozed',
    contactInsightsTitle: 'Contact summary',
    messagesFromCountLabel: 'Messages from',
    messagesToCountLabel: 'Messages to',
    chatTypeLabel: 'Type of chat',
    lastReceivedLabel: 'Last message received',
    lastSentLabel: 'Last message sent',
    noLastReceived: 'No received messages yet',
    noLastSent: 'No sent messages yet',
    callToActionLabel: 'Call to action',
    callToActionReply: 'Reply now',
    callToActionFollowUp: 'Send follow-up',
    priorityReasonLabel: 'Why',
    priorityReasons: {
      'latest-inbound-unanswered': 'Latest message has no newer reply.',
      'email-needs-action': 'New synced email needs review.',
      'follow-up-due': 'Follow-up is due today.',
      'waiting-on-client': 'You are waiting on their response.',
      'recent-activity': 'Recently active thread.',
      'missing-context': 'Add context before drafting.',
      'quiet-thread': 'No urgent action right now.',
    },
    sourcePasteLabel: 'Pasted',
    sourceEmailSyncLabel: 'Synced',
    sourceManualNoteLabel: 'Manual note',
    sourceGeneratedReplyLabel: 'Generated',
    replyCount: 'replies',
    messageCount: 'messages',
    lastReplyNone: 'No replies yet',
    lastReplyToday: 'Replied today',
    lastReplyDays: '{days}d since last reply',
    chatContextLabel: 'Conversation notes',
    chatContextPlaceholder: 'Paste recent messages from WhatsApp, WeChat, email, Slack, or any platform...',
    chatContextSave: 'Save',
    chatContextSaved: 'Saved',
    chatContextHint: 'Saved.',
    addChatContext: '+ Add context',
    chatHubTitle: 'Conversation notes',
    chatHubSubtitle: 'All saved messages, newest first. Filter by contact or review everyone.',
    chatHubOpenButton: 'Chat context',
    chatHubFilterLabel: 'Show messages',
    chatHubAllContacts: 'All contacts',
    chatHubTimelineEmpty: 'No messages saved yet. Use Smart paste on a contact card or connect email.',
    chatHubAllNotesHint: 'Choose a contact above to add or edit extra notes that are included when you generate replies.',
    chatContextExtraLabel: 'Extra context & notes',
    chatHubPerContactAction: 'Open chat',
    chatHubSaveAndClose: 'Save',
    chatHubContactUnavailable: 'This contact is no longer available.',
    chatExtraNotesScreenSubtitle: 'Anything you add here is included when you generate replies for this contact.',
    emailSyncTitle: 'Connect Email',
    syncServersLabel: 'Message source',
    syncServerEmail: 'Email',
    syncServerDingTalk: 'DingTalk',
    syncServerWeChat: 'WeChat',
    syncServerWhatsApp: 'WhatsApp',
    syncServerTelegram: 'Telegram',
    syncGuides: {
      email: {
        title: 'How to connect Email',
        continueLabel: 'Continue',
        steps: [
          '1. Choose your email provider: Select Gmail, Outlook, QQ, 163, iCloud, or "Other" from the dropdown.',
          '2. Enter your email address: Use the full address (e.g. yourname@gmail.com).',
          '3. Get your app password — NOT your login password: Gmail → Google Account > Security > 2-Step Verification > App Passwords. Outlook → Microsoft Account > Security > Advanced > App Passwords. QQ/163/126 → Settings > Account > Enable IMAP > Generate authorization code. iCloud → Apple ID > Sign-In & Security > App-Specific Passwords.',
          '4. Paste the app password into the "Email code / app password" field, then press Connect Email.',
          '5. Once connected, the app auto-syncs new emails every 5 minutes and matches them to your contacts.',
        ],
      },
      dingtalk: {
        title: 'How to connect DingTalk',
        continueLabel: 'Continue',
        steps: [
          '1. Get your DingTalk User ID: Tap your avatar (bottom-left) > "Settings" > "Account" > "About Me". Copy the "User ID" number.',
          '2. Get your DingTalk sync code: On web, go to https://open-dev.dingtalk.com > "My Apps" > Create or select an app > "Credentials" tab > Copy "Client ID" (as account ID) and "Client Secret" (as sync code). On mobile, this requires web access.',
          '3. Enter both values: Paste your User ID and Client Secret into the fields below. Choose which contact to sync DingTalk messages into.',
          '4. Click "Sync DingTalk": The app will connect and import your recent DingTalk messages into the selected contact thread.',
        ],
      },
      wechat: {
        title: 'WeChat: No API available',
        continueLabel: 'Got it',
        steps: [
          '⚠️ WeChat does not provide a public API for third-party apps. Direct message sync is not possible — this is a Tencent platform restriction, not a limitation of this app.',
          '✅ Workaround — Paste method: Open WeChat on your phone or PC, copy the conversation you want to log, then paste it into the "Message from:" box on any contact card.',
          '✅ Workaround — WeChat Work (企业微信): If your team uses WeChat Work (the business version), it does have an API. Contact your IT admin to get a Corp ID and Secret for integration.',
          '💡 Tip: Use the Smart Paste panel (the pencil icon on each contact) to quickly capture and store any WeChat conversation in seconds.',
        ],
      },
      whatsapp: {
        title: 'How to connect WhatsApp',
        continueLabel: 'Continue',
        steps: [
          '1. Prepare your WhatsApp Business connection details.',
          '2. Open the connection screen and fill in the core fields.',
          '3. Save the connection details.',
          '4. After official API support is added, capture can begin there.',
        ],
      },
      telegram: {
        title: 'How to connect Telegram',
        continueLabel: 'Continue',
        steps: [
          '1. Prepare your Telegram bot details.',
          '2. Open the connection screen and fill in the bot fields.',
          '3. Save the connection details.',
          '4. After bot support is added, message capture can start.',
        ],
      },
    },
    syncServerComingSoonSuffix: 'coming soon',
    syncServerComingSoonBody: 'You can paste or import messages for now. Live connection support will arrive when ready.',
    emailSyncHint: 'Choose your email type, enter your email address, then add your email code or app password.',
    emailSyncAction: 'Connect',
    emailSyncRunning: 'Connecting...',
    emailSyncDiagnosticsRunning: 'Checking email connection...',
    emailSyncDiagnosticsSuccess: 'Checked email: fetched {fetched} | matched {matched} | updated {updated}',
    autoSyncNewMailFrom: 'New email from',
    autoSyncReplyNow: 'Reply Now',
    autoSyncDismiss: 'Dismiss',
    autoSyncNeedsAction: 'Needs action',
    autoSyncActionCardTitle: 'Reply needed: {name}',
    autoSyncActionCardBody: '{count} new inbound email(s) detected. Review and respond.',
    autoSyncAttentionTitle: 'Email attention',
    autoSyncAttentionBody: '{count} contact(s) have new inbound email waiting for your reply.',
    autoSyncReplyPrompt: 'Reply to {name}\'s latest email with a warm, professional, concise update. Acknowledge receipt, answer key points directly, and propose the next step.',
    emailSyncReady: 'Last sync complete',
    emailSyncConnectedTitle: 'Connected',
    emailSyncConnectedAs: 'Connected to {email}',
    emailSyncConnectedBody: 'Auto-sync is on. New mail will be checked automatically every 5 minutes.',
    emailSyncReconnectHint: 'To connect a different email account, choose another provider/email below and click Connect Email.',
    emailSyncNowAction: 'Sync Now',
    emailSyncUseAnotherEmail: 'Change Email',
    emailSyncDisconnect: 'Disconnect',
    emailSyncDisconnected: 'Email connection removed.',
    emailSyncApplied: 'Contact context has been updated from email threads.',
    emailSyncFailed: 'Email sync failed',
    emailSyncNeedContactEmail: 'Add at least one contact email before syncing.',
    emailSyncSummary: 'Fetched {fetched} messages, matched {matched}, updated {updated} contacts.',
    emailHostPlaceholder: 'IMAP host (example: imap.gmail.com)',
    emailUsernamePlaceholder: 'Email address',
    emailPasswordPlaceholder: 'Email code / app password',
    emailShowPassword: 'Show',
    emailHidePassword: 'Hide',
    emailSyncPasswordHintGeneric: 'Tip: use your email login code or app password.',
    emailSyncPasswordHintAppPassword: 'Tip: this provider usually requires an app password.',
    emailSyncPasswordHintChinaCode: 'Tip: use your mailbox authorization code.',
    emailSyncErrorInvalidEmail: 'Please enter a valid email address.',
    emailSyncErrorAddressMissing: 'Please enter your email address.',
    emailSyncErrorCodeMissing: 'Please enter your email code or app password.',
    emailSyncErrorProviderMismatch: 'This email belongs to {provider}. Please switch the provider above.',
    emailSyncErrorAuth: 'Login failed. Please check your email address and code/app password.',
    emailSyncErrorServer: 'Email connection is not reachable right now. Please try again later.',
    emailSyncErrorTimeout: 'Connection timed out. Please check your network and try again.',
    emailSyncErrorGeneric: 'Unable to connect email right now. Please try again.',
    emailProviderHelpTitle: 'How to get your code',
    emailProviderHelpGeneric: 'Use your email security settings to create an app password or mailbox authorization code.',
    emailProviderHelpItems: {
      qq: 'QQ Mail: Settings > Account > POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV > Generate authorization code.',
      '163': '163 Mail: Settings > POP3/SMTP/IMAP > Enable IMAP and get authorization code.',
      '126': '126 Mail: Settings > POP3/SMTP/IMAP > Enable IMAP and get authorization code.',
      sina: 'Sina Mail: Enable IMAP in account settings, then use the client authorization password if required.',
      sohu: 'Sohu Mail: Enable IMAP/POP in settings and use the mailbox authorization password.',
      gmail: 'Gmail: Google Account > Security > 2-Step Verification > App passwords.',
      outlook: 'Outlook/Hotmail: Microsoft account security > Advanced security options > Create app password.',
      yahoo: 'Yahoo: Account Security > Generate app password.',
      icloud: 'iCloud: Apple ID > Sign-In and Security > App-Specific Passwords.',
      aol: 'AOL: Account Security > Generate app password.',
      zoho: 'Zoho: Security settings > App Passwords.',
    },
    emailSinceDaysLabel: 'Lookback days',
    emailMaxMessagesLabel: 'Max messages',
    socialSyncNoContacts: 'No contacts available',
    socialSyncTargetContact: 'Target contact: {name}',
    socialSyncTargetRequired: 'Choose a contact to attach synced messages.',
    socialSyncSummary: 'Synced {contacts} contact(s), {messages} matched message(s).',
    socialSyncWebhookEndpoint: 'Webhook endpoint:',
    socialSyncGenericFailed: 'Sync failed. Please check your connection and try again.',
    telegramSyncHint: 'Capture messages from a Telegram bot inbox into one selected contact thread.',
    telegramBotTokenPlaceholder: 'Telegram bot token',
    telegramChatIdPlaceholder: 'Chat ID (optional, recommended)',
    telegramSyncAction: 'Sync Telegram',
    telegramBotTokenRequired: 'Bot token is required.',
    dingTalkSyncHint: 'Capture DingTalk messages through approved webhook/import setup, then attach them to your selected contact.',
    dingTalkAppKeyPlaceholder: 'DingTalk account ID',
    dingTalkSyncCodePlaceholder: 'DingTalk sync code',
    dingTalkSyncAction: 'Sync DingTalk',
    dingTalkAppKeyRequired: 'DingTalk account ID is required.',
    dingTalkSyncCodeRequired: 'DingTalk sync code is required.',
    dingTalkConnectedHint: 'Connected to {appKey}',
    dingTalkReconnectHint: 'This account is already connected.',
    dingTalkWebhookPath: 'POST /api/dingtalk/webhook',
    whatsAppSyncHint: 'Capture WhatsApp Business webhook messages into a selected contact. This does not read arbitrary WhatsApp history.',
    whatsAppPhoneNumberIdPlaceholder: 'WhatsApp account number',
    whatsAppSyncCodePlaceholder: 'WhatsApp sync code',
    whatsAppSyncAction: 'Sync WhatsApp',
    whatsAppPhoneNumberIdRequired: 'WhatsApp account number is required.',
    whatsAppSyncCodeRequired: 'WhatsApp sync code is required.',
    whatsAppWebhookPath: 'POST /api/whatsapp/webhook',
    weChatNoApiTitle: '⚠️ WeChat has no public API',
    weChatNoApiBody: 'Direct sync is not supported by Tencent. Use one of the workarounds below.',
    weChatPasteTitle: '✅ Recommended: Paste method',
    weChatPasteBody: 'Copy any WeChat conversation on your phone or PC, then paste it into the "Message from:" box on a contact card. No API needed.',
    weChatWorkSectionTitle: '企业微信 (WeChat Work) — API sync',
    weChatWorkSectionBody: 'Only available if your organisation uses WeChat Work. Ask your IT admin for Corp ID and Corp Secret.',
    weChatSyncHint: 'WeChat has no public API — direct sync is not possible. Use the paste method on any contact card, or switch to WeChat Work (企业微信) which supports API integration.',
    weChatWorkspaceIdPlaceholder: 'WeChat Work Corp ID (企业微信 CorpID)',
    weChatSyncCodePlaceholder: 'WeChat Work Corp Secret',
    weChatSyncAction: 'Sync WeChat Work',
    weChatWorkspaceIdRequired: 'Corp ID is required (WeChat Work only).',
    weChatSyncCodeRequired: 'Corp Secret is required (WeChat Work only).',
    weChatWebhookPath: 'POST /api/wechat/webhook',
    smartCaptureTitle: 'Smart paste inbox',
    smartCaptureHintPrefix: 'Paste the latest message from ',
    smartCaptureHintSuffix: '.',
    smartCaptureAction: '+ Capture received message',
    smartCaptureCollapsed: 'Capture received message',
    smartCapturePlaceholder: 'Paste the client message, WeChat thread excerpt, email paragraph, or meeting note...',
    messageFromLabel: 'Message from:',
    messagesLabel: 'Messages',
    expandMessageAria: 'Expand message editor',
    collapseMessageAria: 'Collapse message editor',
    pasteFromClipboard: 'Paste',
    saveInboundMessage: 'Save',
    saveAndCompose: 'Save & open composer',
    captureSaved: 'Received message saved to this contact timeline.',
    captureError: 'Paste or type a message before saving.',
    capturedTimelineTitle: 'Recent',
    capturedTimelineEmpty: 'No messages saved',
    timelineInbound: 'Received',
    timelineOutbound: 'Sent',
    timelineNote: 'Note',
    timelinePartiesLine: 'From {sender} · To {receiver}',
    memoryPanelTitle: 'Relationship memory',
    memoryPanelSubtitle: 'Used automatically when you generate replies for this contact.',
    memoryRolePlaceholder: 'Role (e.g. buyer, vendor lead)',
    memoryTopicsPlaceholder: 'Recurring topics (comma-separated)',
    memoryNotesPlaceholder: 'Relationship notes, promises, preferences…',
    memoryStyleLabel: 'Tone',
    memoryStyleFormal: 'Formal',
    memoryStyleWarm: 'Warm',
    memoryStyleDirect: 'Direct',
    memoryStyleConcise: 'Concise',
    memorySave: 'Save memory',
    companyFilesTitle: 'Company files',
    companyFilesHint: 'Attach brochures, catalogues, receipts, or screenshots.',
    waitingOnYouLabel: 'Waiting on you',
    waitingOnThemLabel: 'Awaiting client',
    syncedEmailNeedsReplyBody: 'Synced email from {name} is waiting for your reply.',
    syncedEmailNeedsReplyIntent: 'Reply to synced email',
    waitingOnYouBody: '{name} sent a message {days} day(s) ago and is still waiting on you.',
    waitingOnThemBody: 'You told {name} you would "{summary}" {days} day(s) ago. Check whether they still need an update.',
    waitingOnThemFallback: 'follow up',
    followUpTaskPrompt: 'Draft a concise follow-up reply to {name}. Reference their latest message: {summary}.',
    promiseCheckTaskPrompt: 'Draft a short check-in for {name} about this commitment: {summary}. Keep it clear and proactive.',
    insightFollowUpPrompt: 'Draft a concise follow-up for {recipient}. Intent: {intent}. Goal: {goal}. Timing: {timing}.',
    followUpTaskTitle: 'Follow up with a contact',
    followUpTaskBody: 'You have not followed up with {name} in {days} days.',
    wizardStepCount: 'Step {{current}} of {{total}}',
    wizardNext: 'Next',
    wizardBack: 'Back',
    wizardSkipForNow: 'Skip for now',
    wizardSaveAndFinish: 'Save contact',
    wizardStep1Title: 'Who is this contact?',
    wizardStep1Description: 'Just the basics. You can add more details next, or skip.',
    wizardStep2Title: 'Relationship',
    wizardStep2Description: 'Helps Reply Assistant match the tone they expect.',
    wizardStep3Title: 'Communication preference',
    wizardStep3Description: 'How they like to be addressed and which language to reply in.',
    wizardStep4Title: 'Do\'s and don\'ts',
    wizardStep4Description: 'Anything we should always do — or never do — when replying to them?',
    wizardRoleLabel: 'Role or title',
    wizardRolePlaceholder: 'VP of Sales, Head of Procurement…',
    wizardCommunicationStyleLabel: 'Communication style',
    wizardCommunicationStyleNone: 'No preference',
    wizardPreferredLanguageLabel: 'Reply in',
    wizardPreferredLanguageAuto: 'Auto-detect',
    wizardPreferredLanguageEn: 'English',
    wizardPreferredLanguageZh: 'Chinese',
    wizardDosAndDontsLabel: 'Do\'s and don\'ts',
    wizardDosAndDontsPlaceholder: 'Prefers bullet points. Never use emoji. Always confirm Q3 pricing in the opener.',
    stageLabels: {
      'new-lead': 'New lead',
      'active-client': 'Active client',
      'vip-client': 'VIP client',
      'follow-up': 'Follow-up',
      closed: 'Closed',
      internal: 'Internal',
    },
  },
  snippetLibrary: {
    frameLabel: 'Snippet Library',
    frameTitle: 'Reusable templates',
    addSnippet: 'Add snippet',
    searchPlaceholder: 'Search snippets...',
    noResults: 'No snippets match your search.',
    titlePlaceholder: 'Title',
    textPlaceholder: 'Template text...',
    save: 'Save',
    cancel: 'Cancel',
    insertIntoInput: 'Reuse',
    deleteSnippet: 'Delete {{title}}',
    removeSnippetTitle: 'Remove this snippet?',
    removeSnippetConfirm: 'Are you sure you want to remove this snippet?',
    removeSnippetAction: 'Remove',
    defaultSnippets: [
      {
        id: 'follow-up-gentle',
        title: 'Gentle follow-up',
        text: 'Hi there, just following up on our previous message. Please let me know if you need any clarification and I will gladly assist.',
      },
      {
        id: 'close-confirmation',
        title: 'Close confirmation',
        text: 'Thanks for confirming. I have locked this in on our side and will share the final update shortly.',
      },
      {
        id: 'internal-alignment',
        title: 'Internal alignment note',
        text: 'Team, here is the latest customer context and requested action. Please review and confirm owners before close of day.',
      },
      {
        id: 'pricing-clarity',
        title: 'Pricing clarification',
        text: 'Thanks for your question on pricing. The quoted amount covers implementation and support as discussed. I can also share a cost breakdown if helpful.',
      },
    ],
  },
  resetData: {
    frameLabel: 'Reset Data',
    frameTitle: 'Remove local work data',
    intro: 'Choose what to clear from this device. Your settings, profile, and connected email accounts stay unless you reset them elsewhere.',
    selectAll: 'Select all work data',
    clearSelection: 'Clear selection',
    reviewReset: 'Review reset',
    keepNote: 'Keeps: app settings, language, your profile ID, and email or social connection setup in Settings.',
    confirmTitle: 'Reset selected data?',
    confirmBody: 'This permanently removes the selected local data from Reply Assistant on this device. Draft quality may drop until you add contacts and context again.',
    confirmAcknowledge: 'I understand this cannot be undone.',
    confirmAction: 'Reset now',
    successMessage: 'Selected data was reset. The app is ready for a fresh start.',
    domains: {
      contacts: {
        title: 'Contacts & threads',
        description: 'Contact cards, message timelines, relationship memory, per-contact files, and your selected contact.',
      },
      workContext: {
        title: 'Work context & files',
        description: 'Business context fields and company learning files attached in Work Context.',
      },
      draftMemory: {
        title: 'Snippets & recent replies',
        description: 'Snippet Library templates, recent reply history, and read message markers.',
      },
      queues: {
        title: 'Queues & inbox',
        description: 'Today Queue progress, Action Inbox cards, and daily task snapshots.',
      },
      companionSignals: {
        title: 'Companion learning signals',
        description: 'Work rhythm habits, usage counters, milestones, tone presets, and session hints.',
      },
    },
  },
  miniScreen: {
    back: 'Back',
  },
  businessContext: {
    frameLabel: 'Business Context',
    frameTitle: 'Your workspace profile',
    intro: 'These details help generate more accurate replies tailored to your brand and industry.',
    editHint: 'Tap the pencil icon on any card to add or update that field.',
    done: 'Done',
    cancel: 'Cancel',
    yourNameLabel: 'YOUR NAME',
    yourNamePlaceholder: 'e.g. Alex Morgan',
    companyNameLabel: 'Company / Brand name',
    companyNamePlaceholder: 'e.g. Acme Corp',
    yourPositionLabel: 'YOUR POSITION',
    yourPositionPlaceholder: 'e.g. Account Executive',
    industryLabel: 'Industry',
    industryPlaceholder: 'e.g. SaaS, E-commerce, Real Estate',
    productsServicesLabel: 'Products / Services',
    productsServicesPlaceholder: 'Describe what you sell or offer...',
    brandVoiceLabel: 'Brand voice',
    brandVoicePlaceholder: 'e.g. Professional but approachable, no jargon',
    commonObjectionsLabel: 'Common objections / FAQs',
    commonObjectionsPlaceholder: 'e.g. \'Too expensive\', \'Why not your competitor?\'',
    doNotSayLabel: 'Do not say',
    doNotSayPlaceholder: 'Hard rules, escalation phrases to avoid...',
    companyFilesTitle: 'Company files',
    companyFilesHint: 'Attach brochures, catalogues, price lists, or screenshots.',
  },
  todayQueue: {
    frameLabel: 'Today Queue',
    frameTitle: 'Priority tasks',
    intro: 'Focus on these quick wins first.',
    taskLabel: 'Next best action',
    useNow: 'Use now',
    snooze: 'Snooze',
    markDone: 'Done',
    estMinutes: '~{{minutes}} min',
    dailyImpactSummary: 'Today: {{done}} done · {{usedNow}} use-now ·',
    emptyTitle: 'Queue complete',
    emptyBody: 'All key tasks are done for today.',
    celebrateTitle: 'Queue cleared! 🎉',
    celebrateBody: 'Great work. Queue is complete.',

    clearUnreadTitle: 'Clear unread inbox alerts',
    clearUnreadBody: '{{count}} unread messages need action.',
    followUpTitle: 'Draft a fast follow-up',
    followUpBody: 'Send a short follow-up to move one thread forward.',
    warmupTitle: 'Generate your first reply',
    warmupBody: 'Start with one quick draft to build momentum.',
    enrichContextTitle: 'Complete business context',
    enrichContextBody: '{{count}}/{{total}} context fields filled. Add a bit more for better drafts.',
    buildSnippetsTitle: 'Expand snippet library',
    buildSnippetsBody: '{{count}} snippets saved. Add reusable templates for repeat replies.',
    followUpPrompt: 'Write a concise and polite follow-up that references our last message and asks for the next step.',
    warmupPrompt: 'Write a short professional reply acknowledging the message and confirming we are working on it.',
  },
  actionInbox: {
    frameLabel: 'Action Inbox',
    frameTitle: 'Follow-up command center',
    intro: 'Convert generated insights into focused work actions without losing context.',
    createdLabel: 'Created',
    completedLabel: 'Completed',
    completionRateLabel: 'Completion',
    emptyTitle: 'Inbox is clear',
    emptyBody: 'No pending action cards right now. Add one from the generated reply modal.',
    highRisk: 'High risk',
    mediumRisk: 'Medium risk',
    lowRisk: 'Low risk',
    priorityLabel: 'Priority',
    followUpLabel: 'Follow-up',
    doNow: 'Do now',
    defer: 'Defer',
    delegate: 'Delegate draft',
    removeActionTitle: 'Remove this action?',
    removeActionConfirm: 'This action card will be removed from Action Inbox.',
    removeActionButton: 'Remove',
  },
  instantAmmo: {
    title: 'Quick Start',
    scenarios: {
      'running-late':    { label: 'Running late',     prompt: "I'm running late to the meeting by about 10 minutes, please start without me." },
      'polite-decline':  { label: 'Decline politely', prompt: 'I need to politely decline this request while preserving the relationship.' },
      'follow-up':       { label: 'Follow up',        prompt: "Following up on my message from last week that hasn't been replied to yet." },
      'ask-extension':   { label: 'Ask for extension',prompt: 'I need to request a deadline extension due to unexpected workload this week.' },
      'thank-colleague': { label: 'Thank colleague',  prompt: 'Thank you so much for your help on this project, it really made a difference.' },
      'escalate':        { label: 'Escalate urgently',prompt: 'This issue requires immediate attention and must be escalated to senior leadership.' },
      'cold-outreach':   { label: 'Cold outreach',    prompt: 'Draft a concise cold-outreach opener that references this contact and their company, names a clear business reason for reaching out, and ends with one specific next step.' },
      'pitch-followup':  { label: 'Follow up on pitch', prompt: 'Write a warm but direct follow-up after the recent pitch — confirm the value points already discussed, address any silence, and propose a concrete next conversation.' },
      'objection-price': { label: 'Handle price objection', prompt: 'Reframe a price objection without lowering price first: tie investment to the outcome they care about, surface the cost of inaction, and offer one optional pilot scope.' },
      'closing-nudge':   { label: 'Closing nudge',    prompt: 'Send a confident, low-pressure closing nudge. Recap the decision they have already aligned on, ask the explicit close question, and propose the next step on the calendar.' },
      're-engagement':   { label: 'Re-engage silent client', prompt: 'Reopen a quiet relationship with humility — acknowledge the silence without apologising too much, share one new relevant update, and ask whether priorities have shifted on their side.' },
    },
  },
  milestones: {
    congratulations: 'Rank Unlocked!',
    unlocked: 'achieved',
  },
  weeklyRecap: {
    frameLabel: 'Weekly Recap',
    frameTitle: 'Your week in replies',
    introLine: 'Volume, streak, and who you touched—one calm check on your reply habit.',
    thisWeek: 'This week',
    repliesLabel: 'Replies',
    streakLabel: 'Day streak',
    timeSavedLabel: 'Est. time saved',
    timeSavedUnit: 'min',
    topRecipientLabel: 'Top recipient',
    needsReplyLabel: 'Need reply',
    followUpsDueLabel: 'Follow-ups',
    noDataTitle: 'No replies tracked yet',
    noDataBody:
      'Generate one reply from the main composer to start the loop; we will track streaks and estimated time saved here.',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    queueSparklineLabel: 'Min saved · Queue',
  },
  noAppData: {
    title: 'Sorry, no data available',
    body:
      'This screen fills in once you set up the app. Start with contacts so replies can learn about the people you write to, then add work context for your role and company.',
    contactsHint: 'Best first step',
    contactsLead: 'Add contacts and paste a message or note so the app can learn each relationship.',
    workContextHint: 'Next step',
    workContextLead: 'Add work context so drafts match your company, role, and voice.',
  },
  onboarding: {
    next: 'Next',
    getStarted: 'Get Started',
    skip: 'Skip',
    hotkeyKeysMac: ['Cmd', 'Shift', 'R'],
    hotkeyKeysWin: ['Ctrl', 'Shift', 'R'],
    rankThresholds: ['30+', '70+', '120+'],
    quickStartPreview: ['⏰ Running late', '🙏 Decline politely', '📬 Follow up', '📅 Ask for extension'],
    steps: [
      {
        title: 'Built for one relationship at a time',
        body:
          'Drafts for the contact you choose: their thread and your saved context in one flow—not a blank prompt box. Contacts and settings stay on this device unless you connect sync.',
      },
      {
        title: 'Your global hotkey',
        body: 'Open the assistant from any app. Pick the right contact, paste what they said, generate, copy—without juggling browser tabs.',
      },
      {
        title: 'Earn ranks as you reply',
        body: 'Reach milestones to unlock tone profiles and Mirror Mode—shortcuts for repeat relationships.',
        hint: 'Silver (30) · Gold (70) · Platinum (120)',
      },
      {
        title: 'One-tap quick start',
        body: 'Scenario chips draft common replies fast; each run still respects the contact you have selected.',
      },
    ],
  },
  guidedTour: {
    next: 'Next',
    finish: 'Got it',
    skip: 'Skip tour',
    stepCount: 'Tour · step {{current}} of {{total}}',
    sampleContactName: 'Sample · Sarah Chen',
    sampleContactCompany: 'Acme Procurement',
    sampleContactRole: 'Head of Procurement',
    sampleContactNotes: 'Sample contact — delete from Contacts whenever you like.',
    sampleContactRelationshipNotes: 'Prefers concise replies that confirm next steps explicitly.',
    sampleContactPreferredLanguage: 'English',
    sampleInboundText: 'Hi — just confirming our Q3 order is still on track for the original Friday delivery. Please reply when you have a moment so I can update my team. Thanks!',
    steps: {
      'daily-brief': {
        title: 'This is your Daily Brief',
        body: 'Your next action lives here every morning. Tap the dark button to pick up where you left off.',
      },
      'add-contact': {
        title: 'Every reply gets sharper with one contact',
        body: 'Open Contacts to add a real client. We seeded a sample so you can try the flow before adding your own.',
      },
      'quick-start': {
        title: 'Quick Start scenarios',
        body: 'Pick a chip to draft common replies in one tap — the contact you have selected stays in the loop.',
      },
      'cmd-k': {
        title: '⌘K is your shortcut to everything',
        body: 'Press Cmd+K (or Ctrl+K) any time to open contacts, draft a reply, or follow up.',
      },
    },
    replayTitle: 'Replay guided tour',
    replayDescription: 'Re-run the 30-second tour any time. Useful when you want a refresher or you are showing a colleague.',
    replayButton: 'Replay tour',
  },
  relationshipMemory: {
    eyebrow: 'Their rhythm',
    repliesWithinMinutes: 'Usually replies within ~{{minutes}} min',
    repliesWithinHours: 'Usually replies within ~{{hours}} hr',
    repliesWithinOneDay: 'Usually replies within ~1 day',
    repliesWithinDays: 'Usually replies within ~{{days}} days',
    prefersShort: 'prefers short messages',
    prefersLong: 'prefers longer messages',
    formalBias: 'your tone with them tends formal',
    casualBias: 'your tone with them tends casual',
    separator: ' · ',
  },
  intent: {
    eyebrow: 'Intent',
    request: 'Request',
    approval: 'Approval',
    negotiation: 'Negotiation',
    followUp: 'Follow-up',
    escalation: 'Escalation',
    apology: 'Apology',
    scheduling: 'Scheduling',
    feedback: 'Feedback ask',
    statusUpdate: 'Status update',
    reminder: 'Reminder',
    urgencyHigh: 'Urgent',
    urgencyMedium: 'Soon',
    separator: ' · ',
  },
  rewriteModes: {
    eyebrow: 'Try as',
    diplomatic: 'Diplomatic',
    leadership: 'Leadership',
    negotiation: 'Negotiation',
    customerSupport: 'Customer support',
    recruiting: 'Recruiting',
    voiceLikeMe: 'Write like me',
  },
  outcomeSignals: {
    eyebrow: 'Signals',
    clarity: 'Clarity',
    hasClearCTA: 'Clear next step',
    professional: 'Professional tone',
  },
  followUps: {
    eyebrow: 'Also waiting',
    waitingOn: 'Waiting on {{name}}',
    overdueMinutes: 'overdue by ~{{minutes}} min',
    overdueHours: 'overdue by ~{{hours}} hr',
    overdueOneDay: 'overdue by ~1 day',
    overdueDays: 'overdue by ~{{days}} days',
    separator: ' · ',
  },
  sendTiming: {
    eyebrow: 'Best sent',
    recommendedTime: 'around {{time}} — that is when they usually read',
  },
  systemHealth: {
    frameLabel: 'System Health',
    frameTitle: 'Provider Diagnostics',
    intro: 'Check whether the writing connections are ready before you rely on them.',
    preferredProvider: 'Preferred connection',
    lastChecked: 'Last checked',
    refresh: 'Check again',
    refreshing: 'Refreshing...',
    errorPrefix: 'Connection check error',
    configured: 'Configured',
    latency: 'Latency',
    model: 'Writing model',
    reason: 'Reason',
    yes: 'Yes',
    no: 'No',
    empty: 'No diagnostics returned yet.',
  },
};

const ZH: TranslationBundle = {
  languageOptions: [
    { value: 'auto', label: '自动' },
    { value: 'en', label: '英语' },
    { value: 'zh', label: '中文' },
  ],
  textTypes: [
    { id: 'shorter-reply', label: '更短回复' },
    { id: 'longer-detailed', label: '更长 / 更详细回复' },
    { id: 'persuasive', label: '更有说服力' },
    { id: 'apologetic-polite', label: '道歉 / 礼貌' },
    { id: 'casual-friendly', label: '轻松 / 友好' },
    { id: 'formal-professional', label: '正式 / 专业' },
    { id: 'follow-up', label: '跟进消息' },
    { id: 'suggestion', label: '建议' },
    { id: 'simplify', label: '简化' },
    { id: 'improve', label: '优化' },
    { id: 'polish-english', label: '润色我的英文' },
  ],
  workModes: {
    reply: '外部',
    internal: '内部',
  },
  recipientLabels: {
    'new-lead': '新线索',
    'existing-client': '现有客户',
    'vip-client': 'VIP 客户',
    leader: '领导',
    colleague: '同事',
    others: '其他',
  },
  tonePresetLabels: {
    executive: '高管风格',
    friendly: '友好',
    urgent: '紧急',
    casual: '随和',
  },
  toneControlLabels: {
    composer: '语气调节',
    formality: '正式度',
    warmth: '温暖度',
    urgency: '紧迫度',
    confidence: '信心度',
  },
  rankUnlocks: {
    confidenceHint: '白银解锁：信心度滑块已开启',
    saveToneProfile: '保存语气配置',
    savedProfiles: '已保存配置',
    noSavedProfiles: '暂无保存的配置',
    mirrorMode: '镜像模式',
    mirrorModeDesc: '将生成回复自动填入输入框',
    profileSaved: '语气配置已保存',
    silverHint: '达到白银（30 条回复）即可解锁',
    goldHint: '达到黄金（70 条回复）即可解锁',
    platinumHint: '达到铂金（120 条回复）即可解锁',
  },
  placeholders: {
    reply: '粘贴对方消息——生成会基于你选中的联系人与往来线程，而不是空白聊天框。',
    internal: '粘贴内部备注——草稿会使用已保存的工作背景，不是漫无目的的对话。',
  },
  floating: {
    openMoreFeatures: '打开更多功能',
    pasteAndGo: '粘贴并生成',
    pasteAndGenerate: '从剪贴板粘贴并生成',
    attachFiles: '添加文件',
    attachmentsAdded: '文件已添加',
    attachmentUploadFailed: '无法添加文件',
    uploadLimitReached: '已达到上传上限',
    removeLastLearningFileTitle: '删除最后一个学习文件？',
    removeLastLearningFileBody: '您在此添加的图片、PDF、表格和文档会帮助 Reply Assistant 学习真实业务背景，从而生成更准确的回复。删除最后一个文件将清空已学习的内容。',
    removeLastLearningFileConfirm: '确定要删除吗？',
    removeLastLearningFileKeep: '保留文件',
    removeLastLearningFileAction: '仍然删除',
    generate: '生成',
    generating: '生成中...',
    generateShortcut: '生成 (Cmd/Ctrl + Enter)',
    repliesOne: '条回复',
    repliesMany: '条回复',
    dayShort: '天',
    copiedToClipboard: '已复制到剪贴板',
    copiedGeneratedReply: '已复制生成回复',
    copiedGeneratedReplySavedToContact: '已复制 · 已记入 {{name}}',
    autoCopied: '已自动复制到剪贴板',
    autoCopiedSavedToContact: '已自动复制 · 已记入 {{name}}',
    systemSnapshotTitle: '连接状态',
    systemSnapshotSummary: '{{healthy}}/{{total}} 个连接已就绪',
    systemSnapshotPreferred: '主要',
    systemSnapshotRefresh: '重新检查',
    systemSnapshotChecking: '检查中…',
    nextUpLabel: '下一件',
    openActionCenter: '打开行动',
    closeActionCenter: '关闭',
    dailyBriefLabel: '每日简报',
    justNow: '刚刚',
    minutesAgoShort: '{{count}} 分钟前',
    hoursAgoShort: '{{count}} 小时前',
    daysAgoShort: '{{count}} 天前',
    actionsWaitingOne: '1 项待处理',
    actionsWaitingMany: '{{count}} 项待处理',
    needsYourReply: '{{name}} 需要你回复',
    activeClient: '{{name}} 是当前重点客户',
    clientFallbackBody: '打开该客户，并基于已保存的上下文继续处理。',
    memoryCueTitle: '已记住的背景',
    memoryCueCommitment: '待处理承诺',
    memoryCueLearning: '已学习偏好',
    memoryCueExpandAria: '展开全部记忆背景',
    memoryCueCollapseAria: '收起记忆背景',
    memoryCueBasedOnMessages: '基于 {{count}} 条消息',
    memoryCueOpenCommitmentsHeading: '待处理承诺',
    memoryCueThreadSummaryHeading: '会话摘要',
    memoryCueReplyLearningHeading: '回复学习',
    memoryCueDoneAria: '标记为已完成',
    memoryCueEditAria: '编辑会话摘要',
    memoryCueSaveLabel: '保存',
    memoryCueCancelLabel: '取消',
    memoryCueSummaryPlaceholder: '这段会话主要是关于……',
    memoryCueKindPromise: '承诺',
    memoryCueKindNeedsReply: '待回复',
    memoryCueKindAccepted: '已采用',
    memoryCueKindEdited: '已编辑',
    memoryCueKindRegenerated: '已重写',
    memoryCueButtonAria: '查看已记住的背景',
    memoryCueStackClose: '关闭已记住的背景',
    memoryCueGuideHeading: '需要处理：{{name}}',
    memoryCueActReply: '立即回复',
    memoryCueActFollowUp: '跟进',
    memoryCueDoneLabel: '标记完成',
    memoryCueLearnedHeading: '已学习',
    actionInboxContactReason: '原因：这项任务关联到一个需要回复的联系人。',
    actionInboxPriorityReason: '原因：这是行动收件箱里优先级最高的事项。',
    latestInboundReason: '原因：对方最新发来的消息之后，还没有新的对外回复。',
    selectedClientReason: '原因：这是你选中的客户，或最近最活跃的客户线程。',
    draftReadyReason: '原因：已有一份基于上下文的草稿在等待你查看。',
    addDetailReason: '原因：这个联系人还缺一个关键信息，补充后才能更有把握地起草。',
    followUpReason: '原因：你正在等待对方，现在适合跟进。',
    reviewFileTitle: '检查 {{filename}}',
    reviewFileBody: '有一个附件需要快速确认，之后我才能把它当作依据使用。',
    reviewFileCta: '检查文件',
    reviewFileReason: '原因：低置信度提取内容需要先确认，再用于起草。',
    reviewFileHeader: '请先检查附件内容',
    addDetailMicroAsk: '粘贴最新消息，或给这个联系人补一条简短备注。',
    addDetailMicroAskCta: '粘贴信息',
    addDetailHeader: '粘贴需要我记住的信息',
    clearTitle: '现在没有紧急事项',
    clearBody: '当前没有需要你处理的客户线程。需要准备下一步时，可以查看联系人。',
    clearReason: '原因：目前没有逾期的客户动作。',
    reviewContactsCta: '查看联系人',
    replyNow: '立即回复',
    useContact: '使用联系人',
    addDetailCta: '补充信息',
    followUpCta: '跟进',
    contactInComposer: '联系人已在写作区',
    startClientMemoryTitle: '先建立一个客户记忆',
    startClientMemoryBody: '添加联系人或粘贴客户消息，让回复基于真实关系，而不是空白聊天。',
    startClientMemoryReason: '原因：客户记忆是普通聊天机器人没有的护城河。',
    addContact: '添加联系人',
    referralNudgeTitle: '这个流程正在帮你',
    referralNudgeBody: '你已复制 {{count}} 条回复。如果觉得有用，可以分享给做销售的朋友。',
    referralNudgeInvite: '邀请',
    referralNudgeDismiss: '暂时不用',
    commandNeedsReply: '待回复',
    commandWaiting: '等待中',
    commandCaptured: '已记录',
    commandDrafts: '草稿',
    contactMatchConfirmTitle: '确认客户上下文',
    contactMatchPossibleTitle: '可能的联系人',
    hide: '隐藏',
    contactMatchPausedBody: '粘贴并生成已暂停，避免基于错误客户记忆生成回复。',
    searchContacts: '搜索联系人',
    useSelectedContact: '使用当前联系人',
    useWithoutContact: '不使用联系人',
    commandCapture: '记录',
    commandContacts: '联系人',
    commandQueue: '队列',
    commandReplies: '回复',
    addFollowUp: '+ 添加跟进',
    addedToQueue: '已加入队列',
    openToneComposer: '打开语气调节',
    toneComposerModalTitle: '语气调节',
    toneComposerModalSubtitle: '在生成前调整正式度、温度与紧迫度。',
    toneComposerDone: '应用语气',
    toneComposerClose: '关闭',
    targetLabel: '目标',
    attentionToastNeedsReply: '{{name}} 等待您的回复',
    attentionToastActionWaiting: '新待办已就绪',
    attentionToastNewMail: '{{name}} 发来新消息',
    attentionToastDraftReady: '{{name}} 的草稿已就绪',
    attentionToastDraftReadyBody: '已为您预先撰写一条回复，打开即可一键复制。',
    attentionToastDraftReadyOpen: '打开草稿',
    attentionToastAct: '打开',
    attentionToastDismiss: '稍后',
    cmdKPlaceholder: '输入姓名、请求回复，或粘贴消息……',
    cmdKHintLabel: '需要帮助？按 {{shortcut}}',
    cmdKHintDismiss: '隐藏',
    cmdKEmptyState: '或从下方建议中选择一项。',
    cmdKActionOpenContact: '打开 {{name}}',
    cmdKActionDraftReply: '撰写回复给 {{name}}',
    cmdKActionFollowUp: '跟进 {{name}}',
    cmdKActionUseAsMessage: '作为新消息使用',
    cmdKShortcutMac: '⌘K',
    cmdKShortcutWin: 'Ctrl+K',
    cmdKForYouLabel: '现在适合您',
    cmdKSuggestReply: '回复 {{name}}',
    cmdKSuggestFollowUp: '跟进 {{name}}',
    cmdKSuggestResume: '继续处理 {{name}}',
    cmdKSuggestPaste: '粘贴消息开始',
    smartChipReplyTo: '{{name}} 等待您的回复',
    smartChipFollowUp: '该跟进 {{name}} 了',
    smartChipResume: '继续与 {{name}}',
    smartChipPaste: '在此粘贴最新消息',
    smartChipDismiss: '稍后',
    dailyBriefMorning: '早上好',
    dailyBriefAfternoon: '下午好',
    nextStepPickContactHint: '从这里开始',
    nextStepGenerateHint: '点击生成回复',
    nextStepCopyHint: '复制即可发送',
    smartReplyLabel: '智能回复',
    smartReplyShort: '回复',
    smartReplyHint: '一键基于他们最新的消息生成回复',
    openDraft: '查看草稿',
    draftReadyEyebrow: '草稿已就绪',
    draftReadyBody: '我已为您起草回复，一键即可复制发送。',
    smartReplyUnavailable: '暂无最新来信',
    replyInEn: '用英文回复',
    replyInZh: '用中文回复',
    draftTranslateFailed: '无法翻译草稿，请重试。',
    languageRecommendChip: '→ {{label}}',
    languageRecommendApply: '切换回复语言为 {{label}}',
    languageRecommendTitle: '对方最新消息看起来是 {{label}}',
    culturalTipEyebrow: '跨语言提示',
    culturalTipZhToEnProspect: '西方潜在客户 — 直接说明价值比寒暄更有说服力。',
    culturalTipZhToEnVip: '高端 VIP 客户 — 简洁、正式，避免过度寒暄。',
    culturalTipZhToEnDefault: '回复采用直接、专业的英文表达，避免直译中文套语。',
    culturalTipEnToZhDefault: '回复使用稳重得体的中文，避免英文中常见的直白措辞。',
    culturalTipEnToZhLeader: '对领导更加委婉、尊重，结尾使用请示语。',
    culturalTipMixedClarity: '来信中英文混杂 — 回复将每个意思保留在同一种语言中，确保表达清晰。',
    culturalTipPolishEnglish: '润色您的英文表达而不改变原意。事实保持不变，仅优化语法、语气和流畅度。',
    impressionCheckTitle: '回复印象检查',
    impressionFormalityLabel: '正式度匹配',
    impressionToneLabel: '语气风险',
    impressionLengthLabel: '篇幅',
    impressionStatusOk: '正常',
    impressionStatusWarn: '请确认',
    impressionAutoSoften: '自动柔化',
    impressionReasonFormalityTooCasualForVip: '对 VIP 客户来说过于随意。',
    impressionReasonFormalityTooCasualForLeader: '对领导来说过于随意。',
    impressionReasonFormalityTooStiffForCasual: '对轻松场景来说过于生硬。',
    impressionReasonToneAggressive: '部分措辞可能显得强硬。',
    impressionReasonTonePassive: '语气过于犹豫，可能弱化表达。',
    impressionReasonToneOverpromise: '出现无法保证的承诺。',
    impressionReasonLengthTooBrief: '比该类型回复通常更短。',
    impressionReasonLengthTooLong: '比该类型回复通常更长。',
    voiceMatchLearning: '正在学习您的语气',
    voiceMatchSimilar: '听起来像您',
    voiceMatchDifferent: '与您平时不同 — 请检查语气。',
    voiceMatchUnknown: '尚无语气基线',
    voiceMatchSampleCount: '基于 {{count}} 条历史回复',
    highStakesGuardEyebrow: '最终确认',
    highStakesGuardTitleVip: '发送给 VIP 客户？',
    highStakesGuardTitleLeader: '发送给您的领导？',
    highStakesGuardBody: '高风险收件人 — 请先查看印象检查再复制。',
    highStakesGuardConfirm: '复制并发送',
    highStakesGuardCancel: '继续编辑',
    whyExpandLabel: '查看完整依据',
    whyCollapseLabel: '收起详情',
    whyDetailLatestMessage: '最新来信',
    whyDetailRelationshipMemory: '关系记忆',
    whyDetailBusinessContext: '业务背景',
    whyDetailYourInput: '您的输入',
    whyDetailRecentTimeline: '近期对话',
    whyDetailAttachments: '附件',
    whyDetailNothingGrounded: '暂无明确依据 — 仅基于您的请求生成。',
    notificationNewMailTitle: '{{name}} 发来新消息',
    notificationNewMailBody: '打开 Reply Assistant 查看最新消息并生成回复。',
    notificationDraftReadyTitle: '{{name}} 的草稿已就绪',
    notificationDraftReadyBody: '已为您起草回复 — 打开 Reply Assistant 查看并复制。',
    coach: {
      eyebrow: '助手提醒',
      missingAsk: '发送前先明确请求或下一步。',
      confrontational: '语气偏指责 — 换种说法更顺。',
      tooLong: '比您平时回复对方的长度更长。',
      allCaps: '通篇大写显得像在喊 — 去掉大写强调。',
      fix: '修正',
      dismiss: '知道了',
    },
  },
  focusPlan: {
    eyebrow: '专注计划',
    title: '下一步工作',
    open: '打开计划',
    close: '关闭计划',
    rankNow: '从这里开始',
    rankNext: '下一项',
    rankLater: '稍后',
    whereLabel: '位置',
    whenLabel: '时间',
    estimateMinutes: '约 {{minutes}} 分钟',
    whenNow: '现在',
    whenNext: '接下来',
    whenToday: '今天',
    whenBeforeDrafting: '起草前',
    whenWhenReady: '准备好时',
    whenAround: '最佳时间约{{time}}',
    clockTime: '{{period}}{{hour}}点',
    timeAm: '上午',
    timePm: '下午',
    whereDraft: '查看草稿',
    whereActionInbox: '行动收件箱',
    whereComposer: '写作区',
    whereBusinessContext: '业务背景',
    whereContactMemory: '联系人记忆',
    whereTodayQueue: '今日队列',
    whereContacts: '联系人',
    draftTitle: '{{name}} 的草稿已就绪',
    draftBody: '已有一条基于上下文的回复等待查看。',
    replyTitle: '回复 {{name}}',
    detailTitle: '补充 {{name}} 的背景',
    followUpTitle: '跟进 {{name}}',
    openLoopTitle: '{{name}} 可能正在等待',
    openLoopBody: '对方最新消息之后，还没有新的回复。',
    todayTaskReason: '原因：这个小任务能让接下来的工作更顺。',
    promiseTitle: '兑现你对 {{name}} 的承诺',
    promiseReason: '原因：你说过会跟进 — 把这件事收尾。',
  },
  modal: {
    title: '生成回复',
    subtitle: '可直接复制发送',
    confidenceReadyVoice: '听起来就像你本人 — 可直接发送。',
    confidenceReview: '建议发送前先快速看一遍。',
    confidenceVoiceOff: '语气与你平时略有不同 — 建议检查一下。',
    confidenceThin: '再补充一个细节会更精准。',
    editReply: '编辑回复',
    doneEditing: '完成编辑',
    suggestedNamesLabel: '推荐姓名',
    close: '关闭',
    copyReply: '复制回复',
    copySubject: '复制主题',
    insertSubject: '插入到回复上方',
    subjectInserted: '已将主题插入回复',
    subjectCopied: '主题已复制到剪贴板',
    subjectPrefix: '主题',
    intelligenceTitle: '回复智能分析',
    intelligenceSubtitle: '查看这条草稿背后的判断',
    riskTypeLabel: '风险类型',
    intentLabel: '意图',
    subjectLineLabel: '建议主题',
    nextActionLabel: '下一步动作',
    followUpLabel: '跟进时机',
    basedOnTitle: '依据',
    basedOnLatestMessage: '最新消息',
    basedOnRelationshipMemory: '关系记忆',
    basedOnBusinessContext: '业务背景',
    basedOnYourInput: '你的输入',
    basedOnRecentTimeline: '近期记录',
    basedOnAttachments: '已添加文件',
    basedOnLimitedContext: '上下文有限：补充联系人记忆后草稿会更稳。',
    lowRisk: '低风险',
    mediumRisk: '中风险',
    highRisk: '高风险',
  },
  generatedOutput: {
    replyContext: '感谢你的消息。以下是面向客户的回复草稿。',
    internalContext: '以下是用于内部协作的团队更新草稿。',
    summaryLine: '语气: {{tone}}。对象: {{recipient}}。首选语言: {{language}}。意图: {{textType}}。',
    footer: '如果你希望改成更正式或更简洁的风格，我可以继续调整。',
  },
  auth: {
    signInTitle: '登录',
    signInSubtitle: '使用工作邮箱登录 Reply Assistant 工作区。',
    signInAction: '登录',
    signUpTitle: '创建账户',
    signUpSubtitle: '我们会先发送验证邮件，确认后再打开工作台。',
    signUpAction: '创建账户',
    emailLabel: '邮箱',
    passwordLabel: '密码',
    confirmPasswordLabel: '确认密码',
    nameLabel: '全名',
    newPasswordLabel: '新密码',
    forgotPassword: '忘记密码？',
    forgotPasswordTitle: '重置密码',
    forgotPasswordSubtitle: '输入邮箱，我们将发送重置链接。',
    resetPassword: '发送重置链接',
    resetEmailSent: '请查收邮箱中的重置链接。',
    changePasswordTitle: '修改密码',
    changePasswordSubtitle: '为您的账户设置新密码。',
    changePasswordAction: '更新密码',
    verifyEmailTitle: '请查收邮箱',
    verifyEmailBody: '我们已发送验证链接。请在本设备打开链接后返回此处。',
    backToSignIn: '返回登录',
    createAccount: '创建账户',
    signOut: '退出登录',
    welcomeBack: '欢迎回来',
    welcomeName: '欢迎，{{name}}',
    passwordUpdated: '密码已更新。',
    working: '处理中…',
    showPassword: '显示密码',
    hidePassword: '隐藏密码',
    weakPasswordHint: '密码强度不足',
    strongPasswordHint: '密码强度良好',
    passwordsMatchHint: '两次密码一致',
    alreadyHaveAccount: '已有账户？',
    dontHaveAccount: '还没有账户？',
    signInLink: '登录',
    signUpLink: '创建账户',
    needHelp: '需要帮助？',
    verifyEmailSentTo: '我们已向 {{email}} 发送验证链接。',
    verifyEmailMissingEmail: '请返回登录并使用邮箱重新发送验证链接。',
    resendIn: '{{time}} 后可重新发送',
    resendLink: '重新发送验证链接',
    resendResetLink: '重新发送重置链接',
    resendSuccess: '链接已再次发送，请查收邮箱。',
    resendTooSoon: '请稍后再请求新邮件。',
    errors: {
      required: '请填写此项。',
      invalidCredentials: '邮箱或密码不正确。',
      emailNotConfirmed: '请先验证邮箱后再登录。',
      weakPassword: '密码强度不足',
      passwordMismatch: '两次密码不一致。',
      generic: '出错了，请重试。',
      invalidEmail: '请输入有效的邮箱地址。',
      invalidFullName: '请输入您的全名。',
    },
  },
  settings: {
    frameLabel: '设置',
    frameTitle: '偏好',
    autoCopyTitle: '自动复制回复',
    autoCopyDesc: '生成后立即复制到剪贴板',
    compactModeTitle: '紧凑模式',
    compactModeDesc: '使用更紧凑的工作区布局',
    focusModeTitle: '聚焦模糊强度',
    focusModeDesc: '控制打开面板时背景界面的弱化程度',
    focusModeSoft: '柔和',
    focusModeStrong: '更强',
    lazyModeTitle: '智能回复自动起草',
    lazyModeDesc: '开启后，新消息一到 Reply Assistant 就会预先生成草稿，您一键即可发送。关闭后每次都需要手动生成。',
    highStakesGuardTitle: '高风险发送提醒',
    highStakesGuardDesc: '复制发送给 VIP 客户或领导的回复前显示最终确认。建议销售和向上沟通时开启。',
    nativeNotificationsTitle: '桌面通知',
    nativeNotificationsDesc: '新邮件到达或草稿就绪时弹出 macOS / Windows 原生通知。应用内提示无论如何都会显示。',
    quietHoursTitle: '免打扰时段',
    quietHoursDesc: '在此时段内暂停原生通知，应用图标徽标和每日简报仍然更新。',
    quietHoursStartLabel: '开始',
    quietHoursEndLabel: '结束',
    defaultLanguageTitle: '默认语言',
    defaultLanguageDesc: '每次打开应用时默认选择该语言',
    profileEditorTitle: '个人资料',
    profileEditorDesc: '输入时会自动保存。',
    displayNameLabel: 'USER NAME',
    userIdLabel: '用户 ID',
    referralCodeLabel: '邀请码',
    editDisplayName: '编辑显示名称',
    done: '完成',
    cancel: '取消',
    copyReferralCode: '复制邀请码',
    nameLimitLabel: '字符上限',
    displayNamePlaceholder: '新用户',
    userIdPlaceholder: '526695051',
    referralCodePlaceholder: 'RA-5266-95051',
    profileTitle: '工作区配置',
    profileDesc:
      '草稿始终锚定「眼前这位」：同屏看到往来时间线与关系记忆，而不是泛聊。联系人与偏好保存在本机；连接同步后才会上传邮箱等数据。',
    aiProviderTitle: '回复引擎',
    aiProviderDesc: '选择优先使用的写作连接；其他连接会在需要时保留可用。',
    syncedServersTitle: '连接您的消息',
    syncedServersDesc: '把邮件和工作消息带入正确的联系人，让回复始终有据可依。',
    syncPrivacyFootnote:
      '联系人与往来时间线默认保存在本机。邮箱是当前可靠同步路径；社交渠道以粘贴、导入或 Webhook 捕获为主，除非已接入官方 API。',
    keyboardHintsFootnote:
      '⌘ 或 Ctrl + Enter — 从主输入区生成。⌘ 或 Ctrl + Shift + C — 在焦点不在文本框时复制最新生成的回复。',
    accountTitle: '账户',
    accountDesc: '此桌面工作区的登录身份。',
    accountEmailLabel: '邮箱',
    changePassword: '修改密码',
    signOut: '退出登录',
  },
  accountSettings: {
    frameLabel: '账户',
    frameTitle: '账户设置',
    profileSection: '资料',
    accountSection: '账户',
    sessionSection: '会话',
    dangerSection: '危险操作',
    profileDetails: '资料详情',
    phoneNumber: '手机号码',
    phoneNotSet: '未设置',
    phonePlaceholder: '添加您的手机号',
    phoneNationalPlaceholder: '手机号码',
    phoneSearchPlaceholder: '搜索国家或区号',
    phoneSelectCountry: '选择国家/地区',
    phoneNoResults: '没有匹配的国家/地区',
    phoneInvalid: '请输入所选国家/地区的有效手机号码。',
    phoneTooShort: '号码似乎太短。',
    phoneEmpty: '请输入手机号码，或留空清除号码。',
    phoneNonsense: '这看起来不像真实的手机号码。',
    phoneLooksValid: '号码格式正确',
    phoneSaveFailed: '无法保存手机号码，请重试。',
    changePassword: '修改密码',
    signOut: '退出登录',
    deleteAccount: '删除账户',
    edit: '编辑',
    save: '保存',
    emailLabel: '邮箱',
    openAccountSettings: '打开账户设置',
    signOutConfirmTitle: '退出登录？',
    signOutConfirmBody: '退出后需要重新登录才能使用服务。确定要退出吗？',
  },
  deleteAccount: {
    frameLabel: '账户',
    frameTitle: '删除账户',
    body: '此操作将永久删除您的登录账户。本机上的联系人与草稿会保留，除非您另行重置应用数据。',
    acknowledgeLabel: '我了解此操作无法撤销',
    confirmButton: '删除我的账户',
    working: '正在删除账户…',
    success: '账户已删除。',
    errorGeneric: '无法删除账户，请重试。',
    errorOffline: '无法连接服务器，请检查网络后重试。',
  },
  moreFeatures: {
    copied: '已复制',
    workMenuTitle: '客户工作',
    secondaryMenuTitle: '工具',
    menuLabels: {
      'today-queue': '今日队列',
      'action-inbox': '行动收件箱',
      'contact-threads': '联系人',
      settings: '设置',
      messages: '消息',
      'customer-service': '需要帮助',
      'refer-friends': '邀请好友',
      'recent-replies': '最近回复',
      'snippet-library': '片段库',
      'reset-data': '重置数据',
      'business-context': '工作背景',
      'system-health': '连接检查',
      'weekly-recap': '本周回顾',
    },
    rankLabels: {
      starter: '新手',
      silver: '白银',
      gold: '黄金',
      platinum: '铂金',
    },
    repliesGenerated: '条已生成回复',
    userIdLabel: 'ID',
    copyUserId: '复制用户 ID',
    renew: '续费',
    renewChecking: '正在检查更新…',
    renewLatestTitle: '已是最新版本',
    renewLatestBody: '您已使用最新版本，暂无可用更新。',
    quit: '退出',
    version: '版本',
    toNextRank: '即可解锁',
    maxRank: '💎 已达铂金',
  },
  messages: {
    frameLabel: '消息',
    frameTitle: '收件箱与提醒',
    show: '显示',
    hide: '收起',
    read: '已读',
    unread: '未读',
    companionNote: '此处仅为产品通知；日常回信仍在主界面完成，并围绕你选中的联系人展开。',
    focusHint: '专注模式：滚动到当前消息块后，点击“显示”查看详情。',
    loading: '正在加载通知…',
    emptyTitle: '暂无通知',
    emptyBody: '产品更新和账单提醒发布后，会显示在这里。',
  },
  customerService: {
    frameLabel: '需要帮助',
    frameTitle: '支持中心',
    cardTitle: '帮助中心',
    cardBody: '浏览常见问题，或发送简短留言——我们会认真阅读每一条请求。',
    faqTitle: '常见问题',
    faqSearchPlaceholder: '搜索问题…',
    faqEmpty: '没有匹配的问题。',
    faqItems: [
      {
        id: 'getting-started',
        question: '如何开始使用？',
        answer:
          '登录后，在撰写区添加联系人并点击「生成」。联系人和记忆默认保存在本设备，除非您日后选择同步。',
      },
      {
        id: 'contacts-memory',
        question: '联系人和记忆存在哪里？',
        answer:
          '联系人、备注和对话记忆优先保存在本设备。核心功能可离线使用；云端登录仅用于账号身份。',
      },
      {
        id: 'generate-replies',
        question: '回复是如何生成的？',
        answer:
          '选择联系人，按需添加上下文，然后点击「生成」。助手会根据您的语气设置起草回复，发送前可编辑。',
      },
      {
        id: 'email-sync',
        question: '应用会自动读取我的邮件吗？',
        answer:
          '不会。邮件同步为可选项，并明确说明可访问的范围。由您决定何时连接收件箱；我们不会静默抓取邮件。',
      },
      {
        id: 'sign-in',
        question: '为什么需要登录？',
        answer:
          '登录保障账号安全并便于找回访问权限。日常联系人和草稿仍以本设备本地优先保存。',
      },
      {
        id: 'desktop-updates',
        question: '如何更新桌面版？',
        answer:
          '打开「更多功能」并点击「续费/更新」检查更新。有新版本时会引导您安装。',
      },
      {
        id: 'data-privacy',
        question: '哪些数据会离开本设备？',
        answer:
          '您提交的支持请求和账号操作会进入安全后端。联系人和记忆保持本地，除非未来启用同步且您明确选择加入。',
      },
      {
        id: 'delete-account',
        question: '如何删除账号？',
        answer:
          '前往账号设置 → 删除账号。这将移除云端资料；本设备上的本地数据可在设置中单独清除。',
      },
      {
        id: 'billing',
        question: '账单与邀请',
        answer:
          '套餐与邀请奖励将逐步推出。当前等级与用量显示在「更多功能」中；未经明确告知不会扣费。',
      },
    ],
    authHelpMoreHint: '完整帮助中心与支持表单：登录后打开「更多功能」→「需要帮助」。',
    stillNeedHelpTitle: '仍需帮助？',
    stillNeedHelpBody: '发送简短留言，我们将通过邮件回复您。',
    formNameLabel: '姓名',
    formPhoneLabel: '电话（选填）',
    formEmailLabel: '邮箱',
    formIssueLabel: '问题类型',
    formIssuePlaceholder: '选择类别',
    formMessageLabel: '留言',
    formMessageCounter: '{{count}} / {{max}} 字',
    formSubmit: '发送请求',
    formSubmitting: '发送中…',
    errorNameRequired: '请输入姓名（2–80 个字符）。',
    errorEmailInvalid: '请输入有效的邮箱地址。',
    errorIssueRequired: '请选择问题类型。',
    errorMessageRequired: '请输入留言（至少 10 个字符）。',
    errorMessageTooLong: '留言不能超过 200 个字符。',
    errorPhoneInvalid: '请输入有效电话号码，或留空。',
    formSuccessTitle: '我们已收到您的请求',
    formSuccessBody: '感谢提交，我们将尽快回复您的邮箱。提交时间：{{time}}。',
    formErrorGeneric: '无法发送请求，请重试。',
    formErrorOffline: '您似乎处于离线状态，请检查网络后重试。',
    issueCategories: {
      'account-auth': '登录、密码或账号访问',
      'contacts-memory': '联系人、记忆或本地数据',
      'reply-generation': '生成或编辑回复',
      'email-sync': '邮件连接或同步',
      'desktop-app': '桌面版安装或更新',
      notifications: '通知或提醒',
      'billing-account': '账单、套餐或邀请',
      'data-privacy': '隐私或本设备数据',
      other: '其他',
    },
  },
  referFriends: {
    frameLabel: '邀请好友',
    frameTitle: '奖励与礼赠',
    heroTitle: '邀请好友，获得奖励',
    heroBody: '好友使用你的邀请码加入后，双方都可解锁粉色等级折扣、礼品与续费优惠。',
    referralCodeTitle: '你的邀请码',
    copyReferralCode: '复制邀请码',
    copiedToClipboard: '已复制到剪贴板',
    inviteFriends: '邀请好友',
    inviteCopied: '邀请文案已复制',
    inviteMessage: '我最近在用 Business Reply Assistant 处理客户消息，它会记住客户上下文、生成回复，还会提醒我谁需要跟进。你也可以试试，邀请码：{{code}}。',
    offers: [
      { title: '邀请奖励', desc: '好友享 85 折，你下次续费也享 85 折。' },
      { title: '赠送体验', desc: '给新用户赠送 7 天高级访问权限。' },
      { title: '团队优惠', desc: '邀请 3 位同事，解锁企业组合优惠。' },
    ],
    emptyRewards: '暂未获得邀请奖励。邀请好友即可解锁折扣与礼赠。',
  },
  recentReplies: {
    frameLabel: '最近回复',
    frameTitle: '回复历史',
    emptyText: '暂无回复。先生成一条回复即可建立可复用历史。',
    reuseInInput: '复用',
    searchPlaceholder: '搜索回复...',
    noResults: '没有符合搜索的回复。',
    modeLabels: {
      reply: '回复',
      internal: '内部',
    },
    variantLabels: {
      short: '简短',
      balanced: '均衡',
      persuasive: '说服型',
    },
    minutesAgo: '分钟前',
    hoursAgo: '小时前',
    daysAgo: '天前',
  },
  contactThreads: {
    frameLabel: '联系人',
    frameTitle: '联系人线程',
    intro: '每个联系人对应一条线程：往来、时间线与关系记忆——默认保存在本机。',
    selectedLabel: '当前线程',
    manageLabel: '管理',
    emptyTitle: '还没有保存联系人',
    emptyBody: '先创建联系人，开始建立关系记忆和跟进提醒。',
    nameLabel: '全名',
    namePlaceholder: 'Sarah Chen',
    companyLabel: '公司',
    companyPlaceholder: 'Acme Corp',
    emailPlaceholder: 'name@company.com',
    stageLabel: '阶段',
    notesLabel: '备注',
    notesPlaceholder: '决策人，偏好简洁回复，五月预算评审……',
    pendingCaptureHint: '捕获的消息会保存到此联系人，并打开到输入框。',
    addContactAction: '+ 添加联系人',
    createContact: '添加',
    openContact: '打开',
    useContact: '使用联系人',
    selectedContact: '已选中',
    removeContact: '删除联系人',
    removeContactTitle: '删除这个联系人？',
    removeContactConfirm: '确定要删除这个联系人吗？',
    removeContactAction: '删除',
    unassigned: '未绑定联系人',
    pickerPlaceholder: '选择联系人',
    searchPlaceholder: '快速搜索联系人...',
    internalSearchPlaceholder: '快速搜索内部联系人...',
    clearSelectionLabel: '暂不绑定联系人',
    noSearchResults: '没有匹配的联系人。',
    contactFilterLabel: '联系人视图',
    contactFilterNeedsAction: '需要处理',
    contactFilterAll: '全部',
    contactFilterNeedsActionEmptyTitle: '当前没有紧急联系人',
    contactFilterNeedsActionEmptyBody: '你已处理完当前重点。可切换到“全部”查看所有联系人。',
    priorityStripTitle: '今日联系人重点',
    priorityStripBody: '{needs} 个待处理 • {overdue} 个超期跟进',
    priorityStripReviewAction: '立即查看',
    priorityRiskActionNow: '立即处理',
    priorityRiskDueToday: '今日到期',
    priorityRiskWatchlist: '观察中',
    priorityLastActivity: '最近活动：{time}',
    priorityNoActivity: '暂无互动记录',
    morningFocusTitle: '今日重点',
    morningFocusEta: '约 {minutes} 分钟',
    markDoneAction: '完成',
    snoozeUntilTomorrow: '明日提醒',
    useContactActionShort: '立即使用',
    focusDoneState: '今日已完成。',
    focusSnoozedState: '已延后到明天。',
    dailyImpactFooter: '今日已处理 {done} 项 • 已延后 {snoozed} 项',
    contactInsightsTitle: '联系人概览',
    messagesFromCountLabel: '收到消息',
    messagesToCountLabel: '发送消息',
    chatTypeLabel: '聊天类型',
    lastReceivedLabel: '最近收到时间',
    lastSentLabel: '最近发送时间',
    noLastReceived: '暂无收到消息',
    noLastSent: '暂无发送消息',
    callToActionLabel: '下一步动作',
    callToActionReply: '立即回复',
    callToActionFollowUp: '发送跟进',
    priorityReasonLabel: '原因',
    priorityReasons: {
      'latest-inbound-unanswered': '最近收到的消息还没有新回复。',
      'email-needs-action': '有新同步邮件需要查看。',
      'follow-up-due': '今天适合跟进。',
      'waiting-on-client': '正在等待对方回复。',
      'recent-activity': '最近有互动记录。',
      'missing-context': '先补充上下文再生成。',
      'quiet-thread': '当前没有紧急动作。',
    },
    sourcePasteLabel: '粘贴记录',
    sourceEmailSyncLabel: '同步消息',
    sourceManualNoteLabel: '手动备注',
    sourceGeneratedReplyLabel: '生成回复',
    replyCount: '条回复',
    messageCount: '条消息',
    lastReplyNone: '暂无回复',
    lastReplyToday: '今天已回复',
    lastReplyDays: '距上次回复 {days} 天',
    chatContextLabel: '聊天记录',
    chatContextPlaceholder: '粘贴来自 WhatsApp、微信、邮件或 Slack 的近期对话...',
    chatContextSave: '保存记录',
    chatContextSaved: '已保存',
    chatContextHint: '已保存。',
    addChatContext: '+ 添加记录',
    chatHubTitle: '沟通记录',
    chatHubSubtitle: '按时间倒序查看已保存的消息。可按联系人筛选或查看全部。',
    chatHubOpenButton: '沟通记录',
    chatHubFilterLabel: '显示消息',
    chatHubAllContacts: '全部联系人',
    chatHubTimelineEmpty: '尚无已保存消息。请在联系人卡片使用智能粘贴或连接邮箱。',
    chatHubAllNotesHint: '请在上方选择联系人，以添加或编辑生成回复时使用的补充备注。',
    chatContextExtraLabel: '补充说明与备注',
    chatHubPerContactAction: '查看聊天',
    chatHubSaveAndClose: '保存',
    chatHubContactUnavailable: '该联系人已不存在。',
    chatExtraNotesScreenSubtitle: '此处内容会在为该联系人生成回复时一并作为依据。',
    emailSyncTitle: '连接邮箱',
    syncServersLabel: '消息来源',
    syncServerEmail: '邮箱',
    syncServerDingTalk: '钉钉',
    syncServerWeChat: '微信',
    syncServerWhatsApp: 'WhatsApp',
    syncServerTelegram: 'Telegram',
    syncGuides: {
      email: {
        title: '如何连接邮箱',
        continueLabel: '继续连接',
        steps: [
          '1. 选择邮箱类型：从下拉菜单中选择 Gmail、Outlook、QQ、163、iCloud 或“其他”。',
          '2. 填写完整邮箱地址，例如 yourname@gmail.com。',
          '3. 获取应用专用密码（不是登录密码）：QQ 邮箱 → 设置 > 账户 > 开启 IMAP > 生成授权码。163/126 → 设置 > POP3/SMTP > 开启 IMAP > 获取授权码。Gmail → Google 账户 > 安全 > 两步验证 > 应用专用密码。Outlook → Microsoft 账户 > 安全 > 高级选项 > 应用密码。iCloud → Apple ID > 登录与安全 > 专用应用密码。',
          '4. 将授权码/应用专用密码粘贴到“邮箱码/应用专用密码”栏中，然后点击“连接邮箱”。',
          '5. 连接成功后，系统每 5 分钟自动同步新邮件，并将其匹配到对应联系人。',
        ],
      },
      dingtalk: {
        title: '如何连接钉钉',
        continueLabel: '继续',
        steps: [
          '1. 获取钉钉用户 ID：点击头像（左下角）> "设置" > "账号" > "关于我" > 复制"用户 ID"数字。',
          '2. 获取钉钉同步码：在网页版登录 https://open-dev.dingtalk.com > "我的应用" > 创建或选择应用 > "凭证"标签 > 复制"Client ID"（作为账号 ID）和"Client Secret"（作为同步码）。手机版需要通过网页访问。',
          '3. 输入两个值：将用户 ID 和 Client Secret 粘贴到下面的输入框中。选择要同步钉钉消息到哪个联系人。',
          '4. 点击"同步钉钉"：应用将连接并将你最近的钉钉消息导入到选定的联系人线程。',
        ],
      },
      wechat: {
        title: '微信：暂无开放 API',
        continueLabel: '我知道了',
        steps: [
          '⚠️ 微信不提供第三方应用的公开 API，无法直接同步消息——这是腾讯平台的限制，并非本应用的问题。',
          '✅ 解决方案 — 粘贴方式：在手机或电脑上打开微信，复制你想记录的对话内容，然后粘贴到联系人卡片上的"消息来自："输入框中。',
          '✅ 解决方案 — 企业微信：如果你的团队使用企业微信，它提供开放 API。请联系你的 IT 管理员获取企业 ID（CorpID）和应用密钥（CorpSecret）以进行集成。',
          '💡 提示：使用每个联系人卡片上的智能粘贴面板（铅笔图标），可以在几秒内快速捕获并保存任何微信对话。',
        ],
      },
      whatsapp: {
        title: '如何连接WhatsApp',
        continueLabel: '继续',
        steps: [
          '1. 准备好 WhatsApp Business 的连接信息。',
          '2. 打开连接页面并填写核心字段。',
          '3. 保存连接信息。',
          '4. 后续接入官方 API 后即可开始捕获。',
        ],
      },
      telegram: {
        title: '如何连接Telegram',
        continueLabel: '继续',
        steps: [
          '1. 准备好 Telegram 机器人信息。',
          '2. 打开连接页面并填写机器人字段。',
          '3. 保存连接信息。',
          '4. 后续机器人接入完成后即可捕获消息。',
        ],
      },
    },
    syncServerComingSoonSuffix: '即将推出',
    syncServerComingSoonBody: '目前可先粘贴或导入消息。正式连接功能就绪后会在此提供。',
    emailSyncHint: '选择邮箱类型，输入邮箱地址，再填写邮箱验证码或应用专用密码。',
    emailSyncAction: '连接',
    emailSyncRunning: '连接中...',
    emailSyncDiagnosticsRunning: '正在检查邮箱连接...',
    emailSyncDiagnosticsSuccess: '邮箱已检查：拉取 {fetched} | 匹配 {matched} | 更新 {updated}',
    autoSyncNewMailFrom: '收到新邮件来自',
    autoSyncReplyNow: '立即回复',
    autoSyncDismiss: '关闭',
    autoSyncNeedsAction: '需要处理',
    autoSyncActionCardTitle: '需要回复：{name}',
    autoSyncActionCardBody: '检测到 {count} 封新收件邮件，请查看并回复。',
    autoSyncAttentionTitle: '邮件提醒',
    autoSyncAttentionBody: '{count} 位联系人有新收件邮件，等待你的回复。',
    autoSyncReplyPrompt: '用温暖、专业、简洁的方式回复 {name} 的最新邮件，确认收到、直接回应关键内容，并提出下一步安排。',
    emailSyncReady: '已完成同步',
    emailSyncConnectedTitle: '已连接',
    emailSyncConnectedAs: '已连接：{email}',
    emailSyncConnectedBody: '已开启自动同步。系统会每 5 分钟自动检查新邮件。',
    emailSyncReconnectHint: '如需连接其他邮箱，请在下方切换邮箱类型或邮箱地址后，再点击"连接邮箱"。',
    emailSyncNowAction: '立即同步',
    emailSyncUseAnotherEmail: '更换邮箱',
    emailSyncDisconnect: '断开连接',
    emailSyncDisconnected: '已移除邮箱连接。',
    emailSyncApplied: '已根据邮件线程更新联系人上下文。',
    emailSyncFailed: '邮箱同步失败',
    emailSyncNeedContactEmail: '请先为至少一个联系人填写邮箱地址。',
    emailSyncSummary: '已拉取 {fetched} 封邮件，匹配 {matched} 封，更新 {updated} 个联系人。',
    emailHostPlaceholder: 'IMAP 主机（示例：imap.gmail.com）',
    emailUsernamePlaceholder: '邮箱地址',
    emailPasswordPlaceholder: '邮箱验证码 / 应用专用密码',
    emailShowPassword: '显示',
    emailHidePassword: '隐藏',
    emailSyncPasswordHintGeneric: '提示：可使用邮箱验证码或应用专用密码。',
    emailSyncPasswordHintAppPassword: '提示：该邮箱通常需要应用专用密码。',
    emailSyncPasswordHintChinaCode: '提示：请使用邮箱授权码。',
    emailSyncErrorInvalidEmail: '请输入正确的邮箱地址。',
    emailSyncErrorAddressMissing: '请先输入邮箱地址。',
    emailSyncErrorCodeMissing: '请先输入邮箱验证码或应用专用密码。',
    emailSyncErrorProviderMismatch: '该邮箱属于 {provider}，请切换上方邮箱类型。',
    emailSyncErrorAuth: '登录失败，请检查邮箱地址和验证码/应用专用密码。',
    emailSyncErrorServer: '当前无法连接邮箱，请稍后重试。',
    emailSyncErrorTimeout: '连接超时，请检查网络后重试。',
    emailSyncErrorGeneric: '暂时无法连接邮箱，请稍后重试。',
    emailProviderHelpTitle: '如何获取验证码',
    emailProviderHelpGeneric: '可在邮箱安全设置中生成应用专用密码或邮箱授权码。',
    emailProviderHelpItems: {
      qq: 'QQ 邮箱：设置 > 账户 > POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV > 生成授权码。',
      '163': '163 邮箱：设置 > POP3/SMTP/IMAP > 开启 IMAP 并获取授权码。',
      '126': '126 邮箱：设置 > POP3/SMTP/IMAP > 开启 IMAP 并获取授权码。',
      sina: '新浪邮箱：在账户设置中开启 IMAP，并使用客户端授权密码（如要求）。',
      sohu: '搜狐邮箱：在设置中开启 IMAP/POP，并使用邮箱授权密码。',
      gmail: 'Gmail：Google 账号 > 安全性 > 两步验证 > 应用专用密码。',
      outlook: 'Outlook/Hotmail：Microsoft 账号安全 > 高级安全选项 > 创建应用密码。',
      yahoo: 'Yahoo：账号安全 > 生成应用专用密码。',
      icloud: 'iCloud：Apple ID > 登录与安全 > App 专用密码。',
      aol: 'AOL：账号安全 > 生成应用专用密码。',
      zoho: 'Zoho：安全设置 > App Passwords。',
    },
    emailSinceDaysLabel: '回溯天数',
    emailMaxMessagesLabel: '最大邮件数',
    socialSyncNoContacts: '暂无可用联系人',
    socialSyncTargetContact: '目标联系人：{name}',
    socialSyncTargetRequired: '请选择要绑定同步消息的联系人。',
    socialSyncSummary: '已同步 {contacts} 个联系人，匹配 {messages} 条消息。',
    socialSyncWebhookEndpoint: 'Webhook 地址：',
    socialSyncGenericFailed: '同步失败，请检查连接后重试。',
    telegramSyncHint: '将 Telegram 机器人收件箱中的消息同步到一个指定联系人线程。',
    telegramBotTokenPlaceholder: 'Telegram 机器人 Token',
    telegramChatIdPlaceholder: 'Chat ID（可选，建议填写）',
    telegramSyncAction: '同步 Telegram',
    telegramBotTokenRequired: '请先填写机器人 Token。',
    dingTalkSyncHint: '通过已批准的 Webhook/导入方式捕获钉钉消息，再绑定到你选择的联系人。',
    dingTalkAppKeyPlaceholder: '钉钉账号 ID',
    dingTalkSyncCodePlaceholder: '钉钉同步码',
    dingTalkSyncAction: '同步钉钉',
    dingTalkAppKeyRequired: '请先填写钉钉账号 ID。',
    dingTalkSyncCodeRequired: '请先填写钉钉同步码。',
    dingTalkConnectedHint: '已连接：{appKey}',
    dingTalkReconnectHint: '该账号已连接。',
    dingTalkWebhookPath: 'POST /api/dingtalk/webhook',
    whatsAppSyncHint: '将 WhatsApp Business Webhook 消息捕获到指定联系人；不会读取任意 WhatsApp 历史记录。',
    whatsAppPhoneNumberIdPlaceholder: 'WhatsApp 账号号码',
    whatsAppSyncCodePlaceholder: 'WhatsApp 同步码',
    whatsAppSyncAction: '同步 WhatsApp',
    whatsAppPhoneNumberIdRequired: '请先填写 WhatsApp 账号号码。',
    whatsAppSyncCodeRequired: '请先填写 WhatsApp 同步码。',
    whatsAppWebhookPath: 'POST /api/whatsapp/webhook',
    weChatNoApiTitle: '⚠️ 微信没有公开 API',
    weChatNoApiBody: '腾讯不支持第三方直接同步微信消息。请使用以下任一解决方案。',
    weChatPasteTitle: '✅ 推荐：粘贴方式',
    weChatPasteBody: '在手机或电脑上打开微信，复制对话内容，然后粘贴到联系人卡片上的"消息来自："输入框中。无需 API。',
    weChatWorkSectionTitle: '企业微信 (WeChat Work) — API 同步',
    weChatWorkSectionBody: '仅适用于使用企业微信的团队。请联系 IT 管理员获取 CorpID 和 CorpSecret。',
    weChatSyncHint: '微信没有公开 API，无法直接同步。请使用联系人卡片上的粘贴方式，或改用企业微信（支持 API 集成）。',
    weChatWorkspaceIdPlaceholder: '企业微信 CorpID',
    weChatSyncCodePlaceholder: '企业微信 CorpSecret',
    weChatSyncAction: '同步企业微信',
    weChatWorkspaceIdRequired: '请填写企业微信 CorpID（仅限企业微信）。',
    weChatSyncCodeRequired: '请填写企业微信 CorpSecret（仅限企业微信）。',
    weChatWebhookPath: 'POST /api/wechat/webhook',
    smartCaptureTitle: '智能粘贴收件箱',
    smartCaptureHintPrefix: '粘贴 ',
    smartCaptureHintSuffix: ' 的最新消息。',
    smartCaptureAction: '+ 记录收到的消息',
    smartCaptureCollapsed: '记录收到的消息',
    smartCapturePlaceholder: '粘贴客户消息、微信对话片段、邮件段落，或会议记录...',
    messageFromLabel: '消息来自：',
    messagesLabel: '消息',
    expandMessageAria: '展开消息编辑器',
    collapseMessageAria: '收起消息编辑器',
    pasteFromClipboard: '粘贴',
    saveInboundMessage: '保存',
    saveAndCompose: '保存并打开写作区',
    captureSaved: '收到的消息已保存到该联系人的时间线。',
    captureError: '请先粘贴或输入一段消息。',
    capturedTimelineTitle: '近期',
    capturedTimelineEmpty: '暂无已保存消息',
    timelineInbound: '收到',
    timelineOutbound: '发出',
    timelineNote: '备注',
    timelinePartiesLine: '来自 {sender} · 发给 {receiver}',
    memoryPanelTitle: '关系记忆',
    memoryPanelSubtitle: '在为该联系人生成回复时会自动参考。',
    memoryRolePlaceholder: '角色（如采购、供应商联系人）',
    memoryTopicsPlaceholder: '常见话题（用逗号分隔）',
    memoryNotesPlaceholder: '关系备注、承诺、偏好…',
    memoryStyleLabel: '语气风格',
    memoryStyleFormal: '正式',
    memoryStyleWarm: '友好',
    memoryStyleDirect: '直接',
    memoryStyleConcise: '简洁',
    memorySave: '保存记忆',
    companyFilesTitle: '公司文件',
    companyFilesHint: '可添加宣传册、目录、收据或截图。',
    waitingOnYouLabel: '待你回复',
    waitingOnThemLabel: '等待对方',
    syncedEmailNeedsReplyBody: '来自 {name} 的同步邮件正在等你回复。',
    syncedEmailNeedsReplyIntent: '回复同步邮件',
    waitingOnYouBody: '{name} 在 {days} 天前发来了消息，仍在等你回复。',
    waitingOnThemBody: '你在 {days} 天前对 {name} 提到“{summary}”，可以确认对方是否还需要更新。',
    waitingOnThemFallback: '继续跟进',
    followUpTaskPrompt: '请为 {name} 起草一条简洁的跟进回复，并参考对方最近消息：{summary}。',
    promiseCheckTaskPrompt: '请为 {name} 起草一条主动跟进，确认这个承诺事项：{summary}。语气清晰、积极。',
    insightFollowUpPrompt: '请为 {recipient} 起草一条简洁的跟进。意图：{intent}。目标：{goal}。时间：{timing}。',
    followUpTaskTitle: '跟进联系人',
    followUpTaskBody: '你已经 {days} 天没有跟进 {name}。',
    wizardStepCount: '第 {{current}} / {{total}} 步',
    wizardNext: '下一步',
    wizardBack: '上一步',
    wizardSkipForNow: '稍后再填',
    wizardSaveAndFinish: '保存联系人',
    wizardStep1Title: '这位联系人是谁？',
    wizardStep1Description: '先填基本信息，其他细节可以下一步补充，或随时跳过。',
    wizardStep2Title: '关系信息',
    wizardStep2Description: '帮助 Reply Assistant 把握合适的语气。',
    wizardStep3Title: '沟通偏好',
    wizardStep3Description: '对方的沟通方式与首选回复语言。',
    wizardStep4Title: '注意事项',
    wizardStep4Description: '回复时一定要做或一定不能做的事？',
    wizardRoleLabel: '职位 / 角色',
    wizardRolePlaceholder: '销售副总裁、采购主管……',
    wizardCommunicationStyleLabel: '沟通风格',
    wizardCommunicationStyleNone: '无特别偏好',
    wizardPreferredLanguageLabel: '回复语言',
    wizardPreferredLanguageAuto: '自动判断',
    wizardPreferredLanguageEn: '英文',
    wizardPreferredLanguageZh: '中文',
    wizardDosAndDontsLabel: '注意事项',
    wizardDosAndDontsPlaceholder: '偏好使用要点列。请勿使用表情。开场务必确认 Q3 报价。',
    stageLabels: {
      'new-lead': '新线索',
      'active-client': '活跃客户',
      'vip-client': 'VIP 客户',
      'follow-up': '待跟进',
      closed: '已结束',
      internal: '内部',
    },
  },
  snippetLibrary: {
    frameLabel: '片段库',
    frameTitle: '可复用模板',
    addSnippet: '新增片段',
    searchPlaceholder: '搜索片段...',
    noResults: '没有符合搜索的片段。',
    titlePlaceholder: '标题',
    textPlaceholder: '模板内容...',
    save: '保存',
    cancel: '取消',
    insertIntoInput: '复用',
    deleteSnippet: '删除 {{title}}',
    removeSnippetTitle: '删除这个片段？',
    removeSnippetConfirm: '确定要删除这个片段吗？',
    removeSnippetAction: '删除',
    defaultSnippets: [
      {
        id: 'follow-up-gentle',
        title: '温和跟进',
        text: '你好，我想跟进一下我们之前的消息。如需进一步说明，我很乐意协助。',
      },
      {
        id: 'close-confirmation',
        title: '确认结案',
        text: '感谢确认。我们这边已完成处理，稍后会分享最终更新。',
      },
      {
        id: 'internal-alignment',
        title: '内部对齐说明',
        text: '团队你好，以下是最新客户背景和所需动作。请在今天结束前确认负责人。',
      },
      {
        id: 'pricing-clarity',
        title: '价格说明',
        text: '感谢你对价格的提问。当前报价包含我们讨论的实施与支持内容。如有需要，我也可以提供费用明细。',
      },
    ],
  },
  resetData: {
    frameLabel: '重置数据',
    frameTitle: '清除本地工作数据',
    intro: '选择要从本设备清除的内容。除非您在别处重置，应用设置、个人资料和已连接的邮箱账号会保留。',
    selectAll: '选择全部工作数据',
    clearSelection: '清除选择',
    reviewReset: '查看重置项',
    keepNote: '保留：应用设置、语言、个人 ID，以及设置中的邮箱或社交连接配置。',
    confirmTitle: '重置所选数据？',
    confirmBody: '这将从本设备的 Reply Assistant 中永久删除所选本地数据。在您重新添加联系人和背景之前，草稿质量可能会下降。',
    confirmAcknowledge: '我了解此操作无法撤销。',
    confirmAction: '立即重置',
    successMessage: '所选数据已重置。应用已准备好重新开始。',
    domains: {
      contacts: {
        title: '联系人与线程',
        description: '联系人卡片、消息时间线、关系记忆、联系人文件及当前选中的联系人。',
      },
      workContext: {
        title: '工作背景与文件',
        description: '工作背景字段及在工作背景中附加的公司学习文件。',
      },
      draftMemory: {
        title: '片段与最近回复',
        description: '片段库模板、最近回复记录和已读消息标记。',
      },
      queues: {
        title: '队列与收件箱',
        description: '今日队列进度、行动收件箱卡片和每日任务快照。',
      },
      companionSignals: {
        title: '助手学习信号',
        description: '工作节奏习惯、使用计数、里程碑、语气预设和会话提示。',
      },
    },
  },
  miniScreen: {
    back: '返回',
  },
  businessContext: {
    frameLabel: '业务背景',
    frameTitle: '工作区配置',
    intro: '这些信息有助于生成更贴合你品牌和行业的精准回复。',
    editHint: '点击任意卡片上的铅笔图标，添加或更新该字段。',
    done: '完成',
    cancel: '取消',
    yourNameLabel: '你的姓名',
    yourNamePlaceholder: '例如：Alex Morgan',
    companyNameLabel: '公司 / 品牌名称',
    companyNamePlaceholder: '例如：明星科技',
    yourPositionLabel: '你的职位',
    yourPositionPlaceholder: '例如：客户经理',
    industryLabel: '行业',
    industryPlaceholder: '例如：SaaS、电商、房地产',
    productsServicesLabel: '产品 / 服务',
    productsServicesPlaceholder: '描述你销售或提供的内容...',
    brandVoiceLabel: '品牌语气',
    brandVoicePlaceholder: '例如：专业且亲和，避免行话',
    commonObjectionsLabel: '常见异议 / 常见问题',
    commonObjectionsPlaceholder: '例如：「太贵了」「为什么不选竞品？」',
    doNotSayLabel: '禁用表达',
    doNotSayPlaceholder: '硬性规定、需要避免的升级用语...',
    companyFilesTitle: '公司文件',
    companyFilesHint: '可添加宣传册、目录、价目表或截图。',
  },
  todayQueue: {
    frameLabel: '今日队列',
    frameTitle: '优先任务',
    intro: '先处理这些关键小任务。',
    taskLabel: '下一步最佳动作',
    useNow: '立即处理',
    snooze: '稍后',
    markDone: '完成',
    estMinutes: '约 {{minutes}} 分钟',
    dailyImpactSummary: '今日：完成 {{done}} · 立即处理 {{usedNow}} ·',
    emptyTitle: '队列已清空',
    emptyBody: '今天的关键任务已完成。',
    celebrateTitle: '队列已清空！🎉',
    celebrateBody: '干得漂亮，队列已完成。',

    clearUnreadTitle: '处理未读消息提醒',
    clearUnreadBody: '还有 {{count}} 条未读消息待处理。',
    followUpTitle: '快速起草跟进',
    followUpBody: '写一条简短跟进，推动当前对话。',
    warmupTitle: '生成第一条回复',
    warmupBody: '先完成一条快速草稿，进入状态。',
    enrichContextTitle: '补全业务背景',
    enrichContextBody: '当前已填 {{count}}/{{total}} 项，补全可提升草稿质量。',
    buildSnippetsTitle: '扩充片段库',
    buildSnippetsBody: '当前有 {{count}} 条片段，建议补充常用模板。',
    followUpPrompt: '请写一条简洁且礼貌的跟进消息，引用上次沟通并询问下一步安排。',
    warmupPrompt: '请写一条简短、专业的回复，确认已收到并说明我们正在处理。',
  },
  actionInbox: {
    frameLabel: '行动收件箱',
    frameTitle: '跟进指挥中心',
    intro: '把生成洞察快速变成可执行动作，不丢上下文。',
    createdLabel: '已创建',
    completedLabel: '已完成',
    completionRateLabel: '完成率',
    emptyTitle: '收件箱已清空',
    emptyBody: '当前没有待办行动卡。可在生成回复弹窗中继续添加。',
    highRisk: '高风险',
    mediumRisk: '中风险',
    lowRisk: '低风险',
    priorityLabel: '优先级',
    followUpLabel: '跟进时机',
    doNow: '立即处理',
    defer: '延后',
    delegate: '生成委派草稿',
    removeActionTitle: '移除此行动卡？',
    removeActionConfirm: '该行动卡将从行动收件箱中移除。',
    removeActionButton: '移除',
  },
  instantAmmo: {
    title: '快速开始',
    scenarios: {
      'running-late':    { label: '快迟到了',   prompt: '我开会快迟到了，大约晚 10 分钟，请先开始不用等我。' },
      'polite-decline':  { label: '礼貌拒绝',   prompt: '我需要礼貌地拒绝这个请求，同时不损害双方关系。' },
      'follow-up':       { label: '跟进追问',   prompt: '对上周发出的消息进行跟进，对方还没有回复。' },
      'ask-extension':   { label: '申请延期',   prompt: '由于本周工作量超出预期，我需要申请截止日期延期。' },
      'thank-colleague': { label: '感谢同事',   prompt: '非常感谢你在这个项目上的帮助，真的帮了大忙。' },
      'escalate':        { label: '紧急上报',   prompt: '此问题需要立即处理并上报至高层领导。' },
      'cold-outreach':   { label: '陌生开场',   prompt: '请起草一段简洁的陌生开场：结合该联系人及其公司，给出清晰的商业切入点，并以一个明确的下一步收尾。' },
      'pitch-followup':  { label: '提案跟进',   prompt: '为最近一次提案撰写温和而直接的跟进：确认双方已达成的价值要点，应对沉默，并提出下一步具体安排。' },
      'objection-price': { label: '回应价格异议', prompt: '不要先降价。把投入与对方真正关心的成果联系起来，提示不行动的代价，并提供一个可选的小范围试点。' },
      'closing-nudge':   { label: '促成签约',   prompt: '发出一段自信而不施压的促单跟进：回顾双方已经一致的决策，提出明确的成交问题，并给出下一步日历安排。' },
      're-engagement':   { label: '重新激活',   prompt: '以诚恳的方式重启长时间没有联系的关系：承认沉默而不过度致歉，分享一条新的相关进展，并询问对方近期优先级是否有调整。' },
    },
  },
  milestones: {
    congratulations: '等级解锁！',
    unlocked: '已达成',
  },
  weeklyRecap: {
    frameLabel: '本周回顾',
    frameTitle: '本周回信一览',
    introLine: '回复量、连续天数、最常联系的人——用一页看清你的工作陪伴节奏。',
    thisWeek: '本周',
    repliesLabel: '回复数',
    streakLabel: '连续天数',
    timeSavedLabel: '预计节省',
    timeSavedUnit: '分钟',
    topRecipientLabel: '最常回复',
    needsReplyLabel: '待回复',
    followUpsDueLabel: '待跟进',
    noDataTitle: '还没有可统计的回信',
    noDataBody: '先在主输入区生成一条回复，开启循环；我们会在这里累计连续天数与预估节省时间。',
    days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    queueSparklineLabel: '节省分钟 · 队列',
  },
  noAppData: {
    title: '抱歉，暂无可用数据',
    body:
      '此页面会在您完成基础设置后显示内容。请先添加联系人，让回复基于您实际沟通的对象；再补充工作背景，让草稿更贴合您的公司与角色。',
    contactsHint: '最佳第一步',
    contactsLead: '添加联系人并粘贴消息或备注，让应用开始了解每段关系。',
    workContextHint: '下一步',
    workContextLead: '补充工作背景，让草稿匹配您的公司、职位与表达风格。',
  },
  onboarding: {
    next: '下一步',
    getStarted: '开始使用',
    skip: '跳过',
    hotkeyKeysMac: ['Cmd', 'Shift', 'R'],
    hotkeyKeysWin: ['Ctrl', 'Shift', 'R'],
    rankThresholds: ['30+', '70+', '120+'],
    quickStartPreview: ['⏰ 迟到说明', '🙏 礼貌拒绝', '📬 跟进', '📅 申请延期'],
    steps: [
      {
        title: '为「眼前这位」而不是泛泛聊天',
        body:
          '为当前选中的联系人起草：带上往来线程与本地保存的要点，一气呵成——不是空提示框聊天。联系人与设置默认存在本机；连接同步后才会引入邮箱数据。',
      },
      {
        title: '全局快捷键',
        body: '在任意应用中唤起助手；选好联系人、粘贴对方内容、生成、复制——少切换窗口。',
      },
      {
        title: '通过使用解锁等级',
        body: '累积回复可解锁语气档案、镜像模式等——给反复沟通的关系省时间。',
        hint: '白银 (30) · 黄金 (70) · 铂金 (120)',
      },
      {
        title: '一键快速开始',
        body: '场景标签可快速起稿；每次生成仍会尊重你已选中的那位联系人。',
      },
    ],
  },
  guidedTour: {
    next: '下一步',
    finish: '我知道了',
    skip: '跳过引导',
    stepCount: '引导 · 第 {{current}} / {{total}} 步',
    sampleContactName: '示例 · 陈莎拉',
    sampleContactCompany: 'Acme 采购部',
    sampleContactRole: '采购部负责人',
    sampleContactNotes: '示例联系人 — 随时可在「联系人」中删除。',
    sampleContactRelationshipNotes: '偏好简洁的回复并明确下一步动作。',
    sampleContactPreferredLanguage: '英文',
    sampleInboundText: '您好——确认一下我们 Q3 的订单是否仍按原计划周五交付。方便时回复一下，我好同步给团队。谢谢！',
    steps: {
      'daily-brief': {
        title: '这是您的每日简报',
        body: '每天的下一步行动都从这里开始，点击深色按钮继续未完成的工作。',
      },
      'add-contact': {
        title: '每一封回复因联系人而更精准',
        body: '打开「联系人」添加真实客户。我们预置了一位示例，方便您先体验流程。',
      },
      'quick-start': {
        title: '快速开始场景',
        body: '点击场景标签即可一键起草常见回复 — 仍会针对您选中的联系人。',
      },
      'cmd-k': {
        title: '⌘K 是一切的快捷入口',
        body: '随时按 Cmd+K（Windows 上为 Ctrl+K）打开联系人、起草回复或跟进。',
      },
    },
    replayTitle: '重温引导',
    replayDescription: '随时重看 30 秒引导。复习功能或向同事演示时很方便。',
    replayButton: '重新播放',
  },
  relationshipMemory: {
    eyebrow: '对方节奏',
    repliesWithinMinutes: '通常约 {{minutes}} 分钟内回复',
    repliesWithinHours: '通常约 {{hours}} 小时内回复',
    repliesWithinOneDay: '通常一天内回复',
    repliesWithinDays: '通常约 {{days}} 天内回复',
    prefersShort: '偏好简短的消息',
    prefersLong: '偏好较长的消息',
    formalBias: '您与对方的语气偏正式',
    casualBias: '您与对方的语气偏随意',
    separator: ' · ',
  },
  intent: {
    eyebrow: '意图',
    request: '请求事项',
    approval: '请求批准',
    negotiation: '价格谈判',
    followUp: '跟进',
    escalation: '升级处理',
    apology: '致歉',
    scheduling: '约时间',
    feedback: '征求反馈',
    statusUpdate: '进度同步',
    reminder: '提醒',
    urgencyHigh: '紧急',
    urgencyMedium: '近期',
    separator: ' · ',
  },
  rewriteModes: {
    eyebrow: '换种语气',
    diplomatic: '外交婉转',
    leadership: '领导口吻',
    negotiation: '商务谈判',
    customerSupport: '客服安抚',
    recruiting: '招聘邀约',
    voiceLikeMe: '按我的风格',
  },
  outcomeSignals: {
    eyebrow: '信号',
    clarity: '表达清晰',
    hasClearCTA: '下一步明确',
    professional: '语气专业',
  },
  followUps: {
    eyebrow: '待跟进',
    waitingOn: '等待 {{name}} 回复',
    overdueMinutes: '已超过约 {{minutes}} 分钟',
    overdueHours: '已超过约 {{hours}} 小时',
    overdueOneDay: '已超过约 1 天',
    overdueDays: '已超过约 {{days}} 天',
    separator: ' · ',
  },
  sendTiming: {
    eyebrow: '建议发送时间',
    recommendedTime: '约 {{time}} 左右 — 对方通常这时查看消息',
  },
  systemHealth: {
    frameLabel: '连接检查',
    frameTitle: '写作连接',
    intro: '在正式使用前，检查写作连接是否可用。',
    preferredProvider: '首选连接',
    lastChecked: '最近检测',
    refresh: '重新检查',
    refreshing: '刷新中...',
    errorPrefix: '连接检查错误',
    configured: '已配置',
    latency: '延迟',
    model: '写作模型',
    reason: '原因',
    yes: '是',
    no: '否',
    empty: '暂无诊断结果。',
  },
};

export type AppTranslations = TranslationBundle;

export function resolveLanguage(language: AppLanguage): ResolvedLanguage {
  if (language === 'en' || language === 'zh') {
    return language;
  }

  const browserLanguage = navigator.language.toLowerCase();
  if (browserLanguage.startsWith('zh')) {
    return 'zh';
  }

  return 'en';
}

export function getTranslations(language: AppLanguage): AppTranslations {
  const resolved = resolveLanguage(language);
  return resolved === 'zh' ? ZH : EN;
}

export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/{{(.*?)}}/g, (_m, key) => String(values[key.trim()] ?? ''));
}
