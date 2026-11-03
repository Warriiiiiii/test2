import { describe, expect, it } from 'vitest';
import { takeTurn } from '../src/engine/combat';
import { effectiveStat } from '../src/engine/statuses';
import { getTechnique } from '../src/data/techniques';
import { COMBAT } from '../src/data/stats';
import { dummy, fight, flatStats, play, strike, tech } from './helpers';

describe('stat buffs and debuffs', () => {
  it('Stone Skin adds Body for 3 turns, then expires', () => {
    const stoneSkin = getTechnique('stoneSkin');
    const enemy = dummy({ strength: 10, pattern: [strike()] });
    let s = fight({ stats: flatStats({ body: 2 }), techniques: [stoneSkin] }, enemy);
    s = takeTurn(s, 'stoneSkin'); // player acts first (agility tie), buff covers this hit
    expect(effectiveStat(s.player, 'body')).toBe(5);
    expect(s.player.hp).toBe(100 - 5);
    s = takeTurn(s, 'circulateQi'); // turn 2
    s = takeTurn(s, 'circulateQi'); // turn 3, last buffed turn
    expect(s.player.hp).toBe(100 - 15);
    expect(effectiveStat(s.player, 'body')).toBe(2);
    s = takeTurn(s, 'circulateQi'); // turn 4, no buff
    expect(s.player.hp).toBe(100 - 15 - 8);
  });

  it('a buff applied by the slower actor lasts through the next turn', () => {
    // Turtle-style: Withdraw (+4 Body for 1 turn) used after the player already hit.
    const enemy = dummy({
      body: 0,
      pattern: [strike(0, { hits: 0, effects: [{ kind: 'statMod', target: 'self', stat: 'body', amount: 4, turns: 1 }] }), strike(0, { hits: 0 })],
    });
    let s = fight({ stats: flatStats({ strength: 10 }) }, enemy);
    s = takeTurn(s, 'palmStrike'); // player hits for 10, then enemy withdraws
    expect(s.enemy.hp).toBe(990);
    s = takeTurn(s, 'palmStrike'); // withdraw still up: 10 − 4
    expect(s.enemy.hp).toBe(984);
    s = takeTurn(s, 'palmStrike'); // expired
    expect(s.enemy.hp).toBe(974);
  });

  it('Earthquake lowers enemy Body for the rest of the fight', () => {
    const quake = getTechnique('earthquake');
    let s = fight({ stats: flatStats({ strength: 10, qi: 50 }), techniques: [quake] }, dummy({ body: 4 }));
    s = takeTurn(s, 'earthquake');
    s = play(s, 'palmStrike', 10);
    expect(effectiveStat(s.enemy, 'body')).toBe(2);
  });

  it('statMul multiplies after flat mods (Golden Body)', () => {
    const enemy = dummy({
      body: 8,
      pattern: [strike(0, { hits: 0, effects: [{ kind: 'statMul', target: 'self', stat: 'body', multiplier: 2, turns: 3 }] })],
    });
    const s = takeTurn(fight({}, enemy), 'circulateQi');
    expect(effectiveStat(s.enemy, 'body')).toBe(16);
  });
});

describe('damage over time', () => {
  it('burn ticks at the end of each turn for N turns', () => {
    const burn = getTechnique('burningPalm'); // 1.2 power + burn 3/turn for 3 turns
    let s = fight({ stats: flatStats({ strength: 10, qi: 50 }), techniques: [burn] }, dummy());
    s = takeTurn(s, 'burningPalm');
    expect(s.enemy.hp).toBe(1000 - 12 - 3);
    s = takeTurn(s, 'circulateQi');
    s = takeTurn(s, 'circulateQi');
    expect(s.enemy.hp).toBe(1000 - 12 - 9);
    s = takeTurn(s, 'circulateQi');
    expect(s.enemy.hp).toBe(1000 - 12 - 9);
    expect(s.enemy.statuses.some((st) => st.kind === 'dot')).toBe(false);
  });

  it('poison and bleed from enemies hurt the player and can kill', () => {
    const enemy = dummy({ strength: 1, pattern: [strike(1, { effects: [{ kind: 'dot', type: 'poison', damage: 40, turns: 3 }] })] });
    let s = fight({ stats: flatStats({ vitality: 50 }) }, enemy);
    s = takeTurn(s, 'circulateQi'); // 1 hit + 40 poison
    expect(s.player.hp).toBe(9);
    s = takeTurn(s, 'circulateQi');
    expect(s.result).toBe('lost');
    expect(s.player.hp).toBe(0);
  });

  it('reapplying the same dot refreshes it instead of stacking', () => {
    const burn = tech({ id: 'b', power: 1, effects: [{ kind: 'dot', type: 'burn', damage: 2, turns: 3 }] });
    let s = fight({ stats: flatStats({ strength: 10 }), techniques: [burn] }, dummy());
    s = takeTurn(s, 'b');
    s = takeTurn(s, 'b');
    expect(s.enemy.statuses.filter((st) => st.kind === 'dot')).toHaveLength(1);
    expect(s.enemy.hp).toBe(1000 - 20 - 4);
  });
});

