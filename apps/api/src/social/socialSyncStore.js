import { createClient } from "@supabase/supabase-js";

const SOCIAL_SYNC_TABLE = "social_sync_inbox";
const memoryInbox = new Map();
const SOCIAL_CONFLICT_KEY = "provider,workspace_key,external_id";

function memoryKey(provider, workspaceKey) {
  return `${provider}:${workspaceKey}`;
}

function isSupabaseConfigured() {
  const url = String(process.env.SUPABASE_URL || "").trim();
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) return false;
  if (
    url.includes("YOUR_PROJECT_REF") ||
    key.includes("YOUR_SUPABASE_SERVICE_ROLE_KEY")
  ) {
    return false;
  }
  return true;
}

const supabase = isSupabaseConfigured()
  ? createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false, autoRefreshToken: false },
      },
    )
  : null;

function pushMemory(provider, workspaceKey, items) {
  const key = memoryKey(provider, workspaceKey);
  const current = memoryInbox.get(key) || [];
  const next = [...items, ...current]
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
    .slice(0, 500);
  memoryInbox.set(key, next);
}

function messageDedupeKey(item) {
  const id = String(item?.id || "").trim();
  if (id) return `id:${id}`;

  const direction = String(item?.direction || "inbound").trim();
  const sentAt = String(item?.sentAt || "").trim();
  const chatId = String(item?.chatId || "").trim();
  const text = String(item?.text || "").trim();
  return `composite:${direction}:${sentAt}:${chatId}:${text}`;
}

function dedupeIncomingItems(provider, workspaceKey, items) {
  const key = memoryKey(provider, workspaceKey);
  const current = memoryInbox.get(key) || [];
  const seen = new Set(current.map((item) => messageDedupeKey(item)));
  const next = [];

  for (const item of items) {
    const dedupeKey = messageDedupeKey(item);
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    next.push(item);
  }

  return next;
}

function readMemory(provider, workspaceKey, limit) {
  const key = memoryKey(provider, workspaceKey);
  const current = memoryInbox.get(key) || [];
  return current.slice(0, limit);
}

function toStoreRows(provider, workspaceKey, items, rawPayload) {
  return items.map((item) => ({
    provider,
    workspace_key: workspaceKey,
    external_id: item.id || null,
    direction: item.direction,
    message_text: item.text,
    sender: item.sender || null,
    chat_id: item.chatId || null,
    sent_at: item.sentAt,
    raw_payload: rawPayload ?? {},
  }));
}

function fromStoreRows(rows) {
  return rows.map((row) => ({
    id: String(row.external_id || "").trim(),
    direction: row.direction === "outbound" ? "outbound" : "inbound",
    text: String(row.message_text || "").trim(),
    sentAt: new Date(row.sent_at).toISOString(),
    sender: String(row.sender || "").trim(),
    chatId: String(row.chat_id || "").trim(),
  }));
}

export async function appendSocialMessages({
  provider,
  workspaceKey,
  items,
  rawPayload,
}) {
  const safeProvider = String(provider || "").trim();
  const safeWorkspace = String(workspaceKey || "").trim();
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!safeProvider || !safeWorkspace || safeItems.length === 0) return 0;

  const uniqueItems = dedupeIncomingItems(
    safeProvider,
    safeWorkspace,
    safeItems,
  );
  if (!uniqueItems.length) return 0;

  pushMemory(safeProvider, safeWorkspace, uniqueItems);

  if (!supabase) return uniqueItems.length;

  const rows = toStoreRows(
    safeProvider,
    safeWorkspace,
    uniqueItems,
    rawPayload,
  );
  const rowsWithExternalId = rows.filter((row) =>
    String(row.external_id || "").trim(),
  );
  const rowsWithoutExternalId = rows.filter(
    (row) => !String(row.external_id || "").trim(),
  );

  let hasWriteError = false;

  if (rowsWithExternalId.length) {
    const { error } = await supabase
      .from(SOCIAL_SYNC_TABLE)
      .upsert(rowsWithExternalId, {
        onConflict: SOCIAL_CONFLICT_KEY,
        ignoreDuplicates: true,
      });
    if (error) {
      hasWriteError = true;
      console.warn("[social-sync-store] upsert failed", {
        provider: safeProvider,
        workspaceKey: safeWorkspace,
        code: error.code,
        message: error.message,
      });
    }
  }

  if (rowsWithoutExternalId.length) {
    const { error } = await supabase
      .from(SOCIAL_SYNC_TABLE)
      .insert(rowsWithoutExternalId);
    if (error) {
      hasWriteError = true;
      console.warn("[social-sync-store] insert failed", {
        provider: safeProvider,
        workspaceKey: safeWorkspace,
        code: error.code,
        message: error.message,
      });
    }
  }

  if (!hasWriteError) return uniqueItems.length;

  return 0;
}

export async function listSocialMessages({
  provider,
  workspaceKey,
  limit = 40,
}) {
  const safeProvider = String(provider || "").trim();
  const safeWorkspace = String(workspaceKey || "").trim();
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 40));
  if (!safeProvider || !safeWorkspace) return [];

  if (!supabase) {
    return readMemory(safeProvider, safeWorkspace, safeLimit);
  }

  const { data, error } = await supabase
    .from(SOCIAL_SYNC_TABLE)
    .select("external_id,direction,message_text,sender,chat_id,sent_at")
    .eq("provider", safeProvider)
    .eq("workspace_key", safeWorkspace)
    .order("sent_at", { ascending: false })
    .limit(safeLimit);

  if (error || !Array.isArray(data)) {
    return readMemory(safeProvider, safeWorkspace, safeLimit);
  }

  return fromStoreRows(data);
}
