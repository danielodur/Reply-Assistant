import MiniScreenFrame from './MiniScreenFrame';
import HelpCenterScreen from './help-center/HelpCenterScreen';
import type { AppTranslations } from '../i18n/translations';

type CustomerServiceProps = {
  onClose: () => void;
  copy: AppTranslations;
};

export default function CustomerService({ onClose, copy }: CustomerServiceProps) {
  return (
    <MiniScreenFrame
      label={copy.customerService.frameLabel}
      title={copy.customerService.frameTitle}
      onClose={onClose}
      backLabel={copy.miniScreen.back}
      contentClassName="flex flex-col bg-[#fcfcfd]"
      contentScrollable={false}
    >
      <HelpCenterScreen copy={copy} />
    </MiniScreenFrame>
  );
}
