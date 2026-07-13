import { interpolate, type AppTranslations } from '../../i18n/translations';
import { contactActionStyles } from './contactActionStyles';

type ContactPriorityStripProps = {
  copy: AppTranslations;
  needsAttentionCount: number;
  overdueCount: number;
  onReviewNow: () => void;
  reviewDisabled?: boolean;
};

export default function ContactPriorityStrip({
  copy,
  needsAttentionCount,
  overdueCount,
  onReviewNow,
  reviewDisabled = false,
}: ContactPriorityStripProps) {
  return (
    <div className="rounded-[12px] border border-[#ecd6e0] bg-[#fff7fa] px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-[#a54b72]">{copy.contactThreads.priorityStripTitle}</p>
          <p className="mt-0.5 text-[10px] text-[#7d4f64]">
            {interpolate(copy.contactThreads.priorityStripBody, {
              needs: String(needsAttentionCount),
              overdue: String(overdueCount),
            })}
          </p>
        </div>

        <button
          type="button"
          className={[
            'shrink-0',
            contactActionStyles.primary,
            contactActionStyles.primaryDisabled,
          ].join(' ')}
          onClick={onReviewNow}
          disabled={reviewDisabled}
        >
          {copy.contactThreads.priorityStripReviewAction}
        </button>
      </div>
    </div>
  );
}
