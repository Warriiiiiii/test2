import { describe, expect, it } from 'vitest';
import { createCombat, getEnemyIntent, getNextEnemyElement, mostUsedLaw, takeTurn, turnOrder } from '../src/engine/combat';
import { getEnemy } from '../src/data/enemies';
import { getTechnique } from '../src/data/techniques';
import { COMBAT } from '../src/data/stats';
import { dummy, fight, flatStats, play, setup } from './helpers';

describe('enemy patterns', () => {
  it('Spirit Rat cycles Bite, Bite, Frenzy', () => {
    let s = fight({ stats: flatStats({ strength: 1 }) }, getEnemy('spiritRat'));
    const names: string[] = [];
    for (let i = 0; i < 6; i++) {
      s = takeTurn(s, 'circulateQi');
      const lines = s.log.filter((l) => l.turn === i + 1 && l.side === 'enemy' && l.damage);
      names.push(`${lines[0]!.text.split(' uses ')[1]!.split(' for')[0]}×${lines.length}`);
    }
    expect(names).toEqual(['Bite×1', 'Bite×1', 'Frenzy×2', 'Bite×1', 'Bite×1', 'Frenzy×2']);
    expect(s.player.hp).toBe(100 - 2 * (4 + 4 + 3 + 3));
  });

  it('the Spirit Rat is faster than the base player and acts first', () => {
    const s = fight({ stats: flatStats({ agility: 3 }) }, getEnemy('spiritRat'));
    expect(turnOrder(s)).toEqual(['enemy', 'player']);
  });

  it('player wins Agility ties', () => {
    const s = fight({ stats: flatStats({ agility: 3 }) }, dummy({ agility: 3 }));
    expect(turnOrder(s)).toEqual(['player', 'enemy']);
  });

  it('Jade Python King sheds its skin once at half HP', () => {
    const boss = getEnemy('jadePythonKing');
    const big = getTechnique('seaOfFlames');
    let s = fight({ stats: flatStats({ strength: 25, body: 50, qi: 100, vitality: 500 }), techniques: [big] }, boss);
    s = takeTurn(s, 'seaOfFlames'); // 25 × 3 − 3 = 72 → 48 HP left (< 60), python coils first though
    expect(s.enemy.hp).toBe(48);
    s = takeTurn(s, 'circulateQi'); // Shed Skin fires instead of the pattern move
    expect(s.enemy.hp).toBe(68);
    expect(s.enemy.firedTriggers).toEqual(['hpBelow:0.5']);
    expect(s.enemy.patternIndex).toBe(1); // pattern did not advance on the trigger turn
    s = takeTurn(s, 'circulateQi');
    s = takeTurn(s, 'circulateQi');
    expect(s.log.filter((l) => l.text.includes('Shed Skin'))).toHaveLength(1);
  });

  it('Lava Golem announces Magma Burst two turns early, even without a memory', () => {
    const golem = getEnemy('lavaGolem');
    const s = fight({}, golem);
    const intent = getEnemyIntent(s, { hasMemory: false });
    expect(intent.known).toBe(false);
    expect(intent.moves).toEqual([]);
    expect(intent.telegraphed?.move.name).toBe('Magma Burst');
    expect(intent.telegraphed?.inTurns).toBe(2);
  });

  it('intent is hidden without memory and shown with memory or high Divine Sense', () => {
    const rat = getEnemy('spiritRat');
    const hidden = getEnemyIntent(fight({}, rat), { hasMemory: false });
    expect(hidden.known).toBe(false);
    expect(hidden.telegraphed).toBeUndefined();

    const remembered = getEnemyIntent(fight({}, rat), { hasMemory: true });
    expect(remembered.known).toBe(true);
    expect(remembered.moves.map((m) => m.name)).toEqual(['Bite']);

    const seer = getEnemyIntent(fight({ stats: flatStats({ divineSense: COMBAT.intentDivineSense }) }, rat), { hasMemory: false });
    expect(seer.known).toBe(true);

    const twoMoves = getEnemyIntent(fight({}, rat), { hasMemory: true, movesVisible: 2 });
    expect(twoMoves.moves.map((m) => m.name)).toEqual(['Bite', 'Bite']);
    const later = play(fight({ stats: flatStats({ strength: 1 }) }, rat), 'circulateQi', 2);
    expect(getEnemyIntent(later, { hasMemory: true, movesVisible: 2 }).moves.map((m) => m.name)).toEqual(['Frenzy', 'Bite']);
  });

  it('Ancient Treant regenerates every turn', () => {
    const treant = getEnemy('ancientTreant');
    let s = fight({ stats: flatStats({ strength: 30, body: 100, vitality: 1000 }) }, treant);
    s = takeTurn(s, 'palmStrike'); // 30 − 14 = 16 damage, +10 regen
    expect(s.enemy.hp).toBe(300 - 16 + 10);
  });

  it('Mirror Spirit copies the player stats and the last move used', () => {
    const mirror = getEnemy('mirrorSpirit');
    const flame = getTechnique('flameFinger');
    const copy = fight({ stats: flatStats({ strength: 10, body: 2, agility: 7, divineSense: 3 }) }, mirror);
    expect(copy.enemy.stats).toMatchObject({ strength: 10, body: 2, agility: 7, divineSense: 3 });
    expect(copy.enemy.hp).toBe(150);

    // Agility 0 on both sides so nothing is dodged.
    let s = fight({ element: 'wood', stats: flatStats({ strength: 10, body: 2, qi: 50 }), techniques: [flame] }, mirror);
    s = takeTurn(s, 'circulateQi'); // player first (tie): the mirror copies Circulate Qi, no damage
    expect(s.player.hp).toBe(100);
    s = takeTurn(s, 'flameFinger'); // mirror copies Flame Finger: 16 − 2 = 14
    expect(s.player.hp).toBe(100 - 14);
    expect(s.enemy.hp).toBe(150 - 14);
    // Before the player has ever moved, the mirror falls back to Palm Strike.
    expect(getEnemyIntent(copy, { hasMemory: true }).moves[0]!.id).toBe('palmStrike');
    expect(s.log.filter((l) => l.text.includes('Mirror Spirit uses Flame Finger'))).toHaveLength(1);
  });

  it('Nine-Colored Tribulation rotates element every 2 turns and judges on turn 9', () => {
    const trib = getEnemy('nineColoredTribulation');
    let s = fight({ stats: flatStats({ vitality: 5000, body: 0 }) }, trib);
    expect(s.enemy.element).toBe('fire');
    expect(getNextEnemyElement(s)).toEqual({ element: 'water', inTurns: 2 });
    s = takeTurn(s, 'circulateQi');
    expect(s.enemy.element).toBe('fire');
    expect(getNextEnemyElement(s)).toEqual({ element: 'water', inTurns: 1 });
    s = takeTurn(s, 'circulateQi');
    expect(s.enemy.element).toBe('water');
    s = play(s, 'circulateQi', 6); // now at turn 9
    expect(s.turn).toBe(9);
    expect(getEnemyIntent(s, { hasMemory: true }).moves[0]!.name).toBe("Heaven's Judgment");
    s = takeTurn(s, 'circulateQi');
    const judgment = s.log.find((l) => l.text.includes("Heaven's Judgment"));
    expect(judgment?.damage).toBe(200);
    expect(s.enemy.element).toBe('earth'); // turn 10: phase 4
    s = takeTurn(s, 'circulateQi');
    expect(s.enemy.element).toBe('fire'); // turn 11 wraps around
  });

  it('a fight ends when the enemy dies and later turns do nothing', () => {
    let s = fight({ stats: flatStats({ strength: 10 }) }, dummy({ hp: 15 }));
    s = takeTurn(s, 'palmStrike');
    expect(s.result).toBe('ongoing');
    s = takeTurn(s, 'palmStrike');
    expect(s.result).toBe('won');
    expect(s.enemy.hp).toBe(0);
    expect(takeTurn(s, 'palmStrike')).toBe(s);
  });

  it('tracks the law used most for the boss comprehension bonus', () => {
    const flame = getTechnique('flameFinger');
    const tide = getTechnique('tidePalm');
    let s = createCombat(setup({ stats: flatStats({ qi: 100 }), techniques: [flame, tide] }), dummy(), 1);
    s = takeTurn(s, 'tidePalm');
    s = takeTurn(s, 'flameFinger');
    s = takeTurn(s, 'flameFinger');
    expect(mostUsedLaw(s)).toBe('fire');
    expect(s.lawUse).toEqual({ fire: 2, water: 1 });
  });
});
