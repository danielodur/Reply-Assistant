import { useEffect, useId, useRef, useState } from 'react';
import type { ContactStage } from '../../config/contactThreads';

type StageDropdownProps = {
  value: ContactStage;
  options: Array<[ContactStage, string]>;
  ariaLabel: string;
  onChange: (value: ContactStage) => void;
};

export default function StageDropdown({ value, options, ariaLabel, onChange }: StageDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();
  const selectedLabel = options.find(([id]) => id === value)?.[1] ?? options[0]?.[1] ?? '';
  const selectedIndex = Math.max(0, options.findIndex(([id]) => id === value));

  useEffect(() => {
    if (!open) return;

    // Focus the selected option when opening for immediate keyboard continuity.
    window.requestAnimationFrame(() => {
      optionRefs.current[selectedIndex]?.focus();
    });

    const handleOutside = (event: PointerEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener('pointerdown', handleOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('pointerdown', handleOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, selectedIndex]);

  const moveFocus = (nextIndex: number) => {
    const boundedIndex = (nextIndex + options.length) % options.length;
    optionRefs.current[boundedIndex]?.focus();
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="flex w-full items-center justify-between rounded-[10px] border border-[#edd7e0] bg-white px-3 py-2 text-[11px] text-slate-700 outline-none"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => setOpen(prev => !prev)}
        onKeyDown={event => {
          if (!open && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span>{selectedLabel}</span>
        <span className={`text-[10px] text-[#E85C8B] transition-transform ${open ? 'rotate-180' : ''}`}>
          ˅
        </span>
      </button>

      {open ? (
        <div className="clean-scrollbar absolute left-0 top-[calc(100%+8px)] z-40 w-full overflow-auto rounded-[14px] border border-[#f2dce4] bg-white p-1.5 shadow-[0_14px_35px_rgba(232,92,139,0.16)]">
          <ul id={listboxId} role="listbox" aria-label={ariaLabel} className="space-y-1">
            {options.map(([id, label], index) => (
              <li key={id}>
                <button
                  ref={element => {
                    optionRefs.current[index] = element;
                  }}
                  type="button"
                  role="option"
                  aria-selected={value === id}
                  className={[
                    'w-full rounded-[10px] px-3 py-2 text-left text-[11px] transition',
                    value === id ? 'bg-[#fde7ef] font-semibold text-[#E85C8B]' : 'text-slate-600 hover:bg-[#fff5f8]',
                  ].join(' ')}
                  onKeyDown={event => {
                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      moveFocus(index + 1);
                    } else if (event.key === 'ArrowUp') {
                      event.preventDefault();
                      moveFocus(index - 1);
                    } else if (event.key === 'Home') {
                      event.preventDefault();
                      moveFocus(0);
                    } else if (event.key === 'End') {
                      event.preventDefault();
                      moveFocus(options.length - 1);
                    }
                  }}
                  onClick={() => {
                    onChange(id);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}