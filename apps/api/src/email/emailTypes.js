export const DEFAULT_SYNC_OPTIONS = {
  provider: "imap",
  mailbox: "INBOX",
  sinceDays: 14,
  maxMessages: 120,
};

const SUPPORTED_PROVIDERS = new Set([
  "imap",
  "gmail-oauth",
  "microsoft-oauth",
]);

export function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

export function normalizeEmailAddress(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function parseAddressList(addresses) {
  if (!Array.isArray(addresses)) return [];
  return addresses
    .map((address) => normalizeEmailAddress(address?.address))
    .filter(Boolean);
}

export function coerceSyncConfig(raw) {
  const input = raw && typeof raw === "object" ? raw : {};

  const providerRaw = String(input.provider || DEFAULT_SYNC_OPTIONS.provider)
    .trim()
    .toLowerCase();
  const provider = SUPPORTED_PROVIDERS.has(providerRaw)
    ? providerRaw
    : DEFAULT_SYNC_OPTIONS.provider;

  const host = String(input.host || "").trim();
  const username = String(input.username || "").trim();
  const password = String(input.password || "").trim();
  const accessToken = String(input.accessToken || "").trim();
  const oauthUserEmail = normalizeEmailAddress(input.oauthUserEmail || "");

  const secure =
    typeof input.secure === "boolean"
      ? input.secure
      : Number(input.port) === 993;

  const port = clamp(input.port, 1, 65535, secure ? 993 : 143);

  return {
    provider,
    host,
    port,
    secure,
    username,
    password,
    accessToken,
    oauthUserEmail,
    mailbox:
      String(input.mailbox || DEFAULT_SYNC_OPTIONS.mailbox).trim() ||
      DEFAULT_SYNC_OPTIONS.mailbox,
    sinceDays: clamp(input.sinceDays, 1, 90, DEFAULT_SYNC_OPTIONS.sinceDays),
    maxMessages: clamp(
      input.maxMessages,
      20,
      300,
      DEFAULT_SYNC_OPTIONS.maxMessages,
    ),
  };
}

export function validateSyncConfig(config) {
  if (config.provider === "imap") {
    if (!config.host) return "Missing IMAP host";
    if (!config.username) return "Missing email username";
    if (!config.password) return "Missing email password or app password";
    return null;
  }

  if (config.provider === "gmail-oauth" || config.provider === "microsoft-oauth") {
    if (!config.accessToken) {
      return "Missing OAuth access token";
    }
    if (!config.username && !config.oauthUserEmail) {
      return "Missing account email for direction detection";
    }
    return null;
  }

  return "Unsupported sync provider";
}

export function normalizeContacts(rawContacts) {
  if (!Array.isArray(rawContacts)) return [];

  return rawContacts
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const id = String(item.id || "").trim();
      const name = String(item.name || "").trim();
      const email = normalizeEmailAddress(item.email);
      const chatContext = String(item.chatContext || "").trim();

      if (!id || !name) return null;

      return { id, name, email, chatContext };
    })
    .filter(Boolean);
}
