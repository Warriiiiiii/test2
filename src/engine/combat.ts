// Turn-based combat. Pure functions: `takeTurn` returns a new state and never touches the input.
// One call to `takeTurn` plays a whole round: both actors act in Agility order, then statuses tick.
import type {
  CombatState, Combatant, Element, EnemyCombatant, EnemyDef, Law, Move, MoveEffect,
  PlayerCombatant, Side, Stats, Technique,
} from './types';
import { COMBAT } from '../data/stats';
import { BASICS, getMove } from '../data/techniques';
import { STRINGS } from '../data/strings';
import { seedRng, roll } from './rng';
import { elementMultiplier } from './elements';
import {
  absorbWithShields, consumeStatus, critChance, dodgeChance, effectiveStat, expireStatuses,
  expiryTurn, hasStatus, totalShield,
} from './statuses';

export interface PlayerSetup {
  name?: string;
  /** The run element: the player's defensive element. */
  element: Element;
  stats: Stats;
  /** Equipped techniques. */
  techniques: Technique[];
  lawLevels?: Partial<Record<Law, number>>;
  /** Current HP when the fight starts. Defaults to full. */
  hp?: number;
}

// ---------- Setup ----------

export function createCombat(setup: PlayerSetup, def: EnemyDef, seed: number): CombatState {
  const maxHp = setup.stats.vitality;
  const player: PlayerCombatant = {
    side: 'player',
    name: setup.name ?? 'You',
    element: setup.element,
    stats: { ...setup.stats },
    maxHp,
    hp: Math.min(maxHp, setup.hp ?? maxHp),
    maxQi: setup.stats.qi,
    qi: setup.stats.qi, // Qi is full at the start of each fight
    statuses: [],
    techniques: setup.techniques.slice(0, COMBAT.equipSlots),
    lawLevels: setup.lawLevels ?? {},
  };

  // Mirror Spirit copies the player's combat stats (but keeps its own HP).
  const source = def.mirror ? setup.stats : { strength: def.strength, body: def.body, agility: def.agility, divineSense: 0 };
  const enemy: EnemyCombatant = {
    side: 'enemy',
    name: def.name,
    element: def.elementRotation?.elements[0] ?? def.element,
    stats: {
      vitality: def.hp,
      qi: 0,
      strength: source.strength,
      body: source.body,
      agility: source.agility,
      divineSense: source.divineSense,
    },
    maxHp: def.hp,
    hp: def.hp,
    maxQi: 0,
    qi: 0,
    statuses: [],
    def,
    patternIndex: 0,
    firedTriggers: [],
  };

  return {
    turn: 1,
    player,
    enemy,
    rng: seedRng(seed),
    result: 'ongoing',
    log: [],
    lawUse: {},
  };
}

// ---------- Queries the UI needs ----------

/** Basics plus equipped techniques. */
export function playerMoves(state: CombatState): Move[] {
  return [...BASICS, ...state.player.techniques];
}

export function canUseMove(state: CombatState, move: Move): boolean {
  return state.player.qi >= move.qiCost;
}

export interface Intent {
  /** True when the player can read the enemy (memory or high Divine Sense). */
  known: boolean;
  /** Upcoming moves the player can see, this turn first. Empty when unknown. */
  moves: Move[];
  /** A big move that announces itself early (Magma Burst, Sky Dive), even without a memory. */
  telegraphed?: { move: Move; inTurns: number };
}

export interface IntentOptions {
  hasMemory: boolean;
  /** How many upcoming moves to reveal when known (2 at Time law 3). Default 1. */
  movesVisible?: number;
}

/** What the enemy is about to do, as far as the player can tell. */
export function getEnemyIntent(state: CombatState, opts: IntentOptions): Intent {
  const visible = Math.max(1, opts.movesVisible ?? 1);
  const known = opts.hasMemory || effectiveStat(state.player, 'divineSense') >= COMBAT.intentDivineSense;

  const lookahead = Math.max(visible, 1 + maxWarn(state.enemy.def));
  const upcoming = predictEnemyMoves(state, lookahead);

  let telegraphed: Intent['telegraphed'];
  upcoming.forEach((move, k) => {
    if (!telegraphed && move.warnTurnsAhead !== undefined && k <= move.warnTurnsAhead) {
      telegraphed = { move, inTurns: k };
    }
  });

  const intent: Intent = { known, moves: known ? upcoming.slice(0, visible) : [] };
  if (telegraphed) intent.telegraphed = telegraphed;
  return intent;
}

