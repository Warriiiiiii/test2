import type { AreaDef, EnemyPoolEntry, RegionDef } from '../../engine/types';
import { regularEnemiesOf, bossOf } from '../enemies';
import { realmOfFloor } from '../pagoda';

// The Ninefold Heaven Pagoda: nine floors, one area each.
// winsToClear / monsters on map / boss follow the table in CLAUDE.md section 6.

function poolOf(floor: number): EnemyPoolEntry[] {
  return regularEnemiesOf(realmOfFloor(floor)).map((e) => ({ enemyId: e.id, weight: 1 }));
}

interface FloorSpec {
  winsToClear: number;
  monsterCount: number;
  boss?: true;
  music: string;
}

const FLOORS: Record<number, FloorSpec> = {
  1: { winsToClear: 3, monsterCount: 4, music: 'adventure' },
  2: { winsToClear: 4, monsterCount: 5, music: 'adventure' },
  3: { winsToClear: 3, monsterCount: 4, boss: true, music: 'tension' },
  4: { winsToClear: 4, monsterCount: 5, music: 'cave' },
  5: { winsToClear: 5, monsterCount: 5, music: 'cave' },
  6: { winsToClear: 4, monsterCount: 5, boss: true, music: 'tension' },
  7: { winsToClear: 5, monsterCount: 5, music: 'dungeon' },
  8: { winsToClear: 5, monsterCount: 6, music: 'dungeon' },
  9: { winsToClear: 4, monsterCount: 5, boss: true, music: 'finalArea' },
};

/** Floor 1 is open from the start. A new realm's first floor opens with the breakthrough; others when the floor below is cleared. */
function unlockOf(floor: number): AreaDef['unlock'] {
  if (floor === 1) return { kind: 'always' };
  if (floor === 4) return { kind: 'realm', realm: 'foundation' };
  if (floor === 7) return { kind: 'realm', realm: 'core' };
  return { kind: 'areaCleared', areaId: `pagoda-floor-${floor - 1}` };
}

function floorArea(floor: number): AreaDef {
  const spec = FLOORS[floor]!;
  const realm = realmOfFloor(floor);
  const area: AreaDef = {
    id: `pagoda-floor-${floor}`,
    name: `Floor ${floor}`,
    kind: 'field',
    realm,
    floor,
    map: `pagoda-floor-${floor}`,
    music: spec.music,
    pool: poolOf(floor),
    monsterCount: spec.monsterCount,
    winsToClear: spec.winsToClear,
    unlock: unlockOf(floor),
  };
  if (spec.boss) area.boss = bossOf(realm).id;
  return area;
}

export const PAGODA_REGION: RegionDef = {
  id: 'pagoda',
  name: 'Ninefold Heaven Pagoda',
  description: 'Nine floors above the clouds. Each realm boss guards the way to the next.',
  unlock: { kind: 'always' },
  areas: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(floorArea),
};
