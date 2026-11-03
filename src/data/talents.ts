// Soul tab: insight points and what they buy. Survives death.
import type { StatName } from '../engine/types';

export const INSIGHT_ON_DEATH = {
  perFloorReached: 2,
  perBossBeaten: 5,
} as const;

export interface Talent {
  id: string;
  name: string;
  description: string;
  /** Cost of each level in order. Length = max level. */
  costs: number[];
  /** Starting-stat bonus per level, if this talent gives one. */
  stat?: { name: StatName; perLevel: number };
}

export const TALENTS: Talent[] = [
  { id: 'vitality', name: 'Tempered Flesh', description: '+10 starting Vitality per level.', costs: [3, 6, 9, 12, 15], stat: { name: 'vitality', perLevel: 10 } },
  { id: 'strength', name: 'Iron Sinews', description: '+1 starting Strength per level.', costs: [4, 8, 12, 16, 20], stat: { name: 'strength', perLevel: 1 } },
  { id: 'qi', name: 'Widened Meridians', description: '+2 starting Qi per level.', costs: [3, 6, 9, 12, 15], stat: { name: 'qi', perLevel: 2 } },
  { id: 'agility', name: 'Light Step', description: '+1 starting Agility per level.', costs: [5, 10, 15], stat: { name: 'agility', perLevel: 1 } },
  { id: 'secondSoulSlot', name: 'Second Soul Memory', description: 'Carry 2 techniques through death instead of 1.', costs: [25] },
  { id: 'startingScroll', name: 'Lingering Insight', description: 'Start each run with a random scroll technique.', costs: [20] },
];

/** Spirit Gathering Array: +20% cultivation rate per level, cost doubles each level. */
export const SPIRIT_ARRAY = {
  maxLevel: 10,
  ratePerLevel: 0.2,
  baseCost: 5,
  costMultiplier: 2,
} as const;

export function spiritArrayCost(level: number): number {
  // level 1 costs baseCost, level 2 costs baseCost × 2, level 3 × 4, ...
  return SPIRIT_ARRAY.baseCost * SPIRIT_ARRAY.costMultiplier ** (level - 1);
}

/** Soul-memory slots: techniques carried into the next run. */
export const SOUL_MEMORY = {
  baseSlots: 1,
  withTalentSlots: 2,
} as const;