function maxWarn(def: EnemyDef): number {
  return def.pattern.reduce((m, move) => Math.max(m, move.warnTurnsAhead ?? 0), 0);
}

/** Best guess of the next `count` enemy moves. HP-triggered moves cannot be predicted. */
export function predictEnemyMoves(state: CombatState, count: number): Move[] {
  const { def, patternIndex } = state.enemy;
  const result: Move[] = [];
  for (let k = 0; k < count; k++) {
    const turn = state.turn + k;
    const nth = def.triggers?.find((t) => t.kind === 'everyNthTurn' && turn % t.n === 0);
    if (nth) {
      result.push(nth.move);
    } else if (def.mirror) {
      result.push(mirrorMove(state));
    } else {
      result.push(def.pattern[(patternIndex + k) % def.pattern.length]!);
    }
  }
  return result;
}

/** For rotating-element bosses: the element they will shift to and in how many turns. */
export function getNextEnemyElement(state: CombatState): { element: Element; inTurns: number } | undefined {
  const rot = state.enemy.def.elementRotation;
  if (!rot) return undefined;
  const phase = Math.floor((state.turn - 1) / rot.every);
  const next = rot.elements[(phase + 1) % rot.elements.length]!;
  const inTurns = rot.every - ((state.turn - 1) % rot.every);
  return { element: next, inTurns };
}

// ---------- The round ----------

/** Play one full round with the player using `moveId` (a basic or an equipped technique). */
export function takeTurn(state: CombatState, moveId: string): CombatState {
  if (state.result !== 'ongoing') return state;

  const move = playerMoves(state).find((m) => m.id === moveId);
  if (!move) throw new Error(`Move not available: ${moveId}`);
  if (state.player.qi < move.qiCost) throw new Error(STRINGS.log.notEnoughQi(move.name));

  const s = structuredClone(state);
  const order = turnOrder(s);

  order.forEach((side, i) => {
    if (s.result !== 'ongoing') return;
    const actedSecond = i === 1;
    if (side === 'player') {
      performMove(s, s.player, s.enemy, move, actedSecond);
    } else {
      // Chosen at action time so HP triggers and the Mirror Spirit see what the player just did.
      const choice = chooseEnemyMove(s);
      const acted = performMove(s, s.enemy, s.player, choice.move, actedSecond);
      if (acted) commitEnemyChoice(s.enemy, choice);
    }
  });

  endOfTurn(s);
  return s;
}

/** Who moves first this round. Player wins Agility ties. `actLast` overrides Agility. */
export function turnOrder(state: CombatState): [Side, Side] {
  const playerLast = hasStatus(state.player, 'actLast');
  const enemyLast = hasStatus(state.enemy, 'actLast');
  if (playerLast && !enemyLast) return ['enemy', 'player'];
  if (enemyLast && !playerLast) return ['player', 'enemy'];
  const playerAgi = effectiveStat(state.player, 'agility');
  const enemyAgi = effectiveStat(state.enemy, 'agility');
  return playerAgi >= enemyAgi ? ['player', 'enemy'] : ['enemy', 'player'];
}

// ---------- Enemy AI ----------

interface EnemyChoice {
  move: Move;
  /** True when the move came from the pattern and should advance it once used. */
  fromPattern: boolean;
  /** Id of a once-only trigger to mark as fired once the move is used. */
  triggerId?: string;
}

function chooseEnemyMove(state: CombatState): EnemyChoice {
  const enemy = state.enemy;
  const def = enemy.def;

  for (const trigger of def.triggers ?? []) {
    if (trigger.kind === 'everyNthTurn' && state.turn % trigger.n === 0) {
      return { move: trigger.move, fromPattern: false };
    }
    if (trigger.kind === 'hpBelow') {
      const id = `hpBelow:${trigger.fraction}`;
      const triggered = enemy.hp <= enemy.maxHp * trigger.fraction && !enemy.firedTriggers.includes(id);
      if (triggered) return { move: trigger.move, fromPattern: false, triggerId: id };
    }
  }

  if (def.mirror) return { move: mirrorMove(state), fromPattern: false };

  return { move: def.pattern[enemy.patternIndex % def.pattern.length]!, fromPattern: true };
}

