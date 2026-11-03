import { describe, expect, it } from 'vitest';
import { findPath, manhattan, walkableNeighbours, type WalkableFn } from '../src/engine/pathfinding';

/** Build a walkable function from ASCII rows: '.' walkable, anything else blocked. */
function grid(rows: string[]): WalkableFn {
  return (x, y) => y >= 0 && y < rows.length && x >= 0 && x < rows[y]!.length && rows[y]![x] === '.';
}

describe('findPath', () => {
  it('walks a straight line, excluding the start and including the goal', () => {
    const path = findPath(grid(['.....']), { x: 0, y: 0 }, { x: 3, y: 0 });
    expect(path).toEqual([{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }]);
  });

  it('returns an empty path when already there', () => {
    expect(findPath(grid(['...']), { x: 1, y: 0 }, { x: 1, y: 0 })).toEqual([]);
  });

  it('goes around walls with the shortest route', () => {
    const rows = [
      '.....',
      '.###.',
      '.....',
    ];
    const path = findPath(grid(rows), { x: 0, y: 1 }, { x: 4, y: 1 })!;
    expect(path).not.toBeNull();
    expect(path).toHaveLength(6);
    expect(path[path.length - 1]).toEqual({ x: 4, y: 1 });
    for (const p of path) expect(rows[p.y]![p.x]).toBe('.');
  });

  it('returns null when the goal is blocked or unreachable', () => {
    expect(findPath(grid(['..#..']), { x: 0, y: 0 }, { x: 2, y: 0 })).toBeNull();
    expect(findPath(grid(['..#..']), { x: 0, y: 0 }, { x: 4, y: 0 })).toBeNull();
    expect(findPath(grid(['...']), { x: 0, y: 0 }, { x: 0, y: 5 })).toBeNull();
  });

  it('never moves diagonally', () => {
    const path = findPath(grid(['...', '...', '...']), { x: 0, y: 0 }, { x: 2, y: 2 })!;
    let prev = { x: 0, y: 0 };
    for (const p of path) {
      expect(manhattan(prev, p)).toBe(1);
      prev = p;
    }
    expect(path).toHaveLength(4);
  });

  it('gives up on huge searches without hanging', () => {
    const everywhere: WalkableFn = () => true;
    expect(findPath(everywhere, { x: 0, y: 0 }, { x: 5000, y: 5000 }, 500)).toBeNull();
  });
});

describe('helpers', () => {
  it('manhattan distance', () => {
    expect(manhattan({ x: 1, y: 1 }, { x: 4, y: -1 })).toBe(5);
  });

  it('walkable neighbours skips blocked and out-of-range tiles', () => {
    const n = walkableNeighbours(grid(['.#', '..']), { x: 0, y: 0 });
    expect(n).toEqual([{ x: 0, y: 1 }]);
  });
});
