// Every area map by id. A new area needs its map listed here.
import type { AreaMap } from '../../engine/types';
import { sectGroundsMap } from './sectGrounds';
import {
  floor1Map, floor2Map, floor3Map, floor4Map, floor5Map, floor6Map, floor7Map, floor8Map, floor9Map,
} from './pagodaFloors';

export const MAPS: AreaMap[] = [
  sectGroundsMap,
  floor1Map, floor2Map, floor3Map, floor4Map, floor5Map, floor6Map, floor7Map, floor8Map, floor9Map,
];

export function getMap(id: string): AreaMap {
  const map = MAPS.find((m) => m.id === id);
  if (!map) throw new Error(`Unknown map: ${id}`);
  return map;
}