function commitEnemyChoice(enemy: EnemyCombatant, choice: EnemyChoice): void {
  if (choice.fromPattern) enemy.patternIndex = (enemy.patternIndex + 1) % enemy.def.pattern.length;
  if (choice.triggerId) enemy.firedTriggers.push(choice.triggerId);
}

/** Mirror Spirit repeats the player's last move (Palm Strike before the player has acted). */
function mirrorMove(state: CombatState): Move {
  const id = state.lastPlayerMoveId ?? 'palmStrike';
  return { ...getMove(id), qiCost: 0 };
}

// ---------- Resolving a move ----------

/** Returns false when the actor lost its action (delay or freeze). */
function performMove(s: CombatState, actor: Combatant, target: Combatant, move: Move, actedSecond: boolean): boolean {
  if (consumeStatus(actor, 'delay')) {
    log(s, STRINGS.log.delayed(actor.name), actor.side);
    return false;
  }
  if (consumeStatus(actor, 'freeze')) {
    if (totalShield(actor) > 0) {
      log(s, STRINGS.log.freezeBlocked(actor.name), actor.side);
    } else {
      log(s, STRINGS.log.frozen(actor.name), actor.side);
      return false;
    }
  }

  actor.qi -= move.qiCost;
  if (actor.side === 'player') {
    s.lastPlayerMoveId = move.id;
    if (move.law) s.lawUse[move.law] = (s.lawUse[move.law] ?? 0) + 1;
  }

  const attacks = move.power > 0 && move.hits > 0;
  let landed = !attacks; // non-attack moves always apply their effects
  let totalDamage = 0;

  if (attacks) {
    const hitResult = resolveHits(s, actor, target, move);
    landed = hitResult.landed;
    totalDamage = hitResult.totalDamage;
  } else {
    log(s, STRINGS.log.status(actor.name, move.name), actor.side);
  }

  for (const effect of move.effects) {
    applyEffect(s, actor, target, effect, { landed, totalDamage, actedSecond });
  }

  checkResult(s);
  return true;
}

interface HitOutcome {
  landed: boolean;
  totalDamage: number;
}

function resolveHits(s: CombatState, actor: Combatant, target: Combatant, move: Move): HitOutcome {
  const element = move.element ?? actor.element;
  const ignoreBody = move.effects.find((e): e is Extract<MoveEffect, { kind: 'ignoreBody' }> => e.kind === 'ignoreBody')?.fraction ?? 0;
  const ignoreQiShield = move.effects.some((e) => e.kind === 'ignoreQiShield');
  const empower = consumeStatus(actor, 'empower')?.multiplier ?? 1;
  const sureCrit = consumeStatus(actor, 'sureCrit') !== undefined;
  const lawBonus = lawDamageBonus(actor, move);

  let landed = false;
  let totalDamage = 0;

  for (let i = 0; i < move.hits; i++) {
    if (s.result !== 'ongoing') break;

    let dodged: boolean;
    [dodged, s.rng] = roll(s.rng, dodgeChance(target));
    if (dodged) {
      log(s, STRINGS.log.dodge(target.name, move.name), actor.side, { dodged: true, target: target.side });
      continue;
    }

    let crit = sureCrit;
    if (!crit) [crit, s.rng] = roll(s.rng, critChance(actor));

    const damage = computeDamage({
      strength: effectiveStat(actor, 'strength'),
      power: move.power,
      targetBody: effectiveStat(target, 'body') * (1 - ignoreBody),
      elementMult: elementMultiplier(element, target.element),
      crit,
      extraMult: empower * lawBonus,
    });

    const { through, blocked } = absorbWithShields(target, damage, ignoreQiShield);
    if (blocked > 0) log(s, STRINGS.log.shieldBlock(target.name, blocked), target.side);
    target.hp -= through;
    landed = true;
    totalDamage += damage;

    const text = crit ? STRINGS.log.crit(actor.name, move.name, damage) : STRINGS.log.hit(actor.name, move.name, damage);
    log(s, text, actor.side, { damage, crit, target: target.side });

    reflectDamage(s, actor, target, through);
    checkResult(s);
  }

  return { landed, totalDamage };
}

