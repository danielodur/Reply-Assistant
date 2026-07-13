import { useState } from 'react';
import type { AppTranslations } from '../../i18n/translations';
import type { BasedOnDetail, BasedOnDetailGroup } from '../workbench/buildReplyBasedOnLines';

type WhyThisReplyExpanderProps = {
  copy: AppTranslations;
  details: BasedOnDetail[];
  /** Show the toggle in the modal header (passed already-rendered when collapsed). */
  className?: string;
};

const GROUP_LABEL: Record<BasedOnDetailGroup, keyof AppTranslations['floating']> = {
  'latest-message': 'whyDetailLatestMessage',
  'relationship-memory': 'whyDetailRelationshipMemory',
  'business-context': 'whyDetailBusinessContext',
  'your-input': 'whyDetailYourInput',
  'recent-timeline': 'whyDetailRecentTimeline',
  attachments: 'whyDetailAttachments',
};

/**
 * Tap-to-expand "Based on" details. Collapsed by default; expands to show
 * the full untruncated bullets per group so the user can audit the model.
 */
export default function WhyThisReplyExpander({ copy, details, className = '' }: WhyThisReplyExpanderProps) {
  const [open, setOpen] = useState(false);
  const hasDetails = details.length > 0;

  return (
    <div className={['mt-1', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 transition hover:text-[#c15480]"
      >
        {open ? copy.floating.whyCollapseLabel : copy.floating.whyExpandLabel}
      </button>

      {open ? (
        <div className="mt-1.5 max-h-[180px] overflow-y-auto rounded-[10px] border border-slate-100 bg-white px-2.5 py-1.5">
          {hasDetails ? (
            <ul className="space-y-1.5">
              {details.map((group, index) => (
                <li key={`${group.group}-${index}`}>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#b85d83]">
                    {copy.floating[GROUP_LABEL[group.group]]}
                  </p>
                  <ul className="mt-0.5 space-y-0.5 text-[10px] leading-snug text-slate-600">
                    {group.bullets.map((bullet, bulletIndex) => (
                      <li key={`bullet-${index}-${bulletIndex}`} className="flex gap-1.5">
                        <span className="shrink-0 text-slate-300 select-none" aria-hidden>–</span>
                        <span className="min-w-0 break-words">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[10px] leading-snug text-slate-500">
              {copy.floating.whyDetailNothingGrounded}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
