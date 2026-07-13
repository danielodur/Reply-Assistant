function asString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function asBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asBoundedToneValue(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(1, Math.min(5, Math.round(numeric)));
}

function normalizeBusinessContext(value) {
  if (!value || typeof value !== "object") return null;

  const normalized = {
    yourName: asString(value.yourName),
    companyName: asString(value.companyName),
    yourPosition: asString(value.yourPosition),
    industry: asString(value.industry),
    productsServices: asString(value.productsServices),
    brandVoice: asString(value.brandVoice),
    commonObjections: asString(value.commonObjections),
    doNotSay: asString(value.doNotSay),
  };

  const hasAny = Object.values(normalized).some((entry) => entry.length > 0);
  return hasAny ? normalized : null;
}

function normalizeSnippetMemory(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => ({
      title: asString(item?.title),
      text: asString(item?.text),
    }))
    .filter((item) => item.text.length > 0)
    .slice(0, 5);
}

function normalizeRecentReplies(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => ({
      preview: asString(item?.preview),
      mode: asString(item?.mode, "reply") || "reply",
      recipient:
        asString(item?.recipient, "existing-client") || "existing-client",
      contactName: asString(item?.contactName),
    }))
    .filter((item) => item.preview.length > 0)
    .slice(0, 5);
}

function normalizeGenerationContext(value) {
  if (!value || typeof value !== "object") return null;

  const source = asString(value.source, "composer") || "composer";
  const title = asString(value.title);
  const body = asString(value.body);

  return {
    source,
    ...(title ? { title } : {}),
    ...(body ? { body } : {}),
  };
}

function normalizeAttachmentContext(value) {
  if (!Array.isArray(value)) return [];

  const sourceCounts = {};
  const sourceLimits = {
    composer: 3,
    "business-context": 5,
    contact: 5,
  };

  return value
    .map((item) => ({
      source: asString(item?.source),
      contactId: asString(item?.contactId),
      filename: asString(item?.filename),
      extension: asString(item?.extension).toLowerCase(),
      mimeType: asString(item?.mimeType),
      status: asString(item?.status, "needs-review") || "needs-review",
      summary: asString(item?.summary),
      extractedText: asString(item?.extractedText),
      confidence: Number.isFinite(Number(item?.confidence))
        ? Math.max(0, Math.min(1, Number(item.confidence)))
        : 0,
      provider: asString(item?.provider),
      warnings: Array.isArray(item?.warnings)
        ? item.warnings.map((entry) => asString(entry)).filter(Boolean).slice(0, 5)
        : [],
    }))
    .filter((item) => item.filename && (item.summary || item.extractedText))
    .filter((item) => {
      const limit = sourceLimits[item.source] || 0;
      if (!limit) return false;
      const current = sourceCounts[item.source] || 0;
      if (current >= limit) return false;
      sourceCounts[item.source] = current + 1;
      return true;
    });
}

function normalizeContactThread(value) {
  if (!value || typeof value !== "object") return null;

  const recentReplies = Array.isArray(value.recentReplies)
    ? value.recentReplies
        .map((entry) => asString(entry))
        .filter(Boolean)
        .slice(0, 5)
    : [];

  const normalized = {
    id: asString(value.id),
    name: asString(value.name),
    company: asString(value.company),
    email: asString(value.email),
    stage: asString(value.stage),
    notes: asString(value.notes),
    memorySummary: asString(value.memorySummary),
    chatContext: asString(value.chatContext),
    recentReplies,
    recentMessages: normalizeRecentMessages(value.recentMessages),
    threadSummary: normalizeThreadSummary(value.threadSummary),
    openCommitments: normalizeOpenCommitments(value.openCommitments),
    replyLearning: normalizeReplyLearning(value.replyLearning),
  };

  return normalized.id || normalized.name ? normalized : null;
}

function normalizeRecentMessages(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      direction: asString(item?.direction),
      source: asString(item?.source),
      summary: asString(item?.summary).slice(0, 220),
      createdAt: Number.isFinite(Number(item?.createdAt)) ? Number(item.createdAt) : undefined,
    }))
    .filter((item) => item.summary.length > 0)
    .slice(0, 8);
}

function normalizeThreadSummary(value) {
  if (!value || typeof value !== "object") return null;
  const text = asString(value.text).slice(0, 700);
  if (!text) return null;
  return {
    text,
    messageCount: Number.isFinite(Number(value.messageCount))
      ? Math.max(0, Math.round(Number(value.messageCount)))
      : 0,
    latestMessageAt: Number.isFinite(Number(value.latestMessageAt))
      ? Number(value.latestMessageAt)
      : null,
    updatedAt: Number.isFinite(Number(value.updatedAt))
      ? Number(value.updatedAt)
      : undefined,
  };
}

