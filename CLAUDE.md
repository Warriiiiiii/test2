# Ninefold Pagoda — Game Spec

Working title. A mobile-first web game: xianxia setting, regression loop, turn-based combat, idle cultivation.

The owner designed this game and is not a professional developer. Keep code simple and readable, explain choices briefly in commit messages, and keep every balance number in data files so it can be tuned without touching logic.

---

## 1. Concept

The player is transported from the modern world into a xianxia world. They wake up as a servant of a small sect, with crippled meridians. Every time they die, they wake up again on their first morning in this world, keeping their memories. Nobody knows why.

Goal: climb the Ninefold Heaven Pagoda (9 floors) and reach Nascent Soul to ascend. Clearing floor 9 ends the game.

Core loop:
1. Cultivate (idle) to grow stats and reach the realm peak.
2. Climb pagoda floors (turn-based fights), pick rewards.
3. Beat the realm boss to break through.
4. Die → regress to day 1, keeping memories, law mastery and insight.

---

## 2. Tech stack

- Vite + React + TypeScript
- Zustand for game state
- Vitest for unit tests
- vite-plugin-pwa so the game installs on an Android home screen and works offline
- No backend. Save in localStorage.
- No image assets at first: ink-wash look with CSS, SVG shapes and icons.

Project structure:

```
src/
  data/        balance and content (stats, enemies, techniques, talents, laws, strings)
  engine/      pure TypeScript game logic, no React (combat, cultivation, regression, save)
  store/       Zustand store wiring engine to UI
  ui/          React screens and components
tests/         Vitest tests for engine
```

Rules:
- `engine/` contains pure functions with no UI or browser APIs (except the save module). Everything in it is unit tested.
- All numbers live in `src/data/`. Never hardcode a balance value in logic or UI.
- All player-facing text lives in `src/data/strings.ts` (English for now, French later).
- Seeded RNG in the engine so combat is testable.

---

## 3. Stats

| Stat | Effect | Base (run start) |
|---|---|---|
| Vitality | Max HP | 50 |
| Qi | Max Qi. Techniques cost Qi. Regenerates 2 per turn in combat. Full at the start of each fight. | 10 |
| Strength | Base damage | 5 |
| Body | Reduces damage taken | 2 |
| Agility | Turn order (higher acts first, player wins ties). Dodge chance = 2% per point, max 40%. | 3 |
| Divine Sense | Crit chance = 3% per point, max 50%. Crit = ×2 damage. At 10+, shows enemy intent even without a memory. | 0 |

Each run, the player picks one **element** (fire, water, metal, wood, earth). It sets their starter technique and their defensive element.

---

## 4. Combat

Turn-based, one enemy per fight. Each turn the player picks one action: a basic, or an equipped technique.

**Damage** = `Strength × techniquePower − targetBody`, minimum 1, then modifiers:
- Element counter ×1.5: water > fire > metal > wood > earth > water. Applies both ways. A technique's element vs enemy element, and an enemy's element vs the player's run element.
- Crit ×2 (attacker's Divine Sense). Dodge (defender's Agility).
- Multi-hit techniques roll each hit separately.

**Basics (always available):**
- Palm Strike: power 1.0, 0 Qi, no element
- Qi Shield: blocks `Body × 2 + current Qi` damage this turn, then Qi drops to 0
- Circulate Qi: +5 Qi, no attack

**Enemy intent:** each enemy has a move pattern (array, repeats in order). The next move is shown as an icon + name if the player has a memory of this enemy or Divine Sense ≥ 10. Otherwise "???".

