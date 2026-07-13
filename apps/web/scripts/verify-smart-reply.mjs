/**
 * Smart Reply (Phase 2) wiring invariants.
 * Run: npm run verify:smart-reply (from apps/web)
 *
 * Asserts:
 *  - smart-reply module files exist
 *  - lazyMode is in AppSettings with default true
 *  - Settings UI renders the lazy mode toggle
 *  - FloatingAssistant wires useSmartReply, gates auto-draft on lazyMode,
 *    forwards runSmartReply to MiniScreenHost, declares smart-reply-contact IPC
 *  - useCommandCenterPrimary accepts the new params
 *  - ContactThreadCard renders SmartReplyButton when onSmartReply is supplied
 *  - DetachedMiniScreenHost forwards smart-reply-contact IPC
 *  - GenerationSource includes 'smart-reply'
 *  - WorkRhythmEvent includes 'smart-reply'
 */
import { readFileSync, existsSync } from 'node:fs';
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
  'src/components/smart-reply/canSmartReply.ts',
  'src/components/smart-reply/useSmartReply.ts',
  'src/components/smart-reply/SmartReplyButton.tsx',
]) {
  if (!existsSync(join(webRoot, required))) {
    fail(`missing file ${required}`);
  }
}

const useAppSettings = read('src/hooks/useAppSettings.ts');
assertContains('useAppSettings', useAppSettings, 'lazyMode: boolean');
assertContains('useAppSettings', useAppSettings, 'lazyMode: true');

const settings = read('src/components/Settings.tsx');
assertContains('Settings.tsx', settings, "onToggle('lazyMode')");
assertContains('Settings.tsx', settings, 'lazyModeTitle');

const floating = read('src/components/FloatingAssistant.tsx');
assertContains('FloatingAssistant', floating, "import { useSmartReply } from './smart-reply/useSmartReply'");
assertContains('FloatingAssistant', floating, 'const runSmartReply = useSmartReply({');
assertContains('FloatingAssistant', floating, 'settings.lazyMode && notice.latestInboundText');
assertContains('FloatingAssistant', floating, 'onSmartReply={runSmartReply}');
assertContains('FloatingAssistant', floating, "type: 'smart-reply-contact'");
assertContains('FloatingAssistant', floating, 'runSmartReplyRef');
assertContains('FloatingAssistant', floating, 'contactWithFreshDraft,');
assertContains('FloatingAssistant', floating, 'lazyMode: settings.lazyMode');

const commandCenter = read('src/components/command-center/useCommandCenterPrimary.ts');
assertContains('useCommandCenterPrimary', commandCenter, 'lazyMode?: boolean');
assertContains('useCommandCenterPrimary', commandCenter, 'runSmartReply?:');
assertContains('useCommandCenterPrimary', commandCenter, 'contactWithFreshDraft');
assertContains('useCommandCenterPrimary', commandCenter, 'draftReadyEyebrow');

const card = read('src/components/contacts/ContactThreadCard.tsx');
assertContains('ContactThreadCard', card, "import SmartReplyButton from '../smart-reply/SmartReplyButton'");
assertContains('ContactThreadCard', card, 'onSmartReply={onSmartReply}');

const miniHost = read('src/components/mini-screens/MiniScreenHost.tsx');
assertContains('MiniScreenHost', miniHost, 'onSmartReply?:');
assertContains('MiniScreenHost', miniHost, 'onSmartReply={contact =>');

const detached = read('src/components/DetachedMiniScreenHost.tsx');
assertContains('DetachedMiniScreenHost', detached, "type: 'smart-reply-contact'");

const requestModel = read('src/components/workbench/requestModel.ts');
assertContains('requestModel', requestModel, "'smart-reply'");

const workRhythm = read('src/components/smart-suggestions/workRhythmStore.ts');
assertContains('workRhythmStore', workRhythm, "kind: 'smart-reply'");

console.log('smart-reply wiring invariants OK');
