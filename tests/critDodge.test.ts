import { describe, expect, it } from 'vitest';
import { critChance, dodgeChance } from '../src/engine/statuses';
import { createCombat, takeTurn } from '../src/engine/combat';
import { COMBAT } from '../src/data/stats';
import { dummy, fight, flatStats, play, setup, strike } from './helpers';

describe('crit and dodge chances', () => {
  it('scale with the stat and cap', () => {
    const s = fight({ stats: flatStats({ agility: 10, divineSense: 5 }) }, dummy());
    expect(dodgeChance(s.player)).toBeCloseTo(10 * COMBAT.dodgePerAgility);
    expect(critChance(s.player)).toBeCloseTo(5 * COMBAT.critPerDivineSense);

    const capped = fight({ stats: flatStats({ agility: 99, divineSense: 99 }) }, dummy());
    expect(dodgeChance(capped.player)).toBe(COMBAT.dodgeCap);
    expect(critChance(capped.player)).toBe(COMBAT.critCap);
  });
});

describe('crit and dodge with seeded rng', () => {
  it('the same seed replays the same fight', () => {
    const player = setup({ stats: flatStats({ agility: 10, divineSense: 10 }) });
    const enemy = dummy({ strength: 5, agility: 10, pattern: [strike()] });
    const a = play(createCombat(player, enemy, 99), 'palmStrike', 20);
    const b = play(createCombat(player, enemy, 99), 'palmStrike', 20);
    expect(a.log).toEqual(b.log);
    expect(a.player.hp).toBe(b.player.hp);
  });

  it('different seeds can play out differently', () => {
    const player = setup({ stats: flatStats({ agility: 20, divineSense: 10 }) });
    const enemy = dummy({ strength: 5, pattern: [strike()] });
    const seeds = [1, 2, 3, 4, 5].map((seed) => play(createCombat(player, enemy, seed), 'palmStrike', 20).player.hp);
    expect(new Set(seeds).size).toBeGreaterThan(1);
  });

  it('crits land about as often as Divine Sense says and deal double', () => {
    const player = setup({ stats: flatStats({ strength: 10, divineSense: 10 }) }); // 30% crit
    let crits = 0;
    let hits = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const s = play(createCombat(player, dummy({ hp: 100000 }), seed), 'palmStrike', 10);
      for (const line of s.log) {
        if (line.side !== 'player' || !line.damage) continue;
        hits++;
        if (line.crit) {
          crits++;
          expect(line.damage).toBe(20);
        } else {
          expect(line.damage).toBe(10);
        }
      }
    }
    expect(hits).toBe(1000);
    expect(crits / hits).toBeGreaterThan(0.25);
    expect(crits / hits).toBeLessThan(0.35);
  });

  it('dodges happen about as often as Agility says and take no damage', () => {
    const player = setup({ stats: flatStats({ agility: 10 }) }); // 20% dodge
    const enemy = dummy({ strength: 1, agility: 50, pattern: [strike()] }); // enemy acts first, 1 damage
    let dodges = 0;
    let attacks = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const s = play(createCombat(player, enemy, seed), 'circulateQi', 10);
      const enemyLines = s.log.filter((l) => l.dodged || (l.damage && l.side === 'enemy'));
      attacks += enemyLines.length;
      dodges += enemyLines.filter((l) => l.dodged).length;
      expect(s.player.hp).toBe(100 - (enemyLines.length - enemyLines.filter((l) => l.dodged).length));
    }
    expect(attacks).toBe(1000);
    expect(dodges / attacks).toBeGreaterThan(0.16);
    expect(dodges / attacks).toBeLessThan(0.24);
  });

  it('dodged hits do not apply on-hit effects', () => {
    const player = setup({ stats: flatStats({ agility: 99 }) }); // 40% dodge
    const burner = dummy({ strength: 1, pattern: [strike(1, { effects: [{ kind: 'dot', type: 'burn', damage: 1, turns: 1 }] })] });
    for (let seed = 1; seed <= 20; seed++) {
      const s = takeTurn(createCombat(player, burner, seed), 'circulateQi');
      const dodged = s.log.some((l) => l.dodged);
      const burned = s.log.some((l) => l.text.includes('burn'));
      expect(burned).toBe(!dodged);
    }
  });
});
