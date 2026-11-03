import { describe, expect, it } from 'vitest';
import { REGIONS, START_AREA_ID } from '../src/data/regions';
import { MAPS, getMap } from '../src/data/maps';
import { parseMap } from '../src/engine/map';
import { getEnemy } from '../src/data/enemies';
import { findArea } from '../src/engine/area';

describe('world data integrity', () => {
  const areas = REGIONS.flatMap((r) => r.areas);

  it('area and map ids are unique and the start area exists', () => {
    expect(new Set(areas.map((a) => a.id)).size).toBe(areas.length);
    expect(new Set(MAPS.map((m) => m.id)).size).toBe(MAPS.length);
    expect(findArea(START_AREA_ID).kind).toBe('hub');
  });

  it('every area has a map that parses, with enough spawn points and an exit or hub spots', () => {
    for (const area of areas) {
      const map = parseMap(getMap(area.map));
      if (area.kind === 'field') {
        expect(map.spawnPoints.length, `${area.id} spawn points`).toBeGreaterThanOrEqual(area.monsterCount + 2);
        expect(map.exits.length, `${area.id} exits`).toBeGreaterThan(0);
      } else {
        expect(map.meditation, `${area.id} meditation spot`).toBeDefined();
        expect(map.entrance, `${area.id} entrance`).toBeDefined();
      }
      if (area.boss) {
        expect(map.gate, `${area.id} gate`).toBeDefined();
        expect(map.bossSpot, `${area.id} boss spot`).toBeDefined();
        expect(getEnemy(area.boss).boss).toBe(true);
      } else {
        expect(map.bossSpot).toBeUndefined();
      }
    }
  });

  it('pools reference real enemies of the area realm, and hubs have none', () => {
    for (const area of areas) {
      if (area.kind === 'hub') {
        expect(area.pool).toEqual([]);
        expect(area.monsterCount).toBe(0);
        continue;
      }
      expect(area.pool.length).toBeGreaterThan(0);
      for (const entry of area.pool) {
        const enemy = getEnemy(entry.enemyId);
        expect(enemy.realm).toBe(area.realm);
        expect(entry.weight).toBeGreaterThan(0);
      }
    }
  });

  it('unlock conditions point at existing areas', () => {
    for (const area of areas) {
      if (area.unlock.kind === 'areaCleared') expect(() => findArea((area.unlock as { areaId: string }).areaId)).not.toThrow();
    }
    for (const region of REGIONS) {
      if (region.unlock.kind === 'areaCleared') expect(() => findArea((region.unlock as { areaId: string }).areaId)).not.toThrow();
    }
  });

  it('pagoda floors follow the spec table', () => {
    const floors = findArea('pagoda-floor-1') && REGIONS.find((r) => r.id === 'pagoda')!.areas;
    expect(floors.map((a) => a.winsToClear)).toEqual([3, 4, 3, 4, 5, 4, 5, 5, 4]);
    expect(floors.map((a) => a.monsterCount)).toEqual([4, 5, 4, 5, 5, 5, 5, 6, 5]);
    expect(floors.map((a) => a.boss ?? null)).toEqual([null, null, 'jadePythonKing', null, null, 'elderJin', null, null, 'nineColoredTribulation']);
  });
});
