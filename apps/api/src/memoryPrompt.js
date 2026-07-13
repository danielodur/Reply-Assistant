function cleanValue(value) {
  return String(value || "").trim();
}

export function snippetMemorySection(snippets) {
  if (!Array.isArray(snippets) || snippets.length === 0) {
    return "None";
  }

  const lines = [];

  snippets
    .map((snippet) => ({
      title: cleanValue(snippet?.title),
      text: cleanValue(snippet?.text),
    }))
    .filter((snippet) => snippet.text)
    .slice(0, 5)
    .forEach((snippet, index) => {
      lines.push(`${index + 1}. ${snippet.title || "Untitled snippet"}`);
      lines.push(`   ${snippet.text}`);
    });

  if (lines.length === 0) {
    return "None";
  }

  lines.push(
    "Use snippets only when they genuinely fit the request. Adapt them naturally instead of copying them verbatim unless the user clearly wants template reuse.",
  );

  return lines.join("\n");
}

export function recentReplyMemorySection(recentReplies) {
  if (!Array.isArray(recentReplies) || recentReplies.length === 0) {
    return "None";
  }

  const lines = [];

  recentReplies
    .map((reply) => ({
      preview: cleanValue(reply?.preview),
      mode: cleanValue(reply?.mode),
      recipient: cleanValue(reply?.recipient),
      contactName: cleanValue(reply?.contactName),
    }))
    .filter((reply) => reply.preview)
    .slice(0, 5)
    .forEach((reply, index) => {
      const context = [reply.mode, reply.recipient, reply.contactName]
        .filter(Boolean)
        .join(" | ");
      lines.push(`${index + 1}. ${context || "Recent reply"}`);
      lines.push(`   ${reply.preview}`);
    });

  if (lines.length === 0) {
    return "None";
  }

  lines.push(
    "Use this memory to maintain continuity, avoid repeating the same phrasing, and keep the user's usual working style consistent.",
  );

  return lines.join("\n");
}

export function generationContextSection(context) {
  if (!context || typeof context !== "object") {
    return "Source: composer";
  }

  const source = cleanValue(context.source) || "composer";
  const title = cleanValue(context.title);
  const body = cleanValue(context.body);

  const lines = [`Source: ${source}`];

  if (title) {
    lines.push(`Title: ${title}`);
  }

  if (body) {
    lines.push(`Body: ${body}`);
  }

  return lines.join("\n");
}
