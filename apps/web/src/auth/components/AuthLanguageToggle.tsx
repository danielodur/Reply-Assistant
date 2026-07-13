import { desktopNoDragStyle } from '../../components/DesktopWindowDragRegion';
import type { ResolvedLanguage } from '../../i18n/translations';

type AuthLanguageToggleProps = {
  currentLanguage: ResolvedLanguage;
  onToggle: () => void;
};

export default function AuthLanguageToggle({
  currentLanguage,
  onToggle,
}: AuthLanguageToggleProps) {
  const label = currentLanguage === 'zh' ? 'En' : '中文';

  return (
    <button
      type="button"
      className="absolute left-4 top-4 rounded-full border border-[#edd7e0] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#b04a70] transition hover:border-[#e88ab0] hover:text-[#9a3d62]"
      aria-label={currentLanguage === 'zh' ? 'Switch to English' : '切换到中文'}
      onClick={onToggle}
      style={desktopNoDragStyle()}
    >
      {label}
    </button>
  );
}
