import React from 'react';

type Props = {
  usageCount: number;
  toNextRank: string;
  maxRank: string;
  rankLabels: Record<string, string>;
};

const TIERS = [
  { threshold: 30, labelKey: 'silver' },
  { threshold: 70, labelKey: 'gold' },
  { threshold: 120, labelKey: 'platinum' },
];

export default function RankProgressBar({ usageCount, toNextRank, maxRank, rankLabels }: Props) {
  const nextTier = TIERS.find(t => usageCount < t.threshold);

  if (!nextTier) {
    return (
      <div className="mt-2 rounded-[10px] bg-white/20 px-3 py-2">
        <p className="text-center text-[10px] font-semibold text-[#b04a70]">{maxRank}</p>
      </div>
    );
  }

  const prevThreshold = TIERS.find(t => t.threshold < nextTier.threshold)?.threshold ?? 0;
  const rangeSize = nextTier.threshold - prevThreshold;
  const progressPct = Math.min(100, Math.max(0, ((usageCount - prevThreshold) / rangeSize) * 100));

  return (
    <div className="mt-2 rounded-[10px] bg-white/20 px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-[#3f3738]">
          {usageCount} / {nextTier.threshold}
        </span>
        <span className="text-[9px] font-semibold text-[#b04a70]">
          {rankLabels[nextTier.labelKey]} {toNextRank}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/30">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#f279a6,#dd5f91)] transition-all duration-700"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}
