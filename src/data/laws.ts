// Law mastery: comprehension curve, how comprehension is earned, and milestones.
import type { Law } from '../engine/types';

export const LAWS: Law[] = ['fire', 'water', 'metal', 'wood', 'earth', 'sword', 'time'];

export const LAW_MAX_LEVEL = 9;

/** Comprehension needed to reach level n: 10 × n² cumulative (10, 40, 90, … 810). */
export const COMPREHENSION_PER_LEVEL_FACTOR = 10;

export function comprehensionForLevel(level: number): number {
  return COMPREHENSION_PER_LEVEL_FACTOR * level * level;
}

export const COMPREHENSION_GAIN = {
  /** Using a technique: +1 to its law. */
  useTechnique: 1,
  /** Beating a boss: +20 to the law used most in that fight. */
  bossKill: 20,
  /** Time law on death: base + perFloor × floor reached. */
  timeOnDeathBase: 10,
  timeOnDeathPerFloor: 3,
  /** Dao meditation: +1 to the chosen law every N seconds. */
  daoMeditationAmount: 1,
  daoMeditationIntervalSeconds: 5 * 60,
} as const;

/** Levels at which element and sword laws unlock something. */
export const LAW_MILESTONE_LEVELS = {
  masteryTechnique: 3,
  passive: 6,
  domain: 9,
} as const;

/** Level-6 passives, one per law. */
export const LAW_PASSIVES = {
  fire: { burnExtraTurns: 1 },
  water: { healPerTurn: 3 },
  metal: { bonusBody: 2 },
  wood: { healingBonus: 0.2 },
  earth: { maxHpBonus: 0.1 },
  sword: { critBonus: 0.1 },
} as const;

/** Level-9 Law Domains: a field effect for the whole fight. */
export const LAW_DOMAINS = {
  fire: { enemyBurnPerTurn: 5 },
  water: { playerHealFractionPerTurn: 0.05 },
  metal: { enemyBodyReduction: 0.2 },
  wood: { playerRegenFractionPerTurn: 0.03 },
  earth: { damageTakenReduction: 0.2 },
  sword: { pierceBodyFraction: 0.5 },
} as const;

/** Time law milestones (no techniques). */
export const TIME_MILESTONES = {
  /** See the enemy's next 2 moves. */
  seeTwoMoves: 3,
  /** Rewind 1 turn, once per fight. */
  rewind: 6,
  /** Once per run, retry a lost fight instead of dying. */
  retryFight: 9,
} as const;
