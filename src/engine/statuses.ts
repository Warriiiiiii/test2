// Status effects: reading a combatant's effective stats and ticking durations.
import type { Combatant, StatName, Status } from './types';
import { COMBAT } from '../data/stats';

/** A stat after flat mods and multipliers from statuses. Never below 0. */
export function effectiveStat(c: Combatant, stat: StatName): number {
  let value = c.stats[stat];
  for (const s of c.statuses) {
    if (s.kind === 'statMod' && s.stat === stat) value += s.amount;
  }
  for (const s of c.statuses) {
    if (s.kind === 'statMul' && s.stat === stat) value *= s.multiplier;
  }
  return Math.max(0, value);
}

export function dodgeChance(c: Combatant): number {
  let chance = Math.min(COMBAT.dodgeCap, effectiveStat(c, 'agility') * COMBAT.dodgePerAgility);
  for (const s of c.statuses) {
    if (s.kind === 'dodgeBonus') chance += s.amount;
  }
  return Math.min(1, chance);
}

export function critChance(c: Combatant): number {
  return Math.min(COMBAT.critCap, effectiveStat(c, 'divineSense') * COMBAT.critPerDivineSense);
}

export function hasStatus(c: Combatant, kind: Status['kind']): boolean {
  return c.statuses.some((s) => s.kind === kind);
}

/** Remove and return the first status of a kind (for one-shot statuses like freeze or empower). */
export function consumeStatus<K extends Status['kind']>(
  c: Combatant,
  kind: K,
): Extract<Status, { kind: K }> | undefined {
  const i = c.statuses.findIndex((s) => s.kind === kind);
  if (i === -1) return undefined;
  const [removed] = c.statuses.splice(i, 1);
  return removed as Extract<Status, { kind: K }>;
}

export function totalShield(c: Combatant): number {
  return c.statuses.reduce((sum, s) => (s.kind === 'shield' ? sum + s.amount : sum), 0);
}

/**
 * Drain `damage` from shields, oldest first. Returns how much got through.
 * `ignoreQiShield` skips the Qi Shield basic (Sword Qi).
 */
export function absorbWithShields(c: Combatant, damage: number, ignoreQiShield = false): { through: number; blocked: number } {
  let remaining = damage;
  let blocked = 0;
  for (const s of c.statuses) {
    if (remaining <= 0) break;
    if (s.kind !== 'shield') continue;
    if (ignoreQiShield && s.source === 'qiShield') continue;
    const used = Math.min(s.amount, remaining);
    s.amount -= used;
    remaining -= used;
    blocked += used;
  }
  c.statuses = c.statuses.filter((s) => !(s.kind === 'shield' && s.amount <= 0));
  return { through: remaining, blocked };
}

/**
 * Duration bookkeeping at the end of a turn.
 * Timed statuses carry `expiresAfterTurn`; they are dropped once that turn is over.
 * DoTs count ticks instead and are handled by the combat resolver (they deal damage).
 */
export function expireStatuses(c: Combatant, turn: number): void {
  c.statuses = c.statuses.filter((s) => {
    if ('expiresAfterTurn' in s) return s.expiresAfterTurn > turn;
    if (s.kind === 'dot') return s.turnsLeft > 0;
    return true;
  });
}

/**
 * When a status is applied, this says which turn it lasts through.
 * A status applied by the actor who moved second this turn would otherwise be wasted
 * (the opponent already acted), so it gets one extra turn.
 */
export function expiryTurn(turn: number, turns: number, appliedBySecondActor: boolean): number {
  return turn + turns - 1 + (appliedBySecondActor ? 1 : 0);
}
