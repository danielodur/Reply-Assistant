import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, '..');
const repoRoot = resolve(webRoot, '..', '..');

function readFrom(root, path) {
  return readFileSync(join(root, path), 'utf8');
}

function fail(message) {
  console.error(`Invariant failed: ${message}`);
  process.exit(1);
}

function assertContains(label, body, token) {
  if (!body.includes(token)) {
    fail(`${label} missing "${token}"`);
  }
}

if (!existsSync(join(webRoot, 'src/components/workbench/RememberedContextDock.tsx'))) {
  fail('RememberedContextDock component should exist');
}
if (!existsSync(join(webRoot, 'src/components/more-features/MoreFeaturesMenu.tsx'))) {
  fail('MoreFeaturesMenu component should exist');
}

const contactThreads = readFrom(webRoot, 'src/config/contactThreads.ts');
assertContains('contact thread summary type', contactThreads, 'export type ContactThreadSummary');
assertContains('open commitment type', contactThreads, 'export type ContactOpenCommitment');
assertContains('reply learning type', contactThreads, 'export type ContactReplyLearningSignal');
assertContains('thread summary stored on ContactThread', contactThreads, 'threadSummary?: ContactThreadSummary');
assertContains('open commitments stored on ContactThread', contactThreads, 'openCommitments?: ContactOpenCommitment[]');
assertContains('reply learning stored on ContactThread', contactThreads, 'replyLearning?: ContactReplyLearningSignal[]');
assertContains('refresh helper exported', contactThreads, 'export function refreshContactContinuity');
assertContains('learning helper exported', contactThreads, 'export function appendReplyLearningSignal');
assertContains('generation context carries summary', contactThreads, 'threadSummary: thread.threadSummary');
assertContains('generation context carries commitments', contactThreads, 'openCommitments: thread.openCommitments?.slice(0, 5)');
assertContains('generation context carries learning', contactThreads, 'replyLearning: thread.replyLearning?.slice(0, 5)');

const hook = readFrom(webRoot, 'src/hooks/useContactThreads.ts');
assertContains('hook exposes recordReplyLearning', hook, 'recordReplyLearning');
assertContains('hook refreshes continuity on generated replies', hook, 'refreshContactContinuity(patchLatestGeneratedOutbound');
assertContains('hook refreshes continuity on add message', hook, 'return refreshContactContinuity({');

const floating = readFrom(webRoot, 'src/components/FloatingAssistant.tsx');
assertContains('FA imports RememberedContextDock', floating, "import RememberedContextDock, { getRememberedContextCounts } from './workbench/RememberedContextDock'");
assertContains('FA renders RememberedContextDock', floating, '<RememberedContextDock');
assertContains('FA expands shell for remembered context', floating, 'isRememberedContextOpen');
assertContains('copy records accepted learning', floating, "kind: wasEdited ? 'edited' : 'accepted'");
assertContains('rewrite records regenerated learning', floating, "kind: 'regenerated'");
assertContains('quick start hidden in active context', floating, '!selectedContactThread && !input.trim()');
assertContains('referral excluded from action count', floating, 'const shouldShowReferralNudge = false');

const menuConfig = readFrom(webRoot, 'src/components/more-features/menuConfig.ts');
assertContains('primary menu exported', menuConfig, 'export const primaryMenuItems');
assertContains('secondary menu exported', menuConfig, 'export const secondaryMenuItems');

const moreFeatures = readFrom(webRoot, 'src/components/more-features.tsx');
assertContains('MoreFeatures delegates menu rendering', moreFeatures, '<MoreFeaturesMenu');

