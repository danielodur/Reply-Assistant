import { useMemo, useState } from 'react';
import type { AppTranslations } from '../../i18n/translations';

type FaqAccordionProps = {
  copy: AppTranslations['customerService'];
  compact?: boolean;
  maxItems?: number;
  showSearch?: boolean;
};

export default function FaqAccordion({
  copy,
  compact = false,
  maxItems,
  showSearch = !compact,
}: FaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const base = maxItems ? copy.faqItems.slice(0, maxItems) : copy.faqItems;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return base;
    return base.filter(item => {
      const haystack = `${item.question} ${item.answer}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [copy.faqItems, maxItems, query]);

  return (
    <section>
      {!compact ? (
        <p className="text-[12px] font-semibold text-slate-900">{copy.faqTitle}</p>
      ) : null}

      {showSearch ? (
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.currentTarget.value)}
          placeholder={copy.faqSearchPlaceholder}
          className={[
            'w-full rounded-[10px] border border-[#edd7e0] bg-white px-3 py-2 text-[12px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#e88ab0]',
            compact ? 'mt-2' : 'mt-3',
          ].join(' ')}
        />
      ) : null}

      <div className={compact ? 'mt-2 space-y-2' : 'mt-3 space-y-2'}>
        {items.length === 0 ? (
          <p className="text-[11px] text-slate-500">{copy.faqEmpty}</p>
        ) : (
          items.map(item => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-[12px] border border-slate-200 bg-white"
              >
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-[#fff8fb]"
                  aria-expanded={isOpen}
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                >
                  <span className="text-[12px] font-medium leading-snug text-slate-900">
                    {item.question}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    className={[
                      'mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform',
                      isOpen ? 'rotate-180' : '',
                    ].join(' ')}
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
                {isOpen ? (
                  <div className="border-t border-slate-100 px-3 py-2.5">
                    <p className="text-[11px] leading-relaxed text-slate-600">{item.answer}</p>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
