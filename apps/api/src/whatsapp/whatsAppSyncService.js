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

function normalizeText(message) {
  if (message?.type === "text" && typeof message?.text?.body === "string") {
    return message.text.body.trim();
  }
  if (typeof message?.text?.body === "string") {
    return message.text.body.trim();
  }
  return "";
}

function getSenderName(contactMap, from) {
  const record = contactMap.get(String(from || "").trim());
  if (!record) return "WhatsApp user";
  return String(record.profile?.name || "").trim() || "WhatsApp user";
}

export async function ingestWhatsAppWebhook(input) {
  const payload = input && typeof input === "object" ? input : {};
  const entries = Array.isArray(payload.entry) ? payload.entry : [];

  let ingested = 0;

  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const change of changes) {
      const value = change?.value;
      const metadata = value?.metadata;
      const phoneNumberId = String(metadata?.phone_number_id || "").trim();
      if (!phoneNumberId) continue;

      const contacts = Array.isArray(value?.contacts) ? value.contacts : [];
      const contactMap = new Map(
        contacts.map((contact) => [
          String(contact?.wa_id || "").trim(),
          contact,
        ]),
      );
      const collected = [];

      const messages = Array.isArray(value?.messages) ? value.messages : [];
      for (const message of messages) {
        const text = normalizeText(message);
        if (!text) continue;

        collected.push({
          id: String(message?.id || "").trim(),
          direction: "inbound",
          text,
          sentAt: toIso(message?.timestamp),
          sender: getSenderName(contactMap, message?.from),
          chatId: String(message?.from || "").trim(),
        });
      }

      if (collected.length) {
        const count = await appendSocialMessages({
          provider: "whatsapp",
          workspaceKey: phoneNumberId,
          items: collected,
          rawPayload: value,
        });
        ingested += count;
      }
    }
  }

  return { ok: true, ingested };
}

function coerceConfig(raw) {
  const input = raw && typeof raw === "object" ? raw : {};
  return {
    phoneNumberId: String(input.phoneNumberId || "").trim(),
    maxMessages: clamp(input.maxMessages, 1, 100, 40),
  };
}

export async function syncWhatsAppContactContexts(input) {
  const payload = input && typeof input === "object" ? input : {};
  const syncConfig = coerceConfig(payload.syncConfig);
  const targetContactId = String(payload.targetContactId || "").trim();

  if (!syncConfig.phoneNumberId) {
    return {
      ok: false,
      error: "Missing WhatsApp phone number id",
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
    provider: "whatsapp",
    workspaceKey: syncConfig.phoneNumberId,
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
