// Grid pathfinding for tap-to-move. Breadth-first search, four directions, no diagonals.
// Maps are small (a few hundred tiles), so BFS is plenty and always finds the shortest path.

export interface GridPoint {
  x: number;
  y: number;
}

/** Tells whether a tile can be walked on. Out-of-range tiles must return false. */
export type WalkableFn = (x: number, y: number) => boolean;

const DIRECTIONS: GridPoint[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

/**
 * Shortest path from `from` to `to`, as the tiles to step through (excluding `from`, including `to`).
 * Returns null when `to` is unreachable or not walkable, and [] when already there.
 */
export function findPath(walkable: WalkableFn, from: GridPoint, to: GridPoint, maxTiles = 10_000): GridPoint[] | null {
  if (from.x === to.x && from.y === to.y) return [];
  if (!walkable(to.x, to.y)) return null;

  const key = (p: GridPoint) => `${p.x},${p.y}`;
  const cameFrom = new Map<string, GridPoint | null>();
  cameFrom.set(key(from), null);
  const queue: GridPoint[] = [from];
  let head = 0;

  while (head < queue.length && cameFrom.size <= maxTiles) {
    const current = queue[head++]!;
    for (const d of DIRECTIONS) {
      const next = { x: current.x + d.x, y: current.y + d.y };
      const k = key(next);
      if (cameFrom.has(k) || !walkable(next.x, next.y)) continue;
      cameFrom.set(k, current);
      if (next.x === to.x && next.y === to.y) return rebuild(cameFrom, next, key);
      queue.push(next);
    }
  }
  return null;
}

function rebuild(cameFrom: Map<string, GridPoint | null>, end: GridPoint, key: (p: GridPoint) => string): GridPoint[] {
  const path: GridPoint[] = [];
  let current: GridPoint | null = end;
  while (current) {
    path.push(current);
    current = cameFrom.get(key(current)) ?? null;
  }
  path.pop(); // drop the start tile
  return path.reverse();
}

export function manhattan(a: GridPoint, b: GridPoint): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/** The four tiles next to `p` that are walkable. */
export function walkableNeighbours(walkable: WalkableFn, p: GridPoint): GridPoint[] {
  return DIRECTIONS.map((d) => ({ x: p.x + d.x, y: p.y + d.y })).filter((n) => walkable(n.x, n.y));
}
