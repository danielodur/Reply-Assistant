export type EmailValidationState = 'empty' | 'typing' | 'valid' | 'invalid';

const EMAIL_PATTERN =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9._+-]{0,62}[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,62}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,62}[a-zA-Z0-9])?)+$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  const email = normalizeEmail(value);
  if (!email || email.length > 254) return false;
  if (email.includes('..')) return false;
  if ((email.match(/@/g) || []).length !== 1) return false;
  if (!EMAIL_PATTERN.test(email)) return false;

  const [, domain] = email.split('@');
  if (!domain) return false;

  const labels = domain.split('.');
  if (labels.length < 2) return false;
  if (labels.some(label => !label.length || label.length > 63)) return false;

  const tld = labels[labels.length - 1];
  if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) return false;

  return true;
}

export function getEmailValidationState(value: string): EmailValidationState {
  const email = value.trim();
  if (!email) return 'empty';
  if (isValidEmail(email)) return 'valid';
  if (shouldShowInvalidEmailHint(email)) return 'invalid';
  return 'typing';
}

export function shouldShowInvalidEmailHint(value: string): boolean {
  const email = value.trim();
  if (!email || isValidEmail(email)) return false;
  if (/\s/.test(email)) return true;

  const atCount = (email.match(/@/g) || []).length;
  if (atCount !== 1) return true;
  if (email.startsWith('@') || email.endsWith('@')) return true;

  const [, domain] = email.split('@');
  if (!domain) return false;

  return domain.includes('.');
}

export function isValidFullName(value: string): boolean {
  const name = value.trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 80) return false;
  return /^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*[\p{L}\p{M}]$|^[\p{L}\p{M}]$/u.test(name);
}
