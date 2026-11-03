# Ninefold Pagoda — Game Spec

Working title. A mobile-first 2D web game: xianxia setting, regression loop, explorable pixel-art maps (in the spirit of Inflation RPG), turn-based combat, idle cultivation.

The owner designed this game and is not a professional developer. Keep code simple and readable, explain choices briefly in commit messages, and keep every balance number and every piece of content in data files so it can be tuned or extended without touching logic.

> **Spec v2.** Milestones 1 and 2 were built on spec v1. v2 adds 2D maps, regions and areas, cutscenes and a sprite pack. Code from milestones 1–2 is kept and extended; see section 15.

---

## 1. Concept

The player is transported from the modern world into a xianxia world. They wake up as a servant of a small sect, with crippled meridians. Every time they die, they wake up again on their first morning in this world, keeping their memories. Nobody knows why.

Goal: climb the Ninefold Heaven Pagoda (9 floors) and reach Nascent Soul to ascend. Clearing floor 9 ends the game. More regions can be added later (see section 14).

Core loop:
1. Cultivate (idle) to grow stats and reach the realm peak.
2. Explore 2D maps, touch monsters to start turn-based fights, pick rewards.
3. Beat the realm boss to break through.
4. Die → regress to day 1, keeping memories, law mastery and insight.

---

## 2. Tech stack

- Vite + React + TypeScript for menus, combat screen and app shell
- Phaser 3 for the 2D map scenes, mounted inside a React component
- Zustand for game state (shared by React and Phaser)
- Vitest for unit tests
- vite-plugin-pwa so the game installs on an Android home screen and works offline
- No backend. Save in localStorage.
- Art: Ninja Adventure Asset Pack (section 11)

Project structure:

```
src/
  data/
    stats.ts, techniques.ts, enemies.ts, talents.ts, laws.ts, rewards.ts, cultivation.ts
    regions/        one file per region, each listing its areas
    maps/           one file per area map (grid layout + spawn points)
    cutscenes/      one file per cutscene script
    sprites.ts      maps every game id (enemy, character, tile set, item) to a sprite file
    strings.ts      all UI text
  engine/          pure TypeScript game logic, no React or Phaser (combat, cultivation, regression, encounters, cutscene runner, save)
  scenes/          Phaser scenes (area map)
  store/           Zustand store wiring engine to UI and Phaser
  ui/              React screens and components
public/assets/     sprite pack files actually used by the game
tests/             Vitest tests for engine
```

Rules:
- `engine/` contains pure functions with no UI or browser APIs (except the save module). Everything in it is unit tested.
- All numbers live in `src/data/`. Never hardcode a balance value in logic, UI or scenes.
- All player-facing text lives in `src/data/strings.ts` or in cutscene files (English for now, French later).
- Seeded RNG in the engine so combat and encounters are testable.
- Never reference a sprite file path outside `src/data/sprites.ts`.

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

Turn-based, one enemy per fight, on its own screen (the map pauses behind it). Each turn the player picks one action: a basic, or an equipped technique.

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

**Combat screen visuals:** enemy sprite on top (scaled up with pixelated rendering, idle animation, hit flash, death fade), player sprite at the bottom, area background behind them. Element badge, HP bar and intent icon over the enemy.

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

## 6. World: regions, areas, enemies

### Structure

- A **region** is a group of areas with a theme, an unlock condition and a realm range. Defined in `src/data/regions/<id>.ts`.
- An **area** is one explorable 2D map. Each area defines: map layout, tile set, background music, enemy pool with spawn weights, how many monsters are on the map at once, how many wins clear the area (`winsToClear`), optional boss, optional cutscene triggers, and an unlock condition (previous area cleared, realm reached, etc.).
- The first region is **Ninefold Heaven Pagoda**, with 9 areas (one per floor). Floor 1 unlocks from the start; each floor unlocks when the previous one is cleared.
- A **Sect Grounds** hub area (no monsters) is where every run starts. It holds the meditation spot and the pagoda entrance.

### Exploring an area

- Top-down 16×16 tile map, camera follows the player, scaled for phone screens.
- Movement: tap a tile to walk there (grid pathfinding). Also arrow keys / WASD on desktop.
- Monsters wander slowly on the map, shown with their sprites. Walking into one starts a fight.
- After a win, the monster disappears and a new one spawns elsewhere after a short delay, up to the area's monster count.
- An exit tile returns to Sect Grounds at any time outside combat.
- Area progress (wins) shows at the top. When `winsToClear` is reached, the next area unlocks.
- Boss areas have a sealed gate guarding the boss. The gate opens when the area is cleared **and** the player is at realm peak (section 8).
- Losing any fight = death (section 9).

