import { beforeEach, describe, expect, it } from 'vitest';
import { canRewind, useGameStore } from '../src/store/gameStore';
import { START_AREA_ID } from '../src/data/regions';
import { findArea, isAreaUnlocked, progressOf } from '../src/engine/area';
import { TIME_MILESTONES } from '../src/data/laws';

const initial = useGameStore.getState();
const s = useGameStore.getState;

beforeEach(() => {
  useGameStore.setState(initial, true);
});

function startRun(element: 'fire' | 'water' | 'wood' | 'earth' | 'metal' = 'fire'): void {
  s().newGame();
  s().chooseElement(element, 7);
}

/** Make the player unbeatable so a fight always ends in a win. */
function godMode(): void {
  const run = s().run!;
  useGameStore.setState({ run: { ...run, stats: { ...run.stats, vitality: 500, strength: 100 }, hp: 500 } });
}

function finishFight(): void {
  for (let i = 0; i < 200 && s().combat?.result === 'ongoing'; i++) s().act('palmStrike');
}

function winOnce(monsterId: number): void {
  s().startEncounter(monsterId, 'spiritRat', false);
  finishFight();
  expect(s().combat?.result).toBe('won');
  s().continueAfterFight();
  s().pickReward(0);
}

describe('game store', () => {
  it('walks title → awakening → sect grounds → world → floor 1', () => {
    expect(s().screen).toBe('title');
    s().newGame();
    expect(s().screen).toBe('awakening');
    s().chooseElement('fire', 7);
    expect(s().screen).toBe('area');
    expect(s().areaId).toBe(START_AREA_ID);
    expect(s().run?.highestFloor).toBe(0);
    s().goToTab('world');
    expect(s().screen).toBe('world');
    expect(s().areaId).toBeNull();
    s().enterArea('pagoda-floor-2'); // locked
    expect(s().screen).toBe('world');
    s().enterArea('pagoda-floor-1');
    expect(s().screen).toBe('area');
    expect(s().areaId).toBe('pagoda-floor-1');
    expect(s().run?.highestFloor).toBe(1);
  });

  it('an encounter opens a fight; a win offers cards, counts progress and flags the monster', () => {
    startRun();
    s().enterArea('pagoda-floor-1');
    godMode();
    s().startEncounter(3, 'emberFox', false);
    expect(s().screen).toBe('combat');
    expect(s().combat?.enemy.name).toBe('Ember Fox');
    expect(s().encounter).toEqual({ areaId: 'pagoda-floor-1', monsterId: 3, enemyId: 'emberFox', isBoss: false });
    finishFight();
    const hpAfter = s().combat!.player.hp;
    s().continueAfterFight();
    expect(s().screen).toBe('reward');
    expect(s().rewardCards).toHaveLength(3);
    expect(progressOf(s().run!, 'pagoda-floor-1').wins).toBe(1);
    expect(s().run?.hp).toBe(hpAfter);
    s().pickReward(0);
    expect(s().screen).toBe('area');
    expect(s().rewardCards).toBeNull();
    expect(s().encounter).toBeNull();
    expect(s().defeated?.monsterId).toBe(3);
    s().ackDefeated();
    expect(s().defeated).toBeNull();
  });

  it('enough wins clear floor 1 and unlock floor 2', () => {
    startRun();
    s().enterArea('pagoda-floor-1');
    godMode();
    const floor1 = findArea('pagoda-floor-1');
    for (let i = 0; i < floor1.winsToClear; i++) winOnce(i + 1);
    expect(isAreaUnlocked(findArea('pagoda-floor-2'), s().run!)).toBe(true);
    s().enterArea('pagoda-floor-2');
    expect(s().areaId).toBe('pagoda-floor-2');
    expect(s().run?.highestFloor).toBe(2);
  });

  it('a scroll reward is learned and equipped', () => {
    startRun();
    s().enterArea('pagoda-floor-1');
    useGameStore.setState({ rewardCards: [{ kind: 'scroll', techniqueId: 'swiftSword' }] });
    s().pickReward(0);
    expect(s().run?.learned).toContain('swiftSword');
    expect(s().run?.equipped).toEqual(['flameFinger', 'swiftSword']);
  });

  it('losing counts a death and returns to the awakening', () => {
    startRun('wood');
    s().enterArea('pagoda-floor-1');
    const run = s().run!;
    useGameStore.setState({ run: { ...run, stats: { ...run.stats, vitality: 1 }, hp: 1 } });
    s().startEncounter(1, 'spiritRat', false);
    finishFight();
    expect(s().combat?.result).toBe('lost');
    s().continueAfterFight();
    expect(s().deaths).toBe(1);
    expect(s().screen).toBe('awakening');
    expect(s().run).toBeNull();
    expect(s().areaId).toBeNull();
  });

  it('leaving an area returns to the sect grounds, and from there to the world screen', () => {
    startRun();
    s().enterArea('pagoda-floor-1');
    s().leaveArea();
    expect(s().screen).toBe('area');
    expect(s().areaId).toBe(START_AREA_ID);
    s().leaveArea();
    expect(s().screen).toBe('world');
    expect(s().areaId).toBeNull();
  });

  it('meditation restores HP and techniques can be toggled', () => {
    startRun();
    useGameStore.setState({ run: { ...s().run!, hp: 5 } });
    s().meditate();
    expect(s().run?.hp).toBe(s().run?.stats.vitality);
    s().toggleEquip('flameFinger');
    expect(s().run?.equipped).toEqual([]);
    s().toggleEquip('flameFinger');
    expect(s().run?.equipped).toEqual(['flameFinger']);
  });

  it('rewind needs the Time milestone and works once per fight', () => {
    startRun('earth');
    s().enterArea('pagoda-floor-1');
    s().startEncounter(1, 'ironShellTurtle', false);
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
