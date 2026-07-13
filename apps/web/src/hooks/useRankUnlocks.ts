export type RankUnlocks = {
  /** Silver (30+): unlocks the Confidence tone slider */
  silverUnlocked: boolean;
  /** Gold (70+): unlocks Save Tone Profile */
  goldUnlocked: boolean;
  /** Platinum (120+): unlocks Mirror Mode */
  platinumUnlocked: boolean;
};

export function useRankUnlocks(usageCount: number): RankUnlocks {
  return {
    silverUnlocked: usageCount >= 30,
    goldUnlocked: usageCount >= 70,
    platinumUnlocked: usageCount >= 120,
  };
}
