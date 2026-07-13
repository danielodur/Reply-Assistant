import React, { useState } from 'react';
import type { AppTranslations } from '../i18n/translations';
import { interpolate } from '../i18n/translations';

type OnboardingModalProps = {
  copy: AppTranslations;
  welcomeName?: string;
  onDismiss: () => void;
};

const STEP_COUNT = 4;

function detectIsMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  const platform = (navigator as { userAgentData?: { platform?: string }; platform?: string }).userAgentData?.platform
    ?? navigator.platform ?? '';
  return /Mac|iPhone|iPod|iPad/i.test(platform);
}

export default function OnboardingModal({ copy, welcomeName, onDismiss }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const o = copy.onboarding;

  const handleNext = () => {
    if (step < STEP_COUNT - 1) {
      setStep(s => s + 1);
    } else {
      onDismiss();
    }
  };

  const isLast = step === STEP_COUNT - 1;

  return (
    <div className="absolute inset-0 z-[80] flex items-end justify-center bg-[#0f172a]/50 backdrop-blur-[2px]">
      <div className="w-full rounded-t-[24px] border border-slate-100 bg-white shadow-[0_-12px_40px_rgba(15,23,42,0.18)]">
        {/* Progress bar */}
        <div className="flex gap-1.5 px-5 pt-4">
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <div
              key={i}
              className={[
                'h-1 flex-1 rounded-full transition-all duration-300',
                i <= step ? 'bg-[#d05e8a]' : 'bg-slate-100',
              ].join(' ')}
            />
          ))}
        </div>

        {/* Step content */}
        <div key={step} className="animate-fade-in px-5 pb-5 pt-4">
          <StepContent step={step} copy={copy} o={o} welcomeName={welcomeName} />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-5 pb-6">
          <button
            type="button"
            className="text-[12px] text-slate-400 hover:text-slate-600 transition-colors"
            onClick={onDismiss}
          >
            {o.skip}
          </button>
          <button
            type="button"
            className="rounded-full bg-[#d05e8a] px-5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#b84f79] active:scale-95"
            onClick={handleNext}
          >
            {isLast ? o.getStarted : o.next}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepContent({
  step,
  copy,
  o,
  welcomeName,
}: {
  step: number;
  copy: AppTranslations;
  o: AppTranslations['onboarding'];
  welcomeName?: string;
}) {
  switch (step) {
    case 0:
      return <StepWelcome o={o} copy={copy} welcomeName={welcomeName} />;
    case 1:
      return <StepHotkey o={o} />;
    case 2:
      return <StepRanks copy={copy} o={o} />;
    case 3:
      return <StepQuickStart o={o} />;
    default:
      return null;
  }
}

/* ── Step 1: Welcome ─────────────────────────────────────────────── */
function StepWelcome({
  o,
  copy,
  welcomeName,
}: {
  o: AppTranslations['onboarding'];
  copy: AppTranslations;
  welcomeName?: string;
}) {
  const title = welcomeName
    ? interpolate(copy.auth.welcomeName, { name: welcomeName })
    : o.steps[0].title;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f7d0e3] to-[#f0e6fb] text-3xl shadow-sm">
        💬
      </div>
      <h2 className="text-[17px] font-bold text-slate-800">{title}</h2>
      <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">{o.steps[0].body}</p>
    </div>
  );
}

/* ── Step 2: Hotkey ──────────────────────────────────────────────── */
function StepHotkey({ o }: { o: AppTranslations['onboarding'] }) {
  const hotkeyKeys = detectIsMacPlatform() ? o.hotkeyKeysMac : o.hotkeyKeysWin;
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#dbeafe] to-[#ede9fe] text-3xl shadow-sm">
        ⌨️
      </div>
      <h2 className="text-[17px] font-bold text-slate-800">{o.steps[1].title}</h2>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
        {hotkeyKeys.map(key => (
          <kbd
            key={key}
            className="min-w-[2.25rem] rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-center text-[12px] font-semibold text-slate-700 shadow-sm"
          >
            {key}
          </kbd>
        ))}
      </div>
      <p className="mt-3 text-[12.5px] leading-relaxed text-slate-500">{o.steps[1].body}</p>
    </div>
  );
}

/* ── Step 3: Rank System ─────────────────────────────────────────── */
const RANK_META = [
  { id: 'starter' as const, emoji: '🌱', thresholdIndex: -1, color: 'bg-slate-100 text-slate-600' },
  { id: 'silver' as const, emoji: '🥈', thresholdIndex: 0, color: 'bg-slate-200 text-slate-700' },
  { id: 'gold' as const, emoji: '🥇', thresholdIndex: 1, color: 'bg-amber-100 text-amber-700' },
  { id: 'platinum' as const, emoji: '💎', thresholdIndex: 2, color: 'bg-sky-100 text-sky-700' },
];

function StepRanks({ copy, o }: { copy: AppTranslations; o: AppTranslations['onboarding'] }) {
  return (
    <div>
      <div className="mb-3 flex flex-col items-center text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fef9c3] to-[#fde68a] text-3xl shadow-sm">
          🏆
        </div>
        <h2 className="text-[17px] font-bold text-slate-800">{o.steps[2].title}</h2>
        <p className="mt-1.5 text-[12.5px] text-slate-500">{o.steps[2].body}</p>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-1">
        {RANK_META.map(rank => (
          <div key={rank.id} className={`flex flex-col items-center gap-1 rounded-[12px] py-2.5 px-1 ${rank.color}`}>
            <span className="text-lg">{rank.emoji}</span>
            <span className="text-[10px] font-semibold">{copy.moreFeatures.rankLabels[rank.id]}</span>
            {rank.thresholdIndex >= 0 ? (
              <span className="text-[9px] opacity-70">{o.rankThresholds[rank.thresholdIndex]}</span>
            ) : null}
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-center text-[11px] text-slate-400">{o.steps[2].hint}</p>
    </div>
  );
}

/* ── Step 4: Quick Start ─────────────────────────────────────────── */
function StepQuickStart({ o }: { o: AppTranslations['onboarding'] }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#dcfce7] to-[#bbf7d0] text-3xl shadow-sm">
        ⚡
      </div>
      <h2 className="text-[17px] font-bold text-slate-800">{o.steps[3].title}</h2>
      <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">{o.steps[3].body}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {o.quickStartPreview.map(label => (
          <span
            key={label}
            className="rounded-full border border-[#e8d5df] bg-[#fdf4f8] px-3 py-1 text-[11px] font-medium text-[#b84f79]"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
