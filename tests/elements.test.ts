import { describe, expect, it } from 'vitest';
import { beats, elementMultiplier } from '../src/engine/elements';
import { takeTurn } from '../src/engine/combat';
import { COMBAT } from '../src/data/stats';
import { getTechnique } from '../src/data/techniques';
import { dummy, fight, flatStats, strike } from './helpers';

describe('element counters', () => {
  it('follows water > fire > metal > wood > earth > water', () => {
    expect(beats('water', 'fire')).toBe(true);
    expect(beats('fire', 'metal')).toBe(true);
    expect(beats('metal', 'wood')).toBe(true);
    expect(beats('wood', 'earth')).toBe(true);
    expect(beats('earth', 'water')).toBe(true);
  });

  it('does not run backwards', () => {
    expect(beats('fire', 'water')).toBe(false);
    expect(beats('metal', 'fire')).toBe(false);
    expect(beats('fire', 'fire')).toBe(false);
  });

  it('none is neutral', () => {
    expect(elementMultiplier('none', 'fire')).toBe(1);
    expect(elementMultiplier('fire', 'none')).toBe(1);
  });

  it('uses the data multipliers', () => {
    expect(elementMultiplier('water', 'fire')).toBe(COMBAT.elementCounterMultiplier);
    expect(elementMultiplier('fire', 'water')).toBe(COMBAT.elementWeakMultiplier);
    expect(elementMultiplier('fire', 'wood')).toBe(1);
  });

  it('a technique element counters the enemy element', () => {
    const flame = getTechnique('flameFinger'); // fire, power 1.6
    const metalEnemy = dummy({ element: 'metal' });
    const s = takeTurn(fight({ stats: flatStats({ strength: 10 }), techniques: [flame] }, metalEnemy), 'flameFinger');
    expect(s.enemy.hp).toBe(1000 - 24); // 16 × 1.5
  });

  it('an enemy element counters the player run element', () => {
    const waterEnemy = dummy({ element: 'water', strength: 10, pattern: [strike(1)] });
    const s = takeTurn(fight({ element: 'fire' }, waterEnemy), 'circulateQi');
    expect(s.player.hp).toBe(100 - 15);
  });

  it('Palm Strike has no element and gets no bonus', () => {
    const s = takeTurn(fight({ element: 'water', stats: flatStats({ strength: 10 }) }, dummy({ element: 'fire' })), 'palmStrike');
    expect(s.enemy.hp).toBe(1000 - 10);
  });
});
