// Idle cultivation: CP rates, focus thresholds, realm peaks, breakthrough.
import type { Realm } from '../engine/types';

export const REALMS: Realm[] = ['qiCondensation', 'foundation', 'core'];

/** Cultivation points per second, per realm. */
export const CP_RATE: Record<Realm, number> = {
  qiCondensation: 1,
  foundation: 3,
  core: 9,
};

/** Total CP earned in the realm needed to reach its peak. */
export const REALM_PEAK_CP: Record<Realm, number> = {
  qiCondensation: 3_600,
  foundation: 21_600,
  core: 97_200,
};

/** Costs below are for Qi Condensation and scale by this factor per realm. */
export const FOCUS_COST_REALM_MULTIPLIER = 3;

export const FOCUS = {
  body: {
    vitality: { cp: 30, gain: 3 },
    body: { cp: 150, gain: 1 },
  },
  meridians: {
    qi: { cp: 30, gain: 1 },
    strength: { cp: 120, gain: 1 },
  },
} as const;

/** All current stats are multiplied by this on breakthrough. */
export const BREAKTHROUGH_STAT_MULTIPLIER = 1.5;

/** HP regenerated per second while meditating, as a fraction of max HP. Also applies offline. */
export const MEDITATION_HP_REGEN_PER_SECOND = 0.01;

/** Offline progress is capped at this many seconds (8 hours). */
export const OFFLINE_CAP_SECONDS = 8 * 60 * 60;

/** Spirit herb reward multiplier per realm. */
export const REALM_REWARD_MULTIPLIER: Record<Realm, number> = {
  qiCondensation: 1,
  foundation: 1.5,
  core: 2.25,
};
