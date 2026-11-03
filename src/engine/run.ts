// A run: everything that resets on death. Pure helpers the store calls between fights.
import type { Element, Law, Stats } from './types';
import type { PlayerSetup } from './combat';
import { BASE_STATS } from '../data/stats';
import { STARTER_BY_ELEMENT, getTechnique } from '../data/techniques';
import { PAGODA, isBossFloor, realmOfFloor } from '../data/pagoda';
import { bossOf, regularEnemiesOf } from '../data/enemies';
import { nextInt, seedRng } from './rng';

export interface RunState {
  element: Element;
  stats: Stats;
  /** Current HP. Carries over between the fights of a floor. */
  hp: number;
  /** Technique ids learned this run. */
  learned: string[];
  /** Technique ids equipped, in slot order. */
  equipped: string[];
  floor: number;
  /** 0-based index of the next fight on the current floor. */
  fightIndex: number;
  /** Enemy ids drawn for the current floor. */
  floorEnemies: string[];
  lawLevels: Partial<Record<Law, number>>;
  /** Run-level RNG state: draws floors and seeds fights. */
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
    floor: 1,
    fightIndex: 0,
    floorEnemies: [],
    lawLevels: {},
    rng: seedRng(seed),
  };
}

/**
 * Draw the enemies for a floor: 3 distinct regular enemies of the realm,
 * or 2 regular ones then the boss on a boss floor. Returns the ids and the new rng state.
 */
export function drawFloorEnemies(floor: number, rng: number): [string[], number] {
  const realm = realmOfFloor(floor);
  const pool = regularEnemiesOf(realm).map((e) => e.id);
  const regularCount = isBossFloor(floor) ? PAGODA.fightsPerFloor - 1 : PAGODA.fightsPerFloor;

  const drawn: string[] = [];
  let state = rng;
  while (drawn.length < regularCount && pool.length > 0) {
    let i: number;
    [i, state] = nextInt(state, pool.length);
    drawn.push(pool.splice(i, 1)[0]!);
  }
  if (isBossFloor(floor)) drawn.push(bossOf(realm).id);
  return [drawn, state];
}

/** Move the run to a floor and draw its fights. */
export function startFloor(run: RunState, floor: number): RunState {
  const [floorEnemies, rng] = drawFloorEnemies(floor, run.rng);
  return { ...run, floor, fightIndex: 0, floorEnemies, rng };
}

/** The enemy id of the fight about to be played. */
export function currentEnemyId(run: RunState): string {
  const id = run.floorEnemies[run.fightIndex];
  if (!id) throw new Error(`No fight ${run.fightIndex} on floor ${run.floor}`);
  return id;
}

/** A seed for the next fight, and the run with its rng advanced. */
export function nextFightSeed(run: RunState): [number, RunState] {
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

/** After a won fight: keep the HP the player ended with and move to the next fight. */
export function afterFightWon(run: RunState, hpLeft: number): RunState {
  return { ...run, hp: hpLeft, fightIndex: run.fightIndex + 1 };
}

export function isFloorCleared(run: RunState): boolean {
  return run.fightIndex >= run.floorEnemies.length;
}

/** Full heal, used when the player rests before climbing again. */
export function restored(run: RunState): RunState {
  return { ...run, hp: run.stats.vitality };
}
