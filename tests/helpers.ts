// Small builders shared by the engine tests.
import type { EnemyDef, Move, Stats, Technique } from '../src/engine/types';
import { createCombat, takeTurn, type PlayerSetup } from '../src/engine/combat';
import type { CombatState } from '../src/engine/types';

/** Stats with no dodge or crit so results are exact unless a test asks for them. */
export function flatStats(over: Partial<Stats> = {}): Stats {
  return { vitality: 100, qi: 20, strength: 10, body: 0, agility: 0, divineSense: 0, ...over };
}

export function wait(name = 'Wait'): Move {
  return { id: 'wait', name, power: 0, hits: 0, qiCost: 0, effects: [] };
}

export function strike(power = 1, extra: Partial<Move> = {}): Move {
  return { id: 'strike', name: 'Strike', power, hits: 1, qiCost: 0, effects: [], ...extra };
}

/** A harmless dummy that waits every turn. Body 0, Agility 0, no element. */
export function dummy(over: Partial<EnemyDef> = {}): EnemyDef {
  return {
    id: 'dummy', name: 'Dummy', element: 'none', realm: 'qiCondensation',
    hp: 1000, strength: 10, body: 0, agility: 0,
    pattern: [wait()],
    ...over,
  };
}

export function setup(over: Partial<PlayerSetup> = {}): PlayerSetup {
  return { element: 'none', stats: flatStats(), techniques: [], ...over };
}

export function fight(player: Partial<PlayerSetup>, enemy: EnemyDef, seed = 1): CombatState {
  return createCombat(setup(player), enemy, seed);
}

/** Play several rounds with the same move. */
export function play(state: CombatState, moveId: string, rounds: number): CombatState {
  let s = state;
  for (let i = 0; i < rounds && s.result === 'ongoing'; i++) s = takeTurn(s, moveId);
  return s;
}

export function tech(over: Partial<Technique> & Pick<Technique, 'id'>): Technique {
  return {
    name: over.id, law: 'fire', element: 'fire', kind: 'scroll', power: 1, hits: 1, qiCost: 0, effects: [], ...over,
  };
}
