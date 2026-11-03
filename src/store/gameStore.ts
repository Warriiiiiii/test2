// Zustand store: wires the pure engine to the screens. Holds the current run and fight.
import { create } from 'zustand';
import type { CombatState, Element } from '../engine/types';
import { createCombat, takeTurn } from '../engine/combat';
import {
  afterFightWon, createRun, currentEnemyId, isFloorCleared, nextFightSeed, playerSetup, restored, startFloor,
  type RunState,
} from '../engine/run';
import { getEnemy } from '../data/enemies';
import { TIME_MILESTONES } from '../data/laws';

export type Screen = 'title' | 'awakening' | 'floor' | 'combat';

export interface GameState {
  screen: Screen;
  /** Deaths so far. Resets on page reload until saving arrives in milestone 3. */
  deaths: number;
  run: RunState | null;
  combat: CombatState | null;
  /** The fight as it was before the last action, for the Time-law rewind. */
  previousCombat: CombatState | null;
  rewindUsed: boolean;

  newGame: () => void;
  backToTitle: () => void;
  /** Pick the run element and start floor 1. `seed` is only passed by tests. */
  chooseElement: (element: Element, seed?: number) => void;
  startFight: () => void;
  act: (moveId: string) => void;
  rewind: () => void;
  /** After the result overlay: next fight, back to the floor, or wake up after death. */
  continueAfterFight: () => void;
  /** After clearing the floor: heal up and draw floor 1 again. */
  climbAgain: () => void;
}

export const useGameStore = create<GameState>()((set, get) => ({
  screen: 'title',
  deaths: 0,
  run: null,
  combat: null,
  previousCombat: null,
  rewindUsed: false,

  newGame: () => set({ screen: 'awakening', run: null, combat: null, previousCombat: null }),

  backToTitle: () => set({ screen: 'title', combat: null, previousCombat: null }),

  chooseElement: (element, seed = Date.now()) => {
    const run = startFloor(createRun(element, seed), 1);
    set({ run, screen: 'floor', combat: null, previousCombat: null });
  },

  startFight: () => {
    const { run } = get();
    if (!run || isFloorCleared(run)) return;
    const [seed, next] = nextFightSeed(run);
    const combat = createCombat(playerSetup(next), getEnemy(currentEnemyId(next)), seed);
    set({ run: next, combat, previousCombat: null, rewindUsed: false, screen: 'combat' });
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
    const { run, combat, deaths } = get();
    if (!run || !combat || combat.result === 'ongoing') return;

    if (combat.result === 'lost') {
      set({ deaths: deaths + 1, run: null, combat: null, previousCombat: null, screen: 'awakening' });
      return;
    }

    const next = afterFightWon(run, combat.player.hp);
    set({ run: next, combat: null, previousCombat: null });
    if (isFloorCleared(next)) set({ screen: 'floor' });
    else get().startFight();
  },

  climbAgain: () => {
    const { run } = get();
    if (!run) return;
    set({ run: startFloor(restored(run), 1), screen: 'floor' });
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
