/**
 * Guard child-window layout invariants for docked detached screens.
 * Run: npm run verify:child-window-layout
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const layoutPath = join(__dirname, '..', 'electron', 'childWindowLayout.ts');
const mainPath = join(__dirname, '..', 'electron', 'main.ts');
const layoutSrc = readFileSync(layoutPath, 'utf8');
const mainSrc = readFileSync(mainPath, 'utf8');

if (!layoutSrc.includes('CHILD_WINDOW_COMPACT')) {
  console.error('Invariant failed: refer-friends must use CHILD_WINDOW_COMPACT.');
  process.exit(1);
}

if (layoutSrc.includes('CHILD_WINDOW_WIDE')) {
  console.error('Invariant failed: remove CHILD_WINDOW_WIDE; refer-friends uses COMPACT.');
  process.exit(1);
}

if (!layoutSrc.includes('parentBounds.width + CHILD_WINDOW_GAP')) {
  console.error('Invariant failed: dock X must use parentBounds.width + CHILD_WINDOW_GAP.');
  process.exit(1);
}

if (mainSrc.includes('WINDOW_WIDTH') && /rawX\s*=\s*parentBounds\.x\s*\+\s*WINDOW_WIDTH/.test(mainSrc)) {
  console.error('Invariant failed: main.ts must not compute dock X from WINDOW_WIDTH.');
  process.exit(1);
}

if (!mainSrc.includes('docked')) {
  console.error('Invariant failed: main.ts must track docked child window state.');
  process.exit(1);
}

if (/mainWindow\.on\(['"]move['"][\s\S]{0,120}repositionDockedChildWindows/.test(mainSrc)) {
  console.error('Invariant failed: child windows must not follow main window moves.');
  process.exit(1);
}

if (/repositionDockedChildWindows\(\)/.test(mainSrc)) {
  console.error('Invariant failed: do not reposition child windows when the main window moves or resizes.');
  process.exit(1);
}

if (!/closeOtherChildWindows/.test(mainSrc)) {
  console.error('Invariant failed: opening a child screen must close other child windows first.');
  process.exit(1);
}

if (/parent:\s*mainWindow/.test(mainSrc)) {
  console.error('Invariant failed: child windows must not use parent: mainWindow (OS drags them with the parent).');
  process.exit(1);
}

if (!mainSrc.includes('suppressChildMoveEvents')) {
  console.error('Invariant failed: main.ts must suppress programmatic child move events.');
  process.exit(1);
}

// Pure layout math (mirrors computeChildWindowBounds)
const CHILD_WINDOW_GAP = 8;
const CHILD_WINDOW_COMPACT = { width: 392, height: 448 };
const CHILD_WINDOW_SMALL = { width: 520, height: 586 };

function getChildWindowSize(screenId) {
  return screenId === 'refer-friends' ? CHILD_WINDOW_COMPACT : CHILD_WINDOW_SMALL;
}

function computeDockX(parentBounds) {
  return parentBounds.x + parentBounds.width + CHILD_WINDOW_GAP;
}

const collapsedParent = { x: 100, y: 200, width: 390, height: 650 };
const expandedParent = { x: 100, y: 200, width: 574, height: 650 };

const collapsedX = computeDockX(collapsedParent);
const expandedX = computeDockX(expandedParent);

if (expandedX <= collapsedX) {
  console.error('Invariant failed: expanded parent must dock child further right than collapsed.');
  process.exit(1);
}

const referSize = getChildWindowSize('refer-friends');
const threadsSize = getChildWindowSize('contact-threads');

if (referSize.width >= threadsSize.width || referSize.height >= threadsSize.height) {
  console.error('Invariant failed: refer-friends window must be smaller than default child windows.');
  process.exit(1);
}

console.log('child-window-layout invariants OK');
