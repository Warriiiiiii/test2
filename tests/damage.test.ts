import { describe, expect, it } from 'vitest';
import { computeDamage, takeTurn } from '../src/engine/combat';
import { COMBAT } from '../src/data/stats';
import { dummy, fight, flatStats, strike, tech } from './helpers';

describe('damage formula', () => {
  it('is Strength × power − Body', () => {
    expect(computeDamage({ strength: 10, power: 1.5, targetBody: 3, elementMult: 1, crit: false })).toBe(12);
  });

  it('never drops below the minimum', () => {
    expect(computeDamage({ strength: 2, power: 1, targetBody: 50, elementMult: 1, crit: false })).toBe(COMBAT.minDamage);
  });

  it('doubles on crit', () => {
    expect(computeDamage({ strength: 10, power: 1, targetBody: 0, elementMult: 1, crit: true })).toBe(20);
  });

  it('applies the element counter multiplier', () => {
    expect(computeDamage({ strength: 10, power: 1, targetBody: 0, elementMult: 1.5, crit: false })).toBe(15);
  });

  it('stacks element, crit and extra multipliers, then rounds', () => {
    // (10 × 1.2 − 1) = 11 → × 1.5 × 2 × 2 = 66
    expect(computeDamage({ strength: 10, power: 1.2, targetBody: 1, elementMult: 1.5, crit: true, extraMult: 2 })).toBe(66);
    // 7 × 0.7 = 4.9 → rounds to 5
    expect(computeDamage({ strength: 7, power: 0.7, targetBody: 0, elementMult: 1, crit: false })).toBe(5);
  });
});

describe('damage in a fight', () => {
  it('Palm Strike deals Strength − Body to the enemy', () => {
    const s = takeTurn(fight({ stats: flatStats({ strength: 10 }) }, dummy({ body: 3 })), 'palmStrike');
    expect(s.enemy.hp).toBe(1000 - 7);
  });

  it('enemy hits the player with its own Strength against the player Body', () => {
    const enemy = dummy({ strength: 8, pattern: [strike(1.5)] });
    const s = takeTurn(fight({ stats: flatStats({ body: 2 }) }, enemy), 'circulateQi');
    expect(s.player.hp).toBe(100 - 10);
  });

  it('multi-hit techniques roll each hit on its own', () => {
    const twoHits = tech({ id: 'twin', power: 0.9, hits: 2, law: 'sword', element: 'none' });
    const s = takeTurn(fight({ stats: flatStats({ strength: 10 }), techniques: [twoHits] }, dummy({ body: 4 })), 'twin');
    // Each hit: 10 × 0.9 − 4 = 5, twice.
    expect(s.enemy.hp).toBe(1000 - 10);
    expect(s.log.filter((l) => l.damage && l.side === 'player')).toHaveLength(2);
  });

  it('ignoreBody skips part or all of the target Body', () => {
    const half = tech({ id: 'half', power: 1, effects: [{ kind: 'ignoreBody', fraction: 0.5 }] });
    const all = tech({ id: 'all', power: 1, effects: [{ kind: 'ignoreBody', fraction: 1 }] });
    const enemy = dummy({ body: 6 });
    const a = takeTurn(fight({ stats: flatStats({ strength: 10 }), techniques: [half, all] }, enemy), 'half');
    expect(a.enemy.hp).toBe(1000 - 7);
    const b = takeTurn(fight({ stats: flatStats({ strength: 10 }), techniques: [half, all] }, enemy), 'all');
    expect(b.enemy.hp).toBe(1000 - 10);
  });

  it('law level adds damage to that law techniques', () => {
    const fire = tech({ id: 'ff', power: 1, law: 'fire', element: 'none' });
    const s = takeTurn(fight({ stats: flatStats({ strength: 10 }), techniques: [fire], lawLevels: { fire: 4 } }, dummy()), 'ff');
    expect(s.enemy.hp).toBe(1000 - 12);
  });

  it('costs Qi and refuses a move the player cannot afford', () => {
    const pricey = tech({ id: 'pricey', power: 1, qiCost: 12 });
    const s0 = fight({ stats: flatStats({ qi: 20 }), techniques: [pricey] }, dummy());
    const s1 = takeTurn(s0, 'pricey');
    expect(s1.player.qi).toBe(20 - 12 + COMBAT.qiRegenPerTurn);
    expect(() => takeTurn(s1, 'pricey')).toThrow();
  });

  it('never mutates the previous state', () => {
    const s0 = fight({}, dummy({ pattern: [strike()] }));
    const snapshot = JSON.stringify(s0);
    takeTurn(s0, 'palmStrike');
    expect(JSON.stringify(s0)).toBe(snapshot);
  });
});
