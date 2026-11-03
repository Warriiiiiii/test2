// Turns engine data into short player-facing text and icon categories. No game logic here.
import type { Move, MoveEffect, Status } from '../engine/types';
import { STRINGS } from '../data/strings';

export type MoveCategory = 'attack' | 'multi' | 'dot' | 'shield' | 'heal' | 'qi' | 'buff' | 'debuff' | 'special';

/** Which icon a move gets. */
export function moveCategory(move: Move): MoveCategory {
  const kinds = move.effects.map((e) => e.kind);
  if (move.power > 0 && move.hits > 0) {
    if (kinds.includes('dot')) return 'dot';
    return move.hits > 1 ? 'multi' : 'attack';
  }
  if (kinds.includes('qiShield') || kinds.includes('shield') || kinds.includes('reflect')) return 'shield';
  if (kinds.includes('heal')) return 'heal';
  if (kinds.includes('gainQi')) return 'qi';
  if (kinds.includes('delay') || kinds.includes('freeze') || kinds.includes('actLast')) return 'debuff';
  const statMod = move.effects.find((e) => e.kind === 'statMod' || e.kind === 'statMul');
  if (statMod && (statMod.kind === 'statMod' || statMod.kind === 'statMul')) {
    return statMod.target === 'self' ? 'buff' : 'debuff';
  }
  if (kinds.includes('empower') || kinds.includes('sureCrit') || kinds.includes('dodgeBonus')) return 'buff';
  return 'special';
}

export function describeEffect(e: MoveEffect): string {
  const fx = STRINGS.effects;
  switch (e.kind) {
    case 'heal': return fx.heal(e.amount);
    case 'lifesteal': return fx.lifesteal;
    case 'dot': return fx.dot(fx.dotNames[e.type], e.damage, e.turns);
    case 'statMod':
      return e.amount >= 0
        ? fx.statUp(STRINGS.stats[e.stat], e.amount, e.turns)
        : fx.statDown(STRINGS.stats[e.stat], -e.amount, e.turns);
    case 'statMul': return fx.statMul(STRINGS.stats[e.stat], e.multiplier, e.turns);
    case 'shield': return fx.shield(e.amount, e.turns);
    case 'qiShield': return fx.qiShield;
    case 'gainQi': return fx.gainQi(e.amount);
    case 'delay': return fx.delay;
    case 'freeze': return fx.freeze;
    case 'actLast': return fx.actLast(e.turns);
    case 'ignoreBody': return fx.ignoreBody(e.fraction);
    case 'ignoreQiShield': return fx.ignoreQiShield;
    case 'empower': return fx.empower(e.multiplier);
    case 'sureCrit': return fx.sureCrit;
    case 'reflect': return fx.reflect(e.ratio, e.turns);
    case 'dodgeBonus': return fx.dodgeBonus(e.amount, e.turns);
    case 'selfHpCost': return fx.selfHpCost(e.fraction);
  }
}

/** "1.6× · 2 hits · burn 3/turn for 3" — the parts of a move, without its Qi cost. */
export function describeMove(move: Move): string[] {
  const parts: string[] = [];
  if (move.power > 0 && move.hits > 0) {
    parts.push(STRINGS.ui.power(move.power));
    if (move.hits > 1) parts.push(STRINGS.ui.hits(move.hits));
  }
  for (const e of move.effects) parts.push(describeEffect(e));
  return parts;
}

export function qiCostLabel(move: Move): string {
  return move.qiCost > 0 ? STRINGS.ui.qiCost(move.qiCost) : STRINGS.ui.free;
}

/** A compact chip label for an active status. */
export function describeStatus(st: Status, turn: number): string {
  const left = (expires: number) => (Number.isFinite(expires) ? ` for ${expires - turn + 1}` : '');
  const fx = STRINGS.effects;
  switch (st.kind) {
    case 'dot': return `${fx.dotNames[st.type]} ${st.damage}×${st.turnsLeft}`;
    case 'statMod': return `${STRINGS.stats[st.stat]} ${st.amount > 0 ? '+' : ''}${st.amount}${left(st.expiresAfterTurn)}`;
    case 'statMul': return `${STRINGS.stats[st.stat]} ×${st.multiplier}${left(st.expiresAfterTurn)}`;
    case 'shield': return `${STRINGS.combat.qiShield} ${st.amount}`;
    case 'delay': return fx.delay;
    case 'freeze': return fx.freeze;
    case 'actLast': return `acts last${left(st.expiresAfterTurn)}`;
    case 'empower': return fx.empower(st.multiplier);
    case 'sureCrit': return fx.sureCrit;
    case 'reflect': return `${fx.reflect(st.ratio, 0).split(' for')[0]}${left(st.expiresAfterTurn)}`;
    case 'dodgeBonus': return `${fx.dodgeBonus(st.amount, 0).split(' for')[0]}${left(st.expiresAfterTurn)}`;
  }
}
