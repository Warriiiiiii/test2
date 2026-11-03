// Pagoda layout: floors, fights per floor, which floors hold a realm boss.
import type { Realm } from '../engine/types';

export const PAGODA = {
  floors: 9,
  fightsPerFloor: 3,
  bossFloors: [3, 6, 9],
} as const;

export function realmOfFloor(floor: number): Realm {
  if (floor <= 3) return 'qiCondensation';
  if (floor <= 6) return 'foundation';
  return 'core';
}

export function isBossFloor(floor: number): boolean {
  return (PAGODA.bossFloors as readonly number[]).includes(floor);
}
