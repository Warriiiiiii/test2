// Every technique in the game, plus the three basics.
// Format follows the spec: power (× Strength), Qi cost, effects.
import type { Move, Technique } from '../engine/types';
import { COMBAT } from './stats';

/** "Rest of the fight" duration for status effects. */
export const WHOLE_FIGHT = Infinity;

/** Basics: always available, no law. */
export const BASICS: Move[] = [
  { id: 'palmStrike', name: 'Palm Strike', power: 1.0, hits: 1, qiCost: 0, element: 'none', effects: [] },
  { id: 'qiShield', name: 'Qi Shield', power: 0, hits: 0, qiCost: 0, element: 'none', effects: [{ kind: 'qiShield' }] },
  {
    id: 'circulateQi',
    name: 'Circulate Qi',
    power: 0,
    hits: 0,
    qiCost: 0,
    element: 'none',
    effects: [{ kind: 'gainQi', amount: COMBAT.circulateQiAmount }],
  },
];

export const TECHNIQUES: Technique[] = [
  // --- Fire ---
  { id: 'flameFinger', name: 'Flame Finger', law: 'fire', element: 'fire', kind: 'starter', power: 1.6, hits: 1, qiCost: 4, effects: [] },
  { id: 'seaOfFlames', name: 'Sea of Flames', law: 'fire', element: 'fire', kind: 'scroll', power: 3.0, hits: 1, qiCost: 12, effects: [] },
  {
    id: 'burningPalm', name: 'Burning Palm', law: 'fire', element: 'fire', kind: 'mastery', power: 1.2, hits: 1, qiCost: 5,
    effects: [{ kind: 'dot', type: 'burn', damage: 3, turns: 3 }],
  },

  // --- Water ---
  {
    id: 'tidePalm', name: 'Tide Palm', law: 'water', element: 'water', kind: 'starter', power: 1.2, hits: 1, qiCost: 3,
    effects: [{ kind: 'heal', amount: 4 }],
  },
  {
    id: 'frostLotus', name: 'Frost Lotus', law: 'water', element: 'water', kind: 'scroll', power: 1.5, hits: 1, qiCost: 6,
    effects: [{ kind: 'actLast', turns: 2 }],
  },
  {
    id: 'returningCurrent', name: 'Returning Current', law: 'water', element: 'water', kind: 'mastery', power: 0, hits: 0, qiCost: 6,
    effects: [{ kind: 'heal', amount: 15 }],
  },

  // --- Metal ---
  {
    id: 'ironNeedle', name: 'Iron Needle', law: 'metal', element: 'metal', kind: 'starter', power: 1.4, hits: 1, qiCost: 3,
    effects: [{ kind: 'ignoreBody', fraction: 0.5 }],
  },
  {
    id: 'goldenBell', name: 'Golden Bell', law: 'metal', element: 'metal', kind: 'scroll', power: 0, hits: 0, qiCost: 8,
    effects: [{ kind: 'shield', amount: 20, turns: 2 }],
  },
  {
    id: 'piercingEdge', name: 'Piercing Edge', law: 'metal', element: 'metal', kind: 'mastery', power: 2.2, hits: 1, qiCost: 7,
    effects: [{ kind: 'ignoreBody', fraction: 1 }],
  },

  // --- Wood ---
  {
    id: 'vineBind', name: 'Vine Bind', law: 'wood', element: 'wood', kind: 'starter', power: 0.8, hits: 1, qiCost: 3,
    effects: [{ kind: 'delay' }],
  },
  {
    id: 'verdantLeech', name: 'Verdant Leech', law: 'wood', element: 'wood', kind: 'scroll', power: 1.5, hits: 1, qiCost: 6,
    effects: [{ kind: 'lifesteal', ratio: 1 }],
  },
  {
    id: 'thornArmor', name: 'Thorn Armor', law: 'wood', element: 'wood', kind: 'mastery', power: 0, hits: 0, qiCost: 6,
    effects: [{ kind: 'reflect', ratio: 0.3, turns: 3 }],
  },

  // --- Earth ---
  {
    id: 'stoneSkin', name: 'Stone Skin', law: 'earth', element: 'earth', kind: 'starter', power: 0, hits: 0, qiCost: 3,
    effects: [{ kind: 'statMod', target: 'self', stat: 'body', amount: 3, turns: 3 }],
  },
  { id: 'mountainCrush', name: 'Mountain Crush', law: 'earth', element: 'earth', kind: 'scroll', power: 2.8, hits: 1, qiCost: 10, effects: [] },
  {
    id: 'earthquake', name: 'Earthquake', law: 'earth', element: 'earth', kind: 'mastery', power: 1.5, hits: 1, qiCost: 6,
    effects: [{ kind: 'statMod', target: 'enemy', stat: 'body', amount: -2, turns: WHOLE_FIGHT }],
  },

  // --- Sword (no element, scrolls only) ---
  { id: 'swiftSword', name: 'Swift Sword', law: 'sword', element: 'none', kind: 'scroll', power: 0.9, hits: 2, qiCost: 4, effects: [] },
  { id: 'thousandCuts', name: 'Thousand Cuts', law: 'sword', element: 'none', kind: 'scroll', power: 0.7, hits: 5, qiCost: 12, effects: [] },
  {
    id: 'swordIntent', name: 'Sword Intent', law: 'sword', element: 'none', kind: 'mastery', power: 0, hits: 0, qiCost: 3,
    effects: [{ kind: 'sureCrit' }],
  },
];

/** Starter technique given by the run element. */
export const STARTER_BY_ELEMENT = {
  fire: 'flameFinger',
  water: 'tidePalm',
  metal: 'ironNeedle',
  wood: 'vineBind',
  earth: 'stoneSkin',
} as const;

export function getTechnique(id: string): Technique {
  const t = TECHNIQUES.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown technique: ${id}`);
  return t;
}

export function getBasic(id: string): Move {
  const b = BASICS.find((x) => x.id === id);
  if (!b) throw new Error(`Unknown basic: ${id}`);
  return b;
}

/** Find any player move by id: a basic first, then a technique. */
export function getMove(id: string): Move {
  return BASICS.find((x) => x.id === id) ?? getTechnique(id);
}
