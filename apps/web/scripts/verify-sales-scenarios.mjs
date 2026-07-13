/**
 * Sales scenarios (Phase 8) wiring smoke checks.
 * Run: npm run verify:sales-scenarios (from apps/web)
 *
 * Asserts:
 *  - scenarios/scenarioRegistry.ts exists and contains 11 scenarios with 5 sales-flagged
 *  - InstantAmmo + FloatingAssistant consume the shared registry
 *  - smart-suggestions/types.ts pulls the canonical ID list from the registry
 *  - buildSmartSuggestions applies getScenarioStageBoost
 *  - EN + ZH i18n entries exist for every sales scenario id
 *
 * Plus runtime tests of the registry and stage-aware boost.
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

const registryPath = 'src/components/scenarios/scenarioRegistry.ts';
if (!existsSync(join(webRoot, registryPath))) {
  fail(`missing file ${registryPath}`);
}

const registry = read(registryPath);
for (const id of [
  'cold-outreach',
  'pitch-followup',
  'objection-price',
  'closing-nudge',
  're-engagement',
]) {
  assertContains('scenarioRegistry', registry, `id: '${id}'`);
}
assertContains('scenarioRegistry', registry, 'export function getScenarioById');
assertContains('scenarioRegistry', registry, 'export function getScenarioStageBoost');
assertContains('scenarioRegistry', registry, 'export const ALL_SCENARIO_IDS');

const instantAmmo = read('src/components/InstantAmmo.tsx');
assertContains('InstantAmmo', instantAmmo, "from './scenarios/scenarioRegistry'");
assertContains('InstantAmmo', instantAmmo, 'SCENARIO_REGISTRY');
if (instantAmmo.includes('SCENARIO_STATIC')) {
  fail('InstantAmmo still references the legacy SCENARIO_STATIC array');
}

const floating = read('src/components/FloatingAssistant.tsx');
assertContains('FloatingAssistant', floating, "import { getScenarioById } from './scenarios/scenarioRegistry'");
assertContains('FloatingAssistant', floating, 'getScenarioById(suggestion.scenarioId)');
if (floating.includes('const staticScenarios: Record<string, AmmoScenario>')) {
  fail('FloatingAssistant still defines the legacy staticScenarios map');
}

const typesModule = read('src/components/smart-suggestions/types.ts');
assertContains('smart-suggestions/types', typesModule, "from '../scenarios/scenarioRegistry'");
assertContains('smart-suggestions/types', typesModule, 'REGISTRY_SCENARIO_IDS');
for (const token of ['cold-outreach', 'pitch-followup', 'objection-price', 'closing-nudge', 're-engagement']) {
  assertContains('smart-suggestions/types', typesModule, token);
}

const buildSuggestions = read('src/components/smart-suggestions/buildSmartSuggestions.ts');
assertContains('buildSmartSuggestions', buildSuggestions, 'getScenarioStageBoost');
assertContains('buildSmartSuggestions', buildSuggestions, "import { getScenarioStageBoost } from '../scenarios/scenarioRegistry'");

const translations = read('src/i18n/translations.ts');
for (const id of ['cold-outreach', 'pitch-followup', 'objection-price', 'closing-nudge', 're-engagement']) {
  const matches = translations.split(`'${id}':`).length - 1;
  // Each scenario should appear in the typedef sample is implicit — we expect
  // at least 3 mentions: registry tokens, EN bundle, ZH bundle.
  if (matches < 2) {
    fail(`translations.ts is missing EN/ZH entries for scenario "${id}" (found ${matches} occurrences)`);
  }
}

// Runtime tests
const runtimeTest = `
import {
  SCENARIO_REGISTRY,
  ALL_SCENARIO_IDS,
  getScenarioById,
  getScenarioStageBoost,
} from '../src/components/scenarios/scenarioRegistry';

function assertEq(label, actual, expected) {
  if (actual !== expected) {
    console.error(\`\${label}: expected \${JSON.stringify(expected)}, got \${JSON.stringify(actual)}\`);
    process.exit(1);
  }
}

assertEq('registry size', SCENARIO_REGISTRY.length, 11);
assertEq('ids length', ALL_SCENARIO_IDS.length, 11);

const salesIds = SCENARIO_REGISTRY.filter(s => s.sales).map(s => s.id);
assertEq('sales count', salesIds.length, 5);
['cold-outreach', 'pitch-followup', 'objection-price', 'closing-nudge', 're-engagement']
  .forEach(id => {
    if (!salesIds.includes(id)) {
      console.error(\`sales scenario \${id} missing from registry\`);
      process.exit(1);
    }
  });

const cold = getScenarioById('cold-outreach');
assertEq('cold-outreach recipient', cold?.recipient, 'new-lead');
assertEq('cold-outreach textType', cold?.textType, 'persuasive');
assertEq('cold-outreach workMode', cold?.workMode, 'reply');

assertEq('new-lead cold-outreach boost', getScenarioStageBoost('cold-outreach', 'new-lead'), 18);
assertEq('active-client cold-outreach boost', getScenarioStageBoost('cold-outreach', 'active-client'), 0);
assertEq('active-client pitch-followup boost', getScenarioStageBoost('pitch-followup', 'active-client'), 14);
assertEq('closed re-engagement boost', getScenarioStageBoost('re-engagement', 'closed'), 16);
assertEq('null stage', getScenarioStageBoost('cold-outreach', null), 0);

console.log('sales-scenarios runtime tests OK');
`;

const tempPath = join(webRoot, 'scripts', 'sales-scenarios-runtime.ts');
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

console.log('sales-scenarios wiring invariants OK');
