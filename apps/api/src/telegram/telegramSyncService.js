import { normalizeContacts } from "../email/emailTypes.js";
import {
  buildConversationSnapshot,
  mergeChatContext,
} from "../email/contextBuilder.js";
import { buildSyncedTimelineEntries } from "../email/syncMessageMapper.js";

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function coerceTelegramConfig(raw) {
  const input = raw && typeof raw === "object" ? raw : {};
  return {
    botToken: String(input.botToken || "").trim(),
    chatId: String(input.chatId || "").trim(),
    maxMessages: clamp(input.maxMessages, 1, 100, 40),
  };
}

function sanitizeToken(value) {
  return String(value || "").trim();
}

function toIsoFromUnix(value) {
  const ts = Number(value);
  if (!Number.isFinite(ts) || ts <= 0) return new Date().toISOString();
  return new Date(ts * 1000).toISOString();
}

function toDirection(message) {
  const isBot = Boolean(message?.from?.is_bot);
  return isBot ? "outbound" : "inbound";
}

function toMessageText(message) {
  if (typeof message?.text === "string" && message.text.trim()) {
    return message.text.trim();
  }
  if (typeof message?.caption === "string" && message.caption.trim()) {
    return message.caption.trim();
  }
  return "";
}

function toSenderName(message) {
  const username = String(message?.from?.username || "").trim();
  if (username) return `@${username}`;

  const first = String(message?.from?.first_name || "").trim();
  const last = String(message?.from?.last_name || "").trim();
  const full = [first, last].filter(Boolean).join(" ").trim();
  if (full) return full;

  return "Telegram user";
}

async function fetchTelegramMessages(syncConfig) {
  const token = sanitizeToken(syncConfig.botToken);
  if (!token) {
    throw new Error("Missing Telegram bot token");
  }

  const endpoint = new URL(
    `https://api.telegram.org/bot${encodeURIComponent(token)}/getUpdates`,
  );
  endpoint.searchParams.set("limit", String(syncConfig.maxMessages));
  endpoint.searchParams.set("allowed_updates", JSON.stringify(["message"]));

  const response = await fetch(endpoint, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Telegram API error ${response.status}`);
  }

  if (!payload || payload.ok !== true || !Array.isArray(payload.result)) {
    throw new Error("Telegram API returned an invalid response");
  }

  return payload.result
    .map((item) => item?.message)
    .filter(Boolean)
    .map((message) => {
      const text = toMessageText(message);
      if (!text) return null;

      return {
        id: String(message.message_id || "").trim(),
        direction: toDirection(message),
        text,
        sentAt: toIsoFromUnix(message.date),
        sender: toSenderName(message),
        chatId: String(message?.chat?.id ?? "").trim(),
      };
    })
    .filter(Boolean);
}

export async function syncTelegramContactContexts(input) {
  const payload = input && typeof input === "object" ? input : {};
  const syncConfig = coerceTelegramConfig(payload.syncConfig);
  const targetContactId = String(payload.targetContactId || "").trim();

  if (!syncConfig.botToken) {
    return {
      ok: false,
      error: "Missing Telegram bot token",
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

  const fetchedMessages = await fetchTelegramMessages(syncConfig);
  const filtered = syncConfig.chatId
    ? fetchedMessages.filter((message) => message.chatId === syncConfig.chatId)
    : fetchedMessages;

  const sorted = [...filtered]
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
    .slice(0, syncConfig.maxMessages);

  if (!sorted.length) {
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

  const snapshot = buildConversationSnapshot(sorted, contact.chatContext);
  const merged = mergeChatContext(contact.chatContext, snapshot);

  return {
    ok: true,
    updates: [
      {
        contactId: contact.id,
        chatContext: merged,
        lastSyncedAt: new Date().toISOString(),
        matchedMessages: sorted.length,
        syncedMessages: buildSyncedTimelineEntries(sorted, contact.name),
      },
    ],
    summary: {
      fetchedMessages: fetchedMessages.length,
      matchedMessages: sorted.length,
      updatedContacts: 1,
    },
  };
}
