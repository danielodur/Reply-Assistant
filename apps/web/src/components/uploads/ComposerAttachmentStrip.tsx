import { useRef, useState } from 'react';
import type { UploadContextSummary } from '../../uploads/uploadTypes';
import { COMPOSER_UPLOAD_LIMIT } from '../../uploads/uploadValidation';

const ACCEPTED = 'image/*,.csv,.xlsx,.pdf,.docx,.pptx';

type ComposerAttachmentStripProps = {
  uploads: UploadContextSummary[];
  processing: boolean;
  attachLabel: string;
  limitReachedLabel: string;
  onAttach: (files: FileList) => void;
  onRemove: (id: string) => void;
};

function typeLabel(upload: UploadContextSummary): string {
  return (upload.extension || upload.mimeType || 'file').replace(/^\./, '').toUpperCase();
}

function iconLabel(upload: UploadContextSummary): string {
  const ext = upload.extension.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tif', 'tiff', 'heic', 'heif'].includes(ext)) return 'IMG';
  if (['csv', 'xlsx'].includes(ext)) return 'XLS';
  if (ext === 'pdf') return 'PDF';
  if (ext === 'pptx') return 'PPT';
  if (ext === 'docx') return 'DOC';
  return 'DOC';
}

function compactName(filename: string): string {
  const clean = filename.trim();
  if (clean.length <= 20) return clean;
  const dot = clean.lastIndexOf('.');
  const ext = dot > 0 ? clean.slice(dot) : '';
  return `${clean.slice(0, Math.max(8, 18 - ext.length))}...${ext}`;
}

export default function ComposerAttachmentStrip({
  uploads,
  processing,
  attachLabel,
  limitReachedLabel,
  onAttach,
  onRemove,
}: ComposerAttachmentStripProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUpload, setPreviewUpload] = useState<UploadContextSummary | null>(null);
  const atLimit = uploads.length >= COMPOSER_UPLOAD_LIMIT;

  return (
    <>
      <div className="clean-scrollbar absolute bottom-3 left-3 right-[6.7rem] z-20 flex min-w-0 items-center gap-1.5 overflow-x-auto pb-0.5">
        {uploads.map(upload => (
          <span
            key={upload.id}
            className="group relative inline-flex h-7 max-w-[7.6rem] shrink-0 items-center rounded-full border border-[#eadbd4] bg-white text-[9px] font-semibold text-slate-600 shadow-sm transition hover:border-[#d7b7a7] hover:bg-[#fff8f4]"
          >
            <button
              type="button"
              className="flex min-w-0 items-center gap-1.5 px-1.5 pr-2"
              onClick={() => setPreviewUpload(upload)}
              title={upload.filename}
            >
              <span className="flex h-[18px] min-w-7 items-center justify-center rounded-[5px] bg-slate-100 px-1 text-[7px] font-bold leading-none text-slate-500">
                {iconLabel(upload)}
              </span>
              <span className="truncate">{compactName(upload.filename)}</span>
            </button>
            <button
              type="button"
              className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-[#2f2926] text-[10px] leading-none text-white shadow-sm group-hover:flex"
              aria-label={`Remove ${upload.filename}`}
              onClick={event => {
                event.stopPropagation();
                onRemove(upload.id);
              }}
            >
              x
            </button>
          </span>
        ))}

        {!atLimit ? (
          <button
            type="button"
            disabled={processing}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#eadbd4] bg-white text-[15px] font-semibold leading-none text-[#9f5c43] shadow-sm transition hover:border-[#d7b7a7] hover:bg-[#fff8f4] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => inputRef.current?.click()}
            title={attachLabel}
            aria-label={attachLabel}
          >
            +
          </button>
        ) : null}
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

      {previewUpload ? (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-[#0f172a]/20 px-3 backdrop-blur-[2px]">
          <section className="w-full max-w-[330px] rounded-[18px] border border-[#eadbd4] bg-white p-3 shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9c735c]">{typeLabel(previewUpload)}</p>
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

            {previewUpload.localPreviewUrl ? (
              <img
                src={previewUpload.localPreviewUrl}
                alt={previewUpload.filename}
                className="mt-3 max-h-40 w-full rounded-[12px] border border-slate-200 object-contain"
              />
            ) : null}

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

      {atLimit ? (
        <span className="sr-only">{limitReachedLabel}</span>
      ) : null}
    </>
  );
}