describe('shields', () => {
  it('Qi Shield blocks Body × 2 + Qi this turn and empties Qi', () => {
    const enemy = dummy({ strength: 30, pattern: [strike()] });
    let s = fight({ stats: flatStats({ body: 3, qi: 10 }) }, enemy);
    s = takeTurn(s, 'qiShield'); // shield 16, hit 27 → 11 through
    expect(s.player.hp).toBe(100 - 11);
    expect(s.player.qi).toBe(COMBAT.qiRegenPerTurn);
    expect(s.player.statuses.some((st) => st.kind === 'shield')).toBe(false);
  });

  it('Golden Bell shields 20 for 2 turns and the pool carries over', () => {
    const bell = getTechnique('goldenBell');
    const enemy = dummy({ strength: 8, pattern: [strike()] });
    let s = fight({ stats: flatStats({ qi: 20 }), techniques: [bell] }, enemy);
    s = takeTurn(s, 'goldenBell'); // 8 absorbed, 12 left
    expect(s.player.hp).toBe(100);
    s = takeTurn(s, 'circulateQi'); // 8 absorbed, 4 left, then expires
    expect(s.player.hp).toBe(100);
    s = takeTurn(s, 'circulateQi');
    expect(s.player.hp).toBe(92);
  });

  it('Sword Qi goes through a Qi Shield but not a technique shield', () => {
    const swordQi = strike(1, { effects: [{ kind: 'ignoreQiShield' }] });
    const enemy = dummy({ strength: 10, pattern: [swordQi] });
    const a = takeTurn(fight({ stats: flatStats({ body: 5, qi: 10 }) }, enemy), 'qiShield');
    expect(a.player.hp).toBe(95); // 10 − 5 Body, shield ignored
    const bell = getTechnique('goldenBell');
    const b = takeTurn(fight({ stats: flatStats({ qi: 10 }), techniques: [bell] }, enemy), 'goldenBell');
    expect(b.player.hp).toBe(100);
  });
});

describe('delay, freeze and act-last', () => {
  it('Vine Bind makes the enemy skip a turn without advancing its pattern', () => {
    const vine = getTechnique('vineBind');
    const enemy = dummy({ strength: 10, pattern: [strike(1), strike(2)] });
    let s = fight({ stats: flatStats({ qi: 20 }), techniques: [vine] }, enemy);
    s = takeTurn(s, 'vineBind'); // enemy delayed, no damage
    expect(s.player.hp).toBe(100);
    expect(s.enemy.patternIndex).toBe(0);
    s = takeTurn(s, 'circulateQi'); // now the first strike happens
    expect(s.player.hp).toBe(90);
    expect(s.enemy.patternIndex).toBe(1);
  });

  it('freeze makes the target lose its next action unless shielded', () => {
    const freezer = dummy({ strength: 1, agility: 50, pattern: [strike(0.5, { effects: [{ kind: 'freeze' }] }), strike(0, { hits: 0 })] });
    let s = fight({ stats: flatStats({ strength: 10 }) }, freezer);
    s = takeTurn(s, 'palmStrike'); // enemy first: freezes, player loses the action
    expect(s.enemy.hp).toBe(1000);
    expect(s.log.some((l) => l.text.includes('frozen'))).toBe(true);
    s = takeTurn(s, 'palmStrike'); // enemy waits, player free again
    expect(s.enemy.hp).toBe(990);

    const bell = getTechnique('goldenBell');
    const slowFreezer = { ...freezer, agility: 0 };
    let t = fight({ stats: flatStats({ strength: 10, qi: 20 }), techniques: [bell] }, slowFreezer);
    t = takeTurn(t, 'goldenBell'); // shield goes up first, then the enemy freezes
    t = takeTurn(t, 'palmStrike'); // frozen but shielded: acts anyway
    expect(t.enemy.hp).toBe(990);
    expect(t.log.some((l) => l.text.includes('wards off'))).toBe(true);
  });

  it('Frost Lotus forces a faster enemy to act last', () => {
    const lotus = getTechnique('frostLotus');
    const enemy = dummy({ strength: 10, agility: 50, pattern: [strike()] });
    let s = fight({ stats: flatStats({ strength: 10, qi: 20 }), techniques: [lotus] }, enemy);
    s = takeTurn(s, 'frostLotus'); // enemy acted first this turn
    const firstLine = s.log[0]!;
    expect(firstLine.side).toBe('enemy');
    // Attack lines (hit or dodged) carry the attacker's side, so the first one shows who moved first.
    const firstAttacker = (st: typeof s, turn: number) => st.log.find((l) => l.turn === turn && (l.damage || l.dodged))!.side;
    s = takeTurn(s, 'palmStrike');
    expect(firstAttacker(s, 2)).toBe('player');
    s = takeTurn(s, 'palmStrike');
    expect(firstAttacker(s, 3)).toBe('player');
    s = takeTurn(s, 'palmStrike');
    expect(firstAttacker(s, 4)).toBe('enemy');
  });
});

