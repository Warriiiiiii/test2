import { describe, expect, it } from 'vitest';
import {
  allRegions, canOpenBossGate, enterArea, findArea, findRegion, isAreaCleared, isAreaUnlocked, isRegionUnlocked, progressOf, recordWin,
} from '../src/engine/area';
import { createRun } from '../src/engine/run';

const run0 = createRun('fire', 1);
const floor1 = findArea('pagoda-floor-1');
const floor2 = findArea('pagoda-floor-2');
const floor3 = findArea('pagoda-floor-3');
const floor4 = findArea('pagoda-floor-4');

describe('lookups', () => {
  it('finds regions and areas, and throws on unknown ids', () => {
    expect(allRegions().map((r) => r.id)).toEqual(['sect', 'pagoda']);
    expect(findRegion('pagoda').areas).toHaveLength(9);
    expect(floor3.boss).toBe('jadePythonKing');
    expect(() => findArea('nowhere')).toThrow(/Unknown area/);
    expect(() => findRegion('nowhere')).toThrow(/Unknown region/);
  });
});

describe('clearing and unlocking', () => {
  it('a hub is always cleared and unlocked', () => {
    const hub = findArea('sect-grounds');
    expect(isAreaCleared(hub, run0)).toBe(true);
    expect(isAreaUnlocked(hub, run0)).toBe(true);
    expect(isRegionUnlocked(findRegion('sect'), run0)).toBe(true);
  });

  it('floor 1 is open, floor 2 needs floor 1 cleared, floor 4 needs the next realm', () => {
    expect(isAreaUnlocked(floor1, run0)).toBe(true);
    expect(isAreaUnlocked(floor2, run0)).toBe(false);
    let run = run0;
    for (let i = 0; i < floor1.winsToClear; i++) run = recordWin(run, floor1, 'spiritRat');
    expect(isAreaCleared(floor1, run)).toBe(true);
    expect(isAreaUnlocked(floor2, run)).toBe(true);
    expect(isAreaUnlocked(floor4, run)).toBe(false);
    expect(isAreaUnlocked(floor4, { ...run, realm: 'foundation' })).toBe(true);
    expect(isAreaUnlocked(floor4, { ...run, realm: 'core' })).toBe(true);
  });

  it('wins below the threshold do not clear the area', () => {
    const run = recordWin(run0, floor1, 'spiritRat');
    expect(progressOf(run, floor1.id)).toEqual({ wins: 1, bossDefeated: false });
    expect(isAreaCleared(floor1, run)).toBe(false);
  });
});

describe('bosses', () => {
  it('the gate needs the area cleared and the realm peak', () => {
    let run = run0;
    expect(canOpenBossGate(floor3, run)).toBe(false);
    for (let i = 0; i < floor3.winsToClear; i++) run = recordWin(run, floor3, 'emberFox');
    expect(canOpenBossGate(floor3, run)).toBe(false);
    expect(canOpenBossGate(floor3, { ...run, atRealmPeak: true })).toBe(true);
    expect(canOpenBossGate(floor1, { ...run, atRealmPeak: true })).toBe(false); // no boss here
  });

  it('beating the boss is remembered and counted, but is not a regular win', () => {
    const run = recordWin(run0, floor3, 'jadePythonKing');
    expect(progressOf(run, floor3.id)).toEqual({ wins: 0, bossDefeated: true });
    expect(run.bossesBeaten).toBe(1);
  });
});

describe('entering areas', () => {
  it('tracks the highest pagoda floor reached', () => {
    let run = enterArea(run0, findArea('sect-grounds'));
    expect(run.highestFloor).toBe(0);
    run = enterArea(run, floor2);
    expect(run.highestFloor).toBe(2);
    run = enterArea(run, floor1);
    expect(run.highestFloor).toBe(2);
  });
});
