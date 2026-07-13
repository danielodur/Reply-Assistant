/**
 * Draft translation prompt fragment tests.
 * Run: npm run verify:translate-draft-fragment (from apps/api)
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildTranslateDraftFragment } from "../src/translateDraftFragment.js";

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

console.log("Translate draft fragment — null / no-op cases");
check("null input → null", buildTranslateDraftFragment(null) === null);
check("undefined input → null", buildTranslateDraftFragment(undefined) === null);
check("empty object → null", buildTranslateDraftFragment({}) === null);
check(
  "rewrite-mode title → null",
  buildTranslateDraftFragment({ title: "rewrite-mode:diplomatic" }) === null,
);

console.log("\nTranslate draft fragment — language targets");
const toEn = buildTranslateDraftFragment({ title: "translate-language:en" });
check("translate-language:en → fragment", typeof toEn === "string" && toEn.includes("English"));
const toZh = buildTranslateDraftFragment({ title: "translate-language:zh" });
check(
  "translate-language:zh → fragment",
  typeof toZh === "string" && toZh.includes("Chinese"),
);

console.log("\nTranslate draft fragment — preserve list");
const withPreserve = buildTranslateDraftFragment({
  title: "translate-language:en",
  body: "PRESERVE_VERBATIM:\n- Sarah Chen\n- Acme Ltd",
});
check(
  "preserve terms echoed in fragment",
  typeof withPreserve === "string"
    && withPreserve.includes("Sarah Chen")
    && withPreserve.includes("Acme Ltd"),
);

const server = readFileSync(join(apiRoot, "src", "server.js"), "utf8");
check(
  "server.js imports buildTranslateDraftFragment",
  server.includes('import { buildTranslateDraftFragment } from "./translateDraftFragment.js"'),
);
check(
  "server.js calls buildTranslateDraftFragment in buildMessages",
  server.includes("buildTranslateDraftFragment(request.generationContext)"),
);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}

console.log("\ntranslate-draft-fragment OK");
