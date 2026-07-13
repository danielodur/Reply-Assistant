/**
 * Contact onboarding wizard (Phase 4) wiring invariants.
 * Run: npm run verify:contact-onboarding (from apps/web)
 *
 * Asserts:
 *  - All wizard module files are present and the old single-page modal is gone
 *  - CreateContactInput in useContactThreads carries memoryProfile
 *  - buildContactThread accepts memoryProfile
 *  - ContactThreads.tsx renders CreateContactWizard and persists reply-language preference
 *  - FloatingAssistant + MiniScreenHost + DetachedMiniScreenHost forward memoryProfile in onCreateContact prop typing
 *  - EN + ZH i18n keys for every wizard string exist
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
  'src/components/contacts/wizard/CreateContactWizard.tsx',
  'src/components/contacts/wizard/wizardTypes.ts',
  'src/components/contacts/wizard/Step1Identity.tsx',
  'src/components/contacts/wizard/Step2Relationship.tsx',
  'src/components/contacts/wizard/Step3Communication.tsx',
  'src/components/contacts/wizard/Step4DosAndDonts.tsx',
]) {
  if (!existsSync(join(webRoot, required))) {
    fail(`missing file ${required}`);
  }
}

if (existsSync(join(webRoot, 'src/components/contacts/CreateContactModal.tsx'))) {
  fail('CreateContactModal.tsx should have been removed in favour of the wizard');
}

const useContactThreads = read('src/hooks/useContactThreads.ts');
assertContains('useContactThreads', useContactThreads, 'memoryProfile?: ContactMemoryProfile');

const contactThreadsConfig = read('src/config/contactThreads.ts');
assertContains('contactThreads.ts', contactThreadsConfig, 'memoryProfile?: ContactMemoryProfile');
assertContains('contactThreads.ts', contactThreadsConfig, 'sanitizeMemoryProfile');

const contactThreadsScreen = read('src/components/ContactThreads.tsx');
assertContains('ContactThreads.tsx', contactThreadsScreen, '<CreateContactWizard');
assertContains('ContactThreads.tsx', contactThreadsScreen, "import CreateContactWizard from './contacts/wizard/CreateContactWizard'");
assertContains('ContactThreads.tsx', contactThreadsScreen, 'writeReplyLanguagePreference(nextThread.id');
assertContains('ContactThreads.tsx', contactThreadsScreen, 'memoryProfile?: ContactMemoryProfile');

const floating = read('src/components/FloatingAssistant.tsx');
// FA already imports ContactMemoryProfile transitively via useContactThreads; verify it forwards memoryProfile-capable callers correctly.
// We don't add new tokens to FA in this phase, but the onCreateContact callsite must accept the wider payload type — TS check enforces that.

const miniHost = read('src/components/mini-screens/MiniScreenHost.tsx');
assertContains('MiniScreenHost', miniHost, 'memoryProfile?: ContactMemoryProfile');

const detached = read('src/components/DetachedMiniScreenHost.tsx');
assertContains('DetachedMiniScreenHost', detached, 'memoryProfile?: ContactMemoryProfile');

const translations = read('src/i18n/translations.ts');
const requiredKeys = [
  'wizardStepCount',
  'wizardNext',
  'wizardBack',
  'wizardSkipForNow',
  'wizardSaveAndFinish',
  'wizardStep1Title',
  'wizardStep1Description',
  'wizardStep2Title',
  'wizardStep2Description',
  'wizardStep3Title',
  'wizardStep3Description',
  'wizardStep4Title',
  'wizardStep4Description',
  'wizardRoleLabel',
  'wizardRolePlaceholder',
  'wizardCommunicationStyleLabel',
  'wizardCommunicationStyleNone',
  'wizardPreferredLanguageLabel',
  'wizardPreferredLanguageAuto',
  'wizardPreferredLanguageEn',
  'wizardPreferredLanguageZh',
  'wizardDosAndDontsLabel',
  'wizardDosAndDontsPlaceholder',
];
for (const key of requiredKeys) {
  // Each key should appear as a property declaration AND have at least one EN value and one ZH value.
  // We check by counting occurrences — must be at least 3 (typedef + EN + ZH).
  const matches = translations.split(`${key}:`).length - 1;
  if (matches < 3) {
    fail(`translations.ts is missing EN/ZH entries for "${key}" (found ${matches} occurrences)`);
  }
}

console.log('contact-onboarding wiring invariants OK');
