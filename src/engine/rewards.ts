// Reward cards after a won fight: drawing three and applying the chosen one. Seeded and pure.
import type { StatName } from './types';
import type { RunState } from './run';
import { nextInt } from './rng';
import { CULTIVATION_HERB, PILL_HEAL_FRACTION, REWARD_CARDS_OFFERED, SPIRIT_HERB_BOOSTS } from '../data/rewards';
import { REALM_REWARD_MULTIPLIER } from '../data/cultivation';
import { TECHNIQUES } from '../data/techniques';
import { COMBAT } from '../data/stats';

export type RewardCard =
  | { kind: 'spiritHerb'; stat: StatName; amount: number }
  | { kind: 'cultivationHerb'; bonus: number; durationSeconds: number }
  | { kind: 'scroll'; techniqueId: string }
  | { kind: 'pill'; healFraction: number };

const STAT_NAMES = Object.keys(SPIRIT_HERB_BOOSTS) as StatName[];

/** Scroll techniques the player has not learned this run. */
export function availableScrolls(run: RunState): string[] {
  return TECHNIQUES.filter((t) => t.kind === 'scroll' && !run.learned.includes(t.id)).map((t) => t.id);
}

function spiritHerbAmount(stat: StatName, run: RunState): number {
  return Math.round(SPIRIT_HERB_BOOSTS[stat] * REALM_REWARD_MULTIPLIER[run.realm]);
}

/**
 * Draw the cards offered after a fight: a few random spirit herbs, a cultivation herb,
 * a scroll when one is left to learn, and a pill. Shuffled, then the first three.
 */
export function drawRewardCards(run: RunState, rng: number): [RewardCard[], number] {
  const candidates: RewardCard[] = [];

  // Two different spirit herbs.
  let a: number;
  let b: number;
  [a, rng] = nextInt(rng, STAT_NAMES.length);
  [b, rng] = nextInt(rng, STAT_NAMES.length - 1);
  if (b >= a) b += 1;
  for (const i of [a, b]) {
    const stat = STAT_NAMES[i]!;
    candidates.push({ kind: 'spiritHerb', stat, amount: spiritHerbAmount(stat, run) });
  }

  candidates.push({ kind: 'cultivationHerb', bonus: CULTIVATION_HERB.rateBonus, durationSeconds: CULTIVATION_HERB.durationSeconds });

  const scrolls = availableScrolls(run);
  if (scrolls.length > 0) {
    let i: number;
    [i, rng] = nextInt(rng, scrolls.length);
    candidates.push({ kind: 'scroll', techniqueId: scrolls[i]! });
  }

  candidates.push({ kind: 'pill', healFraction: PILL_HEAL_FRACTION });

  // Fisher–Yates shuffle, then take the cards offered.
  for (let i = candidates.length - 1; i > 0; i--) {
    let j: number;
    [j, rng] = nextInt(rng, i + 1);
    [candidates[i], candidates[j]] = [candidates[j]!, candidates[i]!];
  }
  return [candidates.slice(0, REWARD_CARDS_OFFERED), rng];
}

/** Apply the chosen card. `now` is the current time in ms, for timed boosters. */
export function applyReward(run: RunState, card: RewardCard, now: number): RunState {
  switch (card.kind) {
    case 'spiritHerb': {
      const stats = { ...run.stats, [card.stat]: run.stats[card.stat] + card.amount };
      // Growing Vitality also grows current HP by the same amount.
      const hp = card.stat === 'vitality' ? run.hp + card.amount : run.hp;
      return { ...run, stats, hp };
    }
    case 'cultivationHerb':
      return {
        ...run,
        boosters: [...run.boosters, { kind: 'cultivationRate', bonus: card.bonus, expiresAt: now + card.durationSeconds * 1000 }],
      };
    case 'scroll': {
      if (run.learned.includes(card.techniqueId)) return run;
      const equipped = run.equipped.length < COMBAT.equipSlots ? [...run.equipped, card.techniqueId] : run.equipped;
      return { ...run, learned: [...run.learned, card.techniqueId], equipped };
    }
    case 'pill': {
      const max = run.stats.vitality;
      return { ...run, hp: Math.min(max, run.hp + Math.round(max * card.healFraction)) };
    }
  }
}
