import type { AppTranslations } from '../../i18n/translations';
import type { ToneProfileData } from './toneProfiles';
import type { TonePreset } from './types';
import ToneComposer from './ToneComposer';
import ToneSparkleIcon, { toneSparkleButtonClassName } from './ToneSparkleIcon';

type ToneControlKey = 'formality' | 'warmth' | 'urgency';

type ToneComposeModalProps = {
  open: boolean;
  copy: AppTranslations;
  compactMode: boolean;
  activeTonePreset: TonePreset;
  formality: number;
  warmth: number;
  urgency: number;
  showSaveProfile: boolean;
  savedProfiles: ToneProfileData[];
  onClose: () => void;
  onSelectPreset: (preset: Exclude<TonePreset, null>) => void;
  onChangeControl: (key: ToneControlKey, value: number) => void;
  onSaveProfile: () => void;
  onLoadProfile: (profile: ToneProfileData) => void;
  onDeleteProfile: (id: string) => void;
};

export default function ToneComposeModal({
  open,
  copy,
  compactMode,
  activeTonePreset,
  formality,
  warmth,
  urgency,
  showSaveProfile,
  savedProfiles,
  onClose,
  onSelectPreset,
  onChangeControl,
  onSaveProfile,
  onLoadProfile,
  onDeleteProfile,
}: ToneComposeModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 z-[72] flex items-end justify-center bg-[#0f172a]/16 px-3 pb-4 pt-16 backdrop-blur-[1px]"
      role="presentation"
      onClick={onClose}
    >
      <section
        className="w-full max-w-[342px] rounded-[22px] border border-[#f1d7e0] bg-[linear-gradient(165deg,#fffdfb_0%,#fff7fa_42%,#fdf2f7_100%)] p-3 shadow-[0_28px_64px_rgba(15,23,42,0.22)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tone-compose-modal-title"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <span
              className={`mt-0.5 shrink-0 ${toneSparkleButtonClassName(false)}`}
              aria-hidden="true"
            >
              <ToneSparkleIcon className="h-[20px] w-[20px]" />
            </span>
            <div className="min-w-0">
              <h2
                id="tone-compose-modal-title"
                className="text-[13px] font-semibold leading-5 text-slate-950"
              >
                {copy.floating.toneComposerModalTitle}
              </h2>
              <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                {copy.floating.toneComposerModalSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-full border border-[#edd7e0] bg-white px-2 py-1 text-[10px] font-semibold text-slate-500 transition hover:border-[#e7aac2] hover:text-[#b84f79]"
            onClick={onClose}
          >
            {copy.floating.toneComposerClose}
          </button>
        </div>

        <div className="mt-3">
          <ToneComposer
            copy={copy}
            compactMode={compactMode}
            layout="plain"
            activeTonePreset={activeTonePreset}
            formality={formality}
            warmth={warmth}
            urgency={urgency}
            showSaveProfile={showSaveProfile}
            savedProfiles={savedProfiles}
            onSelectPreset={onSelectPreset}
            onChangeControl={onChangeControl}
            onSaveProfile={onSaveProfile}
            onLoadProfile={onLoadProfile}
            onDeleteProfile={onDeleteProfile}
          />
        </div>

        <button
          type="button"
          className="mt-3 w-full rounded-full bg-[#2f2926] px-4 py-2 text-[11px] font-semibold text-white shadow-[0_10px_24px_rgba(47,41,38,0.2)] transition hover:bg-[#463b35]"
          onClick={onClose}
        >
          {copy.floating.toneComposerDone}
        </button>
      </section>
    </div>
  );
}