describe('other effects', () => {
  it('Coil doubles the next hit only', () => {
    const python = dummy({ strength: 10, pattern: [strike(0, { hits: 0, effects: [{ kind: 'empower', multiplier: 2 }] }), strike(1.2), strike(1)] });
    let s = fight({}, python);
    s = takeTurn(s, 'circulateQi');
    expect(s.player.hp).toBe(100);
    s = takeTurn(s, 'circulateQi');
    expect(s.player.hp).toBe(100 - 24);
    s = takeTurn(s, 'circulateQi');
    expect(s.player.hp).toBe(100 - 24 - 10);
  });

  it('Sword Intent guarantees a crit on the next technique', () => {
    const intent = getTechnique('swordIntent');
    const swift = getTechnique('swiftSword');
    let s = fight({ stats: flatStats({ strength: 10, qi: 20 }), techniques: [intent, swift] }, dummy());
    s = takeTurn(s, 'swordIntent');
    s = takeTurn(s, 'swiftSword');
    const hits = s.log.filter((l) => l.side === 'player' && l.damage);
    expect(hits).toHaveLength(2);
    expect(hits.every((l) => l.crit && l.damage === 18)).toBe(true);
    expect(s.player.statuses.some((st) => st.kind === 'sureCrit')).toBe(false);
  });

  it('Verdant Leech heals for the damage dealt, Tide Palm heals a flat amount', () => {
    const leech = getTechnique('verdantLeech');
    const tide = getTechnique('tidePalm');
    let s = fight({ stats: flatStats({ strength: 10, qi: 30 }), techniques: [leech, tide], hp: 50 }, dummy());
    s = takeTurn(s, 'verdantLeech');
    expect(s.player.hp).toBe(65);
    s = takeTurn(s, 'tidePalm');
    expect(s.player.hp).toBe(69);
  });

  it('healing never exceeds max HP', () => {
    const heal = getTechnique('returningCurrent');
    const s = takeTurn(fight({ stats: flatStats({ qi: 10 }), techniques: [heal], hp: 95 }, dummy()), 'returningCurrent');
    expect(s.player.hp).toBe(100);
  });

  it('Thorn Armor reflects 30% of HP damage taken', () => {
    const thorns = getTechnique('thornArmor');
    const enemy = dummy({ strength: 20, pattern: [strike()] });
    const s = takeTurn(fight({ stats: flatStats({ qi: 10 }), techniques: [thorns] }, enemy), 'thornArmor');
    expect(s.player.hp).toBe(80);
    expect(s.enemy.hp).toBe(994);
  });

  it('Evasive Stance adds flat dodge for a turn', () => {
    const enemy = dummy({ pattern: [strike(0, { hits: 0, effects: [{ kind: 'dodgeBonus', amount: 1, turns: 1 }] }), strike(0, { hits: 0 })] });
    let s = fight({ stats: flatStats({ strength: 10 }) }, enemy);
    s = takeTurn(s, 'palmStrike'); // player hits first, then stance goes up
    s = takeTurn(s, 'palmStrike'); // 100% dodge
    expect(s.enemy.hp).toBe(990);
    s = takeTurn(s, 'palmStrike');
    expect(s.enemy.hp).toBe(980);
  });

  it('Blood Sacrifice costs the enemy 10% HP and triples the next hit', () => {
    const demon = dummy({
      strength: 10,
      pattern: [strike(0, { hits: 0, effects: [{ kind: 'selfHpCost', fraction: 0.1 }, { kind: 'empower', multiplier: 3 }] }), strike(1.2)],
    });
    let s = fight({}, demon);
    s = takeTurn(s, 'circulateQi');
    expect(s.enemy.hp).toBe(900);
    s = takeTurn(s, 'circulateQi');
    expect(s.player.hp).toBe(100 - 36);
  });

  it('Circulate Qi restores Qi and Qi regenerates each turn, capped at max', () => {
    let s = fight({ stats: flatStats({ qi: 10 }), techniques: [tech({ id: 'spend', power: 1, qiCost: 9 })] }, dummy());
    s = takeTurn(s, 'spend');
    expect(s.player.qi).toBe(1 + COMBAT.qiRegenPerTurn);
    s = takeTurn(s, 'circulateQi');
    expect(s.player.qi).toBe(Math.min(10, 3 + COMBAT.circulateQiAmount + COMBAT.qiRegenPerTurn));
  });
});
