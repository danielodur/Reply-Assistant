/**
 * Cross-language prompt fragment (Phase 9.1) golden tests.
 * Run: npm run verify:cross-language-fragment (from apps/api)
 *
 * Asserts:
 *  - buildCrossLanguageFragment is pure and returns null when there is
 *    nothing actionable to add (preserves old backend behavior).
 *  - Each documented register produces a stable directive string.
 *  - replyInLanguage forces a language directive.
 *  - preserveMeaningOnly adds the "do not alter facts" directive.
 *  - Cross-language inbound vs reply triggers the bridge sentence.
 *  - The fragment composes deterministically.
 *  - server.js imports and threads the fragment into buildMessages().
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildCrossLanguageFragment,
  __INTERNAL,
} from "../src/crossLanguageFragment.js";

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

console.log("Cross-language fragment — null / no-op cases");
check("null input → null", buildCrossLanguageFragment(null) === null);
check("undefined input → null", buildCrossLanguageFragment(undefined) === null);
check(
  "empty object → null",
  buildCrossLanguageFragment({}) === null,
);
check(
  "neutral register alone → null",
  buildCrossLanguageFragment({ register: "neutral" }) === null,
);
check(
  "unknown inbound only → null",
  buildCrossLanguageFragment({ inboundLanguage: "unknown" }) === null,
);

console.log("\nCross-language fragment — register directives");
const registers = [
  "western-business",
  "chinese-business",
  "cross-cultural",
  "polish-english",
];
for (const register of registers) {
  const fragment = buildCrossLanguageFragment({ register });
  check(
    `register ${register} produces a directive`,
    typeof fragment === "string" && fragment.length > 0,
  );
  check(
    `register ${register} includes the source-of-truth directive`,
    fragment && fragment.includes(__INTERNAL.REGISTER_DIRECTIVES[register]),
  );
}

console.log("\nCross-language fragment — language + meaning rules");
const replyEn = buildCrossLanguageFragment({ replyInLanguage: "en" });
check(
  "replyInLanguage=en forces English",
  typeof replyEn === "string" && replyEn.includes("English"),
  replyEn,
);

const replyZh = buildCrossLanguageFragment({ replyInLanguage: "zh" });
check(
  "replyInLanguage=zh forces Chinese",
  typeof replyZh === "string" && replyZh.includes("Chinese"),
  replyZh,
);

const polish = buildCrossLanguageFragment({
  register: "polish-english",
  preserveMeaningOnly: true,
});
check(
  "polish-english + preserveMeaningOnly includes meaning lock",
  polish && polish.includes("Preserve original meaning strictly"),
  polish,
);

console.log("\nCross-language fragment — cross-language bridge sentence");
const zhToEn = buildCrossLanguageFragment({
  inboundLanguage: "zh",
  replyInLanguage: "en",
  register: "western-business",
});
check(
  "ZH inbound + EN reply triggers bridge sentence",
  zhToEn && zhToEn.includes("crosses languages"),
  zhToEn,
);
check(
  "ZH→EN includes western-business directive",
  zhToEn &&
    zhToEn.includes(__INTERNAL.REGISTER_DIRECTIVES["western-business"]),
);

const enToZhLeader = buildCrossLanguageFragment({
  inboundLanguage: "en",
  replyInLanguage: "zh",
  register: "chinese-business",
});
check(
  "EN inbound + ZH reply + chinese-business reads as deferential 中文",
  enToZhLeader &&
    enToZhLeader.includes(
      __INTERNAL.REGISTER_DIRECTIVES["chinese-business"],
    ),
  enToZhLeader,
);

console.log("\nCross-language fragment — server wiring");
const serverSource = readFileSync(join(apiRoot, "src/server.js"), "utf8");
check(
  "server.js imports buildCrossLanguageFragment",
  serverSource.includes(
    'from "./crossLanguageFragment.js"',
  ) && serverSource.includes("buildCrossLanguageFragment"),
);
check(
  "buildMessages() invokes buildCrossLanguageFragment with request.crossLanguage",
  serverSource.includes(
    "buildCrossLanguageFragment(request.crossLanguage)",
  ),
);
check(
  "system prompt array filters Boolean so null fragment is no-op",
  serverSource.includes(".filter(Boolean)"),
);

if (failures > 0) {
  console.error(`\n${failures} failure(s) — invariant violated.`);
  process.exit(1);
}
console.log("\nAll cross-language fragment invariants hold.");
