import { describe, expect, it } from 'vitest';
import { ENEMIES, bossOf, regularEnemiesOf } from '../src/data/enemies';
import { BASICS, STARTER_BY_ELEMENT, TECHNIQUES, getTechnique } from '../src/data/techniques';
import { LAWS, comprehensionForLevel } from '../src/data/laws';
import { REALMS } from '../src/data/cultivation';
import { spiritArrayCost } from '../src/data/talents';
import { isBossFloor, realmOfFloor } from '../src/data/pagoda';
import { COMBAT } from '../src/data/stats';

describe('data integrity', () => {
  it('technique and basic ids are unique', () => {
    const ids = [...BASICS, ...TECHNIQUES].map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every element has a starter that exists', () => {
    for (const id of Object.values(STARTER_BY_ELEMENT)) expect(getTechnique(id).kind).toBe('starter');
  });

  it('every element law and sword has one mastery technique', () => {
    for (const law of ['fire', 'water', 'metal', 'wood', 'earth', 'sword'] as const) {
      expect(TECHNIQUES.filter((t) => t.law === law && t.kind === 'mastery')).toHaveLength(1);
    }
  });

  it('enemy ids are unique and each realm has a boss and regular enemies', () => {
    const ids = ENEMIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const realm of REALMS) {
      expect(bossOf(realm).boss).toBe(true);
      expect(regularEnemiesOf(realm).length).toBeGreaterThanOrEqual(3);
    }
    for (const e of ENEMIES) expect(e.pattern.length).toBeGreaterThan(0);
  });

  it('comprehension curve is 10 × n²', () => {
    expect([1, 2, 3, 9].map(comprehensionForLevel)).toEqual([10, 40, 90, 810]);
    expect(LAWS).toHaveLength(7);
  });

  it('Spirit Gathering Array cost doubles per level', () => {
    expect([1, 2, 3, 4].map(spiritArrayCost)).toEqual([5, 10, 20, 40]);
  });

  it('floors map to realms and boss floors', () => {
    expect(realmOfFloor(1)).toBe('qiCondensation');
    expect(realmOfFloor(5)).toBe('foundation');
    expect(realmOfFloor(9)).toBe('core');
    expect([3, 6, 9].every(isBossFloor)).toBe(true);
    expect(isBossFloor(4)).toBe(false);
  });

  it('caps are sane', () => {
    expect(COMBAT.dodgeCap).toBeLessThan(1);
    expect(COMBAT.critCap).toBeLessThan(1);
  });
});
