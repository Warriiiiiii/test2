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
    delayed: (who: string) => `${who} is held back and loses the turn.`,
    frozen: (who: string) => `${who} is frozen and cannot act.`,
    freezeBlocked: (who: string) => `${who}'s shield wards off the freeze.`,
    notEnoughQi: (move: string) => `Not enough Qi for ${move}.`,
    elementShift: (who: string, element: string) => `${who} shifts to ${element}.`,
    win: (enemy: string) => `${enemy} is defeated.`,
    lose: 'Your vision fades to black.',
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
