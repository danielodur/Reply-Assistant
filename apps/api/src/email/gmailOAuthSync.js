import { normalizeEmailAddress } from "./emailTypes.js";

function parseHeaderAddresses(value) {
  const raw = String(value || "").trim();
  if (!raw) return [];

  return raw
    .split(",")
    .map((part) => {
      const angleMatch = part.match(/<([^>]+)>/);
      const email = angleMatch ? angleMatch[1] : part;
      return normalizeEmailAddress(email.replace(/[\"']/g, "").trim());
    })
    .filter(Boolean);
}

function getHeaderValue(headers, name) {
  const key = String(name || "").toLowerCase();
  const header = Array.isArray(headers)
    ? headers.find((item) => String(item?.name || "").toLowerCase() === key)
    : null;
  return String(header?.value || "").trim();
}

export async function fetchGmailOAuthMessages(syncConfig) {
  const accessToken = String(syncConfig.accessToken || "").trim();
  if (!accessToken) {
    throw new Error("Missing OAuth access token for Gmail sync");
  }

  const query = `newer_than:${Number(syncConfig.sinceDays || 14)}d`;
  const listUrl = new URL(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages",
  );
  listUrl.searchParams.set("q", query);
  listUrl.searchParams.set(
    "maxResults",
    String(Number(syncConfig.maxMessages || 120)),
  );

  const listResponse = await fetch(listUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const listPayload = await listResponse.json().catch(() => null);
  if (!listResponse.ok) {
    throw new Error(
      String(
        listPayload?.error?.message || `Gmail API error ${listResponse.status}`,
      ),
    );
  }

  const messageIds = Array.isArray(listPayload?.messages)
    ? listPayload.messages
        .map((item) => String(item?.id || "").trim())
        .filter(Boolean)
    : [];

  const selectedIds = messageIds.slice(
    0,
    Number(syncConfig.maxMessages || 120),
  );
  const messages = [];
  const ownerEmail = normalizeEmailAddress(
    syncConfig.username || syncConfig.oauthUserEmail,
  );

  for (const id of selectedIds) {
    const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Subject`;
    const detailResponse = await fetch(detailUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const detailPayload = await detailResponse.json().catch(() => null);
    if (!detailResponse.ok) {
      continue;
    }

    const headers = detailPayload?.payload?.headers || [];
    const from = parseHeaderAddresses(getHeaderValue(headers, "From"));
    const to = parseHeaderAddresses(getHeaderValue(headers, "To"));
    const cc = parseHeaderAddresses(getHeaderValue(headers, "Cc"));
    const subject = getHeaderValue(headers, "Subject");
    const sentAt = Number(detailPayload?.internalDate)
      ? new Date(Number(detailPayload.internalDate)).toISOString()
      : new Date().toISOString();

    const outbound = ownerEmail && from.includes(ownerEmail);

    messages.push({
      id,
      threadId: String(detailPayload?.threadId || id),
      subject,
      text: String(detailPayload?.snippet || "").trim(),
      from,
      to,
      cc,
      sentAt,
      direction: outbound ? "outbound" : "inbound",
    });
  }

  return messages;
}
