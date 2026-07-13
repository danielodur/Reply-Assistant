/**
 * Impression & Quality Guard (Phase 5) wiring smoke checks.
 * Run: npm run verify:quality-guard (from apps/web)
 *
 * Asserts:
 *  - quality-guard module files exist
 *  - AppSettings exposes highStakesGuard (default true) and Settings UI toggles it
 *  - GeneratedReplyModal accepts impressionCheck/voiceMatch/whyDetails/onAutoSoften
 *    and renders ImpressionCheckChip, VoiceMatchMeter, WhyThisReplyExpander
 *  - FloatingAssistant computes impression + voice match on generate, snapshots
 *    recipient, gates copy through HighStakesGuard, exposes auto-soften
 *  - buildReplyBasedOnDetails is exported
 *  - i18n keys for Phase 5 exist in EN and ZH
 *
 * Plus tiny runtime tests of runImpressionCheck / computeVoiceMatch.
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
  'src/components/quality-guard/impressionCheck.ts',
  'src/components/quality-guard/voiceMatch.ts',
  'src/components/quality-guard/ImpressionCheckChip.tsx',
  'src/components/quality-guard/VoiceMatchMeter.tsx',
  'src/components/quality-guard/HighStakesGuard.tsx',
  'src/components/quality-guard/WhyThisReplyExpander.tsx',
]) {
  if (!existsSync(join(webRoot, required))) {
    fail(`missing file ${required}`);
  }
}

const settingsHook = read('src/hooks/useAppSettings.ts');
assertContains('useAppSettings', settingsHook, 'highStakesGuard: boolean');
assertContains('useAppSettings', settingsHook, 'highStakesGuard: true');

const settingsScreen = read('src/components/Settings.tsx');
assertContains('Settings.tsx', settingsScreen, "onToggle('highStakesGuard')");
assertContains('Settings.tsx', settingsScreen, 'highStakesGuardTitle');

const modal = read('src/components/workbench/GeneratedReplyModal.tsx');
const modalTokens = [
  '<ImpressionCheckChip',
  '<VoiceMatchMeter',
  '<WhyThisReplyExpander',
  'impressionCheck?:',
  'voiceMatch?:',
  'whyDetails?:',
  'onAutoSoften?:',
];
for (const token of modalTokens) {
  assertContains('GeneratedReplyModal', modal, token);
}

const floating = read('src/components/FloatingAssistant.tsx');
const floatingTokens = [
  'runImpressionCheck',
  'computeVoiceMatch',
  'buildReplyBasedOnDetails',
  'HighStakesGuard',
  'isHighStakesRecipient',
  'autoSoftenIntentFor',
  'setActiveImpressionCheck',
  'setActiveVoiceMatch',
  'setActiveWhyDetails',
  'setActiveRecipientSnapshot',
  'setIsHighStakesGuardOpen',
  'shouldHighStakesGuard',
  'performCopy',
  'handleAutoSoften',
  'impressionCheck={activeImpressionCheck}',
  'voiceMatch={activeVoiceMatch}',
  'whyDetails={activeWhyDetails}',
];
for (const token of floatingTokens) {
  assertContains('FloatingAssistant', floating, token);
}

const buildReplyBasedOnLines = read('src/components/workbench/buildReplyBasedOnLines.ts');
assertContains('buildReplyBasedOnLines', buildReplyBasedOnLines, 'export function buildReplyBasedOnDetails');
assertContains('buildReplyBasedOnLines', buildReplyBasedOnLines, 'export type BasedOnDetail');

const translations = read('src/i18n/translations.ts');
const i18nKeys = [
  'impressionCheckTitle',
  'impressionFormalityLabel',
  'impressionToneLabel',
  'impressionLengthLabel',
  'impressionStatusOk',
  'impressionStatusWarn',
  'impressionAutoSoften',
  'impressionReasonFormalityTooCasualForVip',
  'impressionReasonFormalityTooCasualForLeader',
  'impressionReasonFormalityTooStiffForCasual',
  'impressionReasonToneAggressive',
  'impressionReasonTonePassive',
  'impressionReasonToneOverpromise',
  'impressionReasonLengthTooBrief',
  'impressionReasonLengthTooLong',
  'voiceMatchLearning',
  'voiceMatchSimilar',
  'voiceMatchDifferent',
  'voiceMatchUnknown',
  'voiceMatchSampleCount',
  'highStakesGuardEyebrow',
  'highStakesGuardTitleVip',
  'highStakesGuardTitleLeader',
  'highStakesGuardBody',
  'highStakesGuardConfirm',
  'highStakesGuardCancel',
  'whyExpandLabel',
  'whyCollapseLabel',
  'whyDetailLatestMessage',
  'whyDetailRelationshipMemory',
  'whyDetailBusinessContext',
  'whyDetailYourInput',
  'whyDetailRecentTimeline',
  'whyDetailAttachments',
  'whyDetailNothingGrounded',
  'highStakesGuardTitle',
  'highStakesGuardDesc',
];
for (const key of i18nKeys) {
  const matches = translations.split(`${key}:`).length - 1;
  if (matches < 3) {
    fail(`translations.ts is missing EN/ZH entries for "${key}" (found ${matches} occurrences)`);
  }
}

// Runtime sanity tests for the rule engines.
const runtimeTest = `
import { runImpressionCheck, autoSoftenIntentFor, isHighStakesRecipient } from '../src/components/quality-guard/impressionCheck';

function assertEq(label, actual, expected) {
  if (actual !== expected) {
    console.error(\`\${label}: expected \${JSON.stringify(expected)}, got \${JSON.stringify(actual)}\`);
    process.exit(1);
  }
}

const casualToVip = runImpressionCheck({
  message: 'hey, just wanted to say hi.',
  mode: 'reply',
  recipient: 'vip-client',
  textType: 'shorter-reply',
  formality: 2,
});
assertEq('vip casual flagged', casualToVip.formality.status, 'warn');
assertEq('auto-soften intent', autoSoftenIntentFor(casualToVip), 'raise-formality');

const okReply = runImpressionCheck({
  message: 'Thanks for the update — confirming receipt and reviewing your proposal today. I will follow up by end of business with next steps.',
  mode: 'reply',
  recipient: 'existing-client',
  textType: 'shorter-reply',
  formality: 3,
});
assertEq('ok reply formality', okReply.formality.status, 'ok');
assertEq('ok reply tone', okReply.toneRisk.status, 'ok');
assertEq('ok reply length', okReply.length.status, 'ok');
assertEq('ok reply no warnings', okReply.hasWarning, false);

const overpromise = runImpressionCheck({
  message: 'We guarantee you will see results in 24 hours — 100% money back.',
  mode: 'reply',
  recipient: 'new-lead',
  textType: 'shorter-reply',
  formality: 3,
});
assertEq('overpromise flagged', overpromise.toneRisk.status, 'warn');
assertEq('overpromise intent', autoSoftenIntentFor(overpromise), 'remove-overpromise');

assertEq('vip is high-stakes', isHighStakesRecipient('vip-client'), true);
assertEq('leader is high-stakes', isHighStakesRecipient('leader'), true);
assertEq('colleague is not', isHighStakesRecipient('colleague'), false);

console.log('quality-guard runtime tests OK');
`;

const tempPath = join(webRoot, 'scripts', 'quality-guard-runtime.ts');
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

console.log('quality-guard wiring invariants OK');
