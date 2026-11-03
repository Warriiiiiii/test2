import { describe, expect, it } from 'vitest';
import {
  afterFightWon, createRun, currentEnemyId, drawFloorEnemies, isFloorCleared, nextFightSeed, playerSetup, restored, startFloor,
} from '../src/engine/run';
import { BASE_STATS } from '../src/data/stats';
import { getEnemy } from '../src/data/enemies';
import { seedRng } from '../src/engine/rng';
import { PAGODA } from '../src/data/pagoda';

describe('run setup', () => {
  it('starts with base stats, full HP and the element starter equipped', () => {
    const run = createRun('fire', 1);
    expect(run.stats).toEqual(BASE_STATS);
    expect(run.hp).toBe(BASE_STATS.vitality);
    expect(run.learned).toEqual(['flameFinger']);
    expect(run.equipped).toEqual(['flameFinger']);
    expect(run.floor).toBe(1);
  });

  it('builds a player setup the combat engine accepts', () => {
    const run = createRun('water', 1);
    const setup = playerSetup({ ...run, hp: 20 });
    expect(setup.element).toBe('water');
    expect(setup.hp).toBe(20);
    expect(setup.techniques.map((t) => t.id)).toEqual(['tidePalm']);
  });
});

describe('drawing floors', () => {
  it('draws 3 distinct regular enemies of the realm for a normal floor', () => {
    const [ids] = drawFloorEnemies(1, seedRng(5));
    expect(ids).toHaveLength(PAGODA.fightsPerFloor);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      const e = getEnemy(id);
      expect(e.realm).toBe('qiCondensation');
      expect(e.boss).toBeFalsy();
    }
  });

  it('ends boss floors with the realm boss', () => {
    const [f3] = drawFloorEnemies(3, seedRng(1));
    expect(f3).toHaveLength(3);
    expect(f3[2]).toBe('jadePythonKing');
    expect(f3.slice(0, 2).every((id) => !getEnemy(id).boss)).toBe(true);
    const [f6] = drawFloorEnemies(6, seedRng(1));
    expect(f6[2]).toBe('elderJin');
    const [f9] = drawFloorEnemies(9, seedRng(1));
    expect(f9[2]).toBe('nineColoredTribulation');
    const [f5] = drawFloorEnemies(5, seedRng(1));
    expect(f5.every((id) => getEnemy(id).realm === 'foundation')).toBe(true);
  });

  it('is deterministic for a seed and varies across seeds', () => {
    const [a] = drawFloorEnemies(1, seedRng(11));
    const [b] = drawFloorEnemies(1, seedRng(11));
    expect(a).toEqual(b);
    const draws = new Set(Array.from({ length: 30 }, (_, i) => drawFloorEnemies(1, seedRng(i + 1))[0].join(',')));
    expect(draws.size).toBeGreaterThan(1);
  });
});

describe('floor progress', () => {
  it('moves through the fights and knows when the floor is cleared', () => {
    let run = startFloor(createRun('earth', 3), 1);
    expect(run.floorEnemies).toHaveLength(3);
    expect(isFloorCleared(run)).toBe(false);
    expect(currentEnemyId(run)).toBe(run.floorEnemies[0]);
    run = afterFightWon(run, 31);
    expect(run.hp).toBe(31);
    expect(currentEnemyId(run)).toBe(run.floorEnemies[1]);
    run = afterFightWon(run, 20);
    run = afterFightWon(run, 12);
    expect(isFloorCleared(run)).toBe(true);
    expect(() => currentEnemyId(run)).toThrow();
  });

  it('fight seeds advance the run rng', () => {
    const run = startFloor(createRun('wood', 8), 1);
    const [seed1, run2] = nextFightSeed(run);
    const [seed2] = nextFightSeed(run2);
    expect(seed1).not.toBe(seed2);
    expect(run2.rng).not.toBe(run.rng);
  });

  it('resting restores full HP', () => {
    const run = { ...createRun('metal', 1), hp: 3 };
    expect(restored(run).hp).toBe(BASE_STATS.vitality);
  });
});
