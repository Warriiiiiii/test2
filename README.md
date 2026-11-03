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

Milestone 2: the combat screen. Title → choose an element → floor 1 → three fights in a row
against enemies drawn from the Qi Condensation pool. HP carries between fights, Qi refills each fight.
Clearing the floor lets you rest and climb floor 1 again; dying counts a death and sends you back
to the awakening. Rewards, higher floors, saving and cultivation arrive in the next milestones.

## Layout

```
src/data/     every balance number and all player-facing text
src/engine/   pure game logic (combat, rng, statuses) — no React, fully tested
src/store/    Zustand store wiring the engine to the screens
src/ui/       React screens and components
tests/        Vitest tests for the engine
```

Tuning the game means editing files in `src/data/` only.

## Deploy

Every push to `main` runs the tests, builds with the `/test2/` base path and publishes `dist/` to GitHub Pages
(`.github/workflows/deploy.yml`). If the first run fails on the Pages step, open the repo's
Settings → Pages and set Source to "GitHub Actions", then re-run the workflow.