HP regenerates while meditating (1% of max HP per second, also offline). It does not regenerate on maps.

### Reward after each fight

Pick 1 of 3 cards:
- Spirit herb: one stat boost (+5 Vitality, +2 Qi, +1 Strength, +1 Body, +1 Agility or +1 Divine Sense), scaled by realm multiplier (1 / 1.5 / 2.25)
- Cultivation herb: +50% cultivation rate for 30 minutes
- Technique scroll: a scroll technique not yet learned this run
- Pill: heal 50% HP

### Pagoda areas

| Floor | Realm | winsToClear | Monsters on map | Boss |
|---|---|---|---|---|
| 1 | Qi Condensation | 3 | 4 | — |
| 2 | Qi Condensation | 4 | 5 | — |
| 3 | Qi Condensation | 3 | 4 | Jade Python King |
| 4 | Foundation Establishment | 4 | 5 | — |
| 5 | Foundation Establishment | 5 | 5 | — |
| 6 | Foundation Establishment | 4 | 5 | Elder Jin |
| 7 | Core Formation | 5 | 5 | — |
| 8 | Core Formation | 5 | 6 | — |
| 9 | Core Formation | 4 | 5 | Nine-Colored Tribulation |

Each floor's enemy pool is its realm's pool below.

### Enemies

Format: HP / Strength / Body / Agility, element, pattern.

**Qi Condensation (floors 1–3)**
- Spirit Rat (wood): 20/4/0/6. Bite (1.0) → Bite → Frenzy (2 hits × 0.8)
- Iron-Shell Turtle (earth): 35/3/4/1. Withdraw (+4 Body 1 turn) → Slam (1.5)
- Ember Fox (fire): 25/6/1/5. Fox Fire (0.8 + burn 2/turn for 3) → Bite (1.0) → Evasive Stance (+30% dodge 1 turn)
- Outer Sect Bully (metal): 30/5/2/3. Strike (1.0) → Strike → Iron Fist (2.0)
- Boss, Jade Python King (water): 120/8/3/4. Coil (next hit ×2) → Constrict (1.2) → Venom Spit (0.6 + poison 4/turn for 3). Once at 50% HP: Shed Skin (heal 20).

**Foundation Establishment (floors 4–6)**
- Bloodthorn Wolf (wood): 60/12/4/9. Howl (next attack ×1.5) → Pounce (1.2) → Rend (1.0 + bleed 5/turn for 3)
- Lava Golem (fire): 110/10/10/2. Charge (1.2) → Charge → Magma Burst (3.0). Magma Burst intent is shown 2 turns early.
- Wandering Swordsman (none): 80/14/5/8. Swift Sword (2 × 0.9) → Swift Sword → Sword Qi (1.8, ignores Qi Shield)
- Frost Wraith (water): 70/11/3/7. Chill (1.0) → Freeze (0.5 + freeze)
- Boss, Elder Jin of the Golden Pavilion (metal): 300/16/8/6. Phase 1: Golden Bell (shield 40) ↔ Metal Rain (3 × 0.7). At 50% HP: Golden Body (Body ×2 for 3 turns), then resumes.

**Core Formation (floors 7–9)**
- Thunder Roc (metal): 180/22/6/14. Wing Gust (1.0) → Wing Gust → Sky Dive (3.0, intent shown 1 turn early)
- Ancient Treant (wood): 300/18/14/1. Regenerates 10 HP per turn. Root Lash (1.2) → Entangle (delay player 1 turn)
- Demonic Cultivator (fire): 200/24/8/8. Blood Sacrifice (loses 10% own HP, next hit ×3) → Demon Palm (1.2)
- Mirror Spirit (none): HP 150, other stats copy the player's. Each turn it uses the last technique the player used.
- Final boss, Nine-Colored Tribulation: 900/40/12/10. Element rotates fire → water → metal → wood → earth every 2 turns (next element shown in advance). Tribulation Bolt (1.0) each turn. Every 9th turn: Heaven's Judgment (5.0).

---

## 7. Persistent progression (survives death)

**Memories (bestiary):** dying to an enemy unlocks its memory permanently: full pattern, element, weakness, and intent shown in every future fight.

