import { describe, expect, it } from 'vitest';
import { bossMonster, freeSpawnPoints, monsterAt, pickEnemy, populate, spawnMonster, wanderStep, type MapMonster } from '../src/engine/encounters';
import { parseMap } from '../src/engine/map';
import { seedRng } from '../src/engine/rng';
import { findArea } from '../src/engine/area';
import { getMap } from '../src/data/maps';
import { WORLD } from '../src/data/world';

const floor1 = findArea('pagoda-floor-1');
const floor3 = findArea('pagoda-floor-3');
const map1 = parseMap(getMap(floor1.map));
const map3 = parseMap(getMap(floor3.map));

describe('pickEnemy', () => {
  it('only returns ids from the pool and respects weights', () => {
    const pool = [{ enemyId: 'a', weight: 3 }, { enemyId: 'b', weight: 1 }];
    let rng = seedRng(5);
    const counts: Record<string, number> = { a: 0, b: 0 };
    for (let i = 0; i < 2000; i++) {
      let id: string;
      [id, rng] = pickEnemy(pool, rng);
      counts[id]!++;
    }
    expect(counts.a! + counts.b!).toBe(2000);
    expect(counts.a! / 2000).toBeGreaterThan(0.7);
    expect(counts.a! / 2000).toBeLessThan(0.8);
    expect(() => pickEnemy([], rng)).toThrow();
  });
});

describe('spawning', () => {
  it('keeps spawn points away from the player and off other monsters', () => {
    const player = map1.spawnPoints[0]!;
    const occupied: MapMonster = { id: 9, enemyId: 'spiritRat', x: map1.spawnPoints[1]!.x, y: map1.spawnPoints[1]!.y, isBoss: false };
    const free = freeSpawnPoints(map1, [occupied], player);
    expect(free).not.toContainEqual(player);
    expect(free).not.toContainEqual(map1.spawnPoints[1]);
    for (const p of free) expect(Math.abs(p.x - player.x) + Math.abs(p.y - player.y)).toBeGreaterThanOrEqual(WORLD.spawnMinDistance);
  });

  it('spawns a pool enemy on a free spawn point, and null when nothing is free', () => {
    const [m, rng] = spawnMonster(floor1, map1, [], map1.start, 1, seedRng(3));
    expect(m).not.toBeNull();
    expect(floor1.pool.map((e) => e.enemyId)).toContain(m!.enemyId);
    expect(map1.spawnPoints).toContainEqual({ x: m!.x, y: m!.y });
    expect(rng).not.toBe(seedRng(3));
    const everywhere = map1.spawnPoints.map((p, i) => ({ id: i, enemyId: 'spiritRat', x: p.x, y: p.y, isBoss: false }));
    expect(spawnMonster(floor1, map1, everywhere, map1.start, 99, seedRng(3))[0]).toBeNull();
  });

  it('populates up to the area monster count with unique positions, plus the boss on boss floors', () => {
    const [monsters] = populate(floor1, map1, map1.start, false, seedRng(11));
    expect(monsters).toHaveLength(floor1.monsterCount);
    expect(new Set(monsters.map((m) => `${m.x},${m.y}`)).size).toBe(monsters.length);
    expect(monsters.every((m) => !m.isBoss)).toBe(true);

    const [withBoss] = populate(floor3, map3, map3.start, false, seedRng(11));
    expect(withBoss).toHaveLength(floor3.monsterCount + 1);
    const boss = withBoss.find((m) => m.isBoss)!;
    expect(boss.enemyId).toBe('jadePythonKing');
    expect({ x: boss.x, y: boss.y }).toEqual(map3.bossSpot);

    const [afterBoss] = populate(floor3, map3, map3.start, true, seedRng(11));
    expect(afterBoss.some((m) => m.isBoss)).toBe(false);
    expect(bossMonster(floor1, map1, false, 1)).toBeNull();
  });

  it('is deterministic for a seed', () => {
    const [a] = populate(floor1, map1, map1.start, false, seedRng(42));
    const [b] = populate(floor1, map1, map1.start, false, seedRng(42));
    expect(a).toEqual(b);
  });
});

describe('wandering', () => {
  it('bosses never move', () => {
    const boss: MapMonster = { id: 1, enemyId: 'jadePythonKing', x: map3.bossSpot!.x, y: map3.bossSpot!.y, isBoss: true };
    let rng = seedRng(1);
    for (let i = 0; i < 20; i++) {
      let p;
      [p, rng] = wanderStep(boss, map3, [], rng);
      expect(p).toEqual({ x: boss.x, y: boss.y });
    }
  });

  it('only steps onto free walkable tiles next to the monster, and sometimes stays', () => {
    const start = map1.spawnPoints[2]!;
    const monster: MapMonster = { id: 1, enemyId: 'spiritRat', x: start.x, y: start.y, isBoss: false };
    const blocker = { x: start.x + 1, y: start.y };
    let rng = seedRng(7);
    let stayed = 0;
    let moved = 0;
    for (let i = 0; i < 200; i++) {
      let p;
      [p, rng] = wanderStep(monster, map1, [blocker], rng);
      const dist = Math.abs(p.x - start.x) + Math.abs(p.y - start.y);
      expect(dist).toBeLessThanOrEqual(1);
      expect(p).not.toEqual(blocker);
      if (dist === 0) stayed++;
      else moved++;
    }
    expect(stayed).toBeGreaterThan(0);
    expect(moved).toBeGreaterThan(0);
  });

  it('never wanders onto the exit tile', () => {
    const exit = map1.exits[0]!;
    const monster: MapMonster = { id: 1, enemyId: 'spiritRat', x: exit.x + 1, y: exit.y, isBoss: false };
    let rng = seedRng(2);
    for (let i = 0; i < 100; i++) {
      let p;
      [p, rng] = wanderStep(monster, map1, [], rng);
      expect(p).not.toEqual(exit);
    }
  });

  it('monsterAt finds the monster on a tile', () => {
    const list: MapMonster[] = [{ id: 1, enemyId: 'spiritRat', x: 3, y: 4, isBoss: false }];
    expect(monsterAt(list, { x: 3, y: 4 })?.id).toBe(1);
    expect(monsterAt(list, { x: 3, y: 5 })).toBeUndefined();
  });
});
