import { describe, expect, it } from 'vitest';
import { applyReward, availableScrolls, drawRewardCards, type RewardCard } from '../src/engine/rewards';
import { createRun } from '../src/engine/run';
import { seedRng } from '../src/engine/rng';
import { CULTIVATION_HERB, PILL_HEAL_FRACTION, REWARD_CARDS_OFFERED, SPIRIT_HERB_BOOSTS } from '../src/data/rewards';
import { REALM_REWARD_MULTIPLIER } from '../src/data/cultivation';
import { TECHNIQUES } from '../src/data/techniques';
import { COMBAT } from '../src/data/stats';

const run0 = createRun('fire', 1);

describe('drawing cards', () => {
  it('offers three valid cards, deterministic per seed', () => {
    const [cards, rng] = drawRewardCards(run0, seedRng(5));
    expect(cards).toHaveLength(REWARD_CARDS_OFFERED);
    expect(rng).not.toBe(seedRng(5));
    for (const c of cards) expect(['spiritHerb', 'cultivationHerb', 'scroll', 'pill']).toContain(c.kind);
    expect(drawRewardCards(run0, seedRng(5))[0]).toEqual(cards);
  });

  it('spirit herbs use the data boosts scaled by realm', () => {
    let seen = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const [cards] = drawRewardCards({ ...run0, realm: 'foundation' }, seedRng(seed));
      for (const c of cards) {
        if (c.kind !== 'spiritHerb') continue;
        seen++;
        expect(c.amount).toBe(Math.round(SPIRIT_HERB_BOOSTS[c.stat] * REALM_REWARD_MULTIPLIER.foundation));
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('never offers a scroll already learned, and none once all are known', () => {
    const scrolls = TECHNIQUES.filter((t) => t.kind === 'scroll').map((t) => t.id);
    const allKnown = { ...run0, learned: [...run0.learned, ...scrolls] };
    expect(availableScrolls(allKnown)).toEqual([]);
    for (let seed = 1; seed <= 30; seed++) {
      expect(drawRewardCards(allKnown, seedRng(seed))[0].some((c) => c.kind === 'scroll')).toBe(false);
      for (const c of drawRewardCards(run0, seedRng(seed))[0]) {
        if (c.kind === 'scroll') expect(run0.learned).not.toContain(c.techniqueId);
      }
    }
  });
});

describe('applying cards', () => {
  it('spirit herb raises the stat, and current HP when it is Vitality', () => {
    const run = applyReward({ ...run0, hp: 20 }, { kind: 'spiritHerb', stat: 'vitality', amount: 5 }, 0);
    expect(run.stats.vitality).toBe(run0.stats.vitality + 5);
    expect(run.hp).toBe(25);
    const str = applyReward(run0, { kind: 'spiritHerb', stat: 'strength', amount: 1 }, 0);
    expect(str.stats.strength).toBe(run0.stats.strength + 1);
    expect(str.hp).toBe(run0.hp);
  });

  it('pill heals half of max HP, capped at max', () => {
    const card: RewardCard = { kind: 'pill', healFraction: PILL_HEAL_FRACTION };
    expect(applyReward({ ...run0, hp: 10 }, card, 0).hp).toBe(10 + Math.round(run0.stats.vitality * PILL_HEAL_FRACTION));
    expect(applyReward({ ...run0, hp: 45 }, card, 0).hp).toBe(run0.stats.vitality);
  });

  it('scroll is learned and equipped while a slot is free', () => {
    let run = applyReward(run0, { kind: 'scroll', techniqueId: 'swiftSword' }, 0);
    expect(run.learned).toContain('swiftSword');
    expect(run.equipped).toEqual(['flameFinger', 'swiftSword']);
    run = { ...run, equipped: ['flameFinger', 'swiftSword', 'seaOfFlames', 'goldenBell'].slice(0, COMBAT.equipSlots) };
    const full = applyReward(run, { kind: 'scroll', techniqueId: 'thousandCuts' }, 0);
    expect(full.learned).toContain('thousandCuts');
    expect(full.equipped).toHaveLength(COMBAT.equipSlots);
    expect(applyReward(full, { kind: 'scroll', techniqueId: 'thousandCuts' }, 0)).toBe(full);
  });

  it('cultivation herb adds a timed booster', () => {
    const now = 1_000_000;
    const run = applyReward(run0, { kind: 'cultivationHerb', bonus: CULTIVATION_HERB.rateBonus, durationSeconds: 60 }, now);
    expect(run.boosters).toEqual([{ kind: 'cultivationRate', bonus: CULTIVATION_HERB.rateBonus, expiresAt: now + 60_000 }]);
  });
});
