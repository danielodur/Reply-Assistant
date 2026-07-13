import { useEffect, useState } from 'react';
import { loadSyncDraft, saveSyncDraft } from './syncFormStorage';

type SyncPlatformScaffoldProps = {
  hint: string;
  fields: Array<{
    key: string;
    placeholder: string;
    type?: 'text' | 'password';
  }>;
  storageKey: string;
  actionLabel: string;
  statusLabel: string;
};

export default function SyncPlatformScaffold({
  hint,
  fields,
  storageKey,
  actionLabel,
  statusLabel,
}: SyncPlatformScaffoldProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    loadSyncDraft<Record<string, string>>(storageKey, {}),
  );

  useEffect(() => {
    saveSyncDraft(storageKey, values);
  }, [storageKey, values]);

  return (
    <div className="space-y-2">
      <p className="text-[10px] leading-5 text-slate-500">{hint}</p>

      {fields.map(field => (
        <input
          key={field.key}
          type={field.type ?? 'text'}
          value={values[field.key] ?? ''}
          onChange={event => setValues(prev => ({ ...prev, [field.key]: event.currentTarget.value }))}
          placeholder={field.placeholder}
          className="w-full rounded-[10px] border border-[#edd7e0] bg-white px-3 py-2 text-[11px] text-slate-700 outline-none placeholder:text-slate-400"
        />
      ))}

      <button
        type="button"
        className="w-full cursor-not-allowed rounded-full bg-[#E85C8B] px-4 py-2 text-[11px] font-semibold text-white opacity-60"
        disabled
      >
        {actionLabel}
      </button>

      <p className="text-[10px] text-slate-500">{statusLabel}</p>
    </div>
  );
}
