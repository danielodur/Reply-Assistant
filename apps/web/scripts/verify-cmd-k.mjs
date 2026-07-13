/**
 * Cmd+K wiring + intent router smoke checks.
 * Run: npm run verify:cmd-k (from apps/web)
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, '..');
const floatingPath = join(webRoot, 'src', 'components', 'FloatingAssistant.tsx');
const floatingSrc = readFileSync(floatingPath, 'utf8');

const required = [
  "import CmdKPalette from './cmd-k/CmdKPalette'",
  "import CmdKHint from './cmd-k/CmdKHint'",
  '<CmdKPalette',
  '<CmdKHint',
  'handleCmdKIntent',
  'isCmdKHintEligible',
  "event.key.toLowerCase() === 'k'",
  'onDispatch={handleCmdKIntent}',
  'suggestions={paletteSuggestions}',
  'onSelectSuggestion',
];

for (const token of required) {
  if (!floatingSrc.includes(token)) {
    console.error(`Invariant failed: FloatingAssistant missing "${token}"`);
    process.exit(1);
  }
}

const routerTests = join(__dirname, 'cmd-k-intent-tests.ts');
const run = spawnSync('npx', ['--yes', 'tsx', routerTests], {
  cwd: webRoot,
  stdio: 'inherit',
  encoding: 'utf8',
});

if (run.status !== 0) {
  process.exit(run.status ?? 1);
}

console.log('cmd-k wiring invariants OK');
