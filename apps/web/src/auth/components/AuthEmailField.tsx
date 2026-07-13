import { getEmailValidationState } from '../emailValidation';

type AuthEmailFieldProps = {
  id: string;
  label: string;
  value: string;
  autoComplete?: string;
  onChange: (value: string) => void;
  error?: string;
  invalidEmailLabel: string;
};

function EmailValidIcon() {
  return (
    <span
      className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]"
      aria-hidden="true"
    >
      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
        <path
          d="M2.5 6l2.5 2.5 4.5-5"
          stroke="white"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function AuthEmailField({
  id,
  label,
  value,
  autoComplete = 'email',
  onChange,
  error,
  invalidEmailLabel,
}: AuthEmailFieldProps) {
  const validationState = error ? 'invalid' : getEmailValidationState(value);
  const showCheck = validationState === 'valid';
  const showInvalidHint = !error && validationState === 'invalid';

  return (
    <div className="mb-3 text-left">
      <label htmlFor={id} className="mb-1 block text-[11px] font-semibold text-[#725444]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="email"
          inputMode="email"
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={event => onChange(event.target.value)}
          aria-invalid={Boolean(error || showInvalidHint)}
          className={[
            'w-full rounded-[12px] border px-3 py-2.5 text-[13px] outline-none transition-colors',
            showCheck ? 'border-emerald-400 pr-10 focus:border-emerald-500' : 'border-[#edd7e0] pr-3',
            showCheck
              ? 'focus:shadow-[0_0_0_2px_rgba(52,211,153,0.22)]'
              : 'focus:border-[#e88ab0] focus:shadow-[0_0_0_2px_rgba(232,138,176,0.25)]',
          ].join(' ')}
        />
        {showCheck ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center">
            <EmailValidIcon />
          </span>
        ) : null}
      </div>
      {error ? (
        <p className="mt-1 text-[11px] text-[#c15480]">{error}</p>
      ) : showInvalidHint ? (
        <p className="mt-1 text-[11px] text-[#c15480]">{invalidEmailLabel}</p>
      ) : null}
    </div>
  );
}