**Status effects:** burn, poison, bleed (damage per turn for N turns), stat buffs and debuffs with duration, shields, delay (enemy's next move is pushed back 1 turn), freeze (target loses next action unless shielded), act-last (target acts after the opponent regardless of Agility).

**Equip:** up to 4 techniques plus the basics.

---

## 5. Techniques

Format: power (× Strength), Qi cost, effect. Starters are given by the run element. Scrolls drop as rewards. Mastery-3 techniques unlock permanently at law level 3.

| Law | Starter | Scroll | Mastery 3 |
|---|---|---|---|
| Fire | Flame Finger: 1.6, 4 Qi | Sea of Flames: 3.0, 12 Qi | Burning Palm: 1.2, 5 Qi, burn 3/turn for 3 turns |
| Water | Tide Palm: 1.2, 3 Qi, heal 4 | Frost Lotus: 1.5, 6 Qi, enemy acts last for 2 turns | Returning Current: heal 15, 6 Qi |
| Metal | Iron Needle: 1.4, 3 Qi, ignores half Body | Golden Bell: shield 20 for 2 turns, 8 Qi | Piercing Edge: 2.2, 7 Qi, ignores all Body |
| Wood | Vine Bind: 0.8, 3 Qi, delays enemy move 1 turn | Verdant Leech: 1.5, 6 Qi, heal = damage dealt | Thorn Armor: reflect 30% damage for 3 turns, 6 Qi |
| Earth | Stone Skin: +3 Body for 3 turns, 3 Qi | Mountain Crush: 2.8, 10 Qi | Earthquake: 1.5, 6 Qi, −2 enemy Body for the rest of the fight |
| Sword (no element, scrolls only) | — | Swift Sword: 2 hits × 0.9, 4 Qi · Thousand Cuts: 5 hits × 0.7, 12 Qi | Sword Intent: next technique is a guaranteed crit, 3 Qi |
| Time (no techniques) | — | — | See milestones in section 7 |

Learned scroll techniques reset on death. On death, the player picks 1 learned technique to carry into the next run (soul memory). A talent raises this to 2.

---

## 6. Pagoda, enemies, bosses

9 floors × 3 fights. Fights on a floor are played in a row; the player returns to Cultivate after clearing a floor. Floors 3, 6 and 9 end with a realm boss, which can only be challenged at realm peak (section 8). Losing any fight = death.

HP regenerates while meditating (1% of max HP per second, also offline).

**Reward after each fight:** pick 1 of 3 cards:
- Spirit herb: one stat boost (+5 Vitality, +2 Qi, +1 Strength, +1 Body, +1 Agility or +1 Divine Sense), scaled by realm multiplier (1 / 1.5 / 2.25)
- Cultivation herb: +50% cultivation rate for 30 minutes
- Technique scroll: a scroll technique not yet learned this run
- Pill: heal 50% HP

Enemy format: HP / Strength / Body / Agility, element, pattern.

**Floors 1–3: Qi Condensation**
- Spirit Rat (wood): 20/4/0/6. Bite (1.0) → Bite → Frenzy (2 hits × 0.8)
- Iron-Shell Turtle (earth): 35/3/4/1. Withdraw (+4 Body 1 turn) → Slam (1.5)
- Ember Fox (fire): 25/6/1/5. Fox Fire (0.8 + burn 2/turn for 3) → Bite (1.0) → Evasive Stance (+30% dodge 1 turn)
- Outer Sect Bully (metal): 30/5/2/3. Strike (1.0) → Strike → Iron Fist (2.0)
- Boss, Jade Python King (water): 120/8/3/4. Coil (next hit ×2) → Constrict (1.2) → Venom Spit (0.6 + poison 4/turn for 3). Once at 50% HP: Shed Skin (heal 20).

**Floors 4–6: Foundation Establishment**
- Bloodthorn Wolf (wood): 60/12/4/9. Howl (next attack ×1.5) → Pounce (1.2) → Rend (1.0 + bleed 5/turn for 3)
- Lava Golem (fire): 110/10/10/2. Charge (1.2) → Charge → Magma Burst (3.0). Magma Burst intent is shown 2 turns early.
- Wandering Swordsman (none): 80/14/5/8. Swift Sword (2 × 0.9) → Swift Sword → Sword Qi (1.8, ignores Qi Shield)
- Frost Wraith (water): 70/11/3/7. Chill (1.0) → Freeze (0.5 + freeze)
- Boss, Elder Jin of the Golden Pavilion (metal): 300/16/8/6. Phase 1: Golden Bell (shield 40) ↔ Metal Rain (3 × 0.7). At 50% HP: Golden Body (Body ×2 for 3 turns), then resumes.

**Floors 7–9: Core Formation**
- Thunder Roc (metal): 180/22/6/14. Wing Gust (1.0) → Wing Gust → Sky Dive (3.0, intent shown 1 turn early)
- Ancient Treant (wood): 300/18/14/1. Regenerates 10 HP per turn. Root Lash (1.2) → Entangle (delay player 1 turn)
- Demonic Cultivator (fire): 200/24/8/8. Blood Sacrifice (loses 10% own HP, next hit ×3) → Demon Palm (1.2)
- Mirror Spirit (none): HP 150, other stats copy the player's. Each turn it uses the last technique the player used.
- Final boss, Nine-Colored Tribulation: 900/40/12/10. Element rotates fire → water → metal → wood → earth every 2 turns (next element shown in advance). Tribulation Bolt (1.0) each turn. Every 9th turn: Heaven's Judgment (5.0).

Floors 1–2, 4–5 and 7–8 draw 3 random regular enemies from their realm's pool. Boss floors have 2 regular fights then the boss.

---

## 7. Persistent progression (survives death)

**Memories (bestiary):** dying to an enemy unlocks its memory permanently: full pattern, element, weakness, and intent shown in every future fight.

**Law mastery:** 7 laws (fire, water, metal, wood, earth, sword, time), levels 0–9.
- Comprehension needed for level n: `10 × n²` cumulative (10, 40, 90, … 810).
- Using a technique: +1 comprehension to its law.
- Beating a boss: +20 to the law used most in that fight.
- Time law: only grows on death: `+10 + 3 × floor reached`.
- Dao meditation (section 8): +1 to the chosen law every 5 minutes.

Milestones for element and sword laws:
- Every level: +5% damage with that law's techniques
- Level 3: unlock its mastery technique
- Level 6: passive (fire: burns last 1 turn longer · water: heal 3 HP/turn · metal: +2 Body · wood: +20% healing · earth: +10% max HP · sword: +10% crit)
- Level 9: Law Domain, field effect for the whole fight (fire: enemy burns 5/turn · water: player heals 5%/turn · metal: enemy −20% Body · wood: player regenerates 3% HP/turn · earth: player takes −20% damage · sword: all hits pierce half Body)

Time milestones:
- 3: see the enemy's next 2 moves
- 6: rewind 1 turn, once per fight
- 9: once per run, retry a lost fight instead of dying

**Insight points:** earned on death = `2 × floor reached + 5 × bosses beaten this run`. Spent in the Soul tab:
- +10 starting Vitality (5 levels, cost 3/6/9/12/15)
- +1 starting Strength (5 levels, cost 4/8/12/16/20)
- +2 starting Qi (5 levels, cost 3/6/9/12/15)
- +1 starting Agility (3 levels, cost 5/10/15)
- Second soul-memory slot (cost 25)
- Start each run with a random scroll technique (cost 20)
- Spirit Gathering Array: +20% cultivation rate per level (10 levels, cost 5, 10, 20, 40… doubling)

---

## 8. Cultivation (idle)

On the Cultivate screen the character meditates and earns cultivation points (CP) in real time, also while the game is closed. Offline progress is computed from the saved timestamp on load, capped at 8 hours, and shown in a "while you were away" popup.

**CP rate:** Qi Condensation 1/s, Foundation 3/s, Core 9/s. Multiplied by Spirit Gathering Array, cultivation herbs and cultivation manuals.

**Focus (player picks one):**
- Body: every 30 CP → +3 Vitality; every 150 CP → +1 Body
- Meridians: every 30 CP → +1 Qi; every 120 CP → +1 Strength
- Dao: CP is ignored; the chosen law gains comprehension (section 7). This is the only idle progress kept on death.

Costs scale ×3 per realm (matching the rate).

**Realm peak:** total CP earned in the current realm fills a bar. Peak = 3,600 CP (Qi Condensation), 21,600 (Foundation), 97,200 (Core). At peak, CP stops accumulating and the "Challenge boss" button unlocks on the boss floor.

**Breakthrough** (on beating a realm boss): all current stats ×1.5, realm +1, CP bar resets for the new realm.

---

## 9. Regression (on death)

Reset: realm (Qi Condensation), stats (base + talents), CP, learned techniques (except soul-memory carries), current floor (1), run boosters.

Kept: memories, law mastery, insight points, talents, Spirit Gathering Array, death count, total play time.

---

## 10. Screens

Phone portrait first (360–430px wide), works on desktop. Bottom tab bar: **Cultivate · Pagoda · Techniques · Laws · Soul**.

1. **Cultivate (home):** meditating figure, CP counter and rate, focus buttons (Body / Meridians / Dao + law picker), realm peak bar, current stats, HP regen. Offline popup on load.
2. **Pagoda:** vertical tower of 9 floors. Current floor shows its 3 fights. Cleared floors lit, locked floors greyed. Boss button locked until realm peak.
3. **Techniques:** 4 equip slots, learned list, soul-memory slots. Tap for details.
4. **Laws:** 7 laws with level bar, comprehension, next milestone. Memories section: enemies in a grid, revealed ones show pattern and weakness, others "???".
5. **Soul:** insight points, talents, Spirit Gathering Array.
6. **Title:** Continue / New game.
7. **Awakening:** first run shows a short intro (3–4 lines). Later runs show "Death #N", then element choice and soul-memory technique choice.
8. **Combat:** enemy (name, element badge, HP bar, intent icon) on top; short log in the middle; player HP and Qi bars and action buttons at the bottom. Rewind button if Time ≥ 6. Damage numbers float up.
9. **Reward:** 3 cards, pick 1.
10. **Breakthrough:** full-screen moment, new realm name, stats before → after.
11. **Death / Regression:** floor reached, memories unlocked, comprehension gained per law, insight earned, soul-memory choice, "Wake up" button.
12. **Ascension:** ending text, total deaths, total time.

**Visual direction:** ink-wash on dark paper. Jade for Qi, crimson for HP, gold for crits and breakthroughs. One color per element (fire red-orange, water blue, metal silver, wood green, earth ochre). Brush-style display font from Google Fonts with a clean body font. Shapes and icons only, no character art. Respect prefers-reduced-motion.

---

## 11. Save

- localStorage, single key, versioned schema with a migration function.
- Autosave on every meaningful state change and every 10 seconds on the Cultivate screen; save timestamp for offline progress.
- Settings: export save (text to copy) and import save (paste), reset game with an in-page confirmation step.

---

## 12. Debug mode

With `?debug=1` in the URL: a floating panel with time speed (×1/×10/×100), add CP, add insight, set law levels, jump to floor, instant win/lose fight. Hidden otherwise.

---

## 13. Build order

Build in milestones. Each one ends playable, tested, and committed. Stop after each milestone and summarize what changed and how to try it.

1. **Setup + combat engine:** project scaffold, data files, combat engine in `engine/` with Vitest tests (damage formula, element counters, crit/dodge with seeded RNG, statuses, enemy patterns).
2. **Combat screen:** play floor 1 fights against data-driven enemies.
3. **Pagoda loop:** floor map, rewards, death → regression → awakening, save/load.
4. **Cultivation:** idle CP, focus, offline progress, realm peak, boss challenge, breakthrough.
5. **Persistent systems:** memories, law mastery and milestones, insight and Soul tab.
6. **Full content + polish:** all floors and bosses, final boss, ascension, animations, PWA install, debug panel, deploy instructions (GitHub Pages or Netlify).

---

## 14. Balance notes

All numbers above are first drafts. Expected pacing: a full clear around run 5–8. When balancing, change values in `src/data/` only, and report what changed and why.
