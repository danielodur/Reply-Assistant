import type { AppTranslations } from '../../i18n/translations';
import FaqAccordion from './FaqAccordion';
import SupportRequestForm from './SupportRequestForm';

type HelpCenterScreenProps = {
  copy: AppTranslations;
};

export default function HelpCenterScreen({ copy }: HelpCenterScreenProps) {
  const cs = copy.customerService;

  return (
    <div className="clean-scrollbar flex h-full flex-col overflow-y-auto px-5 py-5">
      <div className="rounded-[16px] border border-[#dbe7ff] bg-[#f7fbff] px-4 py-3">
        <p className="text-[12px] font-semibold text-slate-900">{cs.cardTitle}</p>
        <p className="mt-1 text-[11px] leading-5 text-slate-600">{cs.cardBody}</p>
      </div>

      <div className="mt-5">
        <FaqAccordion copy={cs} />
      </div>

      <div className="my-6 border-t border-slate-200" />

      <SupportRequestForm copy={copy} />
    </div>
  );
}
