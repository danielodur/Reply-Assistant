import ToneSparkleIcon, { toneSparkleButtonClassName } from './ToneSparkleIcon';

type ToneSparkleButtonProps = {
  compactMode: boolean;
  ariaLabel: string;
  onClick: () => void;
};

export default function ToneSparkleButton({ compactMode, ariaLabel, onClick }: ToneSparkleButtonProps) {
  return (
    <button
      type="button"
      className={toneSparkleButtonClassName(compactMode)}
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={onClick}
    >
      <ToneSparkleIcon className={compactMode ? 'h-[19px] w-[19px]' : 'h-[20px] w-[20px]'} />
    </button>
  );
}
