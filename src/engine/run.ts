// A run: everything that resets on death. Pure helpers the store calls between fights.
import type { AreaProgress, Booster, Element, Law, Realm, Stats } from './types';
import type { PlayerSetup } from './combat';
import { BASE_STATS } from '../data/stats';
import { STARTER_BY_ELEMENT, getTechnique } from '../data/techniques';
import { nextInt, seedRng } from './rng';

export interface RunState {
  element: Element;
  stats: Stats;
  /** Current HP. Carries over between fights; only meditation restores it. */
  hp: number;
  /** Technique ids learned this run. */
  learned: string[];
  /** Technique ids equipped, in slot order. */
  equipped: string[];
  lawLevels: Partial<Record<Law, number>>;
  realm: Realm;
  /** Wins and boss state per area id. */
  areaProgress: Record<string, AreaProgress>;
  /** Set by cultivation once the realm peak is reached. Boss gates need it. */
  atRealmPeak: boolean;
  /** Highest pagoda floor entered this run (Time law and insight on death). */
  highestFloor: number;
  bossesBeaten: number;
  /** Timed run bonuses, e.g. cultivation herbs. */
  boosters: Booster[];
  /** Run-level RNG state: spawns, rewards and fight seeds. */
  rng: number;
}

export function createRun(element: Element, seed: number): RunState {
  const starter = STARTER_BY_ELEMENT[element as keyof typeof STARTER_BY_ELEMENT];
  const stats = { ...BASE_STATS };
  return {
    element,
    stats,
    hp: stats.vitality,
    learned: starter ? [starter] : [],
    equipped: starter ? [starter] : [],
    lawLevels: {},
    realm: 'qiCondensation',
    areaProgress: {},
    atRealmPeak: false,
    highestFloor: 0,
    bossesBeaten: 0,
    boosters: [],
    rng: seedRng(seed),
  };
}

/** Advance the run rng and return a value for seeding something else. */
export function nextSeed(run: RunState): [number, RunState] {
  const [seed, rng] = nextInt(run.rng, 2 ** 31);
  return [seed, { ...run, rng }];
}

export function playerSetup(run: RunState): PlayerSetup {
  return {
    element: run.element,
    stats: run.stats,
    hp: run.hp,
    techniques: run.equipped.map(getTechnique),
    lawLevels: run.lawLevels,
  };
}

/** Keep the HP the player ended a fight with. */
export function withHp(run: RunState, hp: number): RunState {
  return { ...run, hp: Math.max(0, Math.min(run.stats.vitality, hp)) };
}

/** Full heal, used by meditation until cultivation arrives. */
export function restored(run: RunState): RunState {
  return { ...run, hp: run.stats.vitality };
}

/** Equip or unequip a learned technique. Returns the run unchanged if the change is not allowed. */
export function toggleEquip(run: RunState, techniqueId: string, maxSlots: number): RunState {
  if (!run.learned.includes(techniqueId)) return run;
  if (run.equipped.includes(techniqueId)) return { ...run, equipped: run.equipped.filter((id) => id !== techniqueId) };
  if (run.equipped.length >= maxSlots) return run;
  return { ...run, equipped: [...run.equipped, techniqueId] };
}
