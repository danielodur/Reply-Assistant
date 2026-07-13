import { useState } from 'react';
import { isPasswordValid } from '../passwordRules';

type AuthPasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  autoComplete?: string;
  onChange: (value: string) => void;
  error?: string;
  showPasswordLabel: string;
  hidePasswordLabel: string;
  showStrength?: boolean;
  weakPasswordLabel?: string;
  strongPasswordLabel?: string;
  matchAgainst?: string;
  passwordMatchLabel?: string;
  passwordMismatchLabel?: string;
};

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path
          d="M3 3l18 18M10.58 10.58A2 2 0 0012 15a2 2 0 001.42-.58M9.88 5.09A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7a11.8 11.8 0 01-4.12 5.12M6.12 6.12A11.8 11.8 0 001 12c1.73 3.89 6 7 11 7 1.09 0 2.13-.15 3.09-.42"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function FieldHint({ tone, text }: { tone: 'error' | 'success'; text: string }) {
  return (
    <p
      className={[
        'mt-1 text-[11px]',
        tone === 'success' ? 'text-emerald-600' : 'text-[#c15480]',
      ].join(' ')}
    >
      {text}
    </p>
  );
}

export default function AuthPasswordField({
  id,
  label,
  value,
  autoComplete,
  onChange,
  error,
  showPasswordLabel,
  hidePasswordLabel,
  showStrength = false,
  weakPasswordLabel,
  strongPasswordLabel,
  matchAgainst,
  passwordMatchLabel,
  passwordMismatchLabel,
}: AuthPasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  const renderFeedback = () => {
    if (error) {
      return <FieldHint tone="error" text={error} />;
    }

    if (matchAgainst !== undefined && value) {
      const matches = value === matchAgainst;
      return (
        <FieldHint
          tone={matches ? 'success' : 'error'}
          text={matches ? (passwordMatchLabel ?? '') : (passwordMismatchLabel ?? '')}
        />
      );
    }

    if (showStrength && value && weakPasswordLabel && strongPasswordLabel) {
      const strong = isPasswordValid(value);
      return (
        <FieldHint
          tone={strong ? 'success' : 'error'}
          text={strong ? strongPasswordLabel : weakPasswordLabel}
        />
      );
    }

    return null;
  };

  return (
    <div className="mb-3 text-left">
      <label htmlFor={id} className="mb-1 block text-[11px] font-semibold text-[#725444]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          onChange={event => onChange(event.target.value)}
          className="w-full rounded-[12px] border border-[#edd7e0] px-3 py-2.5 pr-10 text-[13px] outline-none focus:border-[#e88ab0] focus:shadow-[0_0_0_2px_rgba(232,138,176,0.25)]"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-2 inline-flex items-center justify-center rounded-md p-1 text-[#b54e77] transition hover:text-[#c15480]"
          aria-label={visible ? hidePasswordLabel : showPasswordLabel}
          onClick={() => setVisible(prev => !prev)}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
      {renderFeedback()}
    </div>
  );
}
