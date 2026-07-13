import { desktopNoDragStyle } from '../DesktopWindowDragRegion';
import {
  draftLanguageToggleAriaLabel,
  draftLanguageToggleLabel,
  type DraftLanguage,
} from './draftLanguageToggle';

type GeneratedReplyLanguageToggleProps = {
  displayLanguage: DraftLanguage;
  onToggle: () => void;
  disabled?: boolean;
};

/**
 * Matches AuthLanguageToggle styling — compact pill that shows the language
 * you will switch *to* (En when viewing 中文, 中文 when viewing English).
 */
export default function GeneratedReplyLanguageToggle({
  displayLanguage,
  onToggle,
  disabled = false,
}: GeneratedReplyLanguageToggleProps) {
  const label = draftLanguageToggleLabel(displayLanguage);

  return (
    <button
      type="button"
      disabled={disabled}
      className="absolute right-2 top-2 z-20 rounded-full border border-[#edd7e0] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#b04a70] transition hover:border-[#e88ab0] hover:text-[#9a3d62] disabled:cursor-not-allowed disabled:opacity-60"
      aria-label={draftLanguageToggleAriaLabel(displayLanguage)}
      onPointerDown={event => event.stopPropagation()}
      onClick={event => {
        event.stopPropagation();
        onToggle();
      }}
      style={desktopNoDragStyle()}
    >
      {label}
    </button>
  );
}
