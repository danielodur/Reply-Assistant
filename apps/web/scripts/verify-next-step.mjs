/**
 * Next-step guidance wiring smoke checks.
 * Run: npm run verify:next-step (from apps/web)
 *
 * Asserts:
 *  - FloatingAssistant installs NextStepProvider + useNextStep
 *  - useProactiveNudge gets hasActiveNextStep so chip/hint mutex holds
 *  - DailyBriefCard / ComposerPanel / GeneratedReplyModal each call
 *    useNextStepClass with the correct step
 *  - GeneratedReplyDetachedHost wraps with NextStepProvider activeStep="copy"
 *  - The pulse class lands in animate-fade-in.css
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, '..');

function read(p) {
  return readFileSync(join(webRoot, p), 'utf8');
}

function assertContains(label, body, token) {
  if (!body.includes(token)) {
    console.error(`Invariant failed: ${label} missing "${token}"`);
    process.exit(1);
  }
}

const floatingSrc = read('src/components/FloatingAssistant.tsx');
const proactiveSrc = read('src/components/smart-suggestions/useProactiveNudge.ts');
const dailyBriefSrc = read('src/components/command-center/DailyBriefCard.tsx');
const composerSrc = read('src/components/workbench/ComposerPanel.tsx');
const modalSrc = read('src/components/workbench/GeneratedReplyModal.tsx');
const detachedSrc = read('src/components/workbench/GeneratedReplyDetachedHost.tsx');
const cssSrc = read('src/components/animate-fade-in.css');

const floatingTokens = [
  "import { NextStepProvider } from './guidance/NextStepProvider'",
  "import { useNextStep } from './guidance/useNextStep'",
  'const activeNextStep = useNextStep({',
  'hasActiveNextStep: activeNextStep !== null',
  '<NextStepProvider activeStep={activeNextStep}>',
  '</NextStepProvider>',
  "nextStepHint={activeNextStep === 'pick-contact'",
  "generateNextStepHint={activeNextStep === 'generate'",
  "copyNextStepHint={activeNextStep === 'copy'",
];
for (const token of floatingTokens) {
  assertContains('FloatingAssistant', floatingSrc, token);
}

assertContains('useProactiveNudge', proactiveSrc, 'hasActiveNextStep?: boolean');
assertContains('useProactiveNudge', proactiveSrc, '&& !hasActiveNextStep');

assertContains('DailyBriefCard', dailyBriefSrc, "useNextStepClass('pick-contact')");
assertContains('ComposerPanel', composerSrc, "useNextStepClass('generate')");
assertContains('GeneratedReplyModal', modalSrc, "useNextStepClass('copy')");

assertContains('GeneratedReplyDetachedHost', detachedSrc, '<NextStepProvider activeStep="copy">');

assertContains('animate-fade-in.css', cssSrc, '@keyframes nextStepRingPulse');
assertContains('animate-fade-in.css', cssSrc, '.next-step-ring-pulse');

console.log('next-step guidance wiring invariants OK');
