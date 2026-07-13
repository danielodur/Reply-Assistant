import { useEffect, useRef, useState } from 'react';
import type { ImapPreset, ImapPresetId } from './imapPresets';

type EmailProviderPickerProps = {
  presets: ImapPreset[];
  value: ImapPresetId;
  onChange: (value: ImapPresetId) => void;
  disabled?: boolean;
};

export default function EmailProviderPicker({ presets, value, onChange, disabled = false }: EmailProviderPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const activePreset = presets.find(item => item.id === value) ?? presets[0];

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (disabled && isOpen) {
      setIsOpen(false);
    }
  }, [disabled, isOpen]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-[10px] border border-[#edd7e0] bg-white px-3 py-2 text-[11px] text-slate-700 outline-none transition hover:border-[#e7aac2] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
        onClick={() => setIsOpen(prev => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{activePreset.label}</span>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-slate-500" fill="none" aria-hidden="true">
          <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-52 overflow-y-auto rounded-[12px] border border-[#f0dbe3] bg-white p-1.5 shadow-[0_16px_36px_rgba(15,23,42,0.10)]">
          {presets.map(item => {
            const active = item.id === value;
            return (
              <button
                key={item.id}
                type="button"
                className={[
                  'flex w-full items-center rounded-[9px] px-2.5 py-2 text-left text-[10px] font-medium transition',
                  active ? 'bg-[#fff5f9] text-[#c15480]' : 'text-slate-600 hover:bg-[#fff5f9] hover:text-[#c15480]',
                ].join(' ')}
                onClick={() => {
                  onChange(item.id);
                  setIsOpen(false);
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
