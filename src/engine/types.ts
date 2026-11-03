// Shared types for the game engine. No logic here, only shapes.

export type Element = 'fire' | 'water' | 'metal' | 'wood' | 'earth' | 'none';

/** The five element laws plus sword and time. Time has no techniques. */
export type Law = 'fire' | 'water' | 'metal' | 'wood' | 'earth' | 'sword' | 'time';

export type Realm = 'qiCondensation' | 'foundation' | 'core';

export type StatName = 'vitality' | 'qi' | 'strength' | 'body' | 'agility' | 'divineSense';

export type Stats = Record<StatName, number>;

export type DotType = 'burn' | 'poison' | 'bleed';

export type Side = 'player' | 'enemy';

/**
 * Something a move does besides (or instead of) raw damage.
 * Techniques and enemy moves share this list so one resolver handles both.
 */
export type MoveEffect =
  /** Heal the user by a flat amount. */
  | { kind: 'heal'; amount: number }
  /** Heal the user by a fraction of the damage this move dealt (1 = all of it). */
  | { kind: 'lifesteal'; ratio: number }
  /** Burn / poison / bleed on the target: `damage` per turn for `turns` turns. */
  | { kind: 'dot'; type: DotType; damage: number; turns: number }
  /** Flat stat change on self or target. `turns: Infinity` = rest of the fight. */
  | { kind: 'statMod'; target: 'self' | 'enemy'; stat: StatName; amount: number; turns: number }
  /** Multiply a stat on self or target for a duration (Golden Body: body ×2). */
  | { kind: 'statMul'; target: 'self' | 'enemy'; stat: StatName; multiplier: number; turns: number }
  /** A damage pool on the user that absorbs hits before HP. */
  | { kind: 'shield'; amount: number; turns: number }
  /** Qi Shield basic: shield = body × bodyFactor + current Qi, lasts this turn, Qi drops to 0. */
  | { kind: 'qiShield' }
  /** Circulate Qi basic: gain Qi. */
  | { kind: 'gainQi'; amount: number }
  /** Target skips its next action (pattern does not advance for enemies). */
  | { kind: 'delay' }
  /** Target loses its next action unless it has a shield up. */
  | { kind: 'freeze' }
  /** Target acts after the opponent for `turns` turns regardless of Agility. */
  | { kind: 'actLast'; turns: number }
  /** This move's hits ignore a fraction of the target's Body (0.5 = half, 1 = all). */
  | { kind: 'ignoreBody'; fraction: number }
  /** This move's hits go through the target's Qi Shield. */
  | { kind: 'ignoreQiShield' }
  /** User's next damaging move is multiplied (Coil ×2, Howl ×1.5, Blood Sacrifice ×3). */
  | { kind: 'empower'; multiplier: number }
  /** User's next technique is a guaranteed crit (Sword Intent). */
  | { kind: 'sureCrit' }
  /** User reflects a fraction of HP damage taken back to the attacker for `turns` turns. */
  | { kind: 'reflect'; ratio: number; turns: number }
  /** Flat dodge chance bonus on self for `turns` turns (0.3 = +30%). */
  | { kind: 'dodgeBonus'; amount: number; turns: number }
  /** User loses a fraction of its own current HP (Blood Sacrifice). */
  | { kind: 'selfHpCost'; fraction: number };

/**
 * Any action in combat: player basics, player techniques and enemy moves.
 * `power` is multiplied by the user's Strength. `power: 0` means no attack.
 */
export interface Move {
  id: string;
  name: string;
  /** Damage multiplier on Strength. 0 = this move does not attack. */
  power: number;
  /** Number of separate hits, each rolled on its own. */
  hits: number;
  qiCost: number;
  /** Element of the attack. Enemy moves without one use the enemy's element. */
  element?: Element;
  /** Which law gains comprehension when used. Basics and enemy moves have none. */
  law?: Law;
  effects: MoveEffect[];
  /** Show this move as the intent this many turns before it happens, even without a memory. */
  warnTurnsAhead?: number;
}

/** A technique the player can learn and equip. */
export interface Technique extends Move {
  law: Law;
  element: Element;
  kind: 'starter' | 'scroll' | 'mastery';
}

/** Something that interrupts an enemy's pattern once a condition is met. */
export type EnemyTrigger =
  /** Once, the first time HP drops to or below `fraction` of max HP. */
  | { kind: 'hpBelow'; fraction: number; move: Move; once: true }
  /** Every Nth turn (turn 9, 18, 27, …). */
  | { kind: 'everyNthTurn'; n: number; move: Move };

export interface EnemyDef {
  id: string;
  name: string;
  element: Element;
  /** Floor band this enemy appears in. */
  realm: Realm;
  /** Boss of its realm (fought at the end of floors 3, 6 and 9). */
  boss?: boolean;
  hp: number;
  strength: number;
  body: number;
  agility: number;
  /** Moves used in order, looping. */
  pattern: Move[];
  triggers?: EnemyTrigger[];
  /** HP healed at the end of every turn (Ancient Treant). */
  regenPerTurn?: number;
  /** Element changes every N turns, following `elementRotation`. */
  elementRotation?: { every: number; elements: Element[] };
  /** Mirror Spirit: copies the player's stats and last-used technique. */
  mirror?: boolean;
}

/** A status sitting on a combatant during a fight. */
export type Status =
  | { kind: 'dot'; type: DotType; damage: number; turnsLeft: number }
  | { kind: 'statMod'; stat: StatName; amount: number; expiresAfterTurn: number }
  | { kind: 'statMul'; stat: StatName; multiplier: number; expiresAfterTurn: number }
  | { kind: 'shield'; amount: number; source: 'qiShield' | 'technique'; expiresAfterTurn: number }
  | { kind: 'delay' }
  | { kind: 'freeze' }
  | { kind: 'actLast'; expiresAfterTurn: number }
  | { kind: 'empower'; multiplier: number }
  | { kind: 'sureCrit' }
  | { kind: 'reflect'; ratio: number; expiresAfterTurn: number }
  | { kind: 'dodgeBonus'; amount: number; expiresAfterTurn: number };

export interface Combatant {
  side: Side;
  name: string;
  element: Element;
  stats: Stats;
  hp: number;
  maxHp: number;
  qi: number;
  maxQi: number;
  statuses: Status[];
}

export interface PlayerCombatant extends Combatant {
  side: 'player';
  /** Equipped techniques (up to the equip limit) — basics are always available. */
  techniques: Technique[];
  /** Law levels, used for the per-level damage bonus. */
  lawLevels: Partial<Record<Law, number>>;
}

export interface EnemyCombatant extends Combatant {
  side: 'enemy';
  def: EnemyDef;
  /** Index into def.pattern of the next move. */
  patternIndex: number;
  /** Ids of once-only triggers that already fired. */
  firedTriggers: string[];
}

export type CombatResult = 'ongoing' | 'won' | 'lost';

export interface LogEntry {
  turn: number;
  text: string;
  /** Who the line is about, for colouring in the UI. */
  side?: Side;
  /** Damage dealt, when the line is a hit. */
  damage?: number;
  crit?: boolean;
  dodged?: boolean;
}

export interface CombatState {
  turn: number;
  player: PlayerCombatant;
  enemy: EnemyCombatant;
  /** Seeded RNG state. Advances with every roll so fights replay identically. */
  rng: number;
  result: CombatResult;
  log: LogEntry[];
  /** Last technique the player used (Mirror Spirit copies it). */
  lastPlayerMoveId?: string;
  /** Which law the player used most this fight (boss comprehension bonus). */
  lawUse: Partial<Record<Law, number>>;
}
