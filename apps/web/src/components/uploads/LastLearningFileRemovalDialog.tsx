import { useEffect } from 'react';

export type LastLearningFileRemovalCopy = {
  title: string;
  body: string;
  confirm: string;
  keep: string;
  remove: string;
  cancel: string;
};

type LastLearningFileRemovalDialogProps = {
  filename: string;
  copy: LastLearningFileRemovalCopy;
  onKeep: () => void;
  onRemove: () => void;
};

export default function LastLearningFileRemovalDialog({
  filename,
  copy,
  onKeep,
  onRemove,
}: LastLearningFileRemovalDialogProps) {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onKeep();
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onKeep]);

  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center bg-[#0f172a]/32 px-4 backdrop-blur-[3px]">
      <section
        role="alertdialog"
        aria-labelledby="last-learning-file-removal-title"
        aria-describedby="last-learning-file-removal-body"
        className="upload-removal-warning w-full max-w-[300px] rounded-[18px] border border-[#f1d5e1] bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-[linear-gradient(180deg,#f7b8d0,#e85c8b)] text-white shadow-[0_10px_24px_rgba(232,92,139,0.28)]">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
            <path
              d="M8 4h8l1 2h3v2H4V6h3l1-2zm1 8h2v5h-2v-5zm0-3h2v2h-2V9z"
              fill="currentColor"
            />
            <path
              d="M6 8h12v11a2 2 0 01-2 2H8a2 2 0 01-2-2V8z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p id="last-learning-file-removal-title" className="mt-3 text-center text-[13px] font-semibold text-slate-900">
          {copy.title}
        </p>
        <p id="last-learning-file-removal-body" className="mt-1.5 text-center text-[11px] leading-5 text-slate-600">
          {copy.body}
        </p>
        <p className="mt-1 text-center text-[10px] font-medium text-[#b04f78]">{filename}</p>
        <p className="mt-2 text-center text-[10px] font-semibold text-[#9e5b77]">{copy.confirm}</p>

        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            className="rounded-full border border-[#edd7e0] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#b54e77] transition hover:border-[#e7aac2] hover:bg-[#fff5f9]"
            onClick={onKeep}
          >
            {copy.keep}
          </button>
          <button
            type="button"
            className="rounded-full bg-[#E85C8B] px-3 py-1.5 text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(232,92,139,0.24)] transition hover:bg-[#d94f81]"
            onClick={onRemove}
          >
            {copy.remove}
          </button>
        </div>

        <button
          type="button"
          className="mt-2 w-full text-center text-[9px] font-medium text-slate-400 transition hover:text-slate-600"
          onClick={onKeep}
        >
          {copy.cancel}
        </button>
      </section>
    </div>
  );
}
