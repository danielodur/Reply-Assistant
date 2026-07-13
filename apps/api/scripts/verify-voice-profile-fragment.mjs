/**
 * Voice profile fragment (Phase 21a — backend side) golden tests.
 * Run: npm run verify:voice-profile-fragment (from apps/api)
 *
 * Asserts:
 *  - buildVoiceProfileFragment is pure and returns null when there is
 *    nothing actionable to add (matches the crossLanguage pattern).
 *  - Openers / signoffs / cadence / emoji each produce a stable directive.
 *  - server.js + generateContract.js are wired correctly.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildVoiceProfileFragment,
} from "../src/voiceProfileFragment.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = join(__dirname, "..");

let failures = 0;
function check(label, condition, detail = "") {
  if (condition) {
    console.log(`  ok  — ${label}`);
  } else {
    failures += 1;
    console.error(`  fail — ${label}${detail ? `\n        ${detail}` : ""}`);
  }
}

console.log("Voice profile fragment — null / no-op cases");
check("null input → null", buildVoiceProfileFragment(null) === null);
check("undefined input → null", buildVoiceProfileFragment(undefined) === null);
check("empty object → null", buildVoiceProfileFragment({}) === null);
check(
  "empty arrays + zero median + no emoji → null",
  buildVoiceProfileFragment({
    openers: [],
    signoffs: [],
    medianSentenceLength: 0,
    usesEmoji: false,
  }) === null,
);

console.log("\nVoice profile fragment — directives");
const openersOnly = buildVoiceProfileFragment({ openers: ["Hi Sarah,", "Hey team,"] });
check(
  "openers directive emitted",
  openersOnly && openersOnly.includes("Greeting openers"),
  openersOnly,
);
check(
  "openers quoted exactly",
  openersOnly && openersOnly.includes('"Hi Sarah,"'),
  openersOnly,
);

const signoffOnly = buildVoiceProfileFragment({ signoffs: ["Best,", "Thanks!"] });
check(
  "signoff directive emitted",
  signoffOnly && signoffOnly.includes("Sign-offs"),
  signoffOnly,
);

const shortCadence = buildVoiceProfileFragment({ medianSentenceLength: 40 });
check(
  "short cadence label",
  shortCadence && shortCadence.includes("short, punchy"),
  shortCadence,
);
const mediumCadence = buildVoiceProfileFragment({ medianSentenceLength: 120 });
check(
  "medium cadence label",
  mediumCadence && mediumCadence.includes("medium-length"),
  mediumCadence,
);
const longCadence = buildVoiceProfileFragment({ medianSentenceLength: 240 });
check(
  "long cadence label",
  longCadence && longCadence.includes("longer, denser"),
  longCadence,
);

const emojiYes = buildVoiceProfileFragment({ openers: ["Hi"], usesEmoji: true });
check(
  "usesEmoji=true emits keep-emoji directive",
  emojiYes && emojiYes.includes("Emoji are part of the user's voice"),
  emojiYes,
);

const emojiNo = buildVoiceProfileFragment({ openers: ["Hi"], usesEmoji: false });
check(
  "usesEmoji=false emits do-not-add-emoji directive",
  emojiNo && emojiNo.includes("does not use emoji"),
  emojiNo,
);

console.log("\nVoice profile fragment — server wiring");
const serverSource = readFileSync(join(apiRoot, "src/server.js"), "utf8");
check(
  "server.js imports buildVoiceProfileFragment",
  serverSource.includes('from "./voiceProfileFragment.js"') && serverSource.includes("buildVoiceProfileFragment"),
);
check(
  "buildMessages invokes buildVoiceProfileFragment with request.voiceProfile",
  serverSource.includes("buildVoiceProfileFragment(request.voiceProfile)"),
);
check(
  "system prompt array still uses .filter(Boolean) so null fragment is no-op",
  serverSource.includes(".filter(Boolean)"),
);

const contractSource = readFileSync(join(apiRoot, "src/generateContract.js"), "utf8");
check(
  "generateContract.js declares normalizeVoiceProfile",
  contractSource.includes("function normalizeVoiceProfile"),
);
check(
  "normalizeGenerateRequest includes voiceProfile field",
  contractSource.includes("voiceProfile: normalizeVoiceProfile(payload.voiceProfile)"),
);

if (failures > 0) {
  console.error(`\n${failures} failure(s) — invariant violated.`);
  process.exit(1);
}
console.log("\nAll voice profile fragment invariants hold.");
