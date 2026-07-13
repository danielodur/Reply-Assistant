import { useEffect, useMemo, useState } from 'react';
import type { CountryCode } from 'libphonenumber-js';
import type { AppTranslations } from '../../i18n/translations';
import { resolveLanguage, type AppLanguage } from '../../i18n/translations';
import CountryPhonePicker from './CountryPhonePicker';
import {
  buildPhoneCountryOptions,
  defaultPhoneCountry,
  type PhoneCountryOption,
} from './phoneCountries';
import { parseStoredPhone, validatePhoneInput } from './phoneValidation';

type InternationalPhoneFieldProps = {
  valueE164: string;
  onChangeE164: (value: string) => void;
  language: AppLanguage;
  copy: AppTranslations['accountSettings'];
  fieldLabel?: string;
  error?: string;
  onClearError?: () => void;
  onNationalDigitsChange?: (hasDigits: boolean) => void;
  autoFocus?: boolean;
};

export function getPhoneValidationMessage(
  reason: 'empty' | 'invalid' | 'too_short' | 'nonsense',
  copy: AppTranslations['accountSettings'],
): string {
  switch (reason) {
    case 'empty':
      return copy.phoneEmpty;
    case 'too_short':
      return copy.phoneTooShort;
    case 'nonsense':
      return copy.phoneNonsense;
    case 'invalid':
    default:
      return copy.phoneInvalid;
  }
}

export function validatePhoneForSave(
  nationalDigits: string,
  country: CountryCode,
  copy: AppTranslations['accountSettings'],
): { ok: true; e164: string } | { ok: false; message: string } {
  const digits = nationalDigits.replace(/\D/g, '');
  if (!digits) {
    return { ok: true, e164: '' };
  }

  const result = validatePhoneInput(digits, country);
  if (!result.valid) {
    return { ok: false, message: getPhoneValidationMessage(result.reason, copy) };
  }

  return { ok: true, e164: result.e164 };
}

export default function InternationalPhoneField({
  valueE164,
  onChangeE164,
  language,
  copy,
  fieldLabel,
  error,
  onClearError,
  onNationalDigitsChange,
  autoFocus = false,
}: InternationalPhoneFieldProps) {
  const lang = resolveLanguage(language);
  const countries = useMemo(() => buildPhoneCountryOptions(lang), [lang]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [countryIso, setCountryIso] = useState<CountryCode>(() => defaultPhoneCountry(lang));
  const [national, setNational] = useState('');
  const [liveError, setLiveError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const selectedCountry = useMemo(
    () => countries.find(item => item.iso2 === countryIso) ?? countries[0],
    [countries, countryIso],
  );

  useEffect(() => {
    const parsed = parseStoredPhone(valueE164);
    if (parsed) {
      setCountryIso(parsed.country);
      setNational(parsed.national);
      return;
    }
    if (!valueE164.trim()) {
      setNational('');
      setCountryIso(defaultPhoneCountry(lang));
    }
  }, [valueE164, lang]);

  const applyNational = (digits: string, iso: CountryCode) => {
    setNational(digits);
    onNationalDigitsChange?.(digits.length > 0);
    onClearError?.();

    if (!digits) {
      setLiveError(null);
      setIsValid(false);
      onChangeE164('');
      return;
    }

    const result = validatePhoneInput(digits, iso);
    if (result.valid) {
      setLiveError(null);
      setIsValid(true);
      onChangeE164(result.e164);
      return;
    }

    setIsValid(false);
    setLiveError(getPhoneValidationMessage(result.reason, copy));
    onChangeE164('');
  };

  const updateNational = (next: string) => {
    applyNational(next.replace(/\D/g, ''), countryIso);
  };

  const handleSelectCountry = (country: PhoneCountryOption) => {
    setCountryIso(country.iso2);
    setPickerOpen(false);
    onClearError?.();
    if (national) {
      applyNational(national, country.iso2);
    }
  };

  const displayError = error ?? liveError;
  const showValidHint = !displayError && isValid && national.length > 0;

  return (
    <div className="relative">
      <label className="block">
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">
          {fieldLabel ?? copy.phoneNumber}
        </span>
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] border border-[#edd7e0] bg-white px-2.5 py-2 text-[12px] font-medium text-slate-800 transition hover:border-[#e88ab0] hover:bg-[#fff5f9]"
            aria-label={copy.phoneSelectCountry}
          >
            <span className="text-[16px] leading-none" aria-hidden="true">{selectedCountry?.flag}</span>
            <span>{selectedCountry?.dialCode}</span>
            <svg viewBox="0 0 24 24" className="h-3 w-3 text-slate-400" fill="none" aria-hidden="true">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <input
            type="tel"
            inputMode="numeric"
            value={national}
            onChange={event => updateNational(event.currentTarget.value)}
            placeholder={copy.phoneNationalPlaceholder}
            className={[
              'min-w-0 flex-1 rounded-[10px] border bg-white px-3 py-2 text-[12px] text-slate-800 outline-none',
              displayError ? 'border-[#e88ab0]' : 'border-[#edd7e0]',
            ].join(' ')}
            autoFocus={autoFocus}
            aria-invalid={Boolean(displayError)}
          />
        </div>
      </label>

      {displayError ? (
        <p className="mt-2 text-[11px] text-[#c15480]" role="alert">{displayError}</p>
      ) : null}
      {showValidHint ? (
        <p className="mt-2 text-[11px] text-emerald-600">{copy.phoneLooksValid}</p>
      ) : null}

      <CountryPhonePicker
        open={pickerOpen}
        lang={lang}
        selectedIso2={countryIso}
        searchPlaceholder={copy.phoneSearchPlaceholder}
        title={copy.phoneSelectCountry}
        noResults={copy.phoneNoResults}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectCountry}
      />
    </div>
  );
}

export { validatePhoneInput } from './phoneValidation';
