/**
 * Generated-reply draft language toggle wiring tests.
 * Run: npm run verify:draft-language-toggle (from apps/web)
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, '..');

let failures = 0;

function read(relPath) {
  return readFileSync(join(webRoot, relPath), 'utf8');
}

function assertContains(label, haystack, needle) {
  if (!haystack.includes(needle)) {
    failures += 1;
    console.error(`  fail — ${label}\n        missing: ${needle}`);
    return;
  }
  console.log(`  ok  — ${label}`);
}

const modal = read('src/components/workbench/GeneratedReplyModal.tsx');
const fa = read('src/components/FloatingAssistant.tsx');
const detached = read('src/components/workbench/GeneratedReplyDetachedHost.tsx');
const toggle = read('src/components/cross-language/GeneratedReplyLanguageToggle.tsx');
const authToggle = read('src/auth/components/AuthLanguageToggle.tsx');
const translations = read('src/i18n/translations.ts');

assertContains('modal imports GeneratedReplyLanguageToggle', modal, "import GeneratedReplyLanguageToggle from '../cross-language/GeneratedReplyLanguageToggle'");
assertContains('modal renders toggle in draft box', modal, '<GeneratedReplyLanguageToggle');
assertContains('modal passes draftDisplayLanguage', modal, 'draftDisplayLanguage');
assertContains('FA imports draft language helpers', fa, "from './cross-language/draftLanguageToggle'");
assertContains('FA imports translateGeneratedDraft', fa, "from './cross-language/translateGeneratedDraft'");
assertContains('FA wires toggle handler to modal', fa, 'onToggleDraftLanguage');
assertContains('FA skips thread append for translate-draft', fa, "generationSource !== 'translate-draft'");
assertContains('detached host wires toggle', detached, 'onToggleDraftLanguage');

const electronMain = readFileSync(join(webRoot, '..', '..', 'electron', 'main.ts'), 'utf8');
assertContains(
  'electron keeps generated-reply open on child-action',
  electronMain,
  "sourceScreenId === 'generated-reply'",
);
assertContains('toggle matches Auth border class', toggle, 'border-[#edd7e0]');
assertContains('Auth toggle border class exists', authToggle, 'border-[#edd7e0]');
assertContains('EN copy for translate failure', translations, 'draftTranslateFailed');
assertContains('ZH copy for translate failure', translations, '无法翻译草稿');

const runtimeSource = `
import {
  collectPreserveTerms,
  draftLanguageToggleLabel,
  resolveDisplayLanguageForToggle,
  targetLanguageForToggle,
  translateDraftSourceTitle,
} from '../src/components/cross-language/draftLanguageToggle.ts';

const emptyBusiness = {
  yourName: '',
  companyName: '',
  yourPosition: '',
  industry: '',
  productsServices: '',
  brandVoice: '',
  commonObjections: '',
  doNotSay: '',
};

const terms = collectPreserveTerms({
  prioritizedEntities: ['Sarah Chen'],
  contactNames: ['Sarah Chen'],
  businessContext: { ...emptyBusiness, companyName: 'Acme Ltd' },
  draft: 'Hi Sarah Chen, see https://example.com or email me at s@acme.com',
});

if (!terms.includes('Sarah Chen')) throw new Error('expected Sarah Chen preserved');
if (!terms.includes('Acme Ltd')) throw new Error('expected Acme Ltd preserved');
if (!terms.some(t => t.includes('example.com'))) throw new Error('expected URL preserved');

if (resolveDisplayLanguageForToggle('你好，请确认。', 'en') !== 'zh') {
  throw new Error('expected zh display language');
}
if (targetLanguageForToggle('zh') !== 'en') throw new Error('expected en target from zh');
if (draftLanguageToggleLabel('zh') !== 'En') throw new Error('expected En label when viewing zh');
if (draftLanguageToggleLabel('en') !== '中文') throw new Error('expected 中文 label when viewing en');
if (translateDraftSourceTitle('en') !== 'translate-language:en') {
  throw new Error('unexpected translate source title');
}

console.log('draft-language-toggle runtime OK');
`;

import { spawnSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';

const tsTempPath = join(webRoot, 'scripts', 'draft-language-toggle-runtime.ts');
writeFileSync(tsTempPath, runtimeSource);

try {
  const run = spawnSync('npx', ['--yes', 'tsx', tsTempPath], {
    cwd: webRoot,
    stdio: 'inherit',
    encoding: 'utf8',
  });
  if (run.status !== 0) {
    failures += 1;
    console.error('  fail — runtime tests');
  }
} catch {
  failures += 1;
  console.error('  fail — runtime tests');
} finally {
  try {
    unlinkSync(tsTempPath);
  } catch {
    // ignore
  }
  try {
    unlinkSync(runtimePath);
  } catch {
    // ignore
  }
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}

console.log('\ndraft-language-toggle wiring OK');
