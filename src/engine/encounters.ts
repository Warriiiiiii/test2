// Monsters on a map: where they appear, how they wander, and which enemy they are. Seeded and pure.
import type { AreaDef, EnemyPoolEntry } from './types';
import type { ParsedMap } from './map';
import { isWalkable, samePoint } from './map';
import { manhattan, walkableNeighbours, type GridPoint } from './pathfinding';
import { nextFloat, nextInt, roll } from './rng';
import { WORLD } from '../data/world';

export interface MapMonster {
  /** Unique within the area visit. */
  id: number;
  enemyId: string;
  x: number;
  y: number;
  isBoss: boolean;
}

/** Weighted pick from an enemy pool. */
export function pickEnemy(pool: EnemyPoolEntry[], rng: number): [string, number] {
  if (pool.length === 0) throw new Error('Empty enemy pool');
  const total = pool.reduce((sum, e) => sum + e.weight, 0);
  const [f, next] = nextFloat(rng);
  let cursor = f * total;
  for (const entry of pool) {
    cursor -= entry.weight;
    if (cursor < 0) return [entry.enemyId, next];
  }
  return [pool[pool.length - 1]!.enemyId, next];
}

/**
 * Spawn points that are free: not under another monster and not too close to the player.
 */
export function freeSpawnPoints(map: ParsedMap, monsters: MapMonster[], player: GridPoint): GridPoint[] {
  return map.spawnPoints.filter(
    (p) => manhattan(p, player) >= WORLD.spawnMinDistance && !monsters.some((m) => m.x === p.x && m.y === p.y),
  );
}

/** Place one new regular monster, or null when no spawn point is free. */
export function spawnMonster(
  area: AreaDef,
  map: ParsedMap,
  monsters: MapMonster[],
  player: GridPoint,
  nextId: number,
  rng: number,
): [MapMonster | null, number] {
  const spots = freeSpawnPoints(map, monsters, player);
  if (spots.length === 0 || area.pool.length === 0) return [null, rng];
  let i: number;
  [i, rng] = nextInt(rng, spots.length);
  let enemyId: string;
  [enemyId, rng] = pickEnemy(area.pool, rng);
  const spot = spots[i]!;
  return [{ id: nextId, enemyId, x: spot.x, y: spot.y, isBoss: false }, rng];
}

/** The boss standing on its spot, if the area has one and it has not been beaten. */
export function bossMonster(area: AreaDef, map: ParsedMap, bossDefeated: boolean, id: number): MapMonster | null {
  if (!area.boss || !map.bossSpot || bossDefeated) return null;
  return { id, enemyId: area.boss, x: map.bossSpot.x, y: map.bossSpot.y, isBoss: true };
}

/** Fill the map when the player enters: boss first, then regulars up to the area's count. */
export function populate(
  area: AreaDef,
  map: ParsedMap,
  player: GridPoint,
  bossDefeated: boolean,
  rng: number,
): [MapMonster[], number] {
  const monsters: MapMonster[] = [];
  let nextId = 1;
  const boss = bossMonster(area, map, bossDefeated, nextId);
  if (boss) {
    monsters.push(boss);
    nextId++;
  }
  for (let i = 0; i < area.monsterCount; i++) {
    let m: MapMonster | null;
    [m, rng] = spawnMonster(area, map, monsters, player, nextId++, rng);
    if (!m) break;
    monsters.push(m);
  }
  return [monsters, rng];
}

/**
 * One wander decision: usually stay, sometimes step to a free neighbouring tile.
 * Bosses never move. Monsters never step onto other monsters or the player.
 */
export function wanderStep(
  monster: MapMonster,
  map: ParsedMap,
  others: GridPoint[],
  rng: number,
): [GridPoint, number] {
  const here = { x: monster.x, y: monster.y };
  if (monster.isBoss) return [here, rng];
  let moves: boolean;
  [moves, rng] = roll(rng, WORLD.wanderChance);
  if (!moves) return [here, rng];
  const options = walkableNeighbours((x, y) => isWalkable(map, x, y), here).filter(
    (p) => !others.some((o) => samePoint(o, p)) && !map.exits.some((e) => samePoint(e, p)),
  );
  if (options.length === 0) return [here, rng];
  let i: number;
  [i, rng] = nextInt(rng, options.length);
  return [options[i]!, rng];
}

/** The monster standing on a tile, if any. */
export function monsterAt(monsters: MapMonster[], p: GridPoint): MapMonster | undefined {
  return monsters.find((m) => m.x === p.x && m.y === p.y);
}
