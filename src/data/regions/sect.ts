import type { RegionDef } from '../../engine/types';

// The home region: one safe hub where every run starts.
export const SECT_REGION: RegionDef = {
  id: 'sect',
  name: 'Azure Cloud Sect',
  description: 'A small sect at the foot of the mountain. Servants sweep, disciples cultivate.',
  unlock: { kind: 'always' },
  areas: [
    {
      id: 'sect-grounds',
      name: 'Sect Grounds',
      kind: 'hub',
      realm: 'qiCondensation',
      map: 'sect-grounds',
      music: 'village',
      pool: [],
      monsterCount: 0,
      winsToClear: 0,
      unlock: { kind: 'always' },
    },
  ],
};
