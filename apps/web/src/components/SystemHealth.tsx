import { useEffect, useState } from 'react';
import type { AppTranslations } from '../i18n/translations';
import { fetchProviderDiagnostics, type DiagnosticsPayload, type DiagnosticsProviderResult as DiagnosticsResult } from '../lib/apiDiagnostics';
import MiniScreenFrame from './MiniScreenFrame';

type SystemHealthProps = {
  onClose: () => void;
  copy: AppTranslations;
};

function statusColor(status: DiagnosticsResult['status']) {
  if (status === 'ok') return 'text-emerald-700 border-emerald-200 bg-emerald-50';
  if (status === 'failed') return 'text-rose-700 border-rose-200 bg-rose-50';
  return 'text-amber-700 border-amber-200 bg-amber-50';
}

export default function SystemHealth({ onClose, copy }: SystemHealthProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<DiagnosticsPayload | null>(null);

  const loadDiagnostics = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchProviderDiagnostics();
      setPayload(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown diagnostics error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDiagnostics();
  }, []);

  return (
    <MiniScreenFrame
      label={copy.systemHealth.frameLabel}
      title={copy.systemHealth.frameTitle}
      onClose={onClose}
      backLabel={copy.miniScreen.back}
      contentClassName="bg-[#fcfcfd] px-5 py-5"
    >
      <div className="space-y-3">
        <p className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[11px] leading-5 text-slate-600">
          {copy.systemHealth.intro}
        </p>

        <div className="rounded-[14px] border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="font-medium text-slate-600">{copy.systemHealth.preferredProvider}</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-700">
              {payload?.preferredProvider ?? '-'}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500">
            {copy.systemHealth.lastChecked}: {payload?.checkedAt ? new Date(payload.checkedAt).toLocaleString() : '-'}
          </div>
        </div>

        <button
          type="button"
          className="w-full rounded-[12px] border border-[#f0dbe3] bg-white px-4 py-2 text-[11px] font-semibold text-[#b54e77] transition hover:border-[#e7aac2]"
          onClick={() => {
            void loadDiagnostics();
          }}
          disabled={loading}
        >
          {loading ? copy.systemHealth.refreshing : copy.systemHealth.refresh}
        </button>

        {error ? (
          <p className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3 text-[11px] leading-5 text-rose-700">
            {copy.systemHealth.errorPrefix}: {error}
          </p>
        ) : null}

        <div className="space-y-2">
          {(payload?.results ?? []).map(result => (
            <article key={result.provider} className="rounded-[14px] border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700">{result.provider}</p>
                <span className={[
                  'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]',
                  statusColor(result.status),
                ].join(' ')}>
                  {result.status}
                </span>
              </div>

              <div className="mt-2 space-y-1 text-[10px] leading-5 text-slate-600">
                <p>{copy.systemHealth.configured}: {result.configured ? copy.systemHealth.yes : copy.systemHealth.no}</p>
                {typeof result.latencyMs === 'number' ? <p>{copy.systemHealth.latency}: {result.latencyMs} ms</p> : null}
                {result.modelUsed ? <p>{copy.systemHealth.model}: {result.modelUsed}</p> : null}
                {result.reason ? <p className="text-rose-600">{copy.systemHealth.reason}: {result.reason}</p> : null}
              </div>
            </article>
          ))}

          {!loading && !error && (payload?.results?.length ?? 0) === 0 ? (
            <p className="rounded-[12px] border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-[11px] text-slate-500">
              {copy.systemHealth.empty}
            </p>
          ) : null}
        </div>
      </div>
    </MiniScreenFrame>
  );
}
