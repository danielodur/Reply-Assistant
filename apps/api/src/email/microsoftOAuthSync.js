import { normalizeEmailAddress } from "./emailTypes.js";

function parseRecipients(recipients) {
  if (!Array.isArray(recipients)) return [];
  return recipients
    .map((recipient) => normalizeEmailAddress(recipient?.emailAddress?.address))
    .filter(Boolean);
}

export async function fetchMicrosoftOAuthMessages(syncConfig) {
  const accessToken = String(syncConfig.accessToken || "").trim();
  if (!accessToken) {
    throw new Error("Missing OAuth access token for Microsoft sync");
  }

  const since = new Date(
    Date.now() - Number(syncConfig.sinceDays || 14) * 86400000,
  ).toISOString();
  const top = Math.min(Number(syncConfig.maxMessages || 120), 300);

  const endpoint = new URL("https://graph.microsoft.com/v1.0/me/messages");
  endpoint.searchParams.set(
    "$select",
    "id,conversationId,subject,from,toRecipients,ccRecipients,receivedDateTime,bodyPreview",
  );
  endpoint.searchParams.set("$top", String(top));
  endpoint.searchParams.set("$orderby", "receivedDateTime desc");
  endpoint.searchParams.set("$filter", `receivedDateTime ge ${since}`);

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      String(
        payload?.error?.message ||
          `Microsoft Graph API error ${response.status}`,
      ),
    );
  }

  const ownerEmail = normalizeEmailAddress(
    syncConfig.username || syncConfig.oauthUserEmail,
  );
  const items = Array.isArray(payload?.value) ? payload.value : [];

  return items.map((item) => {
    const from = [
      normalizeEmailAddress(item?.from?.emailAddress?.address),
    ].filter(Boolean);
    const to = parseRecipients(item?.toRecipients);
    const cc = parseRecipients(item?.ccRecipients);
    const outbound = ownerEmail && from.includes(ownerEmail);

    return {
      id: String(item?.id || "").trim(),
      threadId: String(item?.conversationId || item?.id || "").trim(),
      subject: String(item?.subject || "").trim(),
      text: String(item?.bodyPreview || "").trim(),
      from,
      to,
      cc,
      sentAt: String(item?.receivedDateTime || new Date().toISOString()),
      direction: outbound ? "outbound" : "inbound",
    };
  });
}
