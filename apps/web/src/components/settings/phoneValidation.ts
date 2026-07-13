import {
  parsePhoneNumberFromString,
  isValidPhoneNumber,
  type CountryCode,
} from 'libphonenumber-js';

export type PhoneValidationResult =
  | { valid: true; e164: string; display: string }
  | { valid: false; reason: 'empty' | 'invalid' | 'too_short' | 'nonsense' };

const REPEATED_DIGIT = /^(\d)\1{5,}$/;

export function parseStoredPhone(value: string): {
  country: CountryCode;
  national: string;
} | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = parsePhoneNumberFromString(trimmed);
  if (!parsed?.country) return null;

  return {
    country: parsed.country,
    national: parsed.nationalNumber,
  };
}

export function validatePhoneInput(
  nationalDigits: string,
  country: CountryCode,
): PhoneValidationResult {
  const digits = nationalDigits.replace(/\D/g, '');
  if (!digits) {
    return { valid: false, reason: 'empty' };
  }

  if (REPEATED_DIGIT.test(digits)) {
    return { valid: false, reason: 'nonsense' };
  }

  const candidate = parsePhoneNumberFromString(digits, country);
  if (!candidate) {
    return { valid: false, reason: 'invalid' };
  }

  if (!isValidPhoneNumber(candidate.number, country)) {
    if (digits.length < 4) {
      return { valid: false, reason: 'too_short' };
    }
    return { valid: false, reason: 'invalid' };
  }

  return {
    valid: true,
    e164: candidate.format('E.164'),
    display: candidate.formatInternational(),
  };
}
