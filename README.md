# Ninefold Pagoda

A mobile-first xianxia web game: die, remember, climb again. The full design lives in [CLAUDE.md](CLAUDE.md).

**Play it:** https://warriiiiiii.github.io/test2/ (deployed from `main` by GitHub Actions)

## Run locally

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # engine tests (Vitest)
npm run build      # production build in dist/
```

## What works right now

Milestone 3: art and world. Title → choose an element → wake up on the Sect Grounds, a 2D pixel-art
map. Tap a tile to walk there (arrow keys or WASD on desktop). Walk onto the mat to meditate (heals
HP) or through the door to open the World screen and enter a pagoda floor. Floors 1–3 have
wandering monsters: touch one to fight it on the combat screen, then pick one of three reward cards.
Wins count towards clearing the floor and unlocking the next one. Floor 3 has a sealed boss gate
that needs the floor cleared and the realm peak (cultivation, milestone 5). Dying returns you to the
awakening. Cutscenes, saving, cultivation and persistent progression arrive in milestones 4–6.

The bottom tabs are Cultivate, World, Techniques, Laws and Soul. Laws and Soul are placeholders.

## Art

Sprites, tiles and items come from the [Ninja Adventure Asset Pack](https://pixel-boy.itch.io/ninja-adventure-asset-pack)
by Pixel-boy and AAA (CC0). Only the files the game uses live in `public/assets/`, with the pack's
folder names kept. `src/data/sprites.ts` is the only file that names a sprite path: it maps every
enemy, the player, the tile themes and the reward items to pack files. Change art there.

## Layout

```
src/data/     every balance number, all content (regions, maps, sprites) and all player-facing text
src/engine/   pure game logic (combat, maps, encounters, rewards, areas) — no React or Phaser, fully tested
src/scenes/   the Phaser area map scene
src/store/    Zustand store wiring the engine to the screens
src/ui/       React screens and components
tests/        Vitest tests for the engine
```

Tuning the game means editing files in `src/data/` only.

## Deploy

Every push to `main` runs the tests, builds with the `/test2/` base path and publishes `dist/` to GitHub Pages
(`.github/workflows/deploy.yml`). If the first run fails on the Pages step, open the repo's
Settings → Pages and set Source to "GitHub Actions", then re-run the workflow.
