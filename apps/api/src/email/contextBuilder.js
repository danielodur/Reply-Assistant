function compactWhitespace(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function toPreview(text, limit = 220) {
  const normalized = compactWhitespace(text);
  if (!normalized) return "";
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit - 1)}…`;
}

export function buildConversationSnapshot(messages, existingContext) {
  const sorted = [...messages]
    .filter((message) => message && message.sentAt)
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
    .slice(0, 8);

  const lines = sorted
    .map((message) => {
      const preview = toPreview(message.text);
      if (!preview) return "";
      const side = message.direction === "outbound" ? "You" : "Contact";
      const timestamp = new Date(message.sentAt).toISOString().slice(0, 10);
      return `- ${timestamp} ${side}: ${preview}`;
    })
    .filter(Boolean);

  if (lines.length === 0) {
    return existingContext || "";
  }

  return ["Auto-synced highlights:", ...lines].join("\n");
}

export function mergeChatContext(existingContext, snapshot) {
  const existing = String(existingContext || "").trim();
  const synced = String(snapshot || "").trim();

  if (!existing) return synced;
  if (!synced) return existing;

  if (
    existing.includes("Auto-synced highlights:") ||
    existing.includes("Auto-synced email highlights:")
  ) {
    return synced;
  }

  return [existing, "", synced].join("\n").trim();
}
