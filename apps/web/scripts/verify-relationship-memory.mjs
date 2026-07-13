/**
 * Relationship Memory (Phase 15) verify.
 * Run: npm run verify:relationship-memory (from apps/web)
 *
 * Asserts:
 *  - relationship-memory module files exist
 *  - ContactThreadCard imports + renders RelationshipHintLine
 *  - buildContactThreadContext appends the derived block to memorySummary
 *    only when stats pass thresholds (manual memory wins on conflict)
 *  - EN + ZH translations include the relationshipMemory bag with all keys
 *  - Runtime stats from fixture threads match expected derivations
 *  - Runtime: hint formatter is null when stats are below threshold;
 *    non-null with the right priority order when they are.
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
  'src/components/relationship-memory/deriveRelationshipStats.ts',
  'src/components/relationship-memory/formatRelationshipHint.ts',
  'src/components/relationship-memory/buildRelationshipPromptBlock.ts',
  'src/components/relationship-memory/RelationshipHintLine.tsx',
]) {
  if (!existsSync(join(webRoot, required))) {
    fail(`expected file ${required} to exist`);
  }
}

const card = read('src/components/contacts/ContactThreadCard.tsx');
assertContains(
  'ContactThreadCard imports RelationshipHintLine',
  card,
  "import RelationshipHintLine from '../relationship-memory/RelationshipHintLine'",
);
assertContains(
  'ContactThreadCard renders <RelationshipHintLine thread={thread} copy={copy} />',
  card,
  '<RelationshipHintLine thread={thread} copy={copy} />',
);

const ctx = read('src/config/contactThreads.ts');
assertContains(
  'buildContactThreadContext imports deriveRelationshipStats',
  ctx,
  "import { deriveRelationshipStats } from '../components/relationship-memory/deriveRelationshipStats'",
);
assertContains(
  'buildContactThreadContext imports buildRelationshipPromptBlock',
  ctx,
  "import { buildRelationshipPromptBlock } from '../components/relationship-memory/buildRelationshipPromptBlock'",
);
assertContains(
  'buildContactThreadContext calls buildRelationshipPromptBlock',
  ctx,
  'buildRelationshipPromptBlock(',
);
// Manual memory must come BEFORE the derived block in the joined memorySummary.
assertContains(
  'manual memory summary is joined first',
  ctx,
  '[manualMemorySummary, relationshipBlock]',
);

const translations = read('src/i18n/translations.ts');
for (const key of [
  'relationshipMemory:',
  'eyebrow:',
  'repliesWithinMinutes:',
  'repliesWithinHours:',
  'repliesWithinOneDay:',
  'repliesWithinDays:',
  'prefersShort:',
  'prefersLong:',
  'formalBias:',
  'casualBias:',
  'separator:',
]) {
  assertContains('translations.ts', translations, key);
}

// EN/ZH parity: each relationshipMemory key appears in two locale blocks
// (EN body + ZH body) on top of the one type-definition occurrence = 3 lines.
const expectedKeyOccurrences = ['repliesWithinMinutes', 'prefersShort', 'casualBias', 'eyebrow'];
for (const k of expectedKeyOccurrences) {
  const re = new RegExp(`\\b${k}\\b`, 'g');
  const count = (translations.match(re) || []).length;
  if (count < 3) {
    fail(`expected key ${k} to appear in type def + EN + ZH (≥3 lines), saw ${count}`);
  }
}

// Sanity-check the stats + formatter via a tiny tsx runner.
const runtimeTest = `
import { deriveRelationshipStats, hasAnyRelationshipSignal } from '../src/components/relationship-memory/deriveRelationshipStats';
import { formatRelationshipHint, buildRelationshipHintParts } from '../src/components/relationship-memory/formatRelationshipHint';
import { buildRelationshipPromptBlock } from '../src/components/relationship-memory/buildRelationshipPromptBlock';
import { getTranslations } from '../src/i18n/translations';

function assertEq(label, actual, expected) {
  if (actual !== expected) {
    console.error(\`\${label}: expected \${JSON.stringify(expected)}, got \${JSON.stringify(actual)}\`);
    process.exit(1);
  }
}

function assertTrue(label, cond) {
  if (!cond) { console.error('FAIL ' + label); process.exit(1); }
}

const enCopy = getTranslations('en').relationshipMemory;
const zhCopy = getTranslations('zh').relationshipMemory;

// Empty thread → silent.
const emptyStats = deriveRelationshipStats([]);
assertTrue('empty stats has no signal', !hasAnyRelationshipSignal(emptyStats));
assertEq('empty hint null', formatRelationshipHint(emptyStats, enCopy), null);
assertEq('empty prompt block null', buildRelationshipPromptBlock(emptyStats), null);

// Single inbound → still silent (below all thresholds).
const oneMsg = [{ id: 'a', direction: 'inbound', source: 'paste', text: 'Hi, ping', summary: 'Hi', createdAt: 1000, sender: 'x', receiver: 'y', followUpKind: 'none' }];
assertEq('single message hint null', formatRelationshipHint(deriveRelationshipStats(oneMsg), enCopy), null);

// Reply-latency fixture: two inbound→outbound pairs, ~2h gap each.
const TWO_HOURS = 2 * 60 * 60 * 1000;
const baseline = 1700000000000;
const replyLatencyThread = [
  { id: 'a1', direction: 'inbound',  source: 'paste', text: 'Question 1?', summary: '', createdAt: baseline, sender: 'them', receiver: 'me', followUpKind: 'none' },
  { id: 'a2', direction: 'outbound', source: 'generated-reply', text: 'Answer 1.', summary: '', createdAt: baseline + TWO_HOURS, sender: 'me', receiver: 'them', followUpKind: 'none' },
  { id: 'b1', direction: 'inbound',  source: 'paste', text: 'Follow up question?', summary: '', createdAt: baseline + 10 * TWO_HOURS, sender: 'them', receiver: 'me', followUpKind: 'none' },
  { id: 'b2', direction: 'outbound', source: 'generated-reply', text: 'Sure thing.',  summary: '', createdAt: baseline + 11 * TWO_HOURS, sender: 'me', receiver: 'them', followUpKind: 'none' },
];
const latStats = deriveRelationshipStats(replyLatencyThread);
assertEq('reply-gap sample size 2', latStats.replyGapSampleSize, 2);
assertEq('avg reply gap is two hours', latStats.avgReplyGapMs, TWO_HOURS);
const latHint = formatRelationshipHint(latStats, enCopy);
assertTrue('reply gap hint shows hours', !!latHint && latHint.includes('2 hr'));
const zhLatHint = formatRelationshipHint(latStats, zhCopy);
assertTrue('reply gap zh hint includes 小时', !!zhLatHint && zhLatHint.includes('小时'));
const latPrompt = buildRelationshipPromptBlock(latStats);
assertTrue('prompt block includes latency', !!latPrompt && latPrompt.includes('Typical reply latency'));

// Short-inbound fixture: 3 short inbound + 3 short outbound.
const shortThread = [];
for (let i = 0; i < 3; i++) {
  shortThread.push({ id: 'i' + i, direction: 'inbound', source: 'paste', text: 'Hi!', summary: 'Hi', createdAt: baseline + i * 1000, sender: 'them', receiver: 'me', followUpKind: 'none' });
  shortThread.push({ id: 'o' + i, direction: 'outbound', source: 'generated-reply', text: 'Hey, sure.', summary: '', createdAt: baseline + i * 1000 + 500, sender: 'me', receiver: 'them', followUpKind: 'none' });
}
const shortStats = deriveRelationshipStats(shortThread);
assertTrue('short inbound below 80 chars', (shortStats.typicalInboundLengthChars ?? 1000) <= 80);
const shortHint = formatRelationshipHint(shortStats, enCopy);
assertTrue('hint mentions short messages', !!shortHint && shortHint.includes('short messages'));

// Long-inbound fixture: 3 long inbound (>=280 chars).
const longInboundText = 'Thanks for your detailed answer. I have a few follow-up questions about the schedule that I want to align with my team. Could you walk me through the milestones across procurement, manufacturing, QA, and the final logistics handoff so I can sanity-check our internal plan and share an executive summary with the leadership group on Friday?';
const longThread = [];
for (let i = 0; i < 3; i++) {
  longThread.push({ id: 'L' + i, direction: 'inbound', source: 'paste', text: longInboundText, summary: '', createdAt: baseline + i * 1000, sender: 'them', receiver: 'me', followUpKind: 'none' });
  longThread.push({ id: 'M' + i, direction: 'outbound', source: 'generated-reply', text: 'Sure — let me lay this out.', summary: '', createdAt: baseline + i * 1000 + 500, sender: 'me', receiver: 'them', followUpKind: 'none' });
}
const longStats = deriveRelationshipStats(longThread);
assertTrue('long inbound above 280 chars', (longStats.typicalInboundLengthChars ?? 0) >= 280);
const longHint = formatRelationshipHint(longStats, enCopy);
assertTrue('hint mentions longer messages', !!longHint && longHint.includes('longer messages'));

// Formality bias: 3 outbound with formal markers.
const formalThread = [
  { id: 'f1', direction: 'outbound', source: 'generated-reply', text: 'Dear Mr. Chen, please find attached the proposal. Kind regards.', summary: '', createdAt: baseline, sender: 'me', receiver: 'them', followUpKind: 'none' },
  { id: 'f2', direction: 'outbound', source: 'generated-reply', text: 'Dear Mr. Chen, I would like to confirm our next meeting. Sincerely.', summary: '', createdAt: baseline + 1000, sender: 'me', receiver: 'them', followUpKind: 'none' },
  { id: 'f3', direction: 'outbound', source: 'generated-reply', text: 'Dear Mr. Chen, kindly review the schedule. Regards.', summary: '', createdAt: baseline + 2000, sender: 'me', receiver: 'them', followUpKind: 'none' },
];
const formalStats = deriveRelationshipStats(formalThread);
assertEq('formal bias detected', formalStats.outboundFormalityBias, 'formal');
const formalPrompt = buildRelationshipPromptBlock(formalStats);
assertTrue('prompt block notes formal bias', !!formalPrompt && formalPrompt.includes('tends formal'));

// Hint priority cap: at most 2 fragments.
const richThread = [...replyLatencyThread, ...shortThread];
const richParts = buildRelationshipHintParts(deriveRelationshipStats(richThread), enCopy);
assertTrue('hint capped at 2 fragments', richParts.length <= 2);
assertTrue('reply-gap is first fragment when present', richParts[0].includes('hr') || richParts[0].includes('day') || richParts[0].includes('min'));

console.log('relationship-memory runtime tests OK');
`;

const tempPath = join(webRoot, 'scripts', 'relationship-memory-runtime.mjs');
const tsTempPath = join(webRoot, 'scripts', 'relationship-memory-runtime.ts');
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

console.log('relationship-memory wiring invariants OK');
