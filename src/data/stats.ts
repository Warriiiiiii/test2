// Base stats and combat formula constants. Tune here, never in engine code.
import type { Stats } from '../engine/types';

/** Stats at the start of a fresh run, before talents. */
export const BASE_STATS: Stats = {
  vitality: 50,
  qi: 10,
  strength: 5,
  body: 2,
  agility: 3,
  divineSense: 0,
};

export const COMBAT = {
  /** Qi regained by the player at the end of every combat turn. */
  qiRegenPerTurn: 2,
  /** Damage can never drop below this after Body is subtracted. */
  minDamage: 1,
  /** Dodge chance per point of Agility (0.02 = 2%). */
  dodgePerAgility: 0.02,
  dodgeCap: 0.4,
  /** Crit chance per point of Divine Sense (0.03 = 3%). */
  critPerDivineSense: 0.03,
  critCap: 0.5,
  critMultiplier: 2,
  /** Divine Sense needed to read enemy intent without a memory. */
  intentDivineSense: 10,
  /** Damage multiplier when the attacking element beats the defending one. */
  elementCounterMultiplier: 1.5,
  /** Damage multiplier when the attacking element is beaten by the defending one (1 = no penalty). */
  elementWeakMultiplier: 1,
  /** Number of techniques the player can equip, on top of the three basics. */
  equipSlots: 4,
  /** Qi Shield blocks body × this + current Qi. */
  qiShieldBodyFactor: 2,
  /** Circulate Qi restores this much Qi. */
  circulateQiAmount: 5,
  /** Law mastery: extra damage per law level with that law's techniques (0.05 = +5%). */
  lawDamagePerLevel: 0.05,
} as const;
