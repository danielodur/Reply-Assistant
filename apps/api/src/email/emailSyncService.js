import {
  matchMessageToContact,
  buildContactEmailIndex,
} from "./contactMatcher.js";
import {
  buildConversationSnapshot,
  mergeChatContext,
} from "./contextBuilder.js";
import {
  coerceSyncConfig,
  normalizeContacts,
  validateSyncConfig,
} from "./emailTypes.js";
import { fetchImapMessages } from "./imapSync.js";
import { fetchGmailOAuthMessages } from "./gmailOAuthSync.js";
import { fetchMicrosoftOAuthMessages } from "./microsoftOAuthSync.js";
import { buildSyncedTimelineEntries } from "./syncMessageMapper.js";

async function fetchMessagesByProvider(syncConfig) {
  if (syncConfig.provider === "gmail-oauth") {
    return fetchGmailOAuthMessages(syncConfig);
  }

  if (syncConfig.provider === "microsoft-oauth") {
    return fetchMicrosoftOAuthMessages(syncConfig);
  }

  return fetchImapMessages(syncConfig);
}

export async function syncEmailContactContexts(input) {
  const payload = input && typeof input === "object" ? input : {};

  const syncConfig = coerceSyncConfig(payload.syncConfig);
  const syncError = validateSyncConfig(syncConfig);
  if (syncError) {
    return {
      ok: false,
      error: syncError,
      updates: [],
      summary: { fetchedMessages: 0, matchedMessages: 0, updatedContacts: 0 },
    };
  }

  const contacts = normalizeContacts(payload.contacts);
  const emailContacts = contacts.filter((contact) => Boolean(contact.email));
  if (emailContacts.length === 0) {
    return {
      ok: false,
      error: "No contacts with email addresses were provided",
      updates: [],
      summary: { fetchedMessages: 0, matchedMessages: 0, updatedContacts: 0 },
    };
  }

  const messages = await fetchMessagesByProvider(syncConfig);
  const index = buildContactEmailIndex(emailContacts);
  const byContactId = new Map();
  let matchedMessages = 0;

  for (const message of messages) {
    const match = matchMessageToContact(message, index);
    if (!match?.contact) continue;
    if (match.confidence !== "high") continue;

    matchedMessages += 1;
    const bucket = byContactId.get(match.contact.id) || [];
    bucket.push(message);
    byContactId.set(match.contact.id, bucket);
  }

  const updates = [];

  for (const [contactId, matched] of byContactId.entries()) {
    const contact = emailContacts.find((item) => item.id === contactId);
    if (!contact) continue;

    const snapshot = buildConversationSnapshot(matched, contact.chatContext);
    const merged = mergeChatContext(contact.chatContext, snapshot);

    updates.push({
      contactId,
      chatContext: merged,
      lastSyncedAt: new Date().toISOString(),
      matchedMessages: matched.length,
      syncedMessages: buildSyncedTimelineEntries(matched, contact.name),
    });
  }

  return {
    ok: true,
    updates,
    summary: {
      fetchedMessages: messages.length,
      matchedMessages,
      updatedContacts: updates.length,
    },
  };
}
