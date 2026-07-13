type AuthFieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  autoComplete?: string;
  onChange: (value: string) => void;
  error?: string;
};

export default function AuthField({
  id,
  label,
  type = 'text',
  value,
  autoComplete,
  onChange,
  error,
}: AuthFieldProps) {
  return (
    <div className="mb-3 text-left">
      <label htmlFor={id} className="mb-1 block text-[11px] font-semibold text-[#725444]">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-[12px] border border-[#edd7e0] px-3 py-2.5 text-[13px] outline-none focus:border-[#e88ab0] focus:shadow-[0_0_0_2px_rgba(232,138,176,0.25)]"
      />
      {error ? <p className="mt-1 text-[12px] text-[#c15480]">{error}</p> : null}
    </div>
  );
}
