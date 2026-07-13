import type { ContactThread } from '../../config/contactThreads';
import type { AppTranslations } from '../../i18n/translations';
import type { ContactPriority } from './contactPriority';
import { contactActionStyles } from './contactActionStyles';

type MorningFocusItem = {
  thread: ContactThread;
  priority: ContactPriority;
};

type ContactMorningFocusProps = {
  copy: AppTranslations;
  items: MorningFocusItem[];
  totalMinutes: number;
  onUseContact: (contactId: string) => void;
  onMarkDone: (contactId: string) => void;
  onSnooze: (contactId: string) => void;
};

export default function ContactMorningFocus({
  copy,
  items,
  totalMinutes,
  onUseContact,
  onMarkDone,
  onSnooze,
}: ContactMorningFocusProps) {
  if (!items.length) return null;

  return (
    <section className="rounded-[12px] border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-slate-800">{copy.contactThreads.morningFocusTitle}</p>
        <span className="text-[10px] text-slate-500">
          {copy.contactThreads.morningFocusEta.replace('{minutes}', String(totalMinutes))}
        </span>
      </div>

      <div className="mt-2 space-y-1.5">
        {items.map(({ thread, priority }) => (
          <div
            key={thread.id}
            className="rounded-[10px] border border-slate-200 bg-slate-50 px-2.5 py-2"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[10px] font-semibold text-slate-800">{thread.name}</p>
              <span className="text-[9px] text-slate-500">
                {priority.level === 'action-now'
                  ? copy.contactThreads.priorityRiskActionNow
                  : priority.level === 'due-today'
                    ? copy.contactThreads.priorityRiskDueToday
                    : copy.contactThreads.priorityRiskWatchlist}
              </span>
            </div>

            <div className="mt-1.5 flex items-center justify-end gap-1.5">
              <button
                type="button"
                className={contactActionStyles.secondary}
                onClick={() => onSnooze(thread.id)}
              >
                {copy.contactThreads.snoozeUntilTomorrow}
              </button>
              <button
                type="button"
                className={contactActionStyles.success}
                onClick={() => onMarkDone(thread.id)}
              >
                {copy.contactThreads.markDoneAction}
              </button>
              <button
                type="button"
                className={contactActionStyles.primary}
                onClick={() => onUseContact(thread.id)}
              >
                {copy.contactThreads.useContactActionShort}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
