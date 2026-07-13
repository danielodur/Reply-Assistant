/**
 * Guard against regressing the "Use now / picker selection disappears" bug:
 * selection must never be cleared solely because workMode disagreed with contact.stage.
 *
 * Run: npm run verify:contact-selection (from apps/web)
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const path = join(__dirname, '..', 'src', 'components', 'FloatingAssistant.tsx');
const src = readFileSync(path, 'utf8');

if (/isContactCompatibleWithMode\([\s\S]{0,220}setSelectedContactId\(null\)/.test(src)) {
  console.error('Invariant failed: do not clear selected contact when work mode mismatches contact stage.');
  process.exit(1);
}

if (!src.includes('writeSelectedContactId')) {
  console.error('Invariant failed: FloatingAssistant must persist selection via writeSelectedContactId.');
  process.exit(1);
}

if (!src.includes('subscribeSelectedContactId')) {
  console.error('Invariant failed: FloatingAssistant must subscribe to cross-window contact selection changes.');
  process.exit(1);
}

if (!src.includes('requiredWorkModeForContact')) {
  console.error('Invariant failed: FloatingAssistant must align work mode via requiredWorkModeForContact.');
  process.exit(1);
}

if (!/never clear selectedContactId/i.test(src)) {
  console.error('Invariant failed: keep the documented selection invariant comment in FloatingAssistant.');
  process.exit(1);
}

console.log('contact-selection invariants OK');
