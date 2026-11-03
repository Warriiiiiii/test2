// Numbers for exploring area maps. Tune here, not in the Phaser scene.
export const WORLD = {
  /** Source tile size in the sprite pack. */
  tileSize: 16,
  /** The map zoom is the largest integer that fits this many tiles across the screen, clamped below. */
  tilesAcross: 11,
  minZoom: 2,
  maxZoom: 4,
  /** World pixels the camera may scroll above the map so the HUD never covers the player at the top edge. */
  cameraTopPadding: 40,
  /** Player walking speed, tiles per second. */
  playerTilesPerSecond: 6,
  /** Monster walking speed, tiles per second. */
  monsterTilesPerSecond: 2.5,
  /** How often a monster considers moving, in milliseconds. */
  wanderIntervalMs: 1200,
  /** Chance a monster moves when it considers it (0.5 = half the time). */
  wanderChance: 0.55,
  /** Monsters never spawn closer than this many tiles (Manhattan) to the player. */
  spawnMinDistance: 4,
  /** Delay before a beaten monster is replaced, in milliseconds. */
  respawnDelayMs: 2500,
} as const;
