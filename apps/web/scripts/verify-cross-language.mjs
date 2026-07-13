/**
 * Cross-language confidence (Phase 3) wiring smoke checks.
 * Run: npm run verify:cross-language (from apps/web)
 *
 * Asserts:
 *  - language detection helper + preference store + tip engine + hook exist
 *  - polish-english text type id is registered
 *  - StructuredRequest exposes the optional CrossLanguageContext block
 *  - WorkbenchHeader takes the recommendation props and renders the chip slot
 *  - GeneratedReplyModal accepts culturalTipKey and renders the strip
 *  - FloatingAssistant wires useReplyLanguage, computes the tip key on generate,
 *    passes it into the modal, and persists per-contact preference on switch
 *  - i18n keys for tips + reply-in labels are present in EN and ZH
 *
 * Plus tiny runtime checks of detectLanguage + resolveCulturalTip.
 */
import { readFileSync, existsSync } from 'node:fs';
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
  'src/lib/languageDetect.ts',
  'src/lib/replyLanguagePreference.ts',
  'src/components/cross-language/culturalTip.ts',
  'src/components/cross-language/useReplyLanguage.ts',
  'src/components/cross-language/LanguageRecommendationChip.tsx',
  'src/components/cross-language/CulturalTipStrip.tsx',
]) {
  if (!existsSync(join(webRoot, required))) {
    fail(`missing file ${required}`);
  }
}

const constants = read('src/components/workbench/constants.ts');
assertContains('constants.ts', constants, "'polish-english'");

const requestModel = read('src/components/workbench/requestModel.ts');
assertContains('requestModel', requestModel, 'CrossLanguageContext');
assertContains('requestModel', requestModel, 'crossLanguage?: CrossLanguageContext');
assertContains('requestModel', requestModel, 'preserveMeaningOnly');

const header = read('src/components/workbench/WorkbenchHeader.tsx');
assertContains('WorkbenchHeader', header, 'recommendedReplyLanguage');
assertContains('WorkbenchHeader', header, 'LanguageRecommendationChip');
assertContains('WorkbenchHeader', header, 'showLanguageRecommendation');

const modal = read('src/components/workbench/GeneratedReplyModal.tsx');
assertContains('GeneratedReplyModal', modal, 'culturalTipKey');
assertContains('GeneratedReplyModal', modal, '<CulturalTipStrip');

const floating = read('src/components/FloatingAssistant.tsx');
const floatingTokens = [
  "import { useReplyLanguage } from './cross-language/useReplyLanguage'",
  "import { resolveCulturalTip, type CulturalTipKey } from './cross-language/culturalTip'",
  "import { detectLanguage } from '../lib/languageDetect'",
  'const replyLanguage = useReplyLanguage({',
  'recommendedReplyLanguage={replyLanguage.recommendedLanguage}',
  'showLanguageRecommendation={replyLanguage.recommendationDiffers}',
  'onApplyLanguageRecommendation={() =>',
  'setActiveCulturalTipKey(tipResolution?.key ?? null)',
  'culturalTipKey={activeCulturalTipKey}',
  'replyLanguage.savePreference(value)',
  'crossLanguage: crossLanguageBlock',
];
for (const token of floatingTokens) {
  assertContains('FloatingAssistant', floating, token);
}

const translations = read('src/i18n/translations.ts');
for (const key of [
  'replyInEn',
  'replyInZh',
  'languageRecommendChip',
  'languageRecommendApply',
  'culturalTipEyebrow',
  'culturalTipZhToEnProspect',
  'culturalTipZhToEnVip',
  'culturalTipZhToEnDefault',
  'culturalTipEnToZhDefault',
  'culturalTipEnToZhLeader',
  'culturalTipMixedClarity',
  'culturalTipPolishEnglish',
]) {
  assertContains('translations.ts', translations, `${key}:`);
}

// Sanity-check the detector + tip engine via a tiny tsx runner.
const runtimeTest = `
import { detectLanguage } from '../src/lib/languageDetect';
import { resolveCulturalTip } from '../src/components/cross-language/culturalTip';

function assertEq(label, actual, expected) {
  if (actual !== expected) {
    console.error(\`\${label}: expected \${expected}, got \${actual}\`);
    process.exit(1);
  }
}

assertEq('all-chinese', detectLanguage('你好，请问明天可以开会吗？'), 'zh');
assertEq('all-english', detectLanguage('Hi Sarah, could we move the meeting to tomorrow?'), 'en');
assertEq('mixed', detectLanguage('Sarah 你好，明天我们开会吗？meeting at 3pm 可以吗？'), 'mixed');
assertEq('numbers-only', detectLanguage('123 456 789'), 'unknown');

const zhToEn = resolveCulturalTip({ inboundLanguage: 'zh', replyLanguage: 'en', recipient: 'new-lead', textType: 'shorter-reply' });
assertEq('zh->en prospect key', zhToEn && zhToEn.key, 'zh-to-en-prospect');
const enToZh = resolveCulturalTip({ inboundLanguage: 'en', replyLanguage: 'zh', recipient: 'leader', textType: 'shorter-reply' });
assertEq('en->zh leader key', enToZh && enToZh.key, 'en-to-zh-leader');
const same = resolveCulturalTip({ inboundLanguage: 'en', replyLanguage: 'en', recipient: 'existing-client', textType: 'shorter-reply' });
assertEq('same-language tip', same, null);
const polish = resolveCulturalTip({ inboundLanguage: 'en', replyLanguage: 'en', recipient: 'existing-client', textType: 'polish-english' });
assertEq('polish-english key', polish && polish.key, 'polish-english');

console.log('cross-language runtime tests OK');
`;

import { writeFileSync, unlinkSync } from 'node:fs';
const tempPath = join(webRoot, 'scripts', 'cross-language-runtime.mjs');
const tsTempPath = join(webRoot, 'scripts', 'cross-language-runtime.ts');
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

console.log('cross-language wiring invariants OK');
