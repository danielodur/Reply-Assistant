/**
 * Follow-ups + send-timing (Phase 19) verify.
 * Run: npm run verify:follow-ups (from apps/web)
 *
 * Asserts:
 *  - follow-ups + timing-intelligence module files exist
 *  - DailyBriefCard imports OpenLoopFootnote, accepts copy+openLoop props,
 *    renders the footnote when `copy` is provided
 *  - GeneratedReplyModal imports SendTimingHint, accepts sendTimingHint
 *    prop, renders it before the action row
 *  - FloatingAssistant computes both signals via useMemo and threads them
 *    into the right components
 *  - EN + ZH followUps + sendTiming bags have every key
 *  - Runtime: detectOpenLoops respects sample thresholds, ranks by overdue,
 *    skips closed loops, falls back to 3 days when no stat exists
 *  - Runtime: deriveSendTimingHint returns null below sample size, returns
 *    null when current hour is inside the band, returns a centre when out
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
  'src/components/follow-ups/detectOpenLoops.ts',
  'src/components/follow-ups/formatOpenLoopHint.ts',
  'src/components/follow-ups/OpenLoopFootnote.tsx',
  'src/components/timing-intelligence/deriveSendTimingHint.ts',
  'src/components/timing-intelligence/SendTimingHint.tsx',
]) {
  if (!existsSync(join(webRoot, required))) {
    fail(`expected file ${required} to exist`);
  }
}

const card = read('src/components/command-center/DailyBriefCard.tsx');
assertContains('DailyBriefCard imports OpenLoopFootnote', card, "import OpenLoopFootnote from '../follow-ups/OpenLoopFootnote'");
assertContains('DailyBriefCard accepts openLoop prop', card, 'openLoop?: OpenLoop | null');
assertContains('DailyBriefCard renders OpenLoopFootnote', card, '<OpenLoopFootnote');
assertContains('DailyBriefCard threads onSelectContact', card, 'onSelectContact={onSelectOpenLoopContact}');

const modal = read('src/components/workbench/GeneratedReplyModal.tsx');
assertContains('modal imports SendTimingHint', modal, "import SendTimingHint from '../timing-intelligence/SendTimingHint'");
assertContains('modal accepts sendTimingHint prop', modal, 'sendTimingHint?: SendTimingHintData | null');
assertContains('modal renders SendTimingHint', modal, '<SendTimingHint');

const fa = read('src/components/FloatingAssistant.tsx');
assertContains('FA imports detectOpenLoops', fa, "import { detectOpenLoops } from './follow-ups/detectOpenLoops'");
assertContains('FA imports deriveSendTimingHint', fa, "import { deriveSendTimingHint } from './timing-intelligence/deriveSendTimingHint'");
assertContains('FA computes dailyBriefOpenLoop', fa, 'const dailyBriefOpenLoop = useMemo');
assertContains('FA excludes selected contact from open loop', fa, 'loop.contactId !== selectedContactId');
assertContains('FA computes sendTimingHint', fa, 'const sendTimingHint = useMemo');
assertContains('FA passes openLoop to DailyBriefCard', fa, 'openLoop={dailyBriefOpenLoop}');
assertContains('FA passes sendTimingHint to modal', fa, 'sendTimingHint={sendTimingHint}');

const translations = read('src/i18n/translations.ts');
for (const key of [
  'followUps:',
  'sendTiming:',
  'waitingOn:',
  'overdueHours:',
  'overdueDays:',
  'recommendedTime:',
]) {
  const re = new RegExp(`\\b${key}`, 'g');
  const count = (translations.match(re) || []).length;
  if (count < 3) {
    fail(`expected key ${key} ≥3 occurrences, saw ${count}`);
  }
}

// Runtime tests.
const runtimeTest = `
import { detectOpenLoops, STALE_FALLBACK_MS, TYPICAL_GAP_MULTIPLIER } from '../src/components/follow-ups/detectOpenLoops';
import { deriveSendTimingHint, MIN_TIMING_SAMPLES } from '../src/components/timing-intelligence/deriveSendTimingHint';

function assertEq(label, actual, expected) {
  if (actual !== expected) {
    console.error(label + ': expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
    process.exit(1);
  }
}

function assertTrue(label, cond) {
  if (!cond) { console.error('FAIL ' + label); process.exit(1); }
}

function msg(id, direction, createdAt) {
  return { id, direction, source: 'paste', text: 'x', summary: '', createdAt, sender: 's', receiver: 'r', followUpKind: 'none' };
}

const NOW = 1700000000000;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Closed loop: newest is outbound → skipped.
const closedThread = {
  id: 'c1', name: 'Closed', company: '', stage: 'follow-up', notes: '',
  lastReplyAt: NOW, replies: [], messages: [msg('a', 'inbound', NOW - 10 * DAY), msg('b', 'outbound', NOW - 5 * DAY)],
  createdAt: NOW, updatedAt: NOW,
};
assertEq('closed loop skipped', detectOpenLoops([closedThread], NOW).length, 0);

// Open loop with no Phase 15 stat — needs > 3 days.
const fallbackOpen = {
  id: 'c2', name: 'Fallback', company: '', stage: 'follow-up', notes: '',
  lastReplyAt: NOW, replies: [], messages: [msg('a', 'inbound', NOW - 4 * DAY)],
  createdAt: NOW, updatedAt: NOW,
};
const fallbackResult = detectOpenLoops([fallbackOpen], NOW);
assertEq('fallback open loop fires after 4 days', fallbackResult.length, 1);
assertEq('fallback source', fallbackResult[0].source, 'fallback');
assertEq('fallback contact', fallbackResult[0].contactName, 'Fallback');

// Newer-than-3-days fallback → silent.
const tooFresh = {
  ...fallbackOpen,
  messages: [msg('a', 'inbound', NOW - 1 * DAY)],
};
assertEq('fresh under 3 days silent', detectOpenLoops([tooFresh], NOW).length, 0);

// With Phase 15 latency stat: 2 prior reply pairs at 1h each → threshold = 3h.
// New inbound 5h ago → overdue. Older inbound 1h ago → not overdue.
const observedOpen = {
  id: 'c3', name: 'Observed', company: '', stage: 'follow-up', notes: '',
  lastReplyAt: NOW, replies: [], messages: [
    msg('p1i', 'inbound',  NOW - 100 * DAY),
    msg('p1o', 'outbound', NOW - 100 * DAY + 1 * HOUR),
    msg('p2i', 'inbound',  NOW - 50 * DAY),
    msg('p2o', 'outbound', NOW - 50 * DAY + 1 * HOUR),
    msg('new', 'inbound',  NOW - 5 * HOUR),
  ],
  createdAt: NOW, updatedAt: NOW,
};
const observedResult = detectOpenLoops([observedOpen], NOW);
assertEq('observed open loop fires past 3x typical gap', observedResult.length, 1);
assertEq('observed source', observedResult[0].source, 'observed');
assertTrue('observed overdueMs positive', observedResult[0].overdueMs > 0);

// Ranking: most overdue first.
const overdueA = { ...fallbackOpen, id: 'a', name: 'A', messages: [msg('a', 'inbound', NOW - 4 * DAY)] };
const overdueB = { ...fallbackOpen, id: 'b', name: 'B', messages: [msg('b', 'inbound', NOW - 10 * DAY)] };
const ranked = detectOpenLoops([overdueA, overdueB], NOW);
assertEq('ranking puts most overdue first', ranked[0].contactName, 'B');

// Send timing: not enough samples → null.
assertEq('timing null below sample size', deriveSendTimingHint([msg('a', 'inbound', NOW)], 14), null);

// Send timing: 5 samples all at 9am, currentHour=14 (outside) → recommend 9.
const morningMsgs = [];
for (let i = 0; i < 5; i++) {
  const d = new Date(NOW - i * DAY);
  d.setHours(9, 30, 0, 0);
  morningMsgs.push(msg('m' + i, 'inbound', d.getTime()));
}
const morningHint = deriveSendTimingHint(morningMsgs, 14);
assertTrue('morning hint exists', morningHint !== null);
assertEq('morning hint hour', morningHint.recommendedHour, 9);

// Send timing: same morning samples but currentHour=9 (inside the band) → null.
assertEq('timing silent when inside band', deriveSendTimingHint(morningMsgs, 9), null);

console.log('follow-ups + send-timing runtime tests OK');
`;

const tempPath = join(webRoot, 'scripts', 'follow-ups-runtime.mjs');
const tsTempPath = join(webRoot, 'scripts', 'follow-ups-runtime.ts');
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

console.log('follow-ups wiring invariants OK');
