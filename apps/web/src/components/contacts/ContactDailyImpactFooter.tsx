import type { AppTranslations } from '../../i18n/translations';

type ContactDailyImpactFooterProps = {
  copy: AppTranslations;
  done: number;
  snoozed: number;
};

export default function ContactDailyImpactFooter({ copy, done, snoozed }: ContactDailyImpactFooterProps) {
  if (done + snoozed === 0) return null;

  return (
    <div className="mt-2 rounded-[10px] border border-slate-200 bg-white px-3 py-1.5 text-[10px] text-slate-600">
      {copy.contactThreads.dailyImpactFooter
        .replace('{done}', String(done))
        .replace('{snoozed}', String(snoozed))}
    </div>
  );
}
