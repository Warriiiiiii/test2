import type { Element } from './types';
import { ELEMENT_BEATS } from '../data/elements';
import { COMBAT } from '../data/stats';

/** True if `attacker` beats `defender` in the counter cycle. */
export function beats(attacker: Element, defender: Element): boolean {
  return ELEMENT_BEATS[attacker] === defender;
}

/** Damage multiplier for an attack of one element against a defender of another. */
export function elementMultiplier(attacker: Element, defender: Element): number {
  if (beats(attacker, defender)) return COMBAT.elementCounterMultiplier;
  if (beats(defender, attacker)) return COMBAT.elementWeakMultiplier;
  return 1;
}
