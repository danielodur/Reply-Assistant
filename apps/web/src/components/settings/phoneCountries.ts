import { getCountries, getCountryCallingCode } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';

export type PhoneCountryOption = {
  iso2: CountryCode;
  dialCode: string;
  name: string;
  sortLetter: string;
  flag: string;
};

function countryFlag(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function sortLetter(name: string): string {
  const first = name.trim().charAt(0).toUpperCase();
  if (/[A-Z]/.test(first)) return first;
  return '#';
}

export function buildPhoneCountryOptions(lang: 'en' | 'zh'): PhoneCountryOption[] {
  const locale = lang === 'zh' ? 'zh-CN' : 'en';
  const displayNames = new Intl.DisplayNames([locale], { type: 'region' });

  return getCountries()
    .map(iso2 => {
      const name = displayNames.of(iso2) ?? iso2;
      return {
        iso2,
        dialCode: `+${getCountryCallingCode(iso2)}`,
        name,
        sortLetter: sortLetter(name),
        flag: countryFlag(iso2),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

export function defaultPhoneCountry(lang: 'en' | 'zh'): CountryCode {
  return lang === 'zh' ? 'CN' : 'US';
}

export function indexLetters(countries: PhoneCountryOption[]): string[] {
  const letters = new Set<string>();
  for (const country of countries) {
    letters.add(country.sortLetter);
  }
  return [...letters].sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });
}
