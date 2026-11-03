// Zustand store: wires the pure engine to the React screens and the Phaser area scene.
// It owns the run and the current fight. Monster positions live in the scene, not here.
import { create } from 'zustand';
import type { CombatState, Element } from '../engine/types';
import { createCombat, takeTurn } from '../engine/combat';
import { createRun, nextSeed, playerSetup, restored, toggleEquip, withHp, type RunState } from '../engine/run';
import { enterArea as markEntered, findArea, isAreaUnlocked, recordWin } from '../engine/area';
import { applyReward, drawRewardCards, type RewardCard } from '../engine/rewards';
import { getEnemy } from '../data/enemies';
import { TIME_MILESTONES } from '../data/laws';
import { COMBAT } from '../data/stats';
import { START_AREA_ID } from '../data/regions';

export type Tab = 'cultivate' | 'world' | 'techniques' | 'laws' | 'soul';
export type Screen = 'title' | 'awakening' | Tab | 'area' | 'combat' | 'reward';

export const TABS: Tab[] = ['cultivate', 'world', 'techniques', 'laws', 'soul'];

/** The fight that started when the player touched a monster on the map. */
export interface Encounter {
  areaId: string;
  monsterId: number;
  enemyId: string;
  isBoss: boolean;
}

export interface GameState {
  screen: Screen;
  /** Deaths so far. Persisted from milestone 4 on. */
  deaths: number;
  run: RunState | null;
  /** The area whose map is open (or paused behind a fight). */
  areaId: string | null;
  combat: CombatState | null;
  /** The fight as it was before the last action, for the Time-law rewind. */
  previousCombat: CombatState | null;
  rewindUsed: boolean;
  encounter: Encounter | null;
  rewardCards: RewardCard[] | null;
  /** Set when a fight ends in a win; the scene removes that monster and then clears it. */
  defeated: Encounter | null;

  newGame: () => void;
  backToTitle: () => void;
  /** Pick the run element and wake up on the Sect Grounds. `seed` is only passed by tests. */
  chooseElement: (element: Element, seed?: number) => void;
  goToTab: (tab: Tab) => void;
  /** Open an area's map if the run has unlocked it. */
  enterArea: (areaId: string) => void;
  /** The exit tile or the HUD button: back to the Sect Grounds. */
  leaveArea: () => void;
  /** A monster was touched on the map. */
  startEncounter: (monsterId: number, enemyId: string, isBoss: boolean) => void;
  act: (moveId: string) => void;
  rewind: () => void;
  /** After the result overlay: rewards after a win, awakening after a death. */
  continueAfterFight: () => void;
  pickReward: (index: number) => void;
  /** Called by the scene once the beaten monster has been removed from the map. */
  ackDefeated: () => void;
  toggleEquip: (techniqueId: string) => void;
  /** Stand-in for cultivation until milestone 5: a full heal. */
  meditate: () => void;
}

export const useGameStore = create<GameState>()((set, get) => ({
  screen: 'title',
  deaths: 0,
  run: null,
  areaId: null,
  combat: null,
  previousCombat: null,
  rewindUsed: false,
  encounter: null,
  rewardCards: null,
  defeated: null,

  newGame: () => set({ screen: 'awakening', run: null, areaId: null, combat: null, previousCombat: null, encounter: null, rewardCards: null }),

  backToTitle: () => set({ screen: 'title', areaId: null, combat: null, previousCombat: null, encounter: null, rewardCards: null }),

  chooseElement: (element, seed = Date.now()) => {
    const run = markEntered(createRun(element, seed), findArea(START_AREA_ID));
    set({ run, areaId: START_AREA_ID, screen: 'area', combat: null, previousCombat: null, encounter: null, rewardCards: null, defeated: null });
  },

  goToTab: (tab) => set({ screen: tab, areaId: null }),

  enterArea: (areaId) => {
    const { run } = get();
    if (!run) return;
    const area = findArea(areaId);
    if (!isAreaUnlocked(area, run)) return;
    set({ run: markEntered(run, area), areaId, screen: 'area', defeated: null });
  },

  leaveArea: () => {
    const { run, areaId } = get();
    if (!run) return;
    if (areaId === START_AREA_ID) {
      set({ screen: 'world', areaId: null });
      return;
    }
    get().enterArea(START_AREA_ID);
  },

  startEncounter: (monsterId, enemyId, isBoss) => {
    const { run, areaId } = get();
    if (!run || !areaId) return;
    const [seed, next] = nextSeed(run);
    const combat = createCombat(playerSetup(next), getEnemy(enemyId), seed);
    set({
      run: next,
      combat,
      previousCombat: null,
      rewindUsed: false,
      encounter: { areaId, monsterId, enemyId, isBoss },
      screen: 'combat',
    });
  },

  act: (moveId) => {
    const { combat } = get();
    if (!combat || combat.result !== 'ongoing') return;
    set({ combat: takeTurn(combat, moveId), previousCombat: combat });
  },

  rewind: () => {
    const state = get();
    if (!canRewind(state)) return;
    set({ combat: state.previousCombat, previousCombat: null, rewindUsed: true });
  },

  continueAfterFight: () => {
    const { run, combat, encounter, deaths } = get();
    if (!run || !combat || !encounter || combat.result === 'ongoing') return;

    if (combat.result === 'lost') {
      set({
        deaths: deaths + 1, run: null, areaId: null, combat: null, previousCombat: null, encounter: null, rewardCards: null, screen: 'awakening',
      });
      return;
    }

    const area = findArea(encounter.areaId);
    let next = recordWin(withHp(run, combat.player.hp), area, encounter.enemyId);
    let seed: number;
    [seed, next] = nextSeed(next);
    const [rewardCards] = drawRewardCards(next, seed);
    set({ run: next, combat: null, previousCombat: null, rewardCards, screen: 'reward' });
  },

  pickReward: (index) => {
    const { run, rewardCards, encounter } = get();
    if (!run || !rewardCards) return;
    const card = rewardCards[index];
    if (!card) return;
    set({
      run: applyReward(run, card, Date.now()),
      rewardCards: null,
      encounter: null,
      defeated: encounter,
      screen: 'area',
    });
  },

  ackDefeated: () => set({ defeated: null }),

  toggleEquip: (techniqueId) => {
    const { run } = get();
    if (!run) return;
    set({ run: toggleEquip(run, techniqueId, COMBAT.equipSlots) });
  },

  meditate: () => {
    const { run } = get();
    if (!run) return;
    set({ run: restored(run) });
  },
}));

/** Rewind is a Time-law milestone, usable once per fight while the fight is still on. */
export function canRewind(state: Pick<GameState, 'combat' | 'previousCombat' | 'rewindUsed' | 'run'>): boolean {
  const timeLevel = state.run?.lawLevels.time ?? 0;
  return (
    timeLevel >= TIME_MILESTONES.rewind &&
    !state.rewindUsed &&
    state.previousCombat !== null &&
    state.combat !== null &&
    state.combat.result === 'ongoing'
  );
}
