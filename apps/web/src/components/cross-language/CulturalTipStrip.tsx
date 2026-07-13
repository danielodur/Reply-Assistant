import type { AppTranslations } from '../../i18n/translations';
import type { CulturalTipKey } from './culturalTip';

type CulturalTipStripProps = {
  copy: AppTranslations;
  tipKey: CulturalTipKey | null;
  className?: string;
};

const TIP_LOOKUP: Record<CulturalTipKey, keyof AppTranslations['floating']> = {
  'zh-to-en-prospect': 'culturalTipZhToEnProspect',
  'zh-to-en-vip': 'culturalTipZhToEnVip',
  'zh-to-en-default': 'culturalTipZhToEnDefault',
  'en-to-zh-default': 'culturalTipEnToZhDefault',
  'en-to-zh-leader': 'culturalTipEnToZhLeader',
  'mixed-clarity': 'culturalTipMixedClarity',
  'polish-english': 'culturalTipPolishEnglish',
};

/**
 * Calm advisory band rendered above the generated reply when the cross-language
 * rule engine has something useful to say. Renders nothing when `tipKey` is null.
 */
export default function CulturalTipStrip({ copy, tipKey, className = '' }: CulturalTipStripProps) {
  if (!tipKey) return null;
  const lookupKey = TIP_LOOKUP[tipKey];
  const tipText = copy.floating[lookupKey];
  if (!tipText) return null;

  return (
    <aside
      role="note"
      className={[
        'mt-2 rounded-[10px] border border-[#dde9f6] bg-[#f5f9ff] px-2.5 py-1.5',
        className,
      ].filter(Boolean).join(' ')}
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#5b7ea6]">
        {copy.floating.culturalTipEyebrow}
      </p>
      <p className="mt-1 text-[10px] leading-snug text-slate-600">
        {tipText}
      </p>
    </aside>
  );
}
