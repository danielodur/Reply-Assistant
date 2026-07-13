import type { UploadContextSummary } from '../../uploads/uploadTypes';

type AttachmentReviewListProps = {
  uploads: UploadContextSummary[];
  onRemove: (id: string) => void;
};

export default function AttachmentReviewList({ uploads, onRemove }: AttachmentReviewListProps) {
  if (!uploads.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {uploads.map(upload => (
        <span key={upload.id} className="inline-flex max-w-[120px] items-center gap-1 rounded-full border border-[#eadbd4] bg-white px-2 py-1 text-[9px] font-semibold text-slate-500">
          <span className="truncate">{upload.extension || upload.filename}</span>
          <button
            type="button"
            className="text-slate-400 hover:text-[#c15480]"
            onClick={() => onRemove(upload.id)}
            aria-label={`Remove ${upload.filename}`}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
