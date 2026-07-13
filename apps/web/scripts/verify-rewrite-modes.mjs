/**
 * Rewrite modes + outcome signals (Phase 18) verify.
 * Run: npm run verify:rewrite-modes (from apps/web)
 *
 * Asserts:
 *  - rewrite-modes module files exist (registry + signals + 2 components)
 *  - GeneratedReplyModal imports both components and renders them around
 *    the bottom action row (signals between draft and actions; strip
 *    immediately above the action row)
 *  - FloatingAssistant imports RewriteMode, defines handleRewriteMode,
 *    routes through handleGenerate with `rewrite-mode:<id>` title, and
 *    threads onRewriteMode + loading into the modal
 *  - EN + ZH bags exist with every key for both new groups
 *  - Runtime: registry has exactly 5 modes, source titles match the
 *    `rewrite-mode:<id>` contract, getRewriteModeById is honest, and
 *    outcome signals fire on the right fixtures
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
  'src/components/rewrite-modes/registry.ts',
  'src/components/rewrite-modes/outcomeSignals.ts',
  'src/components/rewrite-modes/RewriteModeStrip.tsx',
  'src/components/rewrite-modes/OutcomeSignalsRow.tsx',
]) {
  if (!existsSync(join(webRoot, required))) {
    fail(`expected file ${required} to exist`);
  }
}

const modal = read('src/components/workbench/GeneratedReplyModal.tsx');
assertContains('modal imports OutcomeSignalsRow', modal, "import OutcomeSignalsRow from '../rewrite-modes/OutcomeSignalsRow'");
assertContains('modal imports RewriteModeStrip', modal, "import RewriteModeStrip from '../rewrite-modes/RewriteModeStrip'");
assertContains('modal accepts onRewriteMode prop', modal, 'onRewriteMode?: (mode: RewriteMode) => void');
assertContains('modal accepts loading prop', modal, 'loading?: boolean');
assertContains('modal renders OutcomeSignalsRow', modal, '<OutcomeSignalsRow');
assertContains('modal renders RewriteModeStrip', modal, '<RewriteModeStrip');

const fa = read('src/components/FloatingAssistant.tsx');
assertContains('FA imports RewriteMode type', fa, "import type { RewriteMode } from './rewrite-modes/registry'");
assertContains('FA defines handleRewriteMode', fa, 'const handleRewriteMode = useCallback');
assertContains('FA routes through rewrite-mode source title', fa, 'mode.sourceTitle');
assertContains('FA threads onRewriteMode to modal', fa, 'onRewriteMode={handleRewriteMode}');
assertContains('FA threads loading to modal', fa, 'loading={loading}');

const translations = read('src/i18n/translations.ts');
for (const key of [
  'rewriteModes:',
  'outcomeSignals:',
  'diplomatic:',
  'leadership:',
  'customerSupport:',
  'recruiting:',
  'clarity:',
  'hasClearCTA:',
  'professional:',
]) {
  const re = new RegExp(`\\b${key}`, 'g');
  const count = (translations.match(re) || []).length;
  if (count < 3) {
    fail(`expected key ${key} ≥3 occurrences (type def + EN + ZH), saw ${count}`);
  }
}

// Runtime tests for registry + signals
const runtimeTest = `
import { REWRITE_MODES, getRewriteModeById } from '../src/components/rewrite-modes/registry';
import { computeOutcomeSignals, OUTCOME_SIGNALS_MIN_DRAFT_CHARS } from '../src/components/rewrite-modes/outcomeSignals';

function assertEq(label, actual, expected) {
  if (actual !== expected) {
    console.error(label + ': expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
    process.exit(1);
  }
}

function assertTrue(label, cond) {
  if (!cond) { console.error('FAIL ' + label); process.exit(1); }
}

// Registry has exactly 6 modes (5 voices + voiceLikeMe added in Phase 21a).
assertEq('6 rewrite modes', REWRITE_MODES.length, 6);
// voiceLikeMe must remain first so "Write like me" reads as the headline chip.
assertEq('voiceLikeMe first', REWRITE_MODES[0].id, 'voiceLikeMe');

// Every source title matches the documented \`rewrite-mode:<id>\` contract.
for (const mode of REWRITE_MODES) {
  if (mode.sourceTitle !== 'rewrite-mode:' + mode.id) {
    console.error('mode ' + mode.id + ' sourceTitle drift: ' + mode.sourceTitle);
    process.exit(1);
  }
}

// getRewriteModeById is honest.
assertEq('lookup diplomatic', getRewriteModeById('diplomatic').id, 'diplomatic');
assertEq('lookup miss returns null', getRewriteModeById('nope'), null);

// Outcome signals — null when below threshold.
assertEq('signals null below threshold', computeOutcomeSignals('Too short.'), null);

// Clarity yes, CTA yes, professional yes — a well-crafted reply.
const clean = 'Thanks for sending the schedule over. Could you confirm the Friday delivery is still on track? Please let me know by EOD tomorrow so I can update the team.';
const cleanSignals = computeOutcomeSignals(clean);
assertTrue('clean draft hasClarity', cleanSignals.hasClarity);
assertTrue('clean draft hasClearCTA', cleanSignals.hasClearCTA);
assertTrue('clean draft isProfessional', cleanSignals.isProfessional);

// Missing CTA — long statement, no ask.
const noCta = 'Thanks for the heads up. We have been working on the schedule and everything is moving forward as planned. The team has been making good progress this quarter.';
const noCtaSignals = computeOutcomeSignals(noCta);
assertEq('no-cta hasClearCTA false', noCtaSignals.hasClearCTA, false);

// Unprofessional shout — sustained all-caps.
const shout = 'THIS IS UNACCEPTABLE AND THE TEAM NEEDS TO ADDRESS THIS IMMEDIATELY BECAUSE THE DEADLINE HAS PASSED.';
const shoutSignals = computeOutcomeSignals(shout);
assertEq('shout isProfessional false', shoutSignals.isProfessional, false);

// Filler-heavy draft — clarity false.
const filler = 'Basically, at the end of the day, I just wanted to quickly say that we sort of need to talk about this. To be perfectly honest, it is kind of important and I just wanted to let you know.';
const fillerSignals = computeOutcomeSignals(filler);
assertEq('filler hasClarity false', fillerSignals.hasClarity, false);

console.log('rewrite-modes runtime tests OK');
`;

const tempPath = join(webRoot, 'scripts', 'rewrite-modes-runtime.mjs');
const tsTempPath = join(webRoot, 'scripts', 'rewrite-modes-runtime.ts');
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

console.log('rewrite-modes wiring invariants OK');
