import React, { useEffect, useState } from 'react';
import type { MilestoneRank } from '../hooks/useMilestone';

type Props = {
  rank: MilestoneRank | null;
  rankLabel: string;
  congratulations: string;
  unlocked: string;
  onDismiss: () => void;
};

const RANK_EMOJI: Record<MilestoneRank, string> = {
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
};

export default function MilestoneToast({ rank, rankLabel, congratulations, unlocked, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!rank) return;

    setVisible(true);

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
    }, 3200);

    const dismissTimer = window.setTimeout(() => {
      onDismiss();
    }, 3600);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [rank, onDismiss]);

  if (!rank) return null;

  return (
    <div
      className={[
        'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 transition-all duration-300',
        visible ? 'top-14 opacity-100 scale-100' : 'top-10 opacity-0 scale-95',
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      <div className="rounded-[16px] border border-[#f4d7e1] bg-white px-6 py-3 shadow-[0_16px_40px_rgba(232,92,139,0.22)] text-center">
        <div className="text-[28px] leading-none">{RANK_EMOJI[rank]}</div>
        <p className="mt-1.5 text-[13px] font-semibold text-[#231f20]">{congratulations}</p>
        <p className="mt-0.5 text-[11px] text-[#b85a82] font-medium">
          {rankLabel} {unlocked}
        </p>
      </div>
    </div>
  );
}
