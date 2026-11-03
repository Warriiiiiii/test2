import { describe, expect, it } from 'vitest';
import { isWalkable, parseMap, tileAt } from '../src/engine/map';

const sample = {
  id: 'sample',
  tileset: 'field',
  rows: [
    '#######',
    '#P.,=X#',
    '#m~o.m#',
    '#.GB.M#',
    '###E###',
  ],
};

describe('parseMap', () => {
  it('reads size, start and points of interest', () => {
    const m = parseMap(sample);
    expect(m.width).toBe(7);
    expect(m.height).toBe(5);
    expect(m.start).toEqual({ x: 1, y: 1 });
    expect(m.spawnPoints).toEqual([{ x: 1, y: 2 }, { x: 5, y: 2 }]);
    expect(m.exits).toEqual([{ x: 5, y: 1 }]);
    expect(m.gate).toEqual({ x: 2, y: 3 });
    expect(m.bossSpot).toEqual({ x: 3, y: 3 });
    expect(m.meditation).toEqual({ x: 5, y: 3 });
    expect(m.entrance).toEqual({ x: 3, y: 4 });
  });

  it('maps legend characters to tile kinds', () => {
    const m = parseMap(sample);
    expect(tileAt(m, 0, 0)).toBe('tree');
    expect(tileAt(m, 2, 1)).toBe('ground');
    expect(tileAt(m, 3, 1)).toBe('grass');
    expect(tileAt(m, 4, 1)).toBe('path');
    expect(tileAt(m, 2, 2)).toBe('water');
    expect(tileAt(m, 3, 2)).toBe('rock');
    expect(tileAt(m, 1, 2)).toBe('ground'); // spawn points are plain ground
    expect(tileAt(m, 9, 9)).toBeUndefined();
  });

  it('rejects ragged rows, unknown tiles and missing starts', () => {
    expect(() => parseMap({ id: 'ragged', tileset: 'field', rows: ['..', '...'] })).toThrow(/row 1/);
    expect(() => parseMap({ id: 'weird', tileset: 'field', rows: ['P?'] })).toThrow(/unknown tile '\?'/);
    expect(() => parseMap({ id: 'nostart', tileset: 'field', rows: ['...'] })).toThrow(/exactly one player start/);
    expect(() => parseMap({ id: 'twostarts', tileset: 'field', rows: ['P.P'] })).toThrow(/found 2/);
    expect(() => parseMap({ id: 'empty', tileset: 'field', rows: [] })).toThrow(/no rows/);
  });
});

describe('isWalkable', () => {
  const m = parseMap(sample);

  it('blocks trees, rocks, water and the edge of the map', () => {
    expect(isWalkable(m, 0, 0)).toBe(false);
    expect(isWalkable(m, 2, 2)).toBe(false);
    expect(isWalkable(m, 3, 2)).toBe(false);
    expect(isWalkable(m, -1, 1)).toBe(false);
    expect(isWalkable(m, 1, 99)).toBe(false);
  });

  it('allows ground, grass, path, exits, spots and special tiles', () => {
    for (const [x, y] of [[1, 1], [3, 1], [4, 1], [5, 1], [1, 2], [3, 3], [5, 3], [3, 4]]) {
      expect(isWalkable(m, x!, y!)).toBe(true);
    }
  });

  it('treats the gate as a wall until it opens', () => {
    expect(isWalkable(m, 2, 3)).toBe(false);
    expect(isWalkable(m, 2, 3, true)).toBe(true);
  });
});
