// All player-facing text. English for now, French later.
import type { Element, Law, Realm, StatName } from '../engine/types';

export const STRINGS = {
  title: 'Ninefold Pagoda',
  tagline: 'Die. Remember. Climb again.',

  tabs: { cultivate: 'Cultivate', pagoda: 'Pagoda', techniques: 'Techniques', laws: 'Laws', soul: 'Soul' },

  elements: {
    fire: 'Fire', water: 'Water', metal: 'Metal', wood: 'Wood', earth: 'Earth', none: 'None',
  } satisfies Record<Element, string>,

  laws: {
    fire: 'Fire', water: 'Water', metal: 'Metal', wood: 'Wood', earth: 'Earth', sword: 'Sword', time: 'Time',
  } satisfies Record<Law, string>,

  realms: {
    qiCondensation: 'Qi Condensation', foundation: 'Foundation Establishment', core: 'Core Formation',
  } satisfies Record<Realm, string>,
  ascensionRealm: 'Nascent Soul',

  stats: {
    vitality: 'Vitality', qi: 'Qi', strength: 'Strength', body: 'Body', agility: 'Agility', divineSense: 'Divine Sense',
  } satisfies Record<StatName, string>,

  combat: {
    unknownIntent: '???',
    miss: 'miss',
    palmStrike: 'Palm Strike',
    qiShield: 'Qi Shield',
    circulateQi: 'Circulate Qi',
    rewind: 'Rewind',
    victory: 'Victory',
    defeat: 'You have fallen.',
  },

  log: {
    hit: (attacker: string, move: string, damage: number) => `${attacker} uses ${move} for ${damage}.`,
    crit: (attacker: string, move: string, damage: number) => `${attacker} uses ${move}. Critical! ${damage}.`,
    dodge: (defender: string, move: string) => `${defender} dodges ${move}.`,
    shieldBlock: (defender: string, blocked: number) => `${defender}'s shield absorbs ${blocked}.`,
    heal: (who: string, amount: number) => `${who} recovers ${amount} HP.`,
    gainQi: (who: string, amount: number) => `${who} gathers ${amount} Qi.`,
    dot: (who: string, type: string, damage: number) => `${who} takes ${damage} from ${type}.`,
    regen: (who: string, amount: number) => `${who} regenerates ${amount} HP.`,
    reflect: (who: string, amount: number) => `${who} is pierced by thorns for ${amount}.`,
    status: (who: string, move: string) => `${who} uses ${move}.`,
    appears: (enemy: string) => `${enemy} appears.`,
    delayed: (who: string) => `${who} is held back and loses the turn.`,
    frozen: (who: string) => `${who} is frozen and cannot act.`,
    freezeBlocked: (who: string) => `${who}'s shield wards off the freeze.`,
    notEnoughQi: (move: string) => `Not enough Qi for ${move}.`,
    elementShift: (who: string, element: string) => `${who} shifts to ${element}.`,
    win: (enemy: string) => `${enemy} is defeated.`,
    lose: 'Your vision fades to black.',
  },

  ui: {
    newGame: 'New game',
    continueGame: 'Continue',
    noSaveYet: 'No journey to continue',
    floor: (n: number) => `Floor ${n}`,
    fight: (n: number, total: number) => `Fight ${n} of ${total}`,
    fightCard: (n: number) => `Fight ${n}`,
    boss: 'Realm boss',
    cleared: 'Cleared',
    locked: 'Sealed',
    startFight: 'Fight',
    floorCleared: (n: number) => `Floor ${n} cleared`,
    floorClearedNote: 'The stairs above are sealed for now. Rest, then climb floor 1 again.',
    climbAgain: 'Rest and climb again',
    you: 'You',
    turn: (n: number) => `Turn ${n}`,
    enemyFaster: 'strikes first',
    playerFaster: 'you strike first',
    intent: 'Intent',
    telegraph: (move: string, turns: number) => (turns === 0 ? `${move} now!` : `${move} in ${turns}`),
    qiCost: (n: number) => `${n} Qi`,
    free: 'free',
    hits: (n: number) => `${n} hits`,
    power: (p: number) => `${p}×`,
    nextFight: 'Next fight',
    returnToFloor: 'Return to the stairs',
    hpStatus: (hp: number, max: number) => `${hp} / ${max} HP`,
    backToTitle: 'Back',
    rewindUsed: 'Rewind spent',
  },

  /** Short player-facing descriptions of move effects. */
  effects: {
    heal: (n: number) => `heal ${n}`,
    lifesteal: 'heal for damage dealt',
    dot: (type: string, dmg: number, turns: number) => `${type} ${dmg}/turn for ${turns}`,
    statUp: (stat: string, n: number, turns: number) => `+${n} ${stat} for ${turns}`,
    statDown: (stat: string, n: number, turns: number) => `−${n} ${stat}${Number.isFinite(turns) ? ` for ${turns}` : ''}`,
    statMul: (stat: string, mul: number, turns: number) => `${stat} ×${mul} for ${turns}`,
    shield: (n: number, turns: number) => `shield ${n} for ${turns}`,
    qiShield: 'block Body×2 + Qi, empties Qi',
    gainQi: (n: number) => `+${n} Qi`,
    delay: 'delays the enemy 1 turn',
    freeze: 'freeze',
    actLast: (turns: number) => `enemy acts last for ${turns}`,
    ignoreBody: (fraction: number) => (fraction >= 1 ? 'ignores Body' : 'ignores half Body'),
    ignoreQiShield: 'pierces Qi Shield',
    empower: (mul: number) => `next hit ×${mul}`,
    sureCrit: 'next technique crits',
    reflect: (ratio: number, turns: number) => `reflect ${Math.round(ratio * 100)}% for ${turns}`,
    dodgeBonus: (n: number, turns: number) => `+${Math.round(n * 100)}% dodge for ${turns}`,
    selfHpCost: (fraction: number) => `costs ${Math.round(fraction * 100)}% HP`,
    dotNames: { burn: 'burn', poison: 'poison', bleed: 'bleed' },
  },

  awakening: {
    intro: [
      'You wake on a straw mat, in a body that is not yours.',
      'Your meridians are crippled. The sect calls you a servant.',
      'Above the mountain, the Ninefold Heaven Pagoda pierces the clouds.',
      'You do not know why, but you feel you have been here before.',
    ],
    death: (n: number) => `Death #${n}`,
    chooseElement: 'Choose your path',
    chooseSoulMemory: 'Which technique does your soul remember?',
    wakeUp: 'Wake up',
  },
} as const;
