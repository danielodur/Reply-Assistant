/**
 * Draft translation prompt fragment.
 *
 * Activated when generationContext.title is `translate-language:en` or
 * `translate-language:zh`. Works with the renderer's translate-draft flow
 * (preserve list in generationContext.body). Backwards-compatible: returns
 * null for any other title.
 */

const TRANSLATE_TITLE_RE = /^translate-language:(en|zh)$/;

const TARGET_LABEL = {
  en: "English",
  zh: "Chinese (Simplified)",
};

function cleanValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parsePreserveTerms(body) {
  const text = cleanValue(body);
  if (!text) return [];

  const lines = text.split("\n");
  const terms = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "PRESERVE_VERBATIM:") continue;
    const term = trimmed.replace(/^-\s*/, "").trim();
    if (term.length >= 2) terms.push(term);
  }

  return terms;
}

/**
 * @param {object|null|undefined} generationContext
 * @returns {string|null}
 */
export function buildTranslateDraftFragment(generationContext) {
  if (!generationContext || typeof generationContext !== "object") return null;

  const title = cleanValue(generationContext.title);
  const match = title.match(TRANSLATE_TITLE_RE);
  if (!match) return null;

  const target = match[1];
  const targetLabel = TARGET_LABEL[target];
  const preserveTerms = parsePreserveTerms(generationContext.body);

  const parts = [
    `Task: Translate the User Input draft into ${targetLabel} for a ready-to-send business reply.`,
    "Translate only explanatory prose — greetings, body, closings, and connective phrasing.",
    "Do NOT translate or alter proper nouns, person names, company names, product names, email addresses, URLs, numbers, dates, times, currency amounts, or file names.",
    "Preserve line breaks, bullets, numbering, and overall tone. Do not add facts, commitments, prices, or dates that are not in the draft.",
    "Return only the translated message body.",
  ];

  if (preserveTerms.length > 0) {
    parts.push(
      `Keep these strings exactly as written (verbatim, same script where applicable): ${preserveTerms.join("; ")}.`,
    );
  }

  return parts.join(" ");
}
