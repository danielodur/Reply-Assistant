import type { AppTranslations } from '../../i18n/translations';
import { interpolate } from '../../i18n/translations';

type LanguageRecommendationChipProps = {
  copy: AppTranslations;
  recommendedLanguage: 'en' | 'zh';
  visible: boolean;
  onApply: () => void;
  compactMode?: boolean;
};

function recommendedLabel(language: 'en' | 'zh', copy: AppTranslations): string {
  return language === 'en' ? copy.floating.replyInEn : copy.floating.replyInZh;
}

/**
 * Small inline chip that appears between the Language dropdown and the rest of
 * the header when our cross-language layer thinks the user should be replying
 * in a different language than the one currently selected. One tap applies it.
 *
 * Renders nothing when `visible` is false so it never adds chrome to the calm
 * empty state.
 */
export default function LanguageRecommendationChip({
  copy,
  recommendedLanguage,
  visible,
  onApply,
  compactMode = false,
}: LanguageRecommendationChipProps) {
  if (!visible) return null;

  const label = recommendedLabel(recommendedLanguage, copy);

  return (
    <button
      type="button"
      onClick={onApply}
      title={interpolate(copy.floating.languageRecommendApply, { label })}
      aria-label={interpolate(copy.floating.languageRecommendApply, { label })}
      className={[
        'group inline-flex shrink-0 items-center gap-1 rounded-full border border-[#f1c4d6] bg-[#fff7fa] font-semibold text-[#b85a82] transition hover:border-[#e7aac2] hover:bg-[#fde7ef]',
        compactMode ? 'h-7 px-2 text-[9px]' : 'h-8 px-2.5 text-[10px]',
      ].join(' ')}
    >
      <span className="text-[10px] leading-none">↺</span>
      <span className="leading-none">{label}</span>
    </button>
  );
}