**Law mastery:** 7 laws (fire, water, metal, wood, earth, sword, time), levels 0–9.
- Comprehension needed for level n: `10 × n²` cumulative (10, 40, 90, … 810).
- Using a technique: +1 comprehension to its law.
- Beating a boss: +20 to the law used most in that fight.
- Time law: only grows on death: `+10 + 3 × highest floor reached`.
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

**Insight points:** earned on death = `2 × highest floor reached + 5 × bosses beaten this run`. Spent in the Soul tab:
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

**Realm peak:** total CP earned in the current realm fills a bar. Peak = 3,600 CP (Qi Condensation), 21,600 (Foundation), 97,200 (Core). At peak, CP stops accumulating and boss gates can open.

**Breakthrough** (on beating a realm boss): all current stats ×1.5, realm +1, CP bar resets for the new realm. Triggers the breakthrough cutscene.

---

## 9. Regression (on death)

Reset: realm (Qi Condensation), stats (base + talents), CP, learned techniques (except soul-memory carries), unlocked areas (back to floor 1), area progress, run boosters.

Kept: memories, law mastery, insight points, talents, Spirit Gathering Array, cutscenes seen, death count, highest floor ever reached, total play time.

---

## 10. Cutscenes

Data-driven dialogue scenes, one file per cutscene in `src/data/cutscenes/`.

A cutscene is a list of steps:
- `line`: speaker id, portrait (faceset from the sprite pack, optional), text
- `narration`: text with no speaker
- `background`: area or plain color behind the dialogue
- `music`: switch track
- `wait`: pause in ms
- `choice` (optional, for later): 2–3 options, each setting a flag

Each cutscene has a trigger and optional conditions:
- Triggers: `newGame`, `awaken` (every regression), `enterArea` (first time), `bossStart`, `bossDefeat`, `breakthrough`, `death`, `ascension`
- Conditions: death count (e.g. `deaths >= 3`), realm, flags, `seenBefore`

