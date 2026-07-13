/**
 * Voice profile prompt fragment (Phase 21a — "Write like me").
 *
 * Pure function. Mirrors crossLanguageFragment.js: given the optional
 * `voiceProfile` block on a normalized generate request, returns a short
 * system-prompt fragment (or null) that biases the model to match the
 * user's observed openers, sign-offs, sentence length, and emoji habit.
 *
 * Contract reference: apps/web/src/components/voice-profile/buildVoiceProfile.ts
 * Backwards-compatible: returns null when no actionable signal is present.
 */

function joinSamples(list) {
  if (!Array.isArray(list)) return "";
  const cleaned = list
    .map(s => (typeof s === "string" ? s.trim() : ""))
    .filter(s => s.length > 0)
    .slice(0, 3);
  if (cleaned.length === 0) return "";
  return cleaned.map(s => `"${s}"`).join(" / ");
}

function describeSentenceLength(median) {
  if (typeof median !== "number" || median <= 0) return null;
  if (median <= 80) return "short, punchy sentences (median ≈ " + median + " chars)";
  if (median <= 180) return "medium-length sentences (median ≈ " + median + " chars)";
  return "longer, denser sentences (median ≈ " + median + " chars)";
}

/**
 * @param {object|null|undefined} voiceProfile  Normalized voice profile block.
 * @returns {string|null}
 */
export function buildVoiceProfileFragment(voiceProfile) {
  if (!voiceProfile || typeof voiceProfile !== "object") return null;

  const parts = [];
  const openers = joinSamples(voiceProfile.openers);
  const signoffs = joinSamples(voiceProfile.signoffs);
  const sentence = describeSentenceLength(voiceProfile.medianSentenceLength);
  const usesEmoji =
    voiceProfile.usesEmoji === true || voiceProfile.usesEmoji === "true";

  if (openers) {
    parts.push(`Greeting openers the user actually uses: ${openers}. Match this style — do not invent new openers.`);
  }
  if (signoffs) {
    parts.push(`Sign-offs the user actually uses: ${signoffs}. Close in that voice.`);
  }
  if (sentence) {
    parts.push(`Cadence: ${sentence}.`);
  }

  // Emoji guidance is a modifier on real voice signal — only emit when at
  // least one other part is already present. Otherwise `{}` would produce a
  // confident-sounding "user does not use emoji" claim we can't defend.
  if (parts.length > 0) {
    if (usesEmoji) {
      parts.push("Emoji are part of the user's voice — keep them where they fit naturally; do not over-use.");
    } else {
      parts.push("The user does not use emoji in their replies — do not add any.");
    }
  }

  if (parts.length === 0) return null;
  return ["Voice profile (write like the user):", ...parts].join(" ");
}

// Internal export for verification scripts.
export const __INTERNAL = { joinSamples, describeSentenceLength };
