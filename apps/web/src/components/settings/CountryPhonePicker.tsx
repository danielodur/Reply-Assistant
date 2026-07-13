import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildPhoneCountryOptions,
  indexLetters,
  type PhoneCountryOption,
} from './phoneCountries';
import type { CountryCode } from 'libphonenumber-js';

type CountryPhonePickerProps = {
  open: boolean;
  lang: 'en' | 'zh';
  selectedIso2: CountryCode;
  searchPlaceholder: string;
  title: string;
  noResults: string;
  onClose: () => void;
  onSelect: (country: PhoneCountryOption) => void;
};

export default function CountryPhonePicker({
  open,
  lang,
  selectedIso2,
  searchPlaceholder,
  title,
  noResults,
  onClose,
  onSelect,
}: CountryPhonePickerProps) {
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const allCountries = useMemo(() => buildPhoneCountryOptions(lang), [lang]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return allCountries;
    return allCountries.filter(country => {
      const haystack = `${country.name} ${country.dialCode} ${country.iso2}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [allCountries, query]);

  const letters = useMemo(() => indexLetters(filtered), [filtered]);

  const grouped = useMemo(() => {
    const map = new Map<string, PhoneCountryOption[]>();
    for (const country of filtered) {
      const bucket = map.get(country.sortLetter) ?? [];
      bucket.push(country);
      map.set(country.sortLetter, bucket);
    }
    return map;
  }, [filtered]);

  const scrollToLetter = useCallback((letter: string) => {
    const node = sectionRefs.current.get(letter);
    if (node && listRef.current) {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#fcfcfd]">
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#f2d6e0] bg-white text-slate-500 transition hover:border-[#e7aac2] hover:text-[#d86a94]"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="min-w-0 flex-1 text-center text-[13px] font-semibold text-slate-900">{title}</p>
        <div className="h-8 w-8 shrink-0" />
      </div>

      <div className="px-3 py-2">
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.currentTarget.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-[10px] border border-[#edd7e0] bg-white px-3 py-2 text-[12px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#e88ab0]"
          autoFocus
        />
      </div>

      <div className="relative min-h-0 flex-1">
        <div ref={listRef} className="clean-scrollbar absolute inset-0 overflow-y-auto pb-4 pl-3 pr-8">
          {filtered.length === 0 ? (
            <p className="px-2 py-6 text-center text-[12px] text-slate-500">{noResults}</p>
          ) : (
            [...grouped.entries()].map(([letter, countries]) => (
              <div
                key={letter}
                ref={node => {
                  if (node) sectionRefs.current.set(letter, node);
                }}
              >
                <p className="sticky top-0 z-10 bg-[#fcfcfd]/95 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 backdrop-blur-[2px]">
                  {letter}
                </p>
                <ul>
                  {countries.map(country => {
                    const selected = country.iso2 === selectedIso2;
                    return (
                      <li key={country.iso2}>
                        <button
                          type="button"
                          onClick={() => onSelect(country)}
                          className={[
                            'flex w-full items-center gap-2.5 rounded-[10px] px-2 py-2.5 text-left transition',
                            selected ? 'bg-[#fff0f6] text-[#9a3d62]' : 'hover:bg-[#fff5f9] text-slate-800',
                          ].join(' ')}
                        >
                          <span className="text-[18px] leading-none" aria-hidden="true">{country.flag}</span>
                          <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{country.name}</span>
                          <span className="shrink-0 text-[11px] text-slate-500">{country.dialCode}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        {!query.trim() && letters.length > 1 ? (
          <div className="pointer-events-none absolute inset-y-2 right-1 flex w-5 flex-col items-center justify-center gap-0.5">
            {letters.map(letter => (
              <button
                key={letter}
                type="button"
                onClick={() => scrollToLetter(letter)}
                className="pointer-events-auto flex h-[14px] w-[18px] items-center justify-center rounded text-[9px] font-semibold text-[#bf5a83] transition hover:bg-[#fff0f6] hover:text-[#9a3d62]"
                aria-label={letter}
              >
                {letter}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
