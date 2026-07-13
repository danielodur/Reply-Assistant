/**
 * Smart suggestions wiring + ranking smoke checks.
 * Run: npm run verify:smart-suggestions (from apps/web)
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, '..');
const floatingPath = join(webRoot, 'src', 'components', 'FloatingAssistant.tsx');
const floatingSrc = readFileSync(floatingPath, 'utf8');
const palettePath = join(webRoot, 'src', 'components', 'cmd-k', 'CmdKPalette.tsx');
const paletteSrc = readFileSync(palettePath, 'utf8');

const required = [
  "import ContextualQuickStart from './smart-suggestions/ContextualQuickStart'",
  "import SmartNextChip from './smart-suggestions/SmartNextChip'",
  "import { buildSmartSuggestions, getPaletteSuggestions }",
  "import { appendWorkRhythmEvent }",
  "import { useProactiveNudge }",
  '<DailyBriefCard',
  '<ContextualQuickStart',
  '<SmartNextChip',
  'suggestions={paletteSuggestions}',
  'onSelectSuggestion',
  'activateSmartSuggestion',
  'appendWorkRhythmEvent({ kind: \'contact-selected\'',
];

for (const token of required) {
  if (!floatingSrc.includes(token)) {
    console.error(`Invariant failed: FloatingAssistant missing "${token}"`);
    process.exit(1);
  }
}

if (!paletteSrc.includes('suggestions: SmartSuggestion[]')) {
  console.error('Invariant failed: CmdKPalette missing suggestions prop');
  process.exit(1);
}

if (!paletteSrc.includes('CmdKSuggestionList')) {
  console.error('Invariant failed: CmdKPalette missing CmdKSuggestionList');
  process.exit(1);
}

if (floatingSrc.includes('pickDefaultContactId')) {
  console.error('Invariant failed: pickDefaultContactId must not return to FloatingAssistant');
  process.exit(1);
}

const tests = join(__dirname, 'smart-suggestions-tests.ts');
const run = spawnSync('npx', ['--yes', 'tsx', tests], {
  cwd: webRoot,
  stdio: 'inherit',
  encoding: 'utf8',
});

if (run.status !== 0) {
  process.exit(run.status ?? 1);
}

console.log('smart-suggestions wiring invariants OK');