export interface DamageInput {
  strength: number;
  power: number;
  targetBody: number;
  elementMult: number;
  crit: boolean;
  /** Any other multiplier: empower, law bonus. */
  extraMult?: number;
}

/**
 * The damage formula from the spec:
 * Strength × power − target Body, minimum 1, then element counter and crit multipliers.
 */
export function computeDamage(input: DamageInput): number {
  const base = Math.max(COMBAT.minDamage, input.strength * input.power - input.targetBody);
  const withMods = base * input.elementMult * (input.crit ? COMBAT.critMultiplier : 1) * (input.extraMult ?? 1);
  return Math.max(COMBAT.minDamage, Math.round(withMods));
}

function lawDamageBonus(actor: Combatant, move: Move): number {
  if (actor.side !== 'player' || !move.law) return 1;
  const level = (actor as PlayerCombatant).lawLevels[move.law] ?? 0;
  return 1 + level * COMBAT.lawDamagePerLevel;
}

function reflectDamage(s: CombatState, attacker: Combatant, defender: Combatant, hpDamage: number): void {
  if (hpDamage <= 0) return;
  const reflect = defender.statuses.find((st) => st.kind === 'reflect');
  if (!reflect || reflect.kind !== 'reflect') return;
  const back = Math.round(hpDamage * reflect.ratio);
  if (back <= 0) return;
  attacker.hp -= back;
  log(s, STRINGS.log.reflect(attacker.name, back), defender.side, { damage: back, target: attacker.side });
}

interface EffectContext {
  landed: boolean;
  totalDamage: number;
  actedSecond: boolean;
}

function applyEffect(s: CombatState, actor: Combatant, target: Combatant, effect: MoveEffect, ctx: EffectContext): void {
  const until = (turns: number) => expiryTurn(s.turn, turns, ctx.actedSecond);

  switch (effect.kind) {
    case 'heal':
      heal(s, actor, effect.amount);
      break;
    case 'lifesteal':
      heal(s, actor, Math.round(ctx.totalDamage * effect.ratio));
      break;
    case 'dot':
      if (!ctx.landed) break;
      // A fresh application of the same kind replaces the old one.
      target.statuses = target.statuses.filter((st) => !(st.kind === 'dot' && st.type === effect.type));
      target.statuses.push({ kind: 'dot', type: effect.type, damage: effect.damage, turnsLeft: effect.turns });
      break;
    case 'statMod': {
      const who = effect.target === 'self' ? actor : target;
      if (effect.target === 'enemy' && !ctx.landed) break;
      who.statuses.push({ kind: 'statMod', stat: effect.stat, amount: effect.amount, expiresAfterTurn: until(effect.turns) });
      break;
    }
    case 'statMul': {
      const who = effect.target === 'self' ? actor : target;
      if (effect.target === 'enemy' && !ctx.landed) break;
      who.statuses.push({ kind: 'statMul', stat: effect.stat, multiplier: effect.multiplier, expiresAfterTurn: until(effect.turns) });
      break;
    }
    case 'shield':
      actor.statuses.push({ kind: 'shield', amount: effect.amount, source: 'technique', expiresAfterTurn: until(effect.turns) });
      break;
    case 'qiShield': {
      const amount = effectiveStat(actor, 'body') * COMBAT.qiShieldBodyFactor + actor.qi;
      actor.qi = 0;
      actor.statuses.push({ kind: 'shield', amount, source: 'qiShield', expiresAfterTurn: until(1) });
      break;
    }
    case 'gainQi':
      actor.qi = Math.min(actor.maxQi, actor.qi + effect.amount);
      log(s, STRINGS.log.gainQi(actor.name, effect.amount), actor.side);
      break;
    case 'delay':
      if (ctx.landed && !hasStatus(target, 'delay')) target.statuses.push({ kind: 'delay' });
      break;
    case 'freeze':
      if (ctx.landed && !hasStatus(target, 'freeze')) target.statuses.push({ kind: 'freeze' });
      break;
    case 'actLast':
      if (ctx.landed) target.statuses.push({ kind: 'actLast', expiresAfterTurn: until(effect.turns) });
      break;
    case 'empower':
      actor.statuses = actor.statuses.filter((st) => st.kind !== 'empower');
      actor.statuses.push({ kind: 'empower', multiplier: effect.multiplier });
      break;
    case 'sureCrit':
      if (!hasStatus(actor, 'sureCrit')) actor.statuses.push({ kind: 'sureCrit' });
      break;
    case 'reflect':
      actor.statuses.push({ kind: 'reflect', ratio: effect.ratio, expiresAfterTurn: until(effect.turns) });
      break;
    case 'dodgeBonus':
      actor.statuses.push({ kind: 'dodgeBonus', amount: effect.amount, expiresAfterTurn: until(effect.turns) });
      break;
    case 'selfHpCost':
      actor.hp -= Math.floor(actor.hp * effect.fraction);
      break;
    case 'ignoreBody':
    case 'ignoreQiShield':
      // Read during the damage phase.
      break;
  }
}

