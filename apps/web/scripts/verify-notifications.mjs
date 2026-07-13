/**
 * Notifications & badge reliability (Phase 6) wiring smoke checks.
 * Run: npm run verify:notifications (from apps/web)
 *
 * Asserts:
 *  - lib helpers exist (quietHours, desktopNotifications)
 *  - Electron preload exposes notify, setBadgeCount, onNotificationAction
 *  - Electron main installs desktop:notify and desktop:set-badge-count handlers
 *  - global.d.ts mirrors the new Window.desktopApp surface
 *  - AppSettings widened with nativeNotifications + quietHours{Enabled,Start,End}
 *  - Settings UI renders the toggles
 *  - FloatingAssistant fires dispatchDesktopNotification on new mail + draft-ready,
 *    subscribes to notification actions, pushes setDesktopBadgeCount
 *  - i18n keys present in EN + ZH
 *
 * Plus runtime tests of isWithinQuietHours wrap-around logic.
 */
import { readFileSync, existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, '..');
const repoRoot = join(webRoot, '..', '..');

function read(p) {
  return readFileSync(p, 'utf8');
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
  join(webRoot, 'src/lib/quietHours.ts'),
  join(webRoot, 'src/lib/desktopNotifications.ts'),
]) {
  if (!existsSync(required)) {
    fail(`missing file ${required}`);
  }
}

const preload = read(join(repoRoot, 'electron/preload.ts'));
for (const token of [
  'notify:',
  'setBadgeCount:',
  'onNotificationAction:',
  "ipcRenderer.invoke('desktop:notify'",
  "ipcRenderer.invoke('desktop:set-badge-count'",
  "ipcRenderer.on('desktop:notification-action'",
]) {
  assertContains('electron/preload.ts', preload, token);
}

const mainProcess = read(join(repoRoot, 'electron/main.ts'));
for (const token of [
  "Notification",
  "ipcMain.handle('desktop:notify'",
  "ipcMain.handle('desktop:set-badge-count'",
  "mainWindow.webContents.send('desktop:notification-action'",
  'app.dock?.setBadge',
  'app.setBadgeCount',
]) {
  assertContains('electron/main.ts', mainProcess, token);
}

const globalDts = read(join(webRoot, 'src/global.d.ts'));
for (const token of ['notify?:', 'setBadgeCount?:', 'onNotificationAction?:']) {
  assertContains('global.d.ts', globalDts, token);
}

const settingsHook = read(join(webRoot, 'src/hooks/useAppSettings.ts'));
for (const token of [
  'nativeNotifications: boolean',
  'quietHoursEnabled: boolean',
  'quietHoursStart: string',
  'quietHoursEnd: string',
  "quietHoursStart: '22:00'",
  "quietHoursEnd: '08:00'",
  'nativeNotifications: true',
  'quietHoursEnabled: false',
]) {
  assertContains('useAppSettings', settingsHook, token);
}

const settingsScreen = read(join(webRoot, 'src/components/Settings.tsx'));
for (const token of [
  "onToggle('nativeNotifications')",
  "onToggle('quietHoursEnabled')",
  "onSet('quietHoursStart'",
  "onSet('quietHoursEnd'",
  'nativeNotificationsTitle',
  'quietHoursTitle',
]) {
  assertContains('Settings.tsx', settingsScreen, token);
}

const floating = read(join(webRoot, 'src/components/FloatingAssistant.tsx'));
for (const token of [
  "import {\n  dispatchDesktopNotification,\n  setDesktopBadgeCount,\n  subscribeToNotificationActions,\n} from '../lib/desktopNotifications'",
  "kind: 'new-mail'",
  "kind: 'draft-ready'",
  'dispatchDesktopNotification(',
  'setDesktopBadgeCount(',
  'subscribeToNotificationActions(',
]) {
  assertContains('FloatingAssistant', floating, token);
}

const translations = read(join(webRoot, 'src/i18n/translations.ts'));
const i18nKeys = [
  'notificationNewMailTitle',
  'notificationNewMailBody',
  'notificationDraftReadyTitle',
  'notificationDraftReadyBody',
  'nativeNotificationsTitle',
  'nativeNotificationsDesc',
  'quietHoursTitle',
  'quietHoursDesc',
  'quietHoursStartLabel',
  'quietHoursEndLabel',
];
for (const key of i18nKeys) {
  const matches = translations.split(`${key}:`).length - 1;
  if (matches < 3) {
    fail(`translations.ts is missing EN/ZH entries for "${key}" (found ${matches} occurrences)`);
  }
}

const runtimeTest = `
import { isWithinQuietHours, parseTimeString, minutesOfDay } from '../src/lib/quietHours';

function assertEq(label, actual, expected) {
  if (actual !== expected) {
    console.error(\`\${label}: expected \${JSON.stringify(expected)}, got \${JSON.stringify(actual)}\`);
    process.exit(1);
  }
}

function at(hours, minutes) {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

assertEq('parse 22:00', parseTimeString('22:00'), 22 * 60);
assertEq('parse bogus', parseTimeString('not-a-time'), null);
assertEq('minutesOfDay 09:15', minutesOfDay(at(9, 15)), 9 * 60 + 15);

// Disabled window: never quiet.
assertEq('disabled', isWithinQuietHours(at(23, 0), { enabled: false, start: '22:00', end: '08:00' }), false);

// Wrap-around window 22:00 → 08:00
assertEq('wrap inside late', isWithinQuietHours(at(23, 30), { enabled: true, start: '22:00', end: '08:00' }), true);
assertEq('wrap inside early', isWithinQuietHours(at(7, 30), { enabled: true, start: '22:00', end: '08:00' }), true);
assertEq('wrap outside', isWithinQuietHours(at(12, 0), { enabled: true, start: '22:00', end: '08:00' }), false);
assertEq('wrap edge start', isWithinQuietHours(at(22, 0), { enabled: true, start: '22:00', end: '08:00' }), true);
assertEq('wrap edge end exclusive', isWithinQuietHours(at(8, 0), { enabled: true, start: '22:00', end: '08:00' }), false);

// Same-day window 13:00 → 14:00
assertEq('same-day inside', isWithinQuietHours(at(13, 30), { enabled: true, start: '13:00', end: '14:00' }), true);
assertEq('same-day before', isWithinQuietHours(at(12, 59), { enabled: true, start: '13:00', end: '14:00' }), false);
assertEq('same-day after', isWithinQuietHours(at(14, 1), { enabled: true, start: '13:00', end: '14:00' }), false);

// Equal start/end is treated as no-op.
assertEq('zero-length', isWithinQuietHours(at(9, 0), { enabled: true, start: '09:00', end: '09:00' }), false);

// Invalid strings disable rather than crash.
assertEq('invalid string', isWithinQuietHours(at(23, 0), { enabled: true, start: 'bogus', end: '08:00' }), false);

console.log('quiet-hours runtime tests OK');
`;

const tempPath = join(webRoot, 'scripts', 'notifications-runtime.ts');
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

console.log('notifications wiring invariants OK');
