import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getTranslations } from '../src/i18n/translations.ts';
import { buildFocusPlan } from '../src/components/command-center/focusPlan.ts';
import type { ContactThread } from '../src/config/contactThreads.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, '..');

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    console.error(`Invariant failed: ${message}`);
    process.exit(1);
  }
}

function read(path: string): string {
  return readFileSync(join(webRoot, path), 'utf8');
}

function thread(id: string, name: string, latestDirection: 'inbound' | 'outbound' = 'inbound'): ContactThread {
  const now = Date.now();
  return {
    id,
    name,
    company: 'Example Co',
    stage: 'active-client',
    notes: '',
    lastReplyAt: null,
    replies: [],
    messages: [{
      id: `msg-${id}`,
      direction: latestDirection,
      source: 'paste',
      text: `${name} asked for an update.`,
      summary: `${name} asked for an update.`,
      createdAt: now - 3600000,
      sender: name,
      receiver: 'You',
      followUpKind: latestDirection === 'inbound' ? 'needs-reply' : 'none',
      followUpSummary: `${name} needs a reply.`,
    }],
    createdAt: now - 7200000,
    updatedAt: now - 3600000,
  };
}

const copy = getTranslations('en');
const ada = thread('ada', 'Ada');
const ben = thread('ben', 'Ben');
const cy = thread('cy', 'Cy');

const ranked = buildFocusPlan({
  copy,
  contactWithFreshDraft: {
    ...ada,
    pendingDraft: {
      message: 'Draft reply',
      basedOnLines: ['Latest message'],
      sourceInbound: 'Inbound',
      createdAt: Date.now(),
    },
  },
  topActionInboxItem: {
    id: 'task-1',
    title: 'Handle important follow-up',
    body: 'A pending action needs a response.',
    intentLabel: 'Follow-up',
    riskLevel: 'medium',
    followUp: 'Today',
    priority: 80,
    prompt: 'Write a follow-up.',
    createdAt: Date.now(),
    status: 'pending',
    relatedContactId: ben.id,
  },
  reviewUpload: {
    id: 'upload-1',
    source: 'composer',
    filename: 'quote.pdf',
    extension: 'pdf',
    mimeType: 'application/pdf',
    sizeBytes: 128,
    hash: 'hash',
    status: 'needs-review',
    summary: '',
    extractedText: '',
    confidence: 0.5,
    createdAt: Date.now(),
  },
  contactNeedingReply: cy,
  selectedContactThread: null,
  selectedPriority: null,
  openLoop: null,
  todayTasks: [],
});

assert(ranked.length === 3, 'focus plan should cap visible work at three items');
assert(ranked[0].source === 'draft', 'pending draft should rank first');
assert(ranked[1].source === 'action-inbox', 'Action Inbox item should rank before upload review');
assert(ranked[2].source === 'review-file', 'upload review should rank before ordinary contact reply');
assert(ranked.map(item => item.rank).join(',') === 'now,next,later', 'rank labels should be now,next,later');

const deduped = buildFocusPlan({
  copy,
  contactWithFreshDraft: null,
  topActionInboxItem: null,
  reviewUpload: null,
  contactNeedingReply: ada,
  selectedContactThread: null,
  selectedPriority: null,
  openLoop: null,
  todayTasks: [{
    id: `contact-priority-reply-${ada.id}`,
    title: 'Duplicate contact task',
    body: 'Should be deduped against the contact reply.',
    estMinutes: 4,
    action: {
      kind: 'seed-input',
      input: 'Reply',
      workMode: 'reply',
      recipient: 'existing-client',
      textType: 'follow-up',
    },
  }],
});

assert(deduped.length === 1, 'contact Today Queue tasks should dedupe against same-contact reply work');
assert(deduped[0].source === 'reply-now', 'dedupe should preserve the higher-priority contact reply');

const clear = buildFocusPlan({
  copy,
  contactWithFreshDraft: null,
  topActionInboxItem: null,
  reviewUpload: null,
  contactNeedingReply: null,
  selectedContactThread: null,
  selectedPriority: null,
  openLoop: null,
  todayTasks: [],
});
assert(clear.length === 1 && clear[0].source === 'clear', 'clear state should appear when no work is actionable');
assert(
  clear.filter(item => item.source !== 'clear').length === 0,
  'clear state must yield zero actionable items (no false badge)',
);

