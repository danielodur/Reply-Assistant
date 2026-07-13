/**
 * Cross-language prompt fragment (Phase 9.1).
 *
 * Pure function. Given the optional `crossLanguage` block on a normalized
 * generate request, returns a short system-prompt fragment (or null) that
 * biases reply language + register + polish-only behavior at the model layer.
 *
 * The renderer has been shipping this block since Phase 3 and the backend
 * accepted it (normalizeCrossLanguage) but ignored it during prompt
 * construction. This module closes that loop.
 *
 * Contract reference: apps/web/src/components/cross-language/culturalTip.ts
 *  register ∈ 'western-business' | 'chinese-business' | 'cross-cultural'
 *           | 'polish-english' | 'neutral'
 *
 * Backwards-compatible: returns null when no actionable signal is present.
 */

const REGISTER_DIRECTIVES = {
  "western-business":
    "Register: Western business English — direct, concrete, action-first. Lead with the ask or next step; keep one idea per sentence; avoid ornate honorifics or filler softeners.",
  "chinese-business":
    "Register: 中文商务沟通 — 体面、含蓄、留余地。先寒暄一句再切入正题，称呼用敬语，避免过于直接的命令式表达，结尾留出后续沟通空间。",
  "cross-cultural":
    "Register: cross-cultural clarity — plain, unambiguous phrasing that both Chinese and Western readers can parse without idiom. Prefer concrete nouns and numbers over figurative language.",
  "polish-english":
    "Register: polish my English — improve grammar, flow, and natural phrasing only. Do not change meaning, add new claims, or remove facts the user wrote.",
  neutral: null,
};

const LANGUAGE_NAME = {
  en: "English",
  zh: "Chinese",
};

const INBOUND_NAME = {
  en: "English",
  zh: "Chinese",
  mixed: "mixed Chinese + English",
  unknown: null,
};

/**
 * @param {object|null|undefined} crossLanguage  Normalized crossLanguage block.
 * @returns {string|null}
 */
export function buildCrossLanguageFragment(crossLanguage) {
  if (!crossLanguage || typeof crossLanguage !== "object") return null;

  const parts = [];
  const { inboundLanguage, replyInLanguage, register, preserveMeaningOnly } =
    crossLanguage;

  const inboundLabel = inboundLanguage ? INBOUND_NAME[inboundLanguage] : null;
  const replyLabel = replyInLanguage ? LANGUAGE_NAME[replyInLanguage] : null;

  if (replyLabel) {
    parts.push(
      `Reply MUST be written in ${replyLabel} regardless of the inbound message language.`,
    );
  }

  if (inboundLabel && replyLabel && inboundLabel !== replyLabel) {
    parts.push(
      `Inbound message is in ${inboundLabel}; the reply crosses languages — match the recipient's reading register, not the inbound surface form.`,
    );
  }

  if (register) {
    const directive = REGISTER_DIRECTIVES[register];
    if (directive) parts.push(directive);
  }

  if (preserveMeaningOnly) {
    parts.push(
      "Preserve original meaning strictly: polish wording only. Do not add commitments, prices, dates, or facts the user did not write.",
    );
  }

  if (parts.length === 0) return null;
  return ["Cross-language guidance:", ...parts].join(" ");
}

// Internal exports for verification scripts.
export const __INTERNAL = { REGISTER_DIRECTIVES, LANGUAGE_NAME, INBOUND_NAME };
