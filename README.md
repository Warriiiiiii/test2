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

## Layout

```
src/data/     every balance number and all player-facing text
src/engine/   pure game logic (combat, rng, statuses) — no React, fully tested
src/ui/       React screens (from milestone 2)
tests/        Vitest tests for the engine
```

Tuning the game means editing files in `src/data/` only.

## Deploy

Every push to `main` runs the tests, builds with the `/test2/` base path and publishes `dist/` to GitHub Pages
(`.github/workflows/deploy.yml`). If the first run fails on the Pages step, open the repo's
Settings → Pages and set Source to "GitHub Actions", then re-run the workflow.