// C1 — a contact whose inbound messages cluster at a known hour gets a real
// send-timing window when the current hour is outside that band.
function timedThread(id: string, name: string, hour: number): ContactThread {
  const messages = Array.from({ length: 4 }).map((_, index) => ({
    id: `msg-${id}-${index}`,
    direction: 'inbound' as const,
    source: 'paste' as const,
    text: `${name} wrote in.`,
    summary: `${name} wrote in.`,
    createdAt: new Date(2026, 0, 5 + index, hour, 0, 0).getTime(),
    sender: name,
    receiver: 'You',
    followUpKind: 'needs-reply' as const,
    followUpSummary: `${name} needs a reply.`,
  }));
  return {
    id,
    name,
    company: 'Example Co',
    stage: 'active-client',
    notes: '',
    lastReplyAt: null,
    replies: [],
    messages,
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 3600000,
  };
}

const timed = buildFocusPlan({
  copy,
  contactWithFreshDraft: null,
  topActionInboxItem: null,
  reviewUpload: null,
  contactNeedingReply: timedThread('dee', 'Dee', 14),
  selectedContactThread: null,
  selectedPriority: null,
  openLoop: null,
  todayTasks: [],
  currentHour: 3,
});
assert(timed[0].source === 'reply-now', 'timed reply should still rank as reply-now');
assert(
  timed[0].whenLabel === copy.focusPlan.whenAround.replace('{{time}}', '2 PM'),
  `reply outside the timing band should show the send window, got "${timed[0].whenLabel}"`,
);

// C2 — a promise owed to a contact appears, ranks below an unanswered reply,
// and dedupes against same-contact reply work.
const promisePlan = buildFocusPlan({
  copy,
  contactWithFreshDraft: null,
  topActionInboxItem: null,
  reviewUpload: null,
  contactNeedingReply: cy,
  selectedContactThread: null,
  selectedPriority: null,
  openLoop: null,
  todayTasks: [],
  promiseCommitments: [{ contactId: 'pat', contactName: 'Pat', summary: 'Send the revised quote.', sourceMessageId: 'm-1' }],
});
assert(promisePlan[0].source === 'reply-now', 'reply-now should outrank a promise');
assert(promisePlan[1]?.source === 'promise', 'a promise should rank just below reply-now');

const promiseDedupe = buildFocusPlan({
  copy,
  contactWithFreshDraft: null,
  topActionInboxItem: null,
  reviewUpload: null,
  contactNeedingReply: cy,
  selectedContactThread: null,
  selectedPriority: null,
  openLoop: null,
  todayTasks: [],
  promiseCommitments: [{ contactId: cy.id, contactName: cy.name, summary: 'Owe Cy a recap.', sourceMessageId: 'm-2' }],
});
assert(
  promiseDedupe.filter(item => item.contactId === cy.id).length === 1,
  'a promise must dedupe against same-contact reply work',
);

// A2 — Daily Brief recommendation and Focus Plan share one ranking core so
// their top item can never silently disagree.
const recommendation = read('src/components/command-center/workbenchRecommendation.ts');
const planner = read('src/components/command-center/focusPlan.ts');
assert(
  recommendation.includes('leadWorkSignal') && recommendation.includes('collectHeadWorkSignals'),
  'workbenchRecommendation should rank through the shared collectHeadWorkSignals core',
);
assert(
  planner.includes('leadWorkSignal') && planner.includes('collectHeadWorkSignals'),
  'focusPlan should rank through the shared collectHeadWorkSignals core',
);

// A1 — the modal keeps the timing label and only appends the estimate as a hint.
const modal = read('src/components/command-center/FocusPlanModal.tsx');
assert(
  modal.includes('value={primary.whenLabel}'),
  'FocusPlanModal should show the real whenLabel, not replace it with the estimate',
);
assert(modal.includes("event.key === 'Escape'"), 'FocusPlanModal should close on Escape');
assert(modal.includes('maxHeight = `calc(100vh - ${top + EDGE_MARGIN}px)`'), 'FocusPlanModal should cap height to the viewport');
assert(modal.includes('flex flex-col overflow-hidden'), 'FocusPlanModal card should hide outer overflow');
assert(modal.includes('clean-scrollbar mt-3 min-h-0 overflow-y-auto'), 'FocusPlanModal task body should scroll internally');

