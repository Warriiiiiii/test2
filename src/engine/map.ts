// Turns an ASCII area map into tiles and points of interest. Pure, validated, no Phaser here.
//
// Legend (one character per tile):
//   .  ground         walkable
//   ,  grass          walkable, drawn with a grass tuft
//   =  path           walkable, drawn as stone
//   #  tree           blocked
//   o  rock           blocked
//   ~  water          blocked
//   X  exit           walkable, stepping on it leaves the area
//   P  player start   walkable ground, exactly one per map
//   m  monster spawn  walkable ground, where monsters may appear
//   G  boss gate      blocked until the gate opens, then walkable
//   B  boss spot      walkable ground, where the boss waits
//   M  meditation     walkable, tap to cultivate (hub)
//   E  entrance       walkable, tap to open the world screen (hub)
import type { AreaMap } from './types';
import type { GridPoint } from './pathfinding';

export type TileKind =
  | 'ground' | 'grass' | 'path' | 'tree' | 'rock' | 'water' | 'exit' | 'gate' | 'meditation' | 'entrance';

const LEGEND: Record<string, TileKind> = {
  '.': 'ground',
  ',': 'grass',
  '=': 'path',
  '#': 'tree',
  o: 'rock',
  '~': 'water',
  X: 'exit',
  P: 'ground',
  m: 'ground',
  G: 'gate',
  B: 'ground',
  M: 'meditation',
  E: 'entrance',
};

const BLOCKED: ReadonlySet<TileKind> = new Set<TileKind>(['tree', 'rock', 'water']);

export interface ParsedMap {
  id: string;
  width: number;
  height: number;
  /** tiles[y][x] */
  tiles: TileKind[][];
  start: GridPoint;
  spawnPoints: GridPoint[];
  exits: GridPoint[];
  gate?: GridPoint;
  bossSpot?: GridPoint;
  meditation?: GridPoint;
  entrance?: GridPoint;
}

/** Parse and validate a map. Throws a readable error for broken data. */
export function parseMap(map: AreaMap): ParsedMap {
  const height = map.rows.length;
  if (height === 0) throw new Error(`Map ${map.id}: no rows`);
  const width = map.rows[0]!.length;

  const parsed: ParsedMap = { id: map.id, width, height, tiles: [], start: { x: -1, y: -1 }, spawnPoints: [], exits: [] };
  let starts = 0;

  map.rows.forEach((row, y) => {
    if (row.length !== width) throw new Error(`Map ${map.id}: row ${y} has ${row.length} tiles, expected ${width}`);
    const tiles: TileKind[] = [];
    [...row].forEach((ch, x) => {
      const kind = LEGEND[ch];
      if (!kind) throw new Error(`Map ${map.id}: unknown tile '${ch}' at ${x},${y}`);
      tiles.push(kind);
      const p = { x, y };
      if (ch === 'P') { parsed.start = p; starts++; }
      if (ch === 'm') parsed.spawnPoints.push(p);
      if (ch === 'X') parsed.exits.push(p);
      if (ch === 'G') parsed.gate = p;
      if (ch === 'B') parsed.bossSpot = p;
      if (ch === 'M') parsed.meditation = p;
      if (ch === 'E') parsed.entrance = p;
    });
    parsed.tiles.push(tiles);
  });

  if (starts !== 1) throw new Error(`Map ${map.id}: needs exactly one player start 'P', found ${starts}`);
  return parsed;
}

export function tileAt(map: ParsedMap, x: number, y: number): TileKind | undefined {
  return map.tiles[y]?.[x];
}

/** Can something stand on this tile? The gate counts as a wall until it opens. */
export function isWalkable(map: ParsedMap, x: number, y: number, gateOpen = false): boolean {
  const kind = tileAt(map, x, y);
  if (!kind) return false;
  if (kind === 'gate') return gateOpen;
  return !BLOCKED.has(kind);
}

export function samePoint(a: GridPoint, b: GridPoint): boolean {
  return a.x === b.x && a.y === b.y;
}
