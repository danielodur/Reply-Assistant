/**
 * Intent chip (Phase 14) verify.
 * Run: npm run verify:intent (from apps/web)
 *
 * Asserts:
 *  - intent module files exist (detector + hook + chip)
 *  - WorkbenchHeader imports IntentChip + accepts detectedIntent +
 *    intentChipSuppressed props
 *  - FloatingAssistant imports useDetectedIntent and threads the props
 *    into the WorkbenchHeader
 *  - EN + ZH `intent` bag exists with every key
 *  - Runtime: fixture inputs produce the expected intent ids; ambiguous
 *    ties produce null; below-threshold inputs produce null; urgency
 *    patterns produce 'high' / 'medium' / null as expected.
 */
import { readFileSync, existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, '..');

function read(p) {
  return readFileSync(join(webRoot, p), 'utf8');
}

function fail(msg) {
  console.error(`Invariant failed: ${msg}`);
  process.exit(1);
}

function assertContains(label, body, token) {
  if (!body.includes(token)) {
    fail(`${label} missing "${token}"`);
  }
}

for (const required of [
  'src/components/intent/detectIntent.ts',
  'src/components/intent/useDetectedIntent.ts',
  'src/components/intent/IntentChip.tsx',
]) {
  if (!existsSync(join(webRoot, required))) {
    fail(`expected file ${required} to exist`);
  }
}

const header = read('src/components/workbench/WorkbenchHeader.tsx');
assertContains(
  'WorkbenchHeader imports IntentChip',
  header,
  "import IntentChip from '../intent/IntentChip'",
);
assertContains(
  'WorkbenchHeader takes detectedIntent prop',
  header,
  'detectedIntent?: DetectedIntent | null',
);
assertContains(
  'WorkbenchHeader takes intentChipSuppressed prop',
  header,
  'intentChipSuppressed?: boolean',
);
assertContains(
  'WorkbenchHeader renders IntentChip',
  header,
  '<IntentChip',
);
assertContains(
  'WorkbenchHeader OR-suppresses chip when language recommendation chip is visible',
  header,
  'intentChipSuppressed || showLanguageRecommendation',
);

const fa = read('src/components/FloatingAssistant.tsx');
assertContains(
  'FA imports useDetectedIntent',
  fa,
  "import { useDetectedIntent } from './intent/useDetectedIntent'",
);
assertContains(
  'FA calls useDetectedIntent(input)',
  fa,
  'useDetectedIntent(input)',
);
assertContains(
  'FA reuses composeCoachSuppressed for intent suppression',
  fa,
  'const intentChipSuppressed = composeCoachSuppressed',
);
assertContains(
  'FA threads detectedIntent into header',
  fa,
  'detectedIntent={detectedIntent}',
);
assertContains(
  'FA threads intentChipSuppressed into header',
  fa,
  'intentChipSuppressed={intentChipSuppressed}',
);

const translations = read('src/i18n/translations.ts');
for (const key of [
  'request:',
  'approval:',
  'negotiation:',
  'followUp:',
  'escalation:',
  'apology:',
  'scheduling:',
  'feedback:',
  'statusUpdate:',
  'reminder:',
  'urgencyHigh:',
  'urgencyMedium:',
]) {
  // ≥3 occurrences: type def + EN body + ZH body. (Some keys appear in other
  // unrelated places; the floor is what matters.)
  const re = new RegExp(`\\b${key}`, 'g');
  const count = (translations.match(re) || []).length;
  if (count < 3) {
    fail(`expected intent key ${key} ≥3 occurrences, saw ${count}`);
  }
}

// Sanity-check the rule engine via a tiny tsx runner.
const runtimeTest = `
import { detectIntent, INTENT_DETECT_MIN_INPUT_CHARS } from '../src/components/intent/detectIntent';

function assertId(label, result, expectedId) {
  if (!result || result.id !== expectedId) {
    console.error(label + ': expected intent ' + expectedId + ', got ' + JSON.stringify(result));
    process.exit(1);
  }
}

function assertNull(label, result) {
  if (result !== null) {
    console.error(label + ': expected null, got ' + JSON.stringify(result));
    process.exit(1);
  }
}

function assertUrgency(label, result, expected) {
  if (!result || result.urgency !== expected) {
    console.error(label + ': expected urgency ' + expected + ', got ' + JSON.stringify(result));
    process.exit(1);
  }
}

// Below threshold → null.
assertNull('below char threshold', detectIntent('hi there'));

// Single weak phrase → null (needs ≥2 pattern hits for a category).
assertNull('one weak hit only', detectIntent('Just wanted to share my thoughts on the new logo direction for the upcoming campaign launch.'));

// Negotiation strong: price + discount.
const neg = detectIntent('Could we revisit the pricing? The discount we agreed on does not match the latest quotation you sent.');
assertId('negotiation', neg, 'negotiation');

// Scheduling strong.
const sched = detectIntent('Can we schedule a call next Tuesday afternoon? I want to set up a meeting before the end of the week.');
assertId('scheduling', sched, 'scheduling');

// Apology strong.
const apol = detectIntent("I'm so sorry for the delay on the deliverable — please accept our apologies for missing the deadline last week.");
assertId('apology', apol, 'apology');

// Approval strong.
const appr = detectIntent('Please review and confirm the attached SOW so we can get sign-off before the end of week and lock the timeline.');
assertId('approval', appr, 'approval');

// Follow-up strong.
const fu = detectIntent('Following up on the proposal — circling back to see if you had any update on internal review or next steps.');
assertId('followUp', fu, 'followUp');

// Escalation strong with high urgency.
const esc = detectIntent('This is urgent — the shipment is now a blocker for the launch. We need to escalate as soon as possible.');
assertId('escalation', esc, 'escalation');
assertUrgency('escalation urgency high', esc, 'high');

// Medium urgency through "by tomorrow" + "this week".
const med = detectIntent('Could you approve the attached SOW by tomorrow? We need final approval and sign-off this week before the leadership review on Friday.');
if (!med || (med.urgency !== 'medium' && med.urgency !== 'high')) {
  console.error('medium urgency: expected medium/high urgency, got ' + JSON.stringify(med));
  process.exit(1);
}

// Ambiguous tie → null. Use two near-equal categories that both hit twice.
const tie = detectIntent('Following up on the pricing — circling back about the discount we agreed on last quarter please.');
// followUp gets "following up", "circling back" (2). negotiation gets "pricing", "discount" (2). Tie → null.
assertNull('ambiguous tie suppressed', tie);

console.log('intent runtime tests OK');
`;

const tempPath = join(webRoot, 'scripts', 'intent-runtime.mjs');
const tsTempPath = join(webRoot, 'scripts', 'intent-runtime.ts');
writeFileSync(tsTempPath, runtimeTest);

try {
  const run = spawnSync('npx', ['--yes', 'tsx', tsTempPath], {
    cwd: webRoot,
    stdio: 'inherit',
    encoding: 'utf8',
  });
  if (run.status !== 0) {
    process.exit(run.status ?? 1);
  }
} finally {
  try { unlinkSync(tsTempPath); } catch { /* ignore */ }
  try { unlinkSync(tempPath); } catch { /* ignore */ }
}

console.log('intent wiring invariants OK');
