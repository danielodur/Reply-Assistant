import { useEffect, useState } from 'react';
import MiniScreenFrame from './MiniScreenFrame';
import type { AppTranslations } from '../i18n/translations';
import type { ActionInboxAnalytics, ActionInboxItem } from './action-inbox/types';
import NoAppDataGuide from './guidance/NoAppDataGuide';
import type { MiniScreenId } from './workbench/types';

type ActionInboxProps = {
  onClose: () => void;
  copy: AppTranslations;
  items: ActionInboxItem[];
  analytics: ActionInboxAnalytics;
  completionRate: number;
  onDoNow: (item: ActionInboxItem) => void | Promise<void>;
  onRemove: (taskId: string) => void;
  foundationEmpty?: boolean;
  onOpenScreen?: (screenId: MiniScreenId) => void;
};

function riskBadgeClass(risk: ActionInboxItem['riskLevel']): string {
  if (risk === 'high') return 'border-red-100 bg-red-50 text-red-600';
  if (risk === 'medium') return 'border-amber-100 bg-amber-50 text-amber-600';
  return 'border-emerald-100 bg-emerald-50 text-emerald-600';
}

export default function ActionInbox({
  onClose,
  copy,
  items,
  analytics,
  completionRate,
  onDoNow,
  onRemove,
  foundationEmpty = false,
  onOpenScreen,
}: ActionInboxProps) {
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const c = copy.actionInbox;
  const pendingRemovalItem = items.find(item => item.id === pendingRemovalId) ?? null;

  useEffect(() => {
    if (!pendingRemovalId) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPendingRemovalId(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [pendingRemovalId]);

  return (
    <MiniScreenFrame
      label={c.frameLabel}
      title={c.frameTitle}
      onClose={onClose}
      backLabel={copy.miniScreen.back}
      contentClassName="bg-[#fcfcfd]"
      contentOverlay={pendingRemovalItem ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a]/30 px-3 backdrop-blur-[3px]">
          <section className="w-full max-w-[292px] rounded-[18px] border border-[#f1d5e1] bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.20)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-[linear-gradient(180deg,#ef5d8f,#db4d83)] text-lg font-semibold text-white shadow-[0_10px_24px_rgba(255,192,211,0.32)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 text-[11px] font-bold tracking-[0.08em]">
                RA
              </div>
            </div>

            <p className="mt-3 text-center text-[13px] font-semibold text-slate-900">{c.removeActionTitle}</p>
            <p className="mt-1 text-center text-[11px] leading-5 text-slate-600">
              {c.removeActionConfirm}
            </p>
            <p className="mt-1 text-center text-[10px] font-medium text-[#b04f78]">{pendingRemovalItem.title}</p>

            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                className="rounded-full border border-[#edd7e0] bg-white px-3 py-1.5 text-[10px] font-medium text-slate-500 transition hover:border-[#e7aac2] hover:text-[#c15480]"
                onClick={() => setPendingRemovalId(null)}
              >
                {copy.settings.cancel}
              </button>
              <button
                type="button"
                className="rounded-full bg-[#E85C8B] px-3 py-1.5 text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(232,92,139,0.24)] transition hover:bg-[#d94f81]"
                onClick={() => {
                  onRemove(pendingRemovalItem.id);
                  setPendingRemovalId(null);
                }}
              >
                {c.removeActionButton}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    >
      <div className="clean-scrollbar h-full overflow-y-auto px-5 pt-5 pb-7">
        <div className="mb-3 rounded-[12px] border border-[#d9e6ff] bg-[#f5f9ff] px-3 py-2 text-[10px] text-[#42608f]">
          {c.intro}
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2">
          <SummaryChip label={c.createdLabel} value={String(analytics.created)} />
          <SummaryChip label={c.completedLabel} value={String(analytics.done + analytics.delegated)} />
          <SummaryChip label={c.completionRateLabel} value={`${completionRate}%`} />
        </div>

        {items.length === 0 ? (
          foundationEmpty && onOpenScreen ? (
            <NoAppDataGuide copy={copy} onOpenScreen={onOpenScreen} />
          ) : (
            <div className="rounded-[16px] border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
              <p className="text-[13px] font-semibold text-slate-800">{c.emptyTitle}</p>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">{c.emptyBody}</p>
            </div>
          )
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const isFocused = focusedItemId === item.id;
              return (
              <article
                key={item.id}
                onMouseEnter={() => setFocusedItemId(item.id)}
                onMouseLeave={() => setFocusedItemId(null)}
                className={[
                  'rounded-[16px] border bg-white px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-200',
                  isFocused
                    ? 'scale-[1.01] border-[#dd83a8] ring-2 ring-[#f6dbe5] shadow-[0_8px_24px_rgba(221,131,168,0.16)]'
                    : 'border-slate-200',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={["rounded-full border px-1.5 py-0.5 text-[9px] font-semibold", riskBadgeClass(item.riskLevel)].join(' ')}>
                      {item.riskLevel === 'high' ? c.highRisk : item.riskLevel === 'medium' ? c.mediumRisk : c.lowRisk}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                      {c.priorityLabel}: {item.priority}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#f1c9d8] bg-[#fff1f6] text-[13px] font-semibold leading-none text-[#c45d86] transition hover:border-[#e7aac2] hover:bg-[#fde9f2] hover:text-[#b44f77]"
                    onClick={() => setPendingRemovalId(item.id)}
                    aria-label={c.removeActionButton}
                  >
                    -
                  </button>
                </div>

                <p className="mt-2 text-[13px] font-semibold leading-5 text-slate-900">{item.title}</p>
                <p className="mt-1.5 text-[11px] leading-5 text-slate-600">{item.body}</p>
                <p className="mt-1 text-[10px] text-slate-400">{item.followUp}</p>

                <div className="mt-2.5 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    className="cursor-pointer rounded-full bg-[#E85C8B] px-3 py-1 text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(232,92,139,0.2)] transition hover:bg-[#d94f81] active:scale-[0.97]"
                    onClick={() => {
                      void onDoNow(item);
                    }}
                  >
                    {c.doNow}
                  </button>
                </div>
              </article>
            );
            })}
          </div>
        )}
      </div>
    </MiniScreenFrame>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[11px] border border-slate-200 bg-white px-2.5 py-2 text-center">
      <p className="text-[9px] uppercase tracking-[0.06em] text-slate-400">{label}</p>
      <p className="mt-0.5 text-[12px] font-semibold text-slate-700">{value}</p>
    </div>
  );
}
