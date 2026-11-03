// Every game id → sprite file in the Ninja Adventure Asset Pack (public/assets/, pack folder names kept).
// This is the only file allowed to mention a sprite path. Swap art by editing it alone.
//
// Pack sheet layout for monsters (64×64) and characters (64×112): 4 columns = facing down, up, left,
// right; each row is one walk frame. So "walk down" is frames 0, 4, 8, 12. Boss idle strips are one
// row of larger frames. Frame indices count left to right, top to bottom.
import type { TileKind } from '../engine/map';

export const ASSET_ROOT = 'assets/';

/** Browser URL for a pack file, respecting the deploy base path. */
export function assetUrl(file: string): string {
  return `${import.meta.env.BASE_URL}${ASSET_ROOT}${file}`;
}

export interface SpriteAnim {
  frames: number[];
  frameRate: number;
}

export interface SpriteSheetDef {
  file: string;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  /** Frame shown when standing still, facing the camera. */
  idleFrame: number;
  /** Named animations: idle, idleUp, walkDown, walkUp, walkLeft, walkRight (any subset). */
  anims: Record<string, SpriteAnim>;
  /** Optional tint (0xRRGGBB) applied on the map to tell twins apart. */
  tint?: number;
  /** Size on the map relative to the sheet's natural size. */
  mapScale?: number;
  /** Integer zoom on the combat screen. 16 px sprites use 5, bosses less. */
  combatScale?: number;
}

/** A pack monster or character sheet. */
function actor(file: string, over: Partial<SpriteSheetDef> = {}): SpriteSheetDef {
  return {
    file,
    frameWidth: 16,
    frameHeight: 16,
    columns: 4,
    idleFrame: 0,
    anims: {
      idle: { frames: [0, 4, 8, 12], frameRate: 4 },
      idleUp: { frames: [1, 5, 9, 13], frameRate: 4 },
      walkDown: { frames: [0, 4, 8, 12], frameRate: 8 },
      walkUp: { frames: [1, 5, 9, 13], frameRate: 8 },
      walkLeft: { frames: [2, 6, 10, 14], frameRate: 8 },
      walkRight: { frames: [3, 7, 11, 15], frameRate: 8 },
    },
    ...over,
  };
}

/** A pack boss idle strip: `frames` frames of `size` px in one row. Bosses never walk. */
function boss(file: string, size: number, frames: number, over: Partial<SpriteSheetDef> = {}): SpriteSheetDef {
  const all = Array.from({ length: frames }, (_, i) => i);
  return {
    file,
    frameWidth: size,
    frameHeight: size,
    columns: frames,
    idleFrame: 0,
    anims: { idle: { frames: all, frameRate: 6 } },
    combatScale: 3,
    ...over,
  };
}

/** A humble servant: the plain villager. The same sprite every realm; auras come later. */
export const PLAYER_SPRITE: SpriteSheetDef = actor('Actor/Characters/Villager/SpriteSheet.png', {
  anims: {
    idle: { frames: [0, 4], frameRate: 2 },
    idleUp: { frames: [1, 5], frameRate: 2 },
    walkDown: { frames: [0, 4, 8, 12], frameRate: 8 },
    walkUp: { frames: [1, 5, 9, 13], frameRate: 8 },
    walkLeft: { frames: [2, 6, 10, 14], frameRate: 8 },
    walkRight: { frames: [3, 7, 11, 15], frameRate: 8 },
  },
});

/** Enemy id → sprite. Closest-looking pack monster for each one. */
export const ENEMY_SPRITES: Record<string, SpriteSheetDef> = {
  // Qi Condensation
  spiritRat: actor('Actor/Monsters/Mouse/SpriteSheet.png'),
  ironShellTurtle: actor('Actor/Monsters/Mollusc/Mollusc.png'),
  emberFox: actor('Actor/Monsters/Beast/Beast.png'),
  outerSectBully: actor('Actor/Characters/FighterRed/SpriteSheet.png'),
  jadePythonKing: boss('Actor/Boss/GiantFrog/Idle40x40.png', 40, 5),
  // Foundation Establishment
  bloodthornWolf: actor('Actor/Monsters/Beast2/Beast2.png'),
  lavaGolem: actor('Actor/Monsters/Cyclope/SpriteSheet.png'),
  wanderingSwordsman: actor('Actor/Characters/Samurai/SpriteSheet.png'),
  frostWraith: actor('Actor/Monsters/Spirit2/SpriteSheet.png'),
  elderJin: boss('Actor/Boss/GiantBlueSamurai/Idle.png', 48, 12),
  // Core Formation
  thunderRoc: actor('Actor/Monsters/Owl2/Owl2.png'),
  ancientTreant: actor('Actor/Monsters/BambooYellow/SpriteSheet.png'),
  demonicCultivator: actor('Actor/Characters/SorcererBlack/SpriteSheet.png'),
  mirrorSpirit: actor('Actor/Monsters/Spirit/SpriteSheet.png'),
  nineColoredTribulation: boss('Actor/Boss/GiantSpirit/Idle.png', 50, 5),
};

