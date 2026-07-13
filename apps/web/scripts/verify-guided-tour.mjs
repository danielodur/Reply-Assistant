/**
 * Guided tour (Phase 7) wiring smoke checks.
 * Run: npm run verify:guided-tour (from apps/web)
 *
 * Asserts:
 *  - guided-tour module files exist
 *  - data-tour-anchor attributes are placed on the four target surfaces
 *  - FloatingAssistant imports the tour + sample helpers, wires the layer,
 *    seeds the sample contact, and gates the Cmd+K hint on tour activity
 *  - Settings exposes onReplayTour and renders the replay card
 *  - MiniScreenHost forwards onReplayTour to Settings
 *  - i18n keys are present in EN + ZH
 *  - useGuidedTour step machine advances through every step then completes
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
  'src/components/guided-tour/sampleContact.ts',
  'src/components/guided-tour/useGuidedTour.ts',
  'src/components/guided-tour/GuidedTourTooltip.tsx',
  'src/components/guided-tour/GuidedTourLayer.tsx',
]) {
  if (!existsSync(join(webRoot, required))) {
    fail(`missing file ${required}`);
  }
}

assertContains('DailyBriefCard', read('src/components/command-center/DailyBriefCard.tsx'), 'data-tour-anchor="daily-brief-cta"');
assertContains('WorkbenchHeader (add-contact)', read('src/components/workbench/WorkbenchHeader.tsx'), 'data-tour-anchor="add-contact"');
assertContains('WorkbenchHeader (cmd-k)', read('src/components/workbench/WorkbenchHeader.tsx'), 'data-tour-anchor="cmd-k"');
assertContains('InstantAmmo', read('src/components/InstantAmmo.tsx'), 'data-tour-anchor="quick-start"');

const floating = read('src/components/FloatingAssistant.tsx');
const floatingTokens = [
  "import GuidedTourLayer from './guided-tour/GuidedTourLayer'",
  "import { useGuidedTour } from './guided-tour/useGuidedTour'",
  'hasSeededSampleContact',
  'markSampleContactSeeded',
  'buildSampleContact(copy)',
  '<GuidedTourLayer',
  'onReplayTour={guidedTour.restart}',
  '&& !guidedTour.isActive',
];
for (const token of floatingTokens) {
  assertContains('FloatingAssistant', floating, token);
}

const settings = read('src/components/Settings.tsx');
assertContains('Settings.tsx', settings, 'onReplayTour?:');
assertContains('Settings.tsx', settings, 'guidedTour.replayTitle');
assertContains('Settings.tsx', settings, 'guidedTour.replayButton');

const miniHost = read('src/components/mini-screens/MiniScreenHost.tsx');
assertContains('MiniScreenHost', miniHost, 'onReplayTour?:');
assertContains('MiniScreenHost', miniHost, 'onReplayTour={onReplayTour}');

const translations = read('src/i18n/translations.ts');
const i18nKeys = [
  "'daily-brief':",
  "'add-contact':",
  "'quick-start':",
  "'cmd-k':",
  'replayTitle:',
  'replayDescription:',
  'replayButton:',
  'sampleContactName:',
  'sampleContactCompany:',
  'sampleContactRole:',
  'sampleInboundText:',
];
for (const key of i18nKeys) {
  const matches = translations.split(key).length - 1;
  // typedef appears once + EN + ZH = 3 (some keys live only in EN+ZH bodies, hence >= 2)
  if (matches < 2) {
    fail(`translations.ts is missing EN/ZH coverage for "${key}" (found ${matches} occurrences)`);
  }
}

// Runtime test of the tour state machine.
const runtimeTest = `
import { GUIDED_TOUR_STEPS, nextGuidedTourStep } from '../src/components/guided-tour/useGuidedTour';

function assertEq(label, actual, expected) {
  if (actual !== expected) {
    console.error(\`\${label}: expected \${JSON.stringify(expected)}, got \${JSON.stringify(actual)}\`);
    process.exit(1);
  }
}

assertEq('step count', GUIDED_TOUR_STEPS.length, 4);
assertEq('first step', GUIDED_TOUR_STEPS[0], 'daily-brief');
assertEq('after daily-brief', nextGuidedTourStep('daily-brief'), 'add-contact');
assertEq('after add-contact', nextGuidedTourStep('add-contact'), 'quick-start');
assertEq('after quick-start', nextGuidedTourStep('quick-start'), 'cmd-k');
assertEq('after cmd-k', nextGuidedTourStep('cmd-k'), null);

console.log('guided-tour runtime tests OK');
`;

const tempPath = join(webRoot, 'scripts', 'guided-tour-runtime.ts');
writeFileSync(tempPath, runtimeTest);

try {
  const run = spawnSync('npx', ['--yes', 'tsx', tempPath], {
    cwd: webRoot,
    stdio: 'inherit',
    encoding: 'utf8',
  });
  if (run.status !== 0) {
    process.exit(run.status ?? 1);
  }
} finally {
  try { unlinkSync(tempPath); } catch { /* ignore */ }
}

console.log('guided-tour wiring invariants OK');
