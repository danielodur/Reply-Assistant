function cleanValue(value) {
  return String(value || "").trim();
}

function formatMessageDigestLine(entry) {
  if (!entry || typeof entry !== "object") return "";
  const direction = cleanValue(entry.direction);
  const source = cleanValue(entry.source);
  const summary = cleanValue(entry.summary);
  const createdAt = entry.createdAt;
  const timeHint =
    typeof createdAt === "number" && Number.isFinite(createdAt)
      ? new Date(createdAt).toISOString()
      : "";
  const dirLabel =
    direction === "outbound"
      ? "outbound (you)"
      : direction === "inbound"
        ? "inbound (them)"
        : "note";
  return `[${dirLabel}${source ? ` · ${source}` : ""}${timeHint ? ` · ${timeHint}` : ""}] ${summary}`;
}

export function contactThreadSection(contactThread) {
  if (!contactThread || typeof contactThread !== "object") {
    return "None";
  }

  const name = cleanValue(contactThread.name);
  const company = cleanValue(contactThread.company);
  const email = cleanValue(contactThread.email);
  const stage = cleanValue(contactThread.stage);
  const notes = cleanValue(contactThread.notes);
  const memorySummary = cleanValue(contactThread.memorySummary);
  const chatContext = cleanValue(contactThread.chatContext);
  const threadSummary = contactThread.threadSummary && typeof contactThread.threadSummary === "object"
    ? cleanValue(contactThread.threadSummary.text)
    : "";
  const recentReplies = Array.isArray(contactThread.recentReplies)
    ? contactThread.recentReplies
        .map((reply) => cleanValue(reply))
        .filter(Boolean)
        .slice(0, 5)
    : [];

  const recentMessages = Array.isArray(contactThread.recentMessages)
    ? contactThread.recentMessages.filter((m) => m && typeof m === "object")
    : [];
  const openCommitments = Array.isArray(contactThread.openCommitments)
    ? contactThread.openCommitments.filter((item) => item && typeof item === "object")
    : [];
  const replyLearning = Array.isArray(contactThread.replyLearning)
    ? contactThread.replyLearning.filter((item) => item && typeof item === "object")
    : [];

  const lines = [
    `Contact: ${name || "Unknown"}`,
    `Company: ${company || "Unknown"}`,
    `Email: ${email || "Unknown"}`,
    `Stage: ${stage || "Unknown"}`,
    `Notes: ${notes || "None"}`,
    `Relationship memory: ${memorySummary || "None"}`,
    `Long-thread summary: ${threadSummary || "None"}`,
    `Chat history (legacy/freeform): ${chatContext || "None"}`,
  ];

  if (recentMessages.length > 0) {
    lines.push("Recent timeline (newest first):");
    recentMessages.forEach((msg, index) => {
      lines.push(`${index + 1}. ${formatMessageDigestLine(msg)}`);
    });
  } else {
    lines.push("Recent timeline: None");
  }

  if (recentReplies.length > 0) {
    lines.push("Recent generated reply previews:");
    recentReplies.forEach((reply, index) => {
      lines.push(`${index + 1}. ${reply}`);
    });
  } else {
    lines.push("Recent generated reply previews: None");
  }

  if (openCommitments.length > 0) {
    lines.push("Open commitments / unanswered asks:");
    openCommitments.slice(0, 5).forEach((item, index) => {
      const kind = cleanValue(item.kind);
      const direction = cleanValue(item.direction);
      const summary = cleanValue(item.summary);
      lines.push(`${index + 1}. ${kind}${direction ? ` · ${direction}` : ""}: ${summary}`);
    });
  } else {
    lines.push("Open commitments / unanswered asks: None");
  }

  if (replyLearning.length > 0) {
    lines.push("Reply outcome learning:");
    replyLearning.slice(0, 5).forEach((item, index) => {
      const kind = cleanValue(item.kind);
      const textType = cleanValue(item.textType);
      const preview = cleanValue(item.preview);
      lines.push(`${index + 1}. ${kind}${textType ? ` · ${textType}` : ""}: ${preview}`);
    });
  } else {
    lines.push("Reply outcome learning: None");
  }

  lines.push(
    "Use this thread context to avoid repeating yourself, maintain continuity, honor open commitments, and adapt to reply outcome learning without overfitting.",
  );

  return lines.join("\n");
}