// B1 — Focus Plan orchestration lives in the useFocusPlan hook, not inline.
const floating = read('src/components/FloatingAssistant.tsx');
const styles = read('src/index.css');
assert(floating.includes("import FocusPlanModal from './command-center/FocusPlanModal'"), 'FloatingAssistant should import FocusPlanModal');
assert(floating.includes("import { useFocusPlan }"), 'FloatingAssistant should use the useFocusPlan hook');
assert(!floating.includes('const handleFocusPlanItem ='), 'handleFocusPlanItem should no longer be defined inline in FloatingAssistant');
assert(floating.includes('<FocusPlanModal'), 'FloatingAssistant should render FocusPlanModal');
assert(!floating.includes('commandCenterStats.needsReply'), 'old Action Center stat grid should be removed from FloatingAssistant');
assert(
  floating.includes('const open = isMoreFeaturesOpen || activeMiniScreen !== null || isActionCenterOpen || isRememberedContextOpen;'),
  'Focus Plan, remembered context, and More Features open state should use the expanded Electron panel for side placement',
);
assert(
  !floating.includes('const open = isMoreFeaturesOpen || isMoreFeaturesClosing || activeMiniScreen !== null || isActionCenterOpen || isRememberedContextOpen;'),
  'More Features close state should not keep the Electron shell fully expanded as a transparent ghost area',
);
assert(
  floating.includes('const MORE_FEATURES_EXIT_MS = MORE_FEATURES_DRAWER_TRANSITION_MS'),
  'More Features close hold should stay tied to the drawer transition duration',
);
assert(
  floating.includes('const isMoreFeaturesVisible = isMoreFeaturesOpen || isMoreFeaturesClosing'),
  'More Features should keep host visual state through the close animation',
);
assert(
  floating.includes("isMoreFeaturesVisible ? 'rounded-l-[18px] rounded-r-[4px]' : 'rounded-[18px]'"),
  'Main panel corner shape should not snap back before the More Features drawer finishes closing',
);
const moreFeatures = read('src/components/more-features.tsx');
assert(
  moreFeatures.includes('export const MORE_FEATURES_DRAWER_TRANSITION_MS = 300'),
  'More Features drawer should expose the transition duration used by the host close hold',
);
assert(
  moreFeatures.includes('export const MORE_FEATURES_DRAWER_WIDTH = 184'),
  'More Features drawer width should match the expanded Electron shell width so the close animation has no ghost edge',
);
assert(
  moreFeatures.includes("style={{ width: MORE_FEATURES_DRAWER_WIDTH }}"),
  'More Features drawer should use the shared drawer width constant',
);
assert(
  moreFeatures.includes('absolute inset-y-0 left-[390px]'),
  'More Features drawer should anchor at the fixed main-panel right edge, not the shrinking Electron window edge',
);
assert(
  moreFeatures.includes('visible ? \'visible\' : \'invisible\''),
  'More Features drawer should be fully invisible after the close hold completes',
);
assert(
  moreFeatures.includes('transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]') && moreFeatures.includes(": 'pointer-events-none -translate-x-full'"),
  'More Features should slide left by its own width under the right side of the main panel, not under the left corners',
);
assert(
  floating.includes('visible={isMoreFeaturesVisible}'),
  'FloatingAssistant should keep the More Features drawer visible only during open and exit states',
);
const electronMain = read('../../electron/main.ts');
assert(
  electronMain.includes('const PANEL_CLOSE_ANIMATION_MS = 300'),
  'Electron panel close should use the same 300ms duration as the More Features drawer',
);
assert(
  electronMain.includes('clearPanelCloseAnimation();'),
  'Electron panel close animation should be cancellable when another expanded surface opens',
);
assert(
  electronMain.includes('setInterval(tickClose, 16)') && electronMain.includes('mainWindow.setBounds('),
  'Electron should shrink the panel with a controlled non-native close tween instead of a late native shake',
);
assert(
  floating.includes('if (action.kind === \'open-screen\') {\n      openMiniScreen(action.screenId);'),
  'Today Queue open-screen actions should use the child-window helper, not inline mini-screen state',
);
assert(
  !floating.includes('setActiveMiniScreen(action.screenId);'),
  'Focus Plan/Today Queue open-screen actions must not create an inline duplicate mini-screen',
);
assert(
  styles.includes('background: transparent;'),
  'The renderer body must stay transparent so Focus Plan expansion does not show a dull blank side area',
);

const header = read('src/components/workbench/WorkbenchHeader.tsx');
assert(header.includes('actionLabel?: string'), 'WorkbenchHeader should accept an actionLabel');
assert(header.includes('actionLabel ?? copy.floating.openActionCenter'), 'WorkbenchHeader should use custom action label');

const translations = read('src/i18n/translations.ts');
assert(translations.includes('focusPlan: {'), 'translations should include focusPlan namespace');
assert(translations.includes("open: 'Open plan'"), 'EN Focus Plan open copy should exist');
assert(translations.includes("open: '打开计划'"), 'ZH Focus Plan open copy should exist');
assert(translations.includes("promiseTitle: 'Keep your promise to {{name}}'"), 'EN Focus Plan promise copy should exist');
assert(translations.includes("promiseTitle: '兑现你对 {{name}} 的承诺'"), 'ZH Focus Plan promise copy should exist');

console.log('focus-plan planner and wiring invariants OK');