// ---------- Tiles ----------

export interface TileSource {
  file: string;
  tileWidth: number;
  tileHeight: number;
}

/** A tile from one source image. An array means random variants; -1 draws nothing. */
export interface TileRef {
  source: string;
  index: number | number[];
}

/**
 * A map theme. The ground layer draws `base` under everything unless `ground` names a tile for the
 * kind; the overlay layer draws `overlay` tiles (trees, water, props) on top.
 */
export interface TileTheme {
  sources: Record<string, TileSource>;
  base: TileRef;
  ground: Partial<Record<TileKind, TileRef>>;
  overlay: Partial<Record<TileKind, TileRef>>;
}

const SOURCES: Record<string, TileSource> = {
  field: { file: 'Backgrounds/Tilesets/TilesetField.png', tileWidth: 16, tileHeight: 16 },
  nature: { file: 'Backgrounds/Tilesets/TilesetNature.png', tileWidth: 16, tileHeight: 16 },
  water: { file: 'Backgrounds/Tilesets/TilesetWater.png', tileWidth: 16, tileHeight: 16 },
  element: { file: 'Backgrounds/Tilesets/TilesetElement.png', tileWidth: 16, tileHeight: 16 },
};

/** Props shared by every theme: water, the exit sign, the boss gate, the meditation mat, the entrance door. */
const COMMON_OVERLAY: TileTheme['overlay'] = {
  water: { source: 'water', index: [66, 66, 67, 67, 95] },
  exit: { source: 'element', index: 43 },
  gate: { source: 'element', index: 17 },
  meditation: { source: 'element', index: 37 },
  entrance: { source: 'element', index: 15 },
};

const PATH: TileRef = { source: 'field', index: 6 };
const NONE = -1;

/** Tile set id (from map data) → theme. */
export const TILE_THEMES: Record<string, TileTheme> = {
  // Light meadow: pagoda floors 1–3 and the Sect Grounds.
  field: {
    sources: SOURCES,
    base: { source: 'field', index: [21, 21, 21, 21, 21, 23, 24] },
    ground: { path: PATH, exit: PATH, gate: PATH, entrance: PATH },
    overlay: {
      ...COMMON_OVERLAY,
      grass: { source: 'nature', index: [NONE, NONE, NONE, NONE, NONE, NONE, NONE, NONE, NONE, NONE, 240, 241, 242, 243, 244, 245, 264] },
      tree: { source: 'nature', index: [199, 199, 199, 198, 268, 269, 270] },
      rock: { source: 'nature', index: [316, 317, 318] },
    },
  },
  // Deep forest: floors 4–6.
  nature: {
    sources: SOURCES,
    base: { source: 'field', index: [36, 36, 36, 36, 38, 39] },
    ground: { path: PATH, exit: PATH, gate: PATH, entrance: PATH },
    overlay: {
      ...COMMON_OVERLAY,
      grass: { source: 'nature', index: [NONE, NONE, NONE, NONE, NONE, NONE, 240, 243, 268, 272, 273] },
      tree: { source: 'nature', index: [198, 198, 199, 268, 269] },
      rock: { source: 'nature', index: [316, 317, 318] },
    },
  },
  // Snowy summit: floors 7–9.
  dungeon: {
    sources: SOURCES,
    base: { source: 'field', index: [66, 66, 66, 66, 68, 69] },
    ground: { path: PATH, exit: PATH, gate: PATH, entrance: PATH },
    overlay: {
      ...COMMON_OVERLAY,
      grass: { source: 'nature', index: [NONE, NONE, NONE, NONE, NONE, NONE, NONE, 322, 320] },
      tree: { source: 'nature', index: [290, 291, 291] },
      rock: { source: 'nature', index: [320, 321, 322] },
    },
  },
};

/** Single-image icons for reward cards and items. */
export const ITEM_SPRITES = {
  spiritHerb: 'Items/Food/TeaLeaf.png',
  cultivationHerb: 'Items/Food/Seed1.png',
  scroll: 'Items/Scroll/ScrollFire.png',
  pill: 'Items/Potion/LifePot.png',
} as const;

/** Music track id (area data) → file. Files are copied in a later milestone. */
export const MUSIC: Record<string, string> = {
  village: 'Musics/4 - Village.ogg',
  adventure: 'Musics/1 - Adventure Begin.ogg',
  tension: 'Musics/28 - Tension.ogg',
  cave: 'Musics/2 - The Cave.ogg',
  dungeon: 'Musics/21 - Dungeon.ogg',
  finalArea: 'Musics/24 - Final Area.ogg',
};

/** Every image file the game references, for validation. */
export function allSpriteFiles(): string[] {
  const files = new Set<string>();
  files.add(PLAYER_SPRITE.file);
  for (const def of Object.values(ENEMY_SPRITES)) files.add(def.file);
  for (const theme of Object.values(TILE_THEMES)) for (const src of Object.values(theme.sources)) files.add(src.file);
  for (const file of Object.values(ITEM_SPRITES)) files.add(file);
  return [...files];
}
