import { useRef, useState } from 'react';
import type { UploadContextSummary } from '../../uploads/uploadTypes';
import LastLearningFileRemovalDialog, { type LastLearningFileRemovalCopy } from './LastLearningFileRemovalDialog';

const ACCEPTED = 'image/*,.csv,.xlsx,.pdf,.docx,.pptx';

type CompactUploadRowProps = {
  title: string;
  hint: string;
  attachLabel: string;
  limitReachedLabel: string;
  removalDialogCopy: LastLearningFileRemovalCopy;
  uploads: UploadContextSummary[];
  maxFiles: number;
  processing?: boolean;
  error?: string;
  onAttach: (files: FileList) => void;
  onRemove: (id: string) => void;
};

export default function CompactUploadRow({
  title,
  hint,
  attachLabel,
  limitReachedLabel,
  removalDialogCopy,
  uploads,
  maxFiles,
  processing = false,
  error = '',
  onAttach,
  onRemove,
}: CompactUploadRowProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUpload, setPreviewUpload] = useState<UploadContextSummary | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<UploadContextSummary | null>(null);
  const atLimit = uploads.length >= maxFiles;

  const completeRemoval = (upload: UploadContextSummary) => {
    onRemove(upload.id);
    if (previewUpload?.id === upload.id) {
      setPreviewUpload(null);
    }
    setPendingRemoval(null);
  };

  const handleRemove = (upload: UploadContextSummary) => {
    if (uploads.length === 1) {
      setPendingRemoval(upload);
      return;
    }
    completeRemoval(upload);
  };

  return (
    <>
      <section className="rounded-[12px] border border-slate-200 bg-white px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="truncate text-[11px] font-semibold text-slate-800">{title}</p>
              {uploads.length > 0 ? (
                <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold leading-none text-slate-500">
                  {uploads.length}/{maxFiles}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 line-clamp-2 text-[9px] leading-3 text-slate-400">{hint}</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={ACCEPTED}
            multiple
            onChange={event => {
              if (event.currentTarget.files) onAttach(event.currentTarget.files);
              event.currentTarget.value = '';
            }}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {uploads.map(upload => (
            <span
              key={upload.id}
              className="group relative inline-flex max-w-[138px] items-center rounded-full border border-slate-200 bg-slate-50 text-[9px] font-medium text-slate-500 transition hover:border-[#dfc9bd] hover:bg-white"
            >
              <button
                type="button"
                className="flex min-w-0 items-center gap-1.5 px-1.5 py-1 pr-2"
                onClick={() => setPreviewUpload(upload)}
                title={upload.filename}
              >
                <span className="flex h-[18px] min-w-6 items-center justify-center rounded-[5px] bg-slate-200/70 text-[7px] font-bold text-slate-500">
                  {(upload.extension || 'DOC').slice(0, 3).toUpperCase()}
                </span>
                <span className="truncate">{upload.filename}</span>
              </button>
              <button
                type="button"
                className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-[#2f2926] text-[10px] leading-none text-white shadow-sm group-hover:flex"
                onClick={() => handleRemove(upload)}
                aria-label={`Remove ${upload.filename}`}
              >
                x
              </button>
            </span>
          ))}
          {!atLimit ? (
            <button
              type="button"
              disabled={processing}
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#eadbd4] bg-white text-[14px] font-semibold leading-none text-[#8b5b47] transition hover:border-[#d7b7a7] hover:bg-[#fff8f4] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => inputRef.current?.click()}
              title={attachLabel}
              aria-label={attachLabel}
            >
              +
            </button>
          ) : null}
        </div>
        {error ? <p className="mt-1 text-[9px] text-rose-500">{error}</p> : null}
      </section>

      {previewUpload ? (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-[#0f172a]/25 px-4 backdrop-blur-[2px]">
          <section className="w-full max-w-[330px] rounded-[18px] border border-[#eadbd4] bg-white p-3 shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9c735c]">
                  {(previewUpload.extension || previewUpload.mimeType || 'file').toUpperCase()}
                </p>
                <p className="mt-0.5 truncate text-[13px] font-semibold text-slate-900">{previewUpload.filename}</p>
              </div>
              <button
                type="button"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[15px] leading-none text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                aria-label="Close"
                onClick={() => setPreviewUpload(null)}
              >
                x
              </button>
            </div>

            <div className="mt-3 space-y-2 text-[10px] leading-4 text-slate-600">
              <p><span className="font-semibold text-slate-800">Status:</span> {previewUpload.status}</p>
              <p><span className="font-semibold text-slate-800">Confidence:</span> {Math.round(previewUpload.confidence * 100)}%</p>
              {previewUpload.summary ? (
                <p><span className="font-semibold text-slate-800">Summary:</span> {previewUpload.summary}</p>
              ) : null}
              {previewUpload.extractedText ? (
                <p className="clean-scrollbar max-h-28 overflow-y-auto rounded-[10px] bg-slate-50 p-2">
                  {previewUpload.extractedText}
                </p>
              ) : null}
              {previewUpload.warnings?.length ? (
                <p className="text-amber-700">{previewUpload.warnings.join(' ')}</p>
              ) : null}
              {!previewUpload.summary && !previewUpload.extractedText ? (
                <p className="text-slate-500">No readable text was found yet. The app will not guess from this file.</p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {pendingRemoval ? (
        <LastLearningFileRemovalDialog
          filename={pendingRemoval.filename}
          copy={removalDialogCopy}
          onKeep={() => setPendingRemoval(null)}
          onRemove={() => completeRemoval(pendingRemoval)}
        />
      ) : null}
    </>
  );
}