Rules:
- Text appears letter by letter. Tap to finish the line, tap again for the next one. A Skip button skips the whole scene.
- Cutscenes already seen are marked in the save. Each cutscene defines `replay: "always" | "once" | "afterDeathCount"` so regression can unlock new dialogue (e.g. Elder Jin says something different after you've died to him 3 times).

Starter cutscenes to write:
- `intro`: waking up in a servant's room, confused, a senior disciple yells at you to get to work (newGame)
- `awaken`: short line, different flavor text for deaths 1, 2–4, 5+ (awaken)
- `pagoda-first`: entering floor 1 for the first time
- `python-start`, `python-defeat`
- `jin-start`, `jin-defeat`, `jin-start-memory` (plays instead of `jin-start` after dying to him at least once: he notices something strange in your eyes)
- `tribulation-start`
- `breakthrough-foundation`, `breakthrough-core`
- `ascension`

Keep every line short (phone screen, max ~90 characters).

---

## 11. Art and sound

**Pack:** Ninja Adventure Asset Pack by Pixel-boy and AAA (https://pixel-boy.itch.io/ninja-adventure-asset-pack). CC0 license. 16×16 pixel art with characters and facesets, monsters, bosses, tile sets, UI elements, items, effects, fonts, music and sound effects.

Getting it into the repo:
1. Try to download the pack. If itch.io blocks automated download, stop and ask the owner to upload the zip to the repo (or to a GitHub release), then continue.
2. Copy only the files the game uses into `public/assets/`, keeping the pack's folder names. Do not commit the whole pack.
3. Add a credits line in the Settings screen: "Art and music: Ninja Adventure Asset Pack by Pixel-boy and AAA (CC0)".

Mapping rules:
- `src/data/sprites.ts` maps every game id to a sprite, animation frames and an optional tint. Swapping art later means editing only this file.
- Pick the closest-looking monster for each enemy. When several enemies share a sprite, use a tint (e.g. the Ember Fox as a red tint of a beast sprite). Rename nothing in the pack.
- Bosses use the pack's boss sprites.
- The player uses one character sprite from the pack that looks like a humble servant. The sprite stays the same across realms; add a colored aura effect per realm.

**Visual direction:** pixel art everywhere, rendered with `image-rendering: pixelated` at integer scales. UI uses the pack's UI elements and pixel font, on a dark ink-wash-style frame. Colors: jade for Qi, crimson for HP, gold for crits and breakthroughs, one color per element (fire red-orange, water blue, metal silver, wood green, earth ochre). Respect prefers-reduced-motion.

**Sound:** pack music per area (set in area data) and sound effects for hits, crits, rewards, breakthrough and death. Audio starts only after the first tap. Volume and mute in Settings.

---

## 12. Screens

Phone portrait first (360–430px wide), works on desktop. Bottom tab bar on non-map screens: **Cultivate · World · Techniques · Laws · Soul**.

1. **Cultivate (home):** the player sprite meditating, CP counter and rate, focus buttons (Body / Meridians / Dao + law picker), realm peak bar, current stats, HP regen. Offline popup on load.
2. **World:** list of regions, then the region's areas with lock state, progress and boss marker. Tapping an unlocked area enters its map.
3. **Area map (Phaser):** full screen, tab bar hidden. HUD with HP bar, area progress (wins / winsToClear) and an exit button.
4. **Techniques:** 4 equip slots, learned list, soul-memory slots. Tap for details.
5. **Laws:** 7 laws with level bar, comprehension, next milestone. Memories section: enemies in a grid with their sprites; revealed ones show pattern and weakness, others show a dark silhouette and "???".
6. **Soul:** insight points, talents, Spirit Gathering Array.
7. **Title:** Continue / New game / Settings.
8. **Settings:** volume, mute, export save, import save, reset game (in-page confirmation), credits.
9. **Awakening:** after the `intro`/`awaken` cutscene: "Death #N", element choice and soul-memory technique choice.
10. **Combat:** see section 4.
11. **Reward:** 3 cards with item sprites, pick 1.
12. **Breakthrough:** full-screen moment, new realm name, stats before → after, then its cutscene.
13. **Death / Regression:** highest floor reached, memories unlocked, comprehension gained per law, insight earned, soul-memory choice, "Wake up" button.
14. **Cutscene:** dialogue box at the bottom with portrait, name and text; background above.
15. **Ascension:** ending cutscene, then total deaths and total time.

---

## 13. Save and debug

**Save:**
- localStorage, single key, versioned schema with a migration function. Bump the version whenever the save shape changes and migrate older saves.
- Autosave on every meaningful state change and every 10 seconds on the Cultivate screen; save timestamp for offline progress.
- Export save (text to copy) and import save (paste) in Settings.

**Debug mode** (`?debug=1` in the URL): a floating panel with time speed (×1/×10/×100), add CP, add insight, set law levels, unlock all areas, teleport to any area, instant win/lose fight, play any cutscene. Hidden otherwise.

---

## 14. Adding content (for the owner)

Everything below must work by editing data files only, with no engine or UI changes. Keep this section accurate as the code evolves, and keep a short example next to each data file.

- **New monster:** add an entry in `enemies.ts` (stats, element, pattern), a sprite mapping in `sprites.ts`, and its id in an area's enemy pool.
- **More monsters in an area:** raise the area's monster count or add ids to its pool.
- **New area:** add a map file in `maps/`, then an area entry in its region file (tile set, music, pool, winsToClear, boss, unlock condition).
- **New region:** add a file in `regions/` with its areas and unlock condition, and register it in the region list.
- **New cutscene:** add a file in `cutscenes/` with its steps, trigger and conditions.
- **New technique, talent or reward:** add an entry in the matching data file.

The engine validates all data on startup in debug mode (missing sprites, unknown enemy ids, broken unlock chains) and shows clear errors.

---

## 15. Build order

Build in milestones. Each one ends playable, tested, and committed. At the end of each milestone, open a pull request to main, then summarize what changed and how to try it on a phone.

1. ✅ **Setup + combat engine** (spec v1)
2. ✅ **Combat screen** (spec v1, placeholder visuals)
3. **Art + world:** import the sprite pack (section 11), `sprites.ts`, region/area/map data format, Phaser area scene with tap-to-move and wandering monsters, Sect Grounds hub and pagoda floors 1–3, encounters into the combat screen, combat screen updated with sprites, reward cards.
4. **Regression loop + cutscenes + save:** death → regression → awakening, cutscene system and the starter cutscenes, settings screen, save/load with migration.
5. **Cultivation:** idle CP, focus, offline progress, realm peak, boss gates, breakthrough.
6. **Persistent systems:** memories, law mastery and milestones, insight and Soul tab.
7. **Full content + polish:** floors 4–9, all bosses, final boss, ascension, sound and music, PWA install, debug panel, data validation, section 14 examples.

---

## 16. Balance notes

All numbers above are first drafts. Expected pacing: a full clear around run 5–8. When balancing, change values in `src/data/` only, and report what changed and why.
