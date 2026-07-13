/**
 * Compose Coach (Phase 17) verify.
 * Run: npm run verify:compose-coach (from apps/web)
 *
 * Asserts:
 *  - quality-guard/composeCoach.ts + useComposeCoach.ts + ComposeCoachStrip.tsx exist
 *  - ComposerPanel imports + renders ComposeCoachStrip
 *  - FloatingAssistant imports useComposeCoach, computes warnings, threads
 *    suppression flags, and routes the Fix action through handleGenerate
 *    with a `compose-coach:<intent>` title
 *  - EN + ZH floating.coach bag has every key
 *  - Runtime fixture phrases produce the expected warning ids and intents
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
  'src/components/quality-guard/composeCoach.ts',
  'src/components/quality-guard/useComposeCoach.ts',
  'src/components/quality-guard/ComposeCoachStrip.tsx',
]) {
  if (!existsSync(join(webRoot, required))) {
    fail(`expected file ${required} to exist`);
  }
}

const composer = read('src/components/workbench/ComposerPanel.tsx');
assertContains(
  'ComposerPanel imports ComposeCoachStrip',
  composer,
  "import ComposeCoachStrip from '../quality-guard/ComposeCoachStrip'",
);
assertContains(
  'ComposerPanel exposes coachWarnings prop',
  composer,
  'coachWarnings?: ComposeCoachWarning[]',
);
assertContains(
  'ComposerPanel renders <ComposeCoachStrip',
  composer,
  '<ComposeCoachStrip',
);

const fa = read('src/components/FloatingAssistant.tsx');
assertContains(
  'FA imports useComposeCoach',
  fa,
  "import { useComposeCoach } from './quality-guard/useComposeCoach'",
);
assertContains(
  'FA imports deriveRelationshipStats for coach context',
  fa,
  "import { deriveRelationshipStats } from './relationship-memory/deriveRelationshipStats'",
);
assertContains(
  'FA calls useComposeCoach',
  fa,
  'useComposeCoach(input',
);
assertContains(
  'FA computes coach suppression flag',
  fa,
  'const composeCoachSuppressed',
);
assertContains(
  'FA suppresses coach during loading',
  fa,
  'loading\n    || isGeneratedModalOpen',
);
assertContains(
  'FA suppresses coach during guided tour',
  fa,
  '|| guidedTour.isActive',
);
assertContains(
  'FA routes Fix through handleGenerate with compose-coach intent title',
  fa,
  'compose-coach:${warning.intentForFix}',
);
assertContains(
  'FA passes coachWarnings prop to ComposerPanel',
  fa,
  'coachWarnings={composeCoachWarnings}',
);
assertContains(
  'FA passes coachSuppressed prop',
  fa,
  'coachSuppressed={composeCoachSuppressed}',
);
assertContains(
  'FA passes onCoachFix prop',
  fa,
  'onCoachFix={handleComposeCoachFix}',
);

const translations = read('src/i18n/translations.ts');
const requiredCoachKeys = ['eyebrow', 'missingAsk', 'confrontational', 'tooLong', 'allCaps', 'fix'];
for (const key of requiredCoachKeys) {
  const re = new RegExp(`\\b${key}:`, 'g');
  const count = (translations.match(re) || []).length;
  // 1 in type def, 1 in EN body, 1 in ZH body (other false positives possible
  // for very common words but our coach keys are specific to floating.coach so
  // ≥3 is the floor).
  if (count < 3) {
    fail(`expected coach key ${key} to appear in type def + EN + ZH (≥3 lines), saw ${count}`);
  }
}

// Sanity-check the rule engine via a tiny tsx runner.
const runtimeTest = `
import { runComposeCoach, COMPOSE_COACH_MIN_INPUT_CHARS } from '../src/components/quality-guard/composeCoach';

function assertHas(label, warnings, id) {
  if (!warnings.some(w => w.id === id)) {
    console.error(label + ': missing warning ' + id + '. Got ' + JSON.stringify(warnings.map(w => w.id)));
    process.exit(1);
  }
}

function assertNot(label, warnings, id) {
  if (warnings.some(w => w.id === id)) {
    console.error(label + ': should NOT have warning ' + id);
    process.exit(1);
  }
}

function assertEq(label, actual, expected) {
  if (actual !== expected) {
    console.error(label + ': expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
    process.exit(1);
  }
}

// Below threshold → silent.
assertEq('too-short input', runComposeCoach('Hello there.').length, 0);

// Long input without a clear ask → missingAsk warning.
const noAsk = 'Following up on the agreement we discussed last week regarding the pricing schedule and how it relates to the new product launch announced earlier this quarter.';
const noAskW = runComposeCoach(noAsk);
assertHas('long-no-ask', noAskW, 'missingAsk');

// Long input with a question mark → no missingAsk.
const withAsk = 'Following up on the agreement we discussed last week — could you confirm the pricing schedule is still aligned for the new product launch?';
assertNot('long-with-ask', runComposeCoach(withAsk), 'missingAsk');

// Confrontational phrase fires + has raise-formality fix.
const conf = 'As I already mentioned, you should have sent the contract last Friday and you didn’t follow through.';
const confW = runComposeCoach(conf);
assertHas('confrontational fires', confW, 'confrontational');
const confFix = confW.find(w => w.id === 'confrontational');
assertEq('confrontational fix intent', confFix.intentForFix, 'raise-formality');

// All-caps shout fires.
const shout = 'THIS NEEDS URGENT ATTENTION RIGHT NOW BECAUSE THE DEADLINE PASSED AND NO ONE RESPONDED PLEASE LOOK INTO THIS IMMEDIATELY.';
const shoutW = runComposeCoach(shout);
assertHas('allCaps shout', shoutW, 'allCaps');

// Mixed-case normal long text does not fire allCaps.
assertNot('mixed-case no allCaps', runComposeCoach(noAsk), 'allCaps');

// tooLong only when contactStats exist and length > 3x baseline AND > floor.
const baselineStats = {
  avgReplyGapMs: null, replyGapSampleSize: 0,
  typicalInboundLengthChars: null,
  typicalOutboundLengthChars: 200,
  lengthSampleSize: 3,
  outboundFormalityBias: null, formalitySampleSize: 0,
};
const longText = 'A'.repeat(800) + ' please review and confirm by tomorrow.';
const longW = runComposeCoach(longText, { contactStats: baselineStats });
assertHas('tooLong against baseline', longW, 'tooLong');
const longFix = longW.find(w => w.id === 'tooLong');
assertEq('tooLong fix intent', longFix.intentForFix, 'tighten-length');

// Without contactStats, tooLong stays silent even on the same long input.
assertNot('tooLong silent without baseline', runComposeCoach(longText), 'tooLong');

// Threshold gate: just under threshold → silent.
const justUnder = 'x'.repeat(COMPOSE_COACH_MIN_INPUT_CHARS - 1);
assertEq('threshold gate', runComposeCoach(justUnder).length, 0);

console.log('compose-coach runtime tests OK');
`;

const tempPath = join(webRoot, 'scripts', 'compose-coach-runtime.mjs');
const tsTempPath = join(webRoot, 'scripts', 'compose-coach-runtime.ts');
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

console.log('compose-coach wiring invariants OK');
