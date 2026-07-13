import { useEffect, useMemo, useState } from 'react';
import MiniScreenFrame from './MiniScreenFrame';
import type { AppTranslations } from '../i18n/translations';
import { loadContactThreads } from '../config/contactThreads';
import {
  RESET_DATA_DOMAINS,
  type ResetDataDomain,
  onDataReset,
  resetAppData,
} from '../config/resetAppData';
import NoAppDataGuide from './guidance/NoAppDataGuide';
import { isAppFoundationEmpty } from '../lib/isAppFoundationEmpty';
import type { MiniScreenId } from './workbench/types';

type ResetDataProps = {
  onClose: () => void;
  copy: AppTranslations;
  foundationEmpty?: boolean;
  onOpenScreen?: (screenId: MiniScreenId) => void;
};

function domainCopy(copy: AppTranslations, domain: ResetDataDomain) {
  return copy.resetData.domains[domain];
}

export default function ResetData({
  onClose,
  copy,
  foundationEmpty: foundationEmptyProp,
  onOpenScreen,
}: ResetDataProps) {
  const rd = copy.resetData;
  const [foundationEmpty, setFoundationEmpty] = useState(() => (
    foundationEmptyProp ?? isAppFoundationEmpty(loadContactThreads())
  ));
  const [selected, setSelected] = useState<Set<ResetDataDomain>>(() => new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (foundationEmptyProp !== undefined) {
      setFoundationEmpty(foundationEmptyProp);
    }
  }, [foundationEmptyProp]);

  useEffect(() => {
    return onDataReset(() => {
      setFoundationEmpty(isAppFoundationEmpty(loadContactThreads()));
    });
  }, []);

  const showSetupGuide = foundationEmpty && Boolean(onOpenScreen);

  const selectedList = useMemo(
    () => RESET_DATA_DOMAINS.filter(domain => selected.has(domain)),
    [selected],
  );

  useEffect(() => {
    if (!confirmOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setConfirmOpen(false);
        setAcknowledged(false);
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [confirmOpen]);

  const toggleDomain = (domain: ResetDataDomain) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(RESET_DATA_DOMAINS));
  };

  const clearSelection = () => {
    setSelected(new Set());
  };

  const handleConfirmReset = () => {
    if (!selectedList.length || !acknowledged) return;
    resetAppData(selectedList);
    setConfirmOpen(false);
    setAcknowledged(false);
    setSelected(new Set());
    onClose();
  };

  return (
    <MiniScreenFrame
      label={rd.frameLabel}
      title={rd.frameTitle}
      onClose={onClose}
      backLabel={copy.miniScreen.back}
      contentClassName="bg-[#fcfcfd]"
      contentOverlay={confirmOpen ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a]/32 px-3 backdrop-blur-[3px]">
          <section
            role="alertdialog"
            aria-labelledby="reset-data-confirm-title"
            className="upload-removal-warning w-full max-w-[300px] rounded-[18px] border border-[#f1d5e1] bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-[linear-gradient(180deg,#f7b8d0,#e85c8b)] text-white shadow-[0_10px_24px_rgba(232,92,139,0.28)]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                <path
                  d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <p id="reset-data-confirm-title" className="mt-3 text-center text-[13px] font-semibold text-slate-900">
              {rd.confirmTitle}
            </p>
            <p className="mt-1.5 text-center text-[11px] leading-5 text-slate-600">{rd.confirmBody}</p>

            <ul className="mt-3 space-y-1 rounded-[12px] border border-[#f4d7e1] bg-[#fff8fb] px-3 py-2">
              {selectedList.map(domain => (
                <li key={domain} className="text-[10px] font-medium text-[#9e5b77]">
                  • {domainCopy(copy, domain).title}
                </li>
              ))}
            </ul>

            <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-[10px] border border-[#edd7e0] bg-white px-2.5 py-2">
              <input
                type="checkbox"
                className="mt-0.5 h-3.5 w-3.5 rounded border-[#e7aac2] text-[#e85c8b] focus:ring-[#e7aac2]"
                checked={acknowledged}
                onChange={event => setAcknowledged(event.target.checked)}
              />
              <span className="text-[10px] leading-4 text-slate-600">{rd.confirmAcknowledge}</span>
            </label>

            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                className="rounded-full border border-[#edd7e0] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#b54e77] transition hover:border-[#e7aac2] hover:bg-[#fff5f9]"
                onClick={() => {
                  setConfirmOpen(false);
                  setAcknowledged(false);
                }}
              >
                {copy.settings.cancel}
              </button>
              <button
                type="button"
                disabled={!acknowledged}
                className="rounded-full bg-[#E85C8B] px-3 py-1.5 text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(232,92,139,0.24)] transition hover:bg-[#d94f81] disabled:cursor-not-allowed disabled:bg-[#f0b8cc] disabled:shadow-none"
                onClick={handleConfirmReset}
              >
                {rd.confirmAction}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    >
      <div className="clean-scrollbar h-full overflow-y-auto px-5 pt-5 pb-7">
        {showSetupGuide ? (
          <NoAppDataGuide copy={copy} onOpenScreen={onOpenScreen!} />
        ) : (
          <>
        <div className="mb-4 rounded-[12px] border border-[#f1d7e1] bg-[#fff6fa] px-3 py-2 text-[10px] leading-4 text-[#9e5b77]">
          {rd.intro}
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-[#edd7e0] bg-white px-3 py-1 text-[10px] font-semibold text-[#b54e77] transition hover:border-[#e7aac2] hover:bg-[#fff5f9]"
            onClick={selectAll}
          >
            {rd.selectAll}
          </button>
          {selectedList.length > 0 ? (
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              onClick={clearSelection}
            >
              {rd.clearSelection}
            </button>
          ) : null}
        </div>

        <div className="space-y-2.5">
          {RESET_DATA_DOMAINS.map(domain => {
            const item = domainCopy(copy, domain);
            const isSelected = selected.has(domain);
            return (
              <label
                key={domain}
                className={[
                  'flex cursor-pointer items-start gap-3 rounded-[14px] border bg-white px-3.5 py-3 transition',
                  isSelected
                    ? 'border-[#dd83a8] ring-2 ring-[#f6dbe5] shadow-[0_8px_24px_rgba(221,131,168,0.12)]'
                    : 'border-slate-200 hover:border-[#eadbd4]',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-[#e7aac2] text-[#e85c8b] focus:ring-[#e7aac2]"
                  checked={isSelected}
                  onChange={() => toggleDomain(domain)}
                />
                <span className="min-w-0">
                  <span className="block text-[12px] font-semibold text-slate-900">{item.title}</span>
                  <span className="mt-0.5 block text-[10px] leading-4 text-slate-500">{item.description}</span>
                </span>
              </label>
            );
          })}
        </div>

        <div className="mt-4 rounded-[12px] border border-[#eadbd4] bg-[#fff8f4] px-3 py-2 text-[9px] leading-4 text-[#8b5b47]">
          {rd.keepNote}
        </div>

        <button
          type="button"
          disabled={selectedList.length === 0}
          className="mt-4 w-full rounded-[13px] bg-[#e8558a] py-2.5 text-[12px] font-semibold text-white shadow-[0_4px_16px_rgba(232,85,138,0.28)] transition hover:bg-[#d44d80] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#f0b8cc] disabled:text-white/85 disabled:shadow-none disabled:active:scale-100"
          onClick={() => {
            setAcknowledged(false);
            setConfirmOpen(true);
          }}
        >
          {rd.reviewReset}
        </button>
          </>
        )}
      </div>
    </MiniScreenFrame>
  );
}
