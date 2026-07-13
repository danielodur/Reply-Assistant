import { normalizeContacts } from "../email/emailTypes.js";
import {
  buildConversationSnapshot,
  mergeChatContext,
} from "../email/contextBuilder.js";
import { buildSyncedTimelineEntries } from "../email/syncMessageMapper.js";
import {
  appendSocialMessages,
  listSocialMessages,
} from "../social/socialSyncStore.js";

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function toIso(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return new Date().toISOString();
  return new Date(n * 1000).toISOString();
}

function normalizeWebhookMessages(payload) {
  const source = payload && typeof payload === "object" ? payload : {};
  const messages = Array.isArray(source.messages) ? source.messages : [];

  return messages
    .map((message) => {
      const text = String(message?.text || message?.content || "").trim();
      if (!text) return null;

      return {
        id: String(message?.id || message?.msgId || "").trim(),
        direction: message?.direction === "outbound" ? "outbound" : "inbound",
        text,
        sentAt: toIso(message?.timestamp || message?.createdAt),
        sender:
          String(message?.sender || message?.from || "DingTalk user").trim() ||
          "DingTalk user",
        chatId: String(message?.chatId || message?.conversationId || "").trim(),
      };
    })
    .filter(Boolean);
}

export async function ingestDingTalkWebhook(input) {
  const payload = input && typeof input === "object" ? input : {};
  const appKey = String(payload.appKey || payload.agentId || "").trim();
  if (!appKey) {
    return { ok: false, error: "Missing DingTalk app key", ingested: 0 };
  }

  const messages = normalizeWebhookMessages(payload);
  let ingested = 0;

  const count = await appendSocialMessages({
    provider: "dingtalk",
    workspaceKey: appKey,
    items: messages,
    rawPayload: payload,
  });
  ingested += count;

  return { ok: true, ingested };
}

function coerceConfig(raw) {
  const input = raw && typeof raw === "object" ? raw : {};
  return {
    appKey: String(input.appKey || "").trim(),
    maxMessages: clamp(input.maxMessages, 1, 100, 40),
  };
}

export async function syncDingTalkContactContexts(input) {
  const payload = input && typeof input === "object" ? input : {};
  const syncConfig = coerceConfig(payload.syncConfig);
  const targetContactId = String(payload.targetContactId || "").trim();

  if (!syncConfig.appKey) {
    return {
      ok: false,
      error: "Missing DingTalk app key",
      updates: [],
      summary: { fetchedMessages: 0, matchedMessages: 0, updatedContacts: 0 },
    };
  }

  if (!targetContactId) {
    return {
      ok: false,
      error: "Missing target contact id",
      updates: [],
      summary: { fetchedMessages: 0, matchedMessages: 0, updatedContacts: 0 },
    };
  }

  const contacts = normalizeContacts(payload.contacts);
  const contact = contacts.find((item) => item.id === targetContactId);
  if (!contact) {
    return {
      ok: false,
      error: "Target contact was not found",
      updates: [],
      summary: { fetchedMessages: 0, matchedMessages: 0, updatedContacts: 0 },
    };
  }

  const fetchedMessages = await listSocialMessages({
    provider: "dingtalk",
    workspaceKey: syncConfig.appKey,
    limit: syncConfig.maxMessages,
  });
  const selected = fetchedMessages.slice(0, syncConfig.maxMessages);

  if (!selected.length) {
    return {
      ok: true,
      updates: [],
      summary: {
        fetchedMessages: fetchedMessages.length,
        matchedMessages: 0,
        updatedContacts: 0,
      },
    };
  }

  const snapshot = buildConversationSnapshot(selected, contact.chatContext);
  const merged = mergeChatContext(contact.chatContext, snapshot);

  return {
    ok: true,
    updates: [
      {
        contactId: contact.id,
        chatContext: merged,
        lastSyncedAt: new Date().toISOString(),
        matchedMessages: selected.length,
        syncedMessages: buildSyncedTimelineEntries(selected, contact.name),
      },
    ],
    summary: {
      fetchedMessages: fetchedMessages.length,
      matchedMessages: selected.length,
      updatedContacts: 1,
    },
  };
}
