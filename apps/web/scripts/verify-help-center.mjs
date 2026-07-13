/**
 * Assert EN/ZH help-center i18n parity and support issue category ids.
 *
 * Run: npm run verify:help-center --workspace=apps/web
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const translationsPath = join(root, 'src', 'i18n', 'translations.ts');
const issueCategoriesPath = join(root, 'src', 'components', 'help-center', 'supportIssueCategories.ts');

const src = readFileSync(translationsPath, 'utf8');
const issueSrc = readFileSync(issueCategoriesPath, 'utf8');

const REQUIRED_CUSTOMER_SERVICE_KEYS = [
  'frameLabel',
  'frameTitle',
  'cardTitle',
  'cardBody',
  'faqTitle',
  'faqSearchPlaceholder',
  'faqEmpty',
  'faqItems',
  'authHelpMoreHint',
  'stillNeedHelpTitle',
  'stillNeedHelpBody',
  'formNameLabel',
  'formPhoneLabel',
  'formEmailLabel',
  'formIssueLabel',
  'formIssuePlaceholder',
  'formMessageLabel',
  'formMessageCounter',
  'formSubmit',
  'formSubmitting',
  'errorNameRequired',
  'errorEmailInvalid',
  'errorIssueRequired',
  'errorMessageRequired',
  'errorMessageTooLong',
  'errorPhoneInvalid',
  'formSuccessTitle',
  'formSuccessBody',
  'formErrorGeneric',
  'formErrorOffline',
  'issueCategories',
];

const REQUIRED_MORE_FEATURES_RENEW_KEYS = [
  'renew',
  'renewChecking',
  'renewLatestTitle',
  'renewLatestBody',
];

function extractLocaleSection(localeName, sectionName, nextSectionName) {
  const marker = `const ${localeName}: TranslationBundle = {`;
  const start = src.indexOf(marker);
  if (start < 0) throw new Error(`Missing locale block: ${localeName}`);

  const sectionStart = src.indexOf(`${sectionName}: {`, start);
  const nextLocale = localeName === 'EN'
    ? src.indexOf('const ZH: TranslationBundle = {', sectionStart)
    : src.length;
  const sectionEnd = src.indexOf(`${nextSectionName}: {`, sectionStart);
  if (sectionStart < 0 || sectionEnd < 0 || sectionEnd > nextLocale) {
    throw new Error(`Missing ${sectionName} block for ${localeName}`);
  }
  return src.slice(sectionStart, sectionEnd);
}

function hasKey(section, key) {
  return new RegExp(`\\b${key}:`).test(section);
}

function extractIssueIds() {
  const match = issueSrc.match(/SUPPORT_ISSUE_IDS\s*=\s*\[([\s\S]*?)\]\s*as const/);
  if (!match) throw new Error('Could not parse SUPPORT_ISSUE_IDS');
  return [...match[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
}

const issueIds = extractIssueIds();
const enCs = extractLocaleSection('EN', 'customerService', 'referFriends');
const zhCs = extractLocaleSection('ZH', 'customerService', 'referFriends');
const enMf = extractLocaleSection('EN', 'moreFeatures', 'messages');
const zhMf = extractLocaleSection('ZH', 'moreFeatures', 'messages');

let failed = false;

for (const key of REQUIRED_CUSTOMER_SERVICE_KEYS) {
  if (!hasKey(enCs, key)) {
    console.error(`EN customerService missing key: ${key}`);
    failed = true;
  }
  if (!hasKey(zhCs, key)) {
    console.error(`ZH customerService missing key: ${key}`);
    failed = true;
  }
}

for (const key of REQUIRED_MORE_FEATURES_RENEW_KEYS) {
  if (!hasKey(enMf, key)) {
    console.error(`EN moreFeatures missing key: ${key}`);
    failed = true;
  }
  if (!hasKey(zhMf, key)) {
    console.error(`ZH moreFeatures missing key: ${key}`);
    failed = true;
  }
}

for (const id of issueIds) {
  const quoted = `'${id}':`;
  const bare = `${id}:`;
  if (!enCs.includes(quoted) && !enCs.includes(bare)) {
    console.error(`EN issueCategories missing id: ${id}`);
    failed = true;
  }
  if (!zhCs.includes(quoted) && !zhCs.includes(bare)) {
    console.error(`ZH issueCategories missing id: ${id}`);
    failed = true;
  }
}

if (src.includes('supportItems') || src.includes('recentQueryTitle')) {
  console.error('Stale customerService keys (supportItems/recentQuery) still present');
  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log('[verify-help-center] OK — EN/ZH parity and issue category ids verified');
