// Every enemy and boss: HP / Strength / Body / Agility, element, move pattern.
// Enemy moves have no Qi cost. A move without an element uses the enemy's element.
import type { EnemyDef, Move } from '../engine/types';
import { WHOLE_FIGHT } from './techniques';

/** Small helper so plain attacks stay one line. */
function hit(id: string, name: string, power: number, extra: Partial<Move> = {}): Move {
  return { id, name, power, hits: 1, qiCost: 0, effects: [], ...extra };
}

export const ENEMIES: EnemyDef[] = [
  // ===== Floors 1–3: Qi Condensation =====
  {
    id: 'spiritRat', name: 'Spirit Rat', element: 'wood', realm: 'qiCondensation',
    hp: 20, strength: 4, body: 0, agility: 6,
    pattern: [hit('bite', 'Bite', 1.0), hit('bite', 'Bite', 1.0), hit('frenzy', 'Frenzy', 0.8, { hits: 2 })],
  },
  {
    id: 'ironShellTurtle', name: 'Iron-Shell Turtle', element: 'earth', realm: 'qiCondensation',
    hp: 35, strength: 3, body: 4, agility: 1,
    pattern: [
      hit('withdraw', 'Withdraw', 0, { hits: 0, effects: [{ kind: 'statMod', target: 'self', stat: 'body', amount: 4, turns: 1 }] }),
      hit('slam', 'Slam', 1.5),
    ],
  },
  {
    id: 'emberFox', name: 'Ember Fox', element: 'fire', realm: 'qiCondensation',
    hp: 25, strength: 6, body: 1, agility: 5,
    pattern: [
      hit('foxFire', 'Fox Fire', 0.8, { effects: [{ kind: 'dot', type: 'burn', damage: 2, turns: 3 }] }),
      hit('bite', 'Bite', 1.0),
      hit('evasiveStance', 'Evasive Stance', 0, { hits: 0, effects: [{ kind: 'dodgeBonus', amount: 0.3, turns: 1 }] }),
    ],
  },
  {
    id: 'outerSectBully', name: 'Outer Sect Bully', element: 'metal', realm: 'qiCondensation',
    hp: 30, strength: 5, body: 2, agility: 3,
    pattern: [hit('strike', 'Strike', 1.0), hit('strike', 'Strike', 1.0), hit('ironFist', 'Iron Fist', 2.0)],
  },
  {
    id: 'jadePythonKing', name: 'Jade Python King', element: 'water', realm: 'qiCondensation', boss: true,
    hp: 120, strength: 8, body: 3, agility: 4,
    pattern: [
      hit('coil', 'Coil', 0, { hits: 0, effects: [{ kind: 'empower', multiplier: 2 }] }),
      hit('constrict', 'Constrict', 1.2),
      hit('venomSpit', 'Venom Spit', 0.6, { effects: [{ kind: 'dot', type: 'poison', damage: 4, turns: 3 }] }),
    ],
    triggers: [
      { kind: 'hpBelow', fraction: 0.5, once: true, move: hit('shedSkin', 'Shed Skin', 0, { hits: 0, effects: [{ kind: 'heal', amount: 20 }] }) },
    ],
  },

  // ===== Floors 4–6: Foundation Establishment =====
  {
    id: 'bloodthornWolf', name: 'Bloodthorn Wolf', element: 'wood', realm: 'foundation',
    hp: 60, strength: 12, body: 4, agility: 9,
    pattern: [
      hit('howl', 'Howl', 0, { hits: 0, effects: [{ kind: 'empower', multiplier: 1.5 }] }),
      hit('pounce', 'Pounce', 1.2),
      hit('rend', 'Rend', 1.0, { effects: [{ kind: 'dot', type: 'bleed', damage: 5, turns: 3 }] }),
    ],
  },
  {
    id: 'lavaGolem', name: 'Lava Golem', element: 'fire', realm: 'foundation',
    hp: 110, strength: 10, body: 10, agility: 2,
    pattern: [
      hit('charge', 'Charge', 1.2),
      hit('charge', 'Charge', 1.2),
      hit('magmaBurst', 'Magma Burst', 3.0, { warnTurnsAhead: 2 }),
    ],
  },
  {
    id: 'wanderingSwordsman', name: 'Wandering Swordsman', element: 'none', realm: 'foundation',
    hp: 80, strength: 14, body: 5, agility: 8,
    pattern: [
      hit('swiftSword', 'Swift Sword', 0.9, { hits: 2 }),
      hit('swiftSword', 'Swift Sword', 0.9, { hits: 2 }),
      hit('swordQi', 'Sword Qi', 1.8, { effects: [{ kind: 'ignoreQiShield' }] }),
    ],
  },
  {
    id: 'frostWraith', name: 'Frost Wraith', element: 'water', realm: 'foundation',
    hp: 70, strength: 11, body: 3, agility: 7,
    pattern: [hit('chill', 'Chill', 1.0), hit('freeze', 'Freeze', 0.5, { effects: [{ kind: 'freeze' }] })],
  },
  {
    id: 'elderJin', name: 'Elder Jin of the Golden Pavilion', element: 'metal', realm: 'foundation', boss: true,
    hp: 300, strength: 16, body: 8, agility: 6,
    pattern: [
      hit('goldenBell', 'Golden Bell', 0, { hits: 0, effects: [{ kind: 'shield', amount: 40, turns: WHOLE_FIGHT }] }),
      hit('metalRain', 'Metal Rain', 0.7, { hits: 3 }),
    ],
    triggers: [
      {
        kind: 'hpBelow', fraction: 0.5, once: true,
        move: hit('goldenBody', 'Golden Body', 0, { hits: 0, effects: [{ kind: 'statMul', target: 'self', stat: 'body', multiplier: 2, turns: 3 }] }),
      },
    ],
  },

  // ===== Floors 7–9: Core Formation =====
  {
    id: 'thunderRoc', name: 'Thunder Roc', element: 'metal', realm: 'core',
    hp: 180, strength: 22, body: 6, agility: 14,
    pattern: [
      hit('wingGust', 'Wing Gust', 1.0),
      hit('wingGust', 'Wing Gust', 1.0),
      hit('skyDive', 'Sky Dive', 3.0, { warnTurnsAhead: 1 }),
    ],
  },
  {
    id: 'ancientTreant', name: 'Ancient Treant', element: 'wood', realm: 'core',
    hp: 300, strength: 18, body: 14, agility: 1,
    regenPerTurn: 10,
    pattern: [
      hit('rootLash', 'Root Lash', 1.2),
      hit('entangle', 'Entangle', 0, { hits: 0, effects: [{ kind: 'delay' }] }),
    ],
  },
  {
    id: 'demonicCultivator', name: 'Demonic Cultivator', element: 'fire', realm: 'core',
    hp: 200, strength: 24, body: 8, agility: 8,
    pattern: [
      hit('bloodSacrifice', 'Blood Sacrifice', 0, {
        hits: 0,
        effects: [{ kind: 'selfHpCost', fraction: 0.1 }, { kind: 'empower', multiplier: 3 }],
      }),
      hit('demonPalm', 'Demon Palm', 1.2),
    ],
  },
  {
    id: 'mirrorSpirit', name: 'Mirror Spirit', element: 'none', realm: 'core',
    // Strength / Body / Agility are copied from the player when the fight starts.
    hp: 150, strength: 0, body: 0, agility: 0,
    mirror: true,
    pattern: [hit('reflection', 'Reflection', 1.0)],
  },
  {
    id: 'nineColoredTribulation', name: 'Nine-Colored Tribulation', element: 'fire', realm: 'core', boss: true,
    hp: 900, strength: 40, body: 12, agility: 10,
    elementRotation: { every: 2, elements: ['fire', 'water', 'metal', 'wood', 'earth'] },
    pattern: [hit('tribulationBolt', 'Tribulation Bolt', 1.0)],
    triggers: [{ kind: 'everyNthTurn', n: 9, move: hit('heavensJudgment', "Heaven's Judgment", 5.0) }],
  },
];

export function getEnemy(id: string): EnemyDef {
  const e = ENEMIES.find((x) => x.id === id);
  if (!e) throw new Error(`Unknown enemy: ${id}`);
  return e;
}

/** Regular (non-boss) enemies of a realm, used to draw random floor fights. */
export function regularEnemiesOf(realm: EnemyDef['realm']): EnemyDef[] {
  return ENEMIES.filter((e) => e.realm === realm && !e.boss);
}

export function bossOf(realm: EnemyDef['realm']): EnemyDef {
  const b = ENEMIES.find((e) => e.realm === realm && e.boss);
  if (!b) throw new Error(`No boss for realm ${realm}`);
  return b;
}
