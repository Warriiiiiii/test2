import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../src/data/enemies';
import { MAPS } from '../src/data/maps';
import { ENEMY_SPRITES, ITEM_SPRITES, PLAYER_SPRITE, TILE_THEMES, allSpriteFiles } from '../src/data/sprites';

// Milestone 3 keeps the "missing sprite" validation here; the debug panel will show it in-game later.
describe('sprite mapping', () => {
  it('every enemy has a sprite', () => {
    for (const enemy of ENEMIES) expect(ENEMY_SPRITES[enemy.id], `sprite for ${enemy.id}`).toBeDefined();
  });

  it('every map tile set has a theme', () => {
    for (const map of MAPS) expect(TILE_THEMES[map.tileset], `theme ${map.tileset} for ${map.id}`).toBeDefined();
  });

  it('every referenced image exists under public/assets', () => {
    for (const file of allSpriteFiles()) expect(existsSync(`public/assets/${file}`), file).toBe(true);
    for (const file of Object.values(ITEM_SPRITES)) expect(existsSync(`public/assets/${file}`), file).toBe(true);
  });

  it('animations only use frames that fit the sheet layout', () => {
    for (const def of [PLAYER_SPRITE, ...Object.values(ENEMY_SPRITES)]) {
      const maxFrame = def.columns * 7 - 1; // tallest pack sheet is 7 rows
      for (const anim of Object.values(def.anims)) {
        expect(anim.frames.length).toBeGreaterThan(0);
        for (const f of anim.frames) expect(f, `${def.file} frame ${f}`).toBeLessThanOrEqual(maxFrame);
      }
      expect(def.anims.idle, `${def.file} idle`).toBeDefined();
    }
  });

  it('theme tile references point at declared sources', () => {
    for (const [name, theme] of Object.entries(TILE_THEMES)) {
      const refs = [theme.base, ...Object.values(theme.ground), ...Object.values(theme.overlay)];
      for (const ref of refs) expect(theme.sources[ref.source], `${name}: source ${ref.source}`).toBeDefined();
    }
  });
});
