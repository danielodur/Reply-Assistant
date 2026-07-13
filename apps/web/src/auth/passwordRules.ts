export type PasswordRuleId = 'length' | 'letter' | 'number';

export type PasswordRuleCheck = {
  id: PasswordRuleId;
  passed: boolean;
};

export function checkPasswordRules(value: string): PasswordRuleCheck[] {
  return [
    { id: 'length', passed: value.length >= 8 },
    { id: 'letter', passed: /[a-zA-Z]/.test(value) },
    { id: 'number', passed: /\d/.test(value) },
  ];
}

export function isPasswordValid(value: string): boolean {
  return checkPasswordRules(value).every(rule => rule.passed);
}

export { getEmailValidationState, isValidEmail, isValidFullName, normalizeEmail, shouldShowInvalidEmailHint } from './emailValidation';

export const RESEND_COOLDOWN_SECONDS = 120;

export function formatCountdown(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}
