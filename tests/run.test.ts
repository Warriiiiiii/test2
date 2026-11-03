import { describe, expect, it } from 'vitest';
import { createRun, nextSeed, playerSetup, restored, toggleEquip, withHp } from '../src/engine/run';
import { BASE_STATS, COMBAT } from '../src/data/stats';

describe('run setup', () => {
  it('starts in Qi Condensation with base stats, full HP and the element starter equipped', () => {
    const run = createRun('fire', 1);
    expect(run.stats).toEqual(BASE_STATS);
    expect(run.hp).toBe(BASE_STATS.vitality);
    expect(run.learned).toEqual(['flameFinger']);
    expect(run.equipped).toEqual(['flameFinger']);
    expect(run.realm).toBe('qiCondensation');
    expect(run.areaProgress).toEqual({});
    expect(run.atRealmPeak).toBe(false);
    expect(run.highestFloor).toBe(0);
    expect(run.bossesBeaten).toBe(0);
    expect(run.boosters).toEqual([]);
  });

  it('builds a player setup the combat engine accepts', () => {
    const run = createRun('water', 1);
    const setup = playerSetup({ ...run, hp: 20 });
    expect(setup.element).toBe('water');
    expect(setup.hp).toBe(20);
    expect(setup.techniques.map((t) => t.id)).toEqual(['tidePalm']);
  });

  it('seeds advance the run rng and differ', () => {
    const run = createRun('wood', 8);
    const [a, run2] = nextSeed(run);
    const [b] = nextSeed(run2);
    expect(a).not.toBe(b);
    expect(run2.rng).not.toBe(run.rng);
  });

  it('withHp clamps to the valid range, restored heals fully', () => {
    const run = createRun('metal', 1);
    expect(withHp(run, -5).hp).toBe(0);
    expect(withHp(run, 999).hp).toBe(BASE_STATS.vitality);
    expect(withHp(run, 12).hp).toBe(12);
    expect(restored({ ...run, hp: 3 }).hp).toBe(BASE_STATS.vitality);
  });
});

describe('equipping', () => {
  it('toggles learned techniques and respects the slot limit', () => {
    let run = { ...createRun('earth', 1), learned: ['stoneSkin', 'a', 'b', 'c', 'd'] };
    run = toggleEquip(run, 'a', COMBAT.equipSlots);
    run = toggleEquip(run, 'b', COMBAT.equipSlots);
    run = toggleEquip(run, 'c', COMBAT.equipSlots);
    expect(run.equipped).toEqual(['stoneSkin', 'a', 'b', 'c']);
    expect(toggleEquip(run, 'd', COMBAT.equipSlots).equipped).toEqual(['stoneSkin', 'a', 'b', 'c']); // full
    run = toggleEquip(run, 'stoneSkin', COMBAT.equipSlots);
    expect(run.equipped).toEqual(['a', 'b', 'c']);
    expect(toggleEquip(run, 'notLearned', COMBAT.equipSlots)).toBe(run);
  });
});
