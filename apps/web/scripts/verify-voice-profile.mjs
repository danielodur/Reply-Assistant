/**
 * Voice profile (Phase 21a — renderer side) verify.
 * Run: npm run verify:voice-profile (from apps/web)
 *
 * Asserts:
 *  - voice-profile/buildVoiceProfile.ts exists
 *  - StructuredRequest + BuildRequestParams expose the optional VoiceProfileContext
 *  - buildStructuredRequest attaches voiceProfile when present
 *  - contactStyleMemory.ts exposes getContactStyleSamples
 *  - rewrite-modes registry includes voiceLikeMe + EN/ZH labels
 *  - FloatingAssistant imports buildVoiceProfile + getContactStyleSamples
 *    and threads a voiceProfile block onto the StructuredRequest
 *  - Runtime: buildVoiceProfile is honest about thresholds and derivations
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
  'src/components/voice-profile/buildVoiceProfile.ts',
]) {
  if (!existsSync(join(webRoot, required))) {
    fail(`expected file ${required} to exist`);
  }
}

const requestModel = read('src/components/workbench/requestModel.ts');
assertContains('VoiceProfileContext interface declared', requestModel, 'export interface VoiceProfileContext');
assertContains('StructuredRequest carries voiceProfile?', requestModel, 'voiceProfile?: VoiceProfileContext');
assertContains('buildStructuredRequest attaches voiceProfile', requestModel, 'base.voiceProfile = params.voiceProfile');

const styleMemory = read('src/lib/contactStyleMemory.ts');
assertContains('contactStyleMemory exposes getContactStyleSamples', styleMemory, 'export function getContactStyleSamples');

const registry = read('src/components/rewrite-modes/registry.ts');
assertContains('voiceLikeMe in RewriteModeId union', registry, "| 'voiceLikeMe'");
assertContains('voiceLikeMe in REWRITE_MODES list', registry, "id: 'voiceLikeMe'");

const translations = read('src/i18n/translations.ts');
const voiceLikeMeOccurrences = (translations.match(/\bvoiceLikeMe\b/g) || []).length;
if (voiceLikeMeOccurrences < 3) {
  fail(`voiceLikeMe should appear in type def + EN + ZH (≥3 lines), saw ${voiceLikeMeOccurrences}`);
}
assertContains('EN voiceLikeMe label', translations, "voiceLikeMe: 'Write like me'");
assertContains('ZH voiceLikeMe label', translations, "voiceLikeMe: '按我的风格'");

const fa = read('src/components/FloatingAssistant.tsx');
assertContains('FA imports buildVoiceProfile', fa, "import { buildVoiceProfile } from './voice-profile/buildVoiceProfile'");
assertContains('FA imports getContactStyleSamples', fa, 'getContactStyleSamples');
assertContains('FA attaches voiceProfile to request', fa, 'voiceProfile:');

// Runtime — pure derivation behavior.
const runtimeTest = `
import { buildVoiceProfile, VOICE_PROFILE_MIN_SAMPLES } from '../src/components/voice-profile/buildVoiceProfile';

function assertEq(label, actual, expected) {
  if (actual !== expected) {
    console.error(label + ': expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
    process.exit(1);
  }
}
function assertTrue(label, cond) {
  if (!cond) { console.error('FAIL ' + label); process.exit(1); }
}

// Below threshold → null.
assertEq('null on empty', buildVoiceProfile([]), null);
assertEq('null on single sample', buildVoiceProfile(['Hello Sarah, thanks for your note. Best, Dani']), null);

// At threshold — extract openers + signoffs.
const samples = [
  'Hi Sarah,\\nThanks for the heads up — I will confirm by EOD tomorrow.\\nBest,\\nDani',
  'Hi James,\\nQuick one — could we lock the date for next Tuesday?\\nThanks,\\nDani',
];
const profile = buildVoiceProfile(samples);
assertTrue('profile exists at threshold', profile !== null);
assertTrue('opener captured', profile.openers.some(o => o.toLowerCase().startsWith('hi ')));
assertTrue('signoff captured', profile.signoffs.some(s => s === 'Dani'));
assertEq('sampleSize matches', profile.sampleSize, 2);
assertTrue('medianSentenceLength positive', profile.medianSentenceLength > 0);
assertEq('emoji absent', profile.usesEmoji, false);

// Emoji detection.
const emojiSamples = [
  'Thanks Sarah! 🙏 Sounds good — talk soon.',
  'Got it ✅ — locking it in for Friday.',
];
const emojiProfile = buildVoiceProfile(emojiSamples);
assertEq('emoji detected', emojiProfile.usesEmoji, true);

// Uniqueness — same opener twice should only land once.
const dupeSamples = [
  'Hi Sarah, quick note.',
  'Hi Sarah, another quick note.',
  'Hi Sarah, third quick note.',
];
const dupeProfile = buildVoiceProfile(dupeSamples);
assertEq('openers de-duplicated', dupeProfile.openers.length, 1);

// Hidden cap — no more than 3 openers.
const variedSamples = [
  'Hi Sarah, item one.',
  'Hey team, item two.',
  'Hello there, item three.',
  'Yo folks, item four.',
];
const variedProfile = buildVoiceProfile(variedSamples);
assertTrue('opener cap at 3', variedProfile.openers.length <= 3);

console.log('voice-profile runtime tests OK');
`;

const tempPath = join(webRoot, 'scripts', 'voice-profile-runtime.mjs');
const tsTempPath = join(webRoot, 'scripts', 'voice-profile-runtime.ts');
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

console.log('voice-profile wiring invariants OK');
