import { useState } from 'react';
import type { AppTranslations } from '../../i18n/translations';
import type { ToneProfileData } from './toneProfiles';
import type { TonePreset } from './types';

type ToneControlKey = 'formality' | 'warmth' | 'urgency';

type ToneComposerProps = {
  copy: AppTranslations;
  compactMode: boolean;
  /** card = bordered panel; plain = embedded in modal */
  layout?: 'card' | 'plain';
  activeTonePreset: TonePreset;
  formality: number;
  warmth: number;
  urgency: number;
  showSaveProfile: boolean;
  savedProfiles: ToneProfileData[];
  onSelectPreset: (preset: Exclude<TonePreset, null>) => void;
  onChangeControl: (key: ToneControlKey, value: number) => void;
  onSaveProfile: () => void;
  onLoadProfile: (profile: ToneProfileData) => void;
  onDeleteProfile: (id: string) => void;
};

export default function ToneComposer({
  copy,
  compactMode,
  layout = 'card',
  activeTonePreset,
  formality,
  warmth,
  urgency,
  showSaveProfile,
  savedProfiles,
  onSelectPreset,
  onChangeControl,
  onLoadProfile,
  onDeleteProfile,
}: ToneComposerProps) {
  const [showSaved, setShowSaved] = useState(false);

  const controls: Array<{ key: ToneControlKey; label: string; value: number }> = [
    { key: 'formality', label: copy.toneControlLabels.formality, value: formality },
    { key: 'warmth', label: copy.toneControlLabels.warmth, value: warmth },
    { key: 'urgency', label: copy.toneControlLabels.urgency, value: urgency },
  ];

  const shellClass =
    layout === 'card'
      ? `mt-2 mb-2 rounded-[14px] border border-slate-200 bg-[#fcfcfd] ${compactMode ? 'p-1.5' : 'p-2'}`
      : `rounded-[16px] border border-[#f4d7e1] bg-white/90 ${compactMode ? 'p-1.5' : 'p-2'}`;

  return (
    <div className={shellClass}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {copy.toneControlLabels.composer}
        </p>
        <div className={`flex items-center ${compactMode ? 'gap-0.5' : 'gap-1'}`}>
          {(['executive', 'friendly', 'urgent', 'casual'] as const).map(preset => (
            <button
              key={preset}
              type="button"
              className={[
                'rounded-full border transition',
                compactMode ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[9px]',
                activeTonePreset === preset
                  ? 'border-[#e88ab0] bg-[#fde9f2] text-[#b84f79]'
                  : 'border-[#edd7e0] bg-white text-slate-500 hover:border-[#e7aac2]',
              ].join(' ')}
              onClick={() => onSelectPreset(preset)}
            >
              {copy.tonePresetLabels[preset]}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className={`mt-1.5 ${compactMode ? 'space-y-1' : 'space-y-1.5'}`}>
        {controls.map(control => (
          <label key={control.key} className="block">
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>{control.label}</span>
              <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-semibold text-[#b65881]">
                {control.value}/5
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={control.value}
              onChange={event => onChangeControl(control.key, Number(event.target.value))}
              className="mt-1 h-1.5 w-full cursor-pointer accent-[#E85C8B]"
            />
          </label>
        ))}
      </div>

      {/* Gold: Saved tone profiles */}
      {showSaveProfile && savedProfiles.length > 0 && (
        <div className={`mt-2 border-t border-slate-100 ${compactMode ? 'pt-1.5' : 'pt-2'}`}>
          <div className="flex items-center justify-end">
            <button
              type="button"
              className={`text-slate-400 transition hover:text-[#c15480] ${compactMode ? 'text-[8px]' : 'text-[9px]'}`}
              onClick={() => setShowSaved(prev => !prev)}
            >
              {copy.rankUnlocks.savedProfiles} ({savedProfiles.length})
            </button>
          </div>

          {showSaved && savedProfiles.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {savedProfiles.map(profile => (
                <div
                  key={profile.id}
                  className={`flex items-center gap-1 rounded-full border border-[#edd7e0] bg-white ${compactMode ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[9px]'}`}
                >
                  <button
                    type="button"
                    className="text-slate-500 hover:text-[#b84f79]"
                    onClick={() => onLoadProfile(profile)}
                  >
                    {profile.name}
                  </button>
                  <button
                    type="button"
                    className="text-slate-300 hover:text-red-400"
                    onClick={() => onDeleteProfile(profile.id)}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
