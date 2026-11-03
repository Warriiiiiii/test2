// Reward cards offered after each fight. The player picks 1 of 3.
import type { StatName } from '../engine/types';

/** Spirit herb: one stat boost, scaled by the realm reward multiplier. */
export const SPIRIT_HERB_BOOSTS: Record<StatName, number> = {
  vitality: 5,
  qi: 2,
  strength: 1,
  body: 1,
  agility: 1,
  divineSense: 1,
};

/** Cultivation herb: +50% cultivation rate for 30 minutes. */
export const CULTIVATION_HERB = {
  rateBonus: 0.5,
  durationSeconds: 30 * 60,
} as const;

/** Pill: heal this fraction of max HP. */
export const PILL_HEAL_FRACTION = 0.5;

export const REWARD_CARDS_OFFERED = 3;
