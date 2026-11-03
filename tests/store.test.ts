import { beforeEach, describe, expect, it } from 'vitest';
import { canRewind, useGameStore } from '../src/store/gameStore';
import { getEnemy } from '../src/data/enemies';
import { TIME_MILESTONES } from '../src/data/laws';

const initial = useGameStore.getState();

beforeEach(() => {
  useGameStore.setState(initial, true);
});

function playUntilOver(maxRounds = 200): void {
  const s = useGameStore.getState;
  for (let i = 0; i < maxRounds && s().combat?.result === 'ongoing'; i++) s().act('palmStrike');
}

describe('game store', () => {
  it('walks title → awakening → floor → combat', () => {
    const s = useGameStore.getState;
    expect(s().screen).toBe('title');
    s().newGame();
    expect(s().screen).toBe('awakening');
    s().chooseElement('fire', 7);
    expect(s().screen).toBe('floor');
    expect(s().run?.element).toBe('fire');
    expect(s().run?.floorEnemies).toHaveLength(3);
    s().startFight();
    expect(s().screen).toBe('combat');
    expect(s().combat?.enemy.name).toBe(getEnemy(s().run!.floorEnemies[0]!).name);
  });

  it('acting advances the fight and remembers the previous state', () => {
    const s = useGameStore.getState;
    s().newGame();
    s().chooseElement('metal', 7);
    s().startFight();
    const before = s().combat!;
    s().act('palmStrike');
    expect(s().combat!.turn).toBe(2);
    expect(s().previousCombat).toBe(before);
  });

  it('a won fight carries HP into the next fight; the third win clears the floor', () => {
    const s = useGameStore.getState;
    s().newGame();
    s().chooseElement('fire', 7);
    // Make the player unbeatable so the outcome is a win regardless of the draw.
    useGameStore.setState({ run: { ...s().run!, stats: { ...s().run!.stats, vitality: 500, strength: 100 }, hp: 500 } });

    s().startFight();
    playUntilOver();
    expect(s().combat?.result).toBe('won');
    const hpAfter = s().combat!.player.hp;
    s().continueAfterFight();
    expect(s().screen).toBe('combat'); // straight into fight 2
    expect(s().run?.fightIndex).toBe(1);
    expect(s().combat?.player.hp).toBe(hpAfter);
    expect(s().combat?.player.qi).toBe(s().combat?.player.maxQi); // Qi is full again

    playUntilOver();
    s().continueAfterFight();
    playUntilOver();
    s().continueAfterFight();
    expect(s().screen).toBe('floor');
    expect(s().run?.fightIndex).toBe(3);

    s().climbAgain();
    expect(s().run?.hp).toBe(500);
    expect(s().run?.fightIndex).toBe(0);
    expect(s().run?.floorEnemies).toHaveLength(3);
  });

  it('losing counts a death and returns to the awakening', () => {
    const s = useGameStore.getState;
    s().newGame();
    s().chooseElement('wood', 7);
    useGameStore.setState({ run: { ...s().run!, stats: { ...s().run!.stats, vitality: 1 }, hp: 1 } });
    s().startFight();
    playUntilOver();
    expect(s().combat?.result).toBe('lost');
    s().continueAfterFight();
    expect(s().deaths).toBe(1);
    expect(s().screen).toBe('awakening');
    expect(s().run).toBeNull();
  });

  it('rewind needs the Time milestone and works once per fight', () => {
    const s = useGameStore.getState;
    s().newGame();
    s().chooseElement('earth', 7);
    s().startFight();
    s().act('palmStrike');
    expect(canRewind(s())).toBe(false);
    s().rewind();
    expect(s().combat!.turn).toBe(2);

    useGameStore.setState({ run: { ...s().run!, lawLevels: { time: TIME_MILESTONES.rewind } } });
    expect(canRewind(s())).toBe(true);
    s().rewind();
    expect(s().combat!.turn).toBe(1);
    expect(s().rewindUsed).toBe(true);
    s().act('palmStrike');
    expect(canRewind(s())).toBe(false);
  });
});
