import { useEffect, useRef } from 'react';

const MILESTONE_KEY = 'replyAssistantMilestonesAchieved';

export type MilestoneRank = 'silver' | 'gold' | 'platinum';

const MILESTONES: Array<{ threshold: number; rank: MilestoneRank }> = [
  { threshold: 30, rank: 'silver' },
  { threshold: 70, rank: 'gold' },
  { threshold: 120, rank: 'platinum' },
];

function loadAchieved(): Set<number> {
  try {
    const raw = localStorage.getItem(MILESTONE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function saveAchieved(achieved: Set<number>): void {
  localStorage.setItem(MILESTONE_KEY, JSON.stringify([...achieved]));
}

export function useMilestone(
  usageCount: number,
  onMilestone: (rank: MilestoneRank) => void,
): void {
  const prevCountRef = useRef(usageCount);
  const onMilestoneRef = useRef(onMilestone);
  onMilestoneRef.current = onMilestone;

  useEffect(() => {
    const prev = prevCountRef.current;
    prevCountRef.current = usageCount;

    if (usageCount <= prev) return;

    const achieved = loadAchieved();

    for (const milestone of MILESTONES) {
      if (!achieved.has(milestone.threshold) && usageCount >= milestone.threshold && prev < milestone.threshold) {
        achieved.add(milestone.threshold);
        saveAchieved(achieved);
        onMilestoneRef.current(milestone.rank);
        break;
      }
    }
  }, [usageCount]);
}
