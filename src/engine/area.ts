// Area progress and unlocking, on top of the run state. Pure functions over region data.
import type { AreaDef, AreaProgress, RegionDef, UnlockCondition } from './types';
import type { RunState } from './run';
import { REGIONS } from '../data/regions';
import { REALMS } from '../data/cultivation';

export function allRegions(): RegionDef[] {
  return REGIONS;
}

export function findArea(areaId: string): AreaDef {
  for (const region of REGIONS) {
    const area = region.areas.find((a) => a.id === areaId);
    if (area) return area;
  }
  throw new Error(`Unknown area: ${areaId}`);
}

export function findRegion(regionId: string): RegionDef {
  const region = REGIONS.find((r) => r.id === regionId);
  if (!region) throw new Error(`Unknown region: ${regionId}`);
  return region;
}

export function progressOf(run: RunState, areaId: string): AreaProgress {
  return run.areaProgress[areaId] ?? { wins: 0, bossDefeated: false };
}

export function isAreaCleared(area: AreaDef, run: RunState): boolean {
  return area.kind === 'hub' || progressOf(run, area.id).wins >= area.winsToClear;
}

export function conditionMet(condition: UnlockCondition, run: RunState): boolean {
  switch (condition.kind) {
    case 'always':
      return true;
    case 'areaCleared':
      return isAreaCleared(findArea(condition.areaId), run);
    case 'realm':
      return REALMS.indexOf(run.realm) >= REALMS.indexOf(condition.realm);
  }
}

export function isAreaUnlocked(area: AreaDef, run: RunState): boolean {
  return conditionMet(area.unlock, run);
}

export function isRegionUnlocked(region: RegionDef, run: RunState): boolean {
  return conditionMet(region.unlock, run);
}

/** The boss gate opens once the area is cleared and the player stands at realm peak. */
export function canOpenBossGate(area: AreaDef, run: RunState): boolean {
  if (!area.boss) return false;
  return isAreaCleared(area, run) && run.atRealmPeak;
}

/** Count a won fight in an area. Boss wins are remembered separately. */
export function recordWin(run: RunState, area: AreaDef, enemyId: string): RunState {
  const before = progressOf(run, area.id);
  const isBoss = area.boss === enemyId;
  const progress: AreaProgress = {
    wins: isBoss ? before.wins : before.wins + 1,
    bossDefeated: before.bossDefeated || isBoss,
  };
  return {
    ...run,
    areaProgress: { ...run.areaProgress, [area.id]: progress },
    bossesBeaten: run.bossesBeaten + (isBoss ? 1 : 0),
  };
}

/** Remember the highest pagoda floor entered this run. */
export function enterArea(run: RunState, area: AreaDef): RunState {
  const floor = area.floor ?? 0;
  return floor > run.highestFloor ? { ...run, highestFloor: floor } : run;
}