function normalizeOpenCommitments(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      kind: asString(item?.kind),
      summary: asString(item?.summary).slice(0, 220),
      direction: asString(item?.direction),
      createdAt: Number.isFinite(Number(item?.createdAt)) ? Number(item.createdAt) : undefined,
    }))
    .filter((item) => item.summary.length > 0 && (item.kind === "needs-reply" || item.kind === "promise"))
    .slice(0, 5);
}

function normalizeReplyLearning(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      kind: asString(item?.kind),
      preview: asString(item?.preview).slice(0, 260),
      textType: asString(item?.textType),
      variantId: asString(item?.variantId),
      createdAt: Number.isFinite(Number(item?.createdAt)) ? Number(item.createdAt) : undefined,
    }))
    .filter((item) => item.preview.length > 0 && ["accepted", "edited", "regenerated"].includes(item.kind))
    .slice(0, 5);
}

function asStringList(value, cap) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asString(item))
    .filter((item) => item.length > 0)
    .slice(0, cap);
}

function normalizeVoiceProfile(value) {
  if (!value || typeof value !== "object") return null;

  const openers = asStringList(value.openers, 3);
  const signoffs = asStringList(value.signoffs, 3);
  const medianRaw = Number(value.medianSentenceLength);
  const medianSentenceLength =
    Number.isFinite(medianRaw) && medianRaw > 0 ? Math.round(medianRaw) : 0;
  const usesEmoji = asBoolean(value.usesEmoji, false);
  const sampleRaw = Number(value.sampleSize);
  const sampleSize =
    Number.isFinite(sampleRaw) && sampleRaw > 0 ? Math.round(sampleRaw) : 0;

  if (
    openers.length === 0
    && signoffs.length === 0
    && medianSentenceLength === 0
    && !usesEmoji
  ) {
    return null;
  }

  return {
    openers,
    signoffs,
    medianSentenceLength,
    usesEmoji,
    sampleSize,
  };
}

function normalizeCrossLanguage(value) {
  if (!value || typeof value !== "object") return null;

  const inboundLanguage = asString(value.inboundLanguage);
  const replyInLanguage = asString(value.replyInLanguage);
  const register = asString(value.register);
  const preserveMeaningOnly = asBoolean(value.preserveMeaningOnly, false);

  if (!inboundLanguage && !replyInLanguage && !register && !preserveMeaningOnly) {
    return null;
  }

  return {
    ...(inboundLanguage ? { inboundLanguage } : {}),
    ...(replyInLanguage ? { replyInLanguage } : {}),
    ...(register ? { register } : {}),
    ...(preserveMeaningOnly ? { preserveMeaningOnly: true } : {}),
  };
}

export function normalizeGenerateRequest(body) {
  const payload = body && typeof body === "object" ? body : {};

  return {
    mode: asString(payload.mode, "reply") || "reply",
    recipient:
      asString(payload.recipient, "existing-client") || "existing-client",
    textType: asString(payload.textType, "balanced") || "balanced",
    language: asString(payload.language, "English") || "English",
    tone: {
      formality: asBoundedToneValue(payload?.tone?.formality, 3),
      warmth: asBoundedToneValue(payload?.tone?.warmth, 3),
      urgency: asBoundedToneValue(payload?.tone?.urgency, 3),
      confidence: asBoundedToneValue(payload?.tone?.confidence, 3),
    },
    businessContext: normalizeBusinessContext(payload.businessContext),
    rawInput: asString(payload.rawInput),
    mirrorMode: asBoolean(payload.mirrorMode),
    snippetMemory: normalizeSnippetMemory(payload.snippetMemory),
    recentReplies: normalizeRecentReplies(payload.recentReplies),
    generationContext: normalizeGenerationContext(payload.generationContext),
    attachmentContext: normalizeAttachmentContext(payload.attachmentContext),
    contactThread: normalizeContactThread(payload.contactThread),
    preferredProvider: asString(payload.preferredProvider),
    crossLanguage: normalizeCrossLanguage(payload.crossLanguage),
    voiceProfile: normalizeVoiceProfile(payload.voiceProfile),
  };
}

export function validateGenerateRequest(request) {
  if (!request.rawInput || request.rawInput.length === 0) {
    return { ok: false, error: "rawInput is required" };
  }

  return { ok: true };
}

export function buildQuickActions(insight) {
  if (!insight || typeof insight !== "object") return [];

  const hasFollowUp =
    typeof insight.followUp === "string" && insight.followUp.trim().length > 0;
  const actions = [
    { id: "send-now", label: "Send now" },
    { id: "save-reply", label: "Save reply" },
    { id: "add-task", label: hasFollowUp ? "Add follow-up" : "Add task" },
  ];

  return actions;
}
