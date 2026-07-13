/**
 * Assert EN/ZH auth i18n parity and auth screen route ids.
 *
 * Run: npm run verify:auth --workspace=apps/web
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const translationsPath = join(__dirname, '..', 'src', 'i18n', 'translations.ts');
const authShellPath = join(__dirname, '..', 'src', 'auth', 'AuthShell.tsx');
const authDir = join(__dirname, '..', 'src', 'auth');

const src = readFileSync(translationsPath, 'utf8');
const authShell = readFileSync(authShellPath, 'utf8');

const REQUIRED_AUTH_KEYS = [
  'signInTitle',
  'signUpTitle',
  'emailLabel',
  'passwordLabel',
  'confirmPasswordLabel',
  'nameLabel',
  'forgotPassword',
  'resetPassword',
  'changePasswordTitle',
  'verifyEmailTitle',
  'verifyEmailBody',
  'backToSignIn',
  'signOut',
  'passwordUpdated',
  'showPassword',
  'hidePassword',
  'weakPasswordHint',
  'strongPasswordHint',
  'passwordsMatchHint',
  'alreadyHaveAccount',
  'dontHaveAccount',
  'signInLink',
  'signUpLink',
  'needHelp',
  'verifyEmailSentTo',
  'verifyEmailMissingEmail',
  'resendIn',
  'resendLink',
  'resendResetLink',
  'resendSuccess',
  'resendTooSoon',
  'errors.required',
  'errors.invalidCredentials',
  'errors.emailNotConfirmed',
  'errors.weakPassword',
  'errors.passwordMismatch',
  'errors.generic',
  'errors.invalidEmail',
  'errors.invalidFullName',
];

const REQUIRED_ACCOUNT_SETTINGS_KEYS = [
  'frameLabel',
  'frameTitle',
  'profileSection',
  'accountSection',
  'sessionSection',
  'dangerSection',
  'profileDetails',
  'phoneNumber',
  'phoneNotSet',
  'phoneNationalPlaceholder',
  'phoneSearchPlaceholder',
  'phoneSelectCountry',
  'phoneNoResults',
  'phoneInvalid',
  'phoneTooShort',
  'phoneEmpty',
  'phoneNonsense',
  'phoneLooksValid',
  'phoneSaveFailed',
  'changePassword',
  'signOut',
  'deleteAccount',
  'edit',
  'save',
  'openAccountSettings',
  'signOutConfirmTitle',
  'signOutConfirmBody',
];

const REQUIRED_DELETE_ACCOUNT_KEYS = [
  'frameLabel',
  'frameTitle',
  'body',
  'acknowledgeLabel',
  'confirmButton',
  'working',
  'errorGeneric',
  'errorOffline',
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

function extractLocaleAuthSection(localeName) {
  return extractLocaleSection(localeName, 'auth', 'settings');
}

function hasKey(block, key) {
  if (key.startsWith('errors.')) {
    const sub = key.split('.')[1];
    return new RegExp(`errors:\\s*\\{[\\s\\S]*${sub}:`).test(block);
  }
  return new RegExp(`${key}:`).test(block);
}

for (const locale of ['EN', 'ZH']) {
  const block = extractLocaleAuthSection(locale);
  const missing = REQUIRED_AUTH_KEYS.filter(key => !hasKey(block, key));
  if (missing.length) {
    console.error(`Missing auth keys in ${locale}:`, missing);
    process.exit(1);
  }
}

for (const locale of ['EN', 'ZH']) {
  const block = extractLocaleSection(locale, 'accountSettings', 'deleteAccount');
  const missing = REQUIRED_ACCOUNT_SETTINGS_KEYS.filter(key => !hasKey(block, key));
  if (missing.length) {
    console.error(`Missing accountSettings keys in ${locale}:`, missing);
    process.exit(1);
  }
}

for (const locale of ['EN', 'ZH']) {
  const block = extractLocaleSection(locale, 'deleteAccount', 'moreFeatures');
  const missing = REQUIRED_DELETE_ACCOUNT_KEYS.filter(key => !hasKey(block, key));
  if (missing.length) {
    console.error(`Missing deleteAccount keys in ${locale}:`, missing);
    process.exit(1);
  }
}

const requiredRoutes = [
  'sign-in',
  'sign-up',
  'forgot-password',
  'verify-email',
  'change-password',
];

for (const route of requiredRoutes) {
  if (!authShell.includes(`'${route}'`)) {
    console.error(`AuthShell missing route id: ${route}`);
    process.exit(1);
  }
}

if (!src.includes('accountTitle')) {
  console.error('Settings account i18n keys missing');
  process.exit(1);
}

const accountSettingsPath = join(__dirname, '..', 'src', 'components', 'settings', 'AccountSettings.tsx');
const deleteAccountPath = join(__dirname, '..', 'src', 'components', 'settings', 'DeleteAccount.tsx');
const deleteAccountApiPath = join(__dirname, '..', 'src', 'auth', 'deleteAccountApi.ts');
for (const [label, filePath] of [
  ['AccountSettings', accountSettingsPath],
  ['DeleteAccount', deleteAccountPath],
  ['deleteAccountApi', deleteAccountApiPath],
]) {
  try {
    readFileSync(filePath, 'utf8');
  } catch {
    console.error(`Missing ${label} file`);
    process.exit(1);
  }
}

const moreFeaturesSrc = readFileSync(join(__dirname, '..', 'src', 'components', 'more-features.tsx'), 'utf8');
if (moreFeaturesSrc.includes('onSignOut')) {
  console.error('more-features must use onQuit instead of onSignOut');
  process.exit(1);
}

const preloadSrc = readFileSync(join(__dirname, '..', '..', '..', 'electron', 'preload.ts'), 'utf8');
if (!preloadSrc.includes('quitApp')) {
  console.error('electron preload missing quitApp');
  process.exit(1);
}

const passwordFieldSrc = readFileSync(join(authDir, 'components', 'AuthPasswordField.tsx'), 'utf8');
if (!passwordFieldSrc.includes('EyeIcon')) {
  console.error('AuthPasswordField missing password visibility toggle');
  process.exit(1);
}
if (!passwordFieldSrc.includes('showStrength')) {
  console.error('AuthPasswordField missing inline password strength hints');
  process.exit(1);
}

try {
  readFileSync(join(authDir, 'components', 'AuthPasswordRequirements.tsx'), 'utf8');
  console.error('AuthPasswordRequirements card should be removed');
  process.exit(1);
} catch {
  // expected — requirements card removed
}

const signUpSrc = readFileSync(join(authDir, 'screens', 'SignUpScreen.tsx'), 'utf8');
const changePasswordSrc = readFileSync(join(authDir, 'screens', 'ChangePasswordScreen.tsx'), 'utf8');
if (signUpSrc.includes('AuthPasswordRequirements') || changePasswordSrc.includes('AuthPasswordRequirements')) {
  console.error('Auth screens still import AuthPasswordRequirements');
  process.exit(1);
}

if (!authShell.includes('verifyEmail')) {
  console.error('AuthShell missing verify email resolution');
  process.exit(1);
}

if (!readFileSync(join(authDir, 'components', 'AuthLanguageToggle.tsx'), 'utf8').includes('中文')) {
  console.error('AuthLanguageToggle missing Chinese switch label');
  process.exit(1);
}
if (!readFileSync(join(authDir, 'AuthShell.tsx'), 'utf8').includes('AuthLanguageProvider')) {
  console.error('AuthShell must wrap auth screens with AuthLanguageProvider');
  process.exit(1);
}

const sharedJs = readFileSync(join(__dirname, '..', '..', '..', 'netlify-auth', 'auth', 'shared.js'), 'utf8');
if (!sharedJs.includes('mountLanguageToggle') || !sharedJs.includes("return lang() === 'zh' ? 'En' : '中文'")) {
  console.error('Netlify shared.js missing single-button language toggle');
  process.exit(1);
}

const emailValidationSrc = readFileSync(join(authDir, 'emailValidation.ts'), 'utf8');
const emailFieldSrc = readFileSync(join(authDir, 'components', 'AuthEmailField.tsx'), 'utf8');
for (const screen of ['SignInScreen.tsx', 'SignUpScreen.tsx', 'ForgotPasswordScreen.tsx']) {
  const screenSrc = readFileSync(join(authDir, 'screens', screen), 'utf8');
  if (!screenSrc.includes('AuthEmailField') || !screenSrc.includes('noValidate')) {
    console.error(`${screen} must use AuthEmailField with noValidate forms`);
    process.exit(1);
  }
}
if (!emailFieldSrc.includes('EmailValidIcon')) {
  console.error('AuthEmailField missing valid email check indicator');
  process.exit(1);
}
if (!emailValidationSrc.includes('EMAIL_PATTERN')) {
  console.error('emailValidation.ts missing strict email pattern');
  process.exit(1);
}

async function assertEmailValidation() {
  const { isValidEmail } = await import('../src/auth/emailValidation.ts');
  const invalid = [
    '',
    '   ',
    'notanemail',
    'a@b',
    'test@domain',
    '@test.com',
    'test@.com',
    'test..x@gmail.com',
    'test @gmail.com',
    'test@gmail',
    'a@b.c',
    '@',
    'user@',
    'user@@test.com',
  ];
  const valid = [
    'user@gmail.com',
    'first.last@company.co.uk',
    'name@sub.domain.org',
    'team+inbox@startup.io',
  ];

  for (const sample of invalid) {
    if (isValidEmail(sample)) {
      console.error(`Expected invalid email to fail: ${JSON.stringify(sample)}`);
      process.exit(1);
    }
  }
  for (const sample of valid) {
    if (!isValidEmail(sample)) {
      console.error(`Expected valid email to pass: ${JSON.stringify(sample)}`);
      process.exit(1);
    }
  }
}

await assertEmailValidation();

console.log('auth i18n + route invariants OK');