function heal(s: CombatState, who: Combatant, amount: number): void {
  if (amount <= 0) return;
  const healed = Math.min(amount, who.maxHp - who.hp);
  who.hp += healed;
  log(s, STRINGS.log.heal(who.name, healed), who.side, { heal: healed, target: who.side });
}

// ---------- End of round ----------

function endOfTurn(s: CombatState): void {
  if (s.result !== 'ongoing') return;

  for (const c of [s.player, s.enemy]) {
    for (const st of c.statuses) {
      if (st.kind !== 'dot') continue;
      c.hp -= st.damage;
      st.turnsLeft -= 1;
      log(s, STRINGS.log.dot(c.name, st.type, st.damage), c.side, { damage: st.damage, target: c.side });
    }
  }
  checkResult(s);
  if (s.result !== 'ongoing') return;

  const regen = s.enemy.def.regenPerTurn;
  if (regen) {
    const healed = Math.min(regen, s.enemy.maxHp - s.enemy.hp);
    if (healed > 0) {
      s.enemy.hp += healed;
      log(s, STRINGS.log.regen(s.enemy.name, healed), 'enemy', { heal: healed, target: 'enemy' });
    }
  }

  s.player.qi = Math.min(s.player.maxQi, s.player.qi + COMBAT.qiRegenPerTurn);

  expireStatuses(s.player, s.turn);
  expireStatuses(s.enemy, s.turn);
  s.turn += 1;

  rotateElement(s);
}

function rotateElement(s: CombatState): void {
  const rot = s.enemy.def.elementRotation;
  if (!rot) return;
  const phase = Math.floor((s.turn - 1) / rot.every);
  const element = rot.elements[phase % rot.elements.length]!;
  if (element !== s.enemy.element) {
    s.enemy.element = element;
    log(s, STRINGS.log.elementShift(s.enemy.name, STRINGS.elements[element]), 'enemy');
  }
}

function checkResult(s: CombatState): void {
  if (s.result !== 'ongoing') return;
  if (s.player.hp <= 0) {
    s.player.hp = 0;
    s.result = 'lost';
    log(s, STRINGS.log.lose, 'player');
  } else if (s.enemy.hp <= 0) {
    s.enemy.hp = 0;
    s.result = 'won';
    log(s, STRINGS.log.win(s.enemy.name), 'enemy');
  }
}

function log(s: CombatState, text: string, side?: Side, extra: Partial<Pick<CombatState['log'][number], 'damage' | 'heal' | 'crit' | 'dodged' | 'target'>> = {}): void {
  s.log.push({ turn: s.turn, text, side, ...extra });
}

/** The law the player used most this fight, for the boss comprehension bonus. */
export function mostUsedLaw(state: CombatState): Law | undefined {
  let best: Law | undefined;
  let bestCount = 0;
  for (const [law, count] of Object.entries(state.lawUse) as [Law, number][]) {
    if (count > bestCount) {
      best = law;
      bestCount = count;
    }
  }
  return best;
}