const apiContract = readFrom(repoRoot, 'apps/api/src/generateContract.js');
assertContains('API normalizes memorySummary', apiContract, 'memorySummary: asString(value.memorySummary)');
assertContains('API normalizes recentMessages', apiContract, 'recentMessages: normalizeRecentMessages(value.recentMessages)');
assertContains('API normalizes threadSummary', apiContract, 'threadSummary: normalizeThreadSummary(value.threadSummary)');
assertContains('API normalizes commitments', apiContract, 'openCommitments: normalizeOpenCommitments(value.openCommitments)');
assertContains('API normalizes learning', apiContract, 'replyLearning: normalizeReplyLearning(value.replyLearning)');

const prompt = readFrom(repoRoot, 'apps/api/src/contactThreadPrompt.js');
assertContains('prompt includes long-thread summary', prompt, 'Long-thread summary');
assertContains('prompt includes commitments', prompt, 'Open commitments / unanswered asks');
assertContains('prompt includes learning', prompt, 'Reply outcome learning');

const translations = readFrom(webRoot, 'src/i18n/translations.ts');
assertContains('EN memory cue copy', translations, "memoryCueTitle: 'Remembered context'");
assertContains('ZH memory cue copy', translations, "memoryCueTitle: '已记住的背景'");
assertContains('EN menu title copy', translations, "workMenuTitle: 'Client work'");
assertContains('ZH menu title copy', translations, "workMenuTitle: '客户工作'");

const rememberedDock = readFrom(webRoot, 'src/components/workbench/RememberedContextDock.tsx');
assertContains('remembered context exports header counts', rememberedDock, 'export function getRememberedContextCounts');
assertContains('remembered context count exposes saved context separately', rememberedDock, 'hasContext: boolean');
assertContains('remembered context saved summaries leave badge count', rememberedDock, 'summaryNeedsReview');
assertContains('remembered context saved summaries are not pending', rememberedDock, 'contact.threadSummary?.locked !== true');
assertContains('remembered context notice is action-only', rememberedDock, 'hasContext: count > 0');
assertContains('remembered context anchors to header icon', rememberedDock, "document.querySelector('[data-remembered-context-anchor]')");
assertContains('remembered context uses fixed transparent popover', rememberedDock, 'className="fixed inset-0 z-[68]"');
assertContains('remembered context has generated-reply-like popover height', rememberedDock, 'const POPOVER_MIN_HEIGHT = 640');
assertContains('remembered context has tall summary editor', rememberedDock, 'min-h-[420px]');
assertContains('remembered context edit uses assisted textarea', rememberedDock, '<AssistedNotesTextarea');
assertContains('remembered context edit keeps actions out of textarea scroll', rememberedDock, 'border-t border-slate-100 pt-3');
assertContains('remembered context edit wrapper stretches textarea', rememberedDock, 'className="flex min-h-0 flex-1 flex-col overflow-hidden"');
assertContains('remembered context edit textarea reserves footer space', rememberedDock, 'textareaClassName="clean-scrollbar min-h-0 w-full flex-1');
if (rememberedDock.includes('maxLength={700}')) {
  fail('RememberedContextDock summary editor must not cap existing long summaries at 700 characters');
}
if (rememberedDock.includes('textareaClassName="clean-scrollbar h-full min-h-[420px]')) {
  fail('RememberedContextDock summary textarea must not consume the footer height');
}
if (rememberedDock.includes('left-2 top-1/2')) {
  fail('RememberedContextDock must not render a left-edge bell trigger');
}
if (rememberedDock.includes('backdrop-blur')) {
  fail('RememberedContextDock must not use a blur backdrop');
}

const header = readFrom(webRoot, 'src/components/workbench/WorkbenchHeader.tsx');
assertContains('header owns remembered context anchor', header, 'data-remembered-context-anchor');
assertContains('header overlaps workbench alert icons', header, "'flex shrink-0 items-center'");
assertContains('FA shows remembered icon for action-required work only', floating, 'showRememberedContextButton={rememberedContextCounts.count > 0');
assertContains('FA badge count uses pending remembered work only', floating, 'rememberedContextCount={rememberedContextCounts.count}');

console.log('contact-continuity wiring invariants OK');
