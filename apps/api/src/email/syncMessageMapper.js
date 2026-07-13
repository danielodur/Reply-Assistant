function compactText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSummary(text) {
  if (!text) return "";
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
}

function toIsoTimestamp(value) {
  const ts = new Date(String(value || "")).getTime();
  if (!Number.isFinite(ts)) return new Date().toISOString();
  return new Date(ts).toISOString();
}

export function buildSyncedTimelineEntries(messages, contactName) {
  const name = String(contactName || "Contact").trim() || "Contact";

  return messages
    .map((message) => {
      const text = compactText(message.text || message.subject);
      if (!text) return null;

      const direction =
        message.direction === "outbound" ? "outbound" : "inbound";
      return {
        externalId: String(message.id || "").trim() || undefined,
        direction,
        source: "email-sync",
        text,
        summary: buildSummary(text),
        sentAt: toIsoTimestamp(message.sentAt),
        sender: direction === "outbound" ? "You" : name,
        receiver: direction === "outbound" ? name : "You",
      };
    })
    .filter(Boolean)
    .slice(0, 25);
}
