import type { AreaMap } from '../../engine/types';

// Pagoda floor maps. X = exit back to the Sect Grounds, m = monster spawn points,
// G = boss gate, B = where the boss waits. See engine/map.ts for the legend.

export const floor1Map: AreaMap = {
  id: 'pagoda-floor-1',
  tileset: 'field',
  rows: [
    '########################',
    '#X.....,,,,###,,,,,....#',
    '#.P....,,,,,#,,,,m,,...#',
    '#......,m,,,,,,,,,,,...#',
    '#,,,,,,,,,,oo,,,,,,,,,,#',
    '#,,~~~,,,,,,,,,,,,,,~~,#',
    '#,,~~~~,,,m,,,,,,,,~~~,#',
    '#,,,~~,,,,,,,,,m,,,,~,,#',
    '#,,,,,,,,,,,,,,,,,,,,,,#',
    '#,,##,,,,,,,,,,,,,,,##,#',
    '#,,##,,,m,,,,,,,,,,,##,#',
    '#,,,,,,,,,,,,,,,m,,,,,,#',
    '#,,,,,,,,,oo,,,,,,,,,,,#',
    '#,,,,,,,,,,,,,,,,,,,,,,#',
    '#,,,m,,,,,,,,,,,,,,m,,,#',
    '#,,,,,,,,,,,,,,,,,,,,,,#',
    '#####,,,,,,,,,,,,,,#####',
    '########################',
  ],
};

export const floor2Map: AreaMap = {
  id: 'pagoda-floor-2',
  tileset: 'field',
  rows: [
    '##########################',
    '#,,,,,,,,,,,,,,,,,,,,,,,,#',
    '#,X.P,,,m,,,,oo,,,m,,,,,,#',
    '#,,,,,,,,,,,,,,,,,,,,,,,,#',
    '#,,,###,,,,,,,,,,,,###,,,#',
    '#,,,###,,,,m,,,,,,,###,,,#',
    '#,,,,,,,,,,,,,,,,,,,,,,,,#',
    '#~~,,,,,,,,,,,,,,,,,,,,~~#',
    '#~~~,,,m,,,,oooo,,,m,,~~~#',
    '#~~,,,,,,,,,,,,,,,,,,,,~~#',
    '#,,,,,,,,,,,,,,,,,,,,,,,,#',
    '#,,,###,,,,,,,,,,,,###,,,#',
    '#,,,###,,,m,,,,,m,,###,,,#',
    '#,,,,,,,,,,,,,,,,,,,,,,,,#',
    '#,,,,,,,,,,,oo,,,,,,,,,,,#',
    '#,,m,,,,,,,,,,,,,,,,,m,,,#',
    '#,,,,,,,,,,,,,,,,,,,,,,,,#',
    '##########################',
  ],
};

export const floor3Map: AreaMap = {
  id: 'pagoda-floor-3',
  tileset: 'field',
  rows: [
    '##########################',
    '#######,,,,,,,,,,,,#######',
    '#######,,,,,B,,,,,,#######',
    '#######,,,,,,,,,,,,#######',
    '#######,,,,,,,,,,,,#######',
    '###########~G~############',
    '#,,,,,,,,,,~.~,,,,,,,,,,,#',
    '#,,m,,,,,,,,.,,,,,,,,m,,,#',
    '#,,,,,,,,,,,.,,,,,,,,,,,,#',
    '#,,,,oo,,,,,,,,,,,oo,,,,,#',
    '#,,,,,,,,,m,,,,,m,,,,,,,,#',
    '#~~,,,,,,,,,,,,,,,,,,,,~~#',
    '#~~~,,m,,,,,,,,,,,,m,,~~~#',
    '#,,,,,,,,,,,,,,,,,,,,,,,,#',
    '#,,,,m,,,,,,,,,,,,,m,,,,,#',
    '#,,,,,,,,,,,,,,,,,,,,,,,,#',
    '#,,,,,,,,,,,,P,,,,,,,,,,,#',
    '#,,,,,,,,,,,,X,,,,,,,,,,,#',
    '##########################',
  ],
};

// Floors 4–9 reuse the three layouts above with their own tile sets until they get real maps.
export const floor4Map: AreaMap = { ...floor2Map, id: 'pagoda-floor-4', tileset: 'nature' };
export const floor5Map: AreaMap = { ...floor1Map, id: 'pagoda-floor-5', tileset: 'nature' };
export const floor6Map: AreaMap = { ...floor3Map, id: 'pagoda-floor-6', tileset: 'nature' };
export const floor7Map: AreaMap = { ...floor1Map, id: 'pagoda-floor-7', tileset: 'dungeon' };
export const floor8Map: AreaMap = { ...floor2Map, id: 'pagoda-floor-8', tileset: 'dungeon' };
export const floor9Map: AreaMap = { ...floor3Map, id: 'pagoda-floor-9', tileset: 'dungeon' };
