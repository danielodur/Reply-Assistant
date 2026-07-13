import { desktopNoDragStyle } from '../../components/DesktopWindowDragRegion';

type AuthHelpButtonProps = {
  label: string;
  onClick: () => void;
};

function HeadphoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path
        d="M4 14v-2a8 8 0 0116 0v2M4 14a2 2 0 002 2h1v-5H5a1 1 0 00-1 1v2zm16 0a2 2 0 01-2 2h-1v-5h2a1 1 0 011 1v2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AuthHelpButton({ label, onClick }: AuthHelpButtonProps) {
  return (
    <button
      type="button"
      className="absolute right-4 top-4 inline-flex items-center gap-1 text-[10px] font-medium text-[#b04a70] transition hover:text-[#9a3d62]"
      onClick={onClick}
      style={desktopNoDragStyle()}
    >
      <HeadphoneIcon />
      <span>{label}</span>
    </button>
  );
}
