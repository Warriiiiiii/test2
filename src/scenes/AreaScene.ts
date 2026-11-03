// The explorable area map. Thin Phaser driver over the pure engine: pathfinding, encounters and
// progress rules live in src/engine; this file only draws, tweens and forwards events to the store.
import Phaser from 'phaser';
import type { AreaDef } from '../engine/types';
import { canOpenBossGate, findArea, progressOf } from '../engine/area';
import { getMap } from '../data/maps';
import { isWalkable, parseMap, samePoint, type ParsedMap } from '../engine/map';
import { findPath, type GridPoint } from '../engine/pathfinding';
import { monsterAt, populate, spawnMonster, wanderStep, type MapMonster } from '../engine/encounters';
import { nextInt, seedRng } from '../engine/rng';
import { WORLD } from '../data/world';
import { ENEMY_SPRITES, PLAYER_SPRITE, TILE_THEMES, assetUrl, type SpriteSheetDef, type TileRef, type TileTheme } from '../data/sprites';
import { useGameStore } from '../store/gameStore';

export interface AreaSceneData {
  areaId: string;
  seed: number;
}

interface MonsterView {
  data: MapMonster;
  sprite: Phaser.GameObjects.Sprite;
}

const TILE = WORLD.tileSize;
/** Each tile source image gets its own id range in the tilemap. */
const FIRST_GID = 1;
const GID_STRIDE = 1000;

export class AreaScene extends Phaser.Scene {
  private area!: AreaDef;
  private map!: ParsedMap;
  private rng = 0;
  private tilesetId = 'field';

  private player!: Phaser.GameObjects.Sprite;
  private playerTile!: GridPoint;
  private path: GridPoint[] = [];
  private moving = false;
  private facing = 'Down';

  private monsters: MonsterView[] = [];
  private nextMonsterId = 1;
  private gateOpen = false;
  private overlay?: Phaser.Tilemaps.TilemapLayer;
  private theme!: TileTheme;
  private gateGid = -1;

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
  private unsubscribe?: () => void;

  constructor() {
    super('area');
  }

  init(data: AreaSceneData): void {
    this.area = findArea(data.areaId);
    const mapData = getMap(this.area.map);
    this.map = parseMap(mapData);
    this.tilesetId = mapData.tileset;
    this.rng = seedRng(data.seed);
    this.monsters = [];
    this.path = [];
    this.moving = false;
    this.nextMonsterId = 1;
  }

  preload(): void {
    const theme = TILE_THEMES[this.tilesetId];
    if (!theme) throw new Error(`Unknown tile set: ${this.tilesetId}`);
    this.theme = theme;
    for (const [name, src] of Object.entries(theme.sources)) this.load.image(`tiles:${name}`, assetUrl(src.file));
    this.loadSheet('player', PLAYER_SPRITE);
    for (const id of this.enemyIds()) this.loadSheet(`enemy:${id}`, this.spriteOf(id));
  }

  create(): void {
    this.drawTiles();
    this.createAnims('player', PLAYER_SPRITE);
    for (const id of this.enemyIds()) this.createAnims(`enemy:${id}`, this.spriteOf(id));

    this.playerTile = { ...this.map.start };
    this.player = this.add.sprite(0, 0, 'player', PLAYER_SPRITE.idleFrame).setDepth(10);
    this.placeAt(this.player, this.playerTile);
    this.player.play('player:idle');

    const run = useGameStore.getState().run;
    const bossDefeated = run ? progressOf(run, this.area.id).bossDefeated : false;
    let initial: MapMonster[];
    [initial, this.rng] = populate(this.area, this.map, this.playerTile, bossDefeated, this.rng);
    for (const m of initial) this.addMonster(m);
    this.nextMonsterId = initial.length + 1;
    this.refreshGate();

    const cam = this.cameras.main;
    this.applyZoom();
    cam.setBounds(0, -WORLD.cameraTopPadding, this.map.width * TILE, this.map.height * TILE + WORLD.cameraTopPadding, true);
    cam.startFollow(this.player, true, 0.2, 0.2);
    this.scale.on('resize', this.applyZoom, this);

    // ?debug=1 exposes the scene next to the store (see main.tsx).
    if (new URLSearchParams(window.location.search).has('debug')) {
      const w = window as unknown as { __pagoda?: Record<string, unknown> };
      w.__pagoda = { ...(w.__pagoda ?? {}), scene: this };
    }

    this.input.on('pointerup', this.onTap, this);
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }

    this.time.addEvent({ delay: WORLD.wanderIntervalMs, loop: true, callback: this.wander, callbackScope: this });

    this.unsubscribe = useGameStore.subscribe((state, prev) => {
      if (state.screen !== 'area' && prev.screen === 'area') this.scene.pause();
      if (state.screen === 'area' && prev.screen !== 'area') this.scene.resume();
      if (state.defeated && state.defeated.areaId === this.area.id) {
        this.removeMonster(state.defeated.monsterId, !state.defeated.isBoss);
        state.ackDefeated();
      }
      if (state.run !== prev.run) this.refreshGate();
    });
    const cleanup = () => {
      this.unsubscribe?.();
      this.scale.off('resize', this.applyZoom, this);
    };
    this.events.once('shutdown', cleanup);
    this.events.once('destroy', cleanup);
  }

  /** Largest integer zoom that keeps a comfortable number of tiles across the screen. */
  private applyZoom(): void {
    const fit = Math.floor(this.scale.width / (TILE * WORLD.tilesAcross));
    this.cameras.main.setZoom(Math.max(WORLD.minZoom, Math.min(WORLD.maxZoom, fit)));
  }

  update(): void {
    if (this.moving || this.path.length > 0) return;
    const dir = this.heldDirection();
    if (dir) this.stepTowards({ x: this.playerTile.x + dir.x, y: this.playerTile.y + dir.y });
  }

  // ---------- Drawing ----------

  private drawTiles(): void {
    const names = Object.keys(this.theme.sources);
    const ground: number[][] = [];
    const overlay: number[][] = [];
    for (let y = 0; y < this.map.height; y++) {
      const g: number[] = [];
      const o: number[] = [];
      for (let x = 0; x < this.map.width; x++) {
        const kind = this.map.tiles[y]![x]!;
        let gid = this.gidOf(this.theme.ground[kind]);
        if (gid < 0) gid = this.gidOf(this.theme.base);
        g.push(gid);
        o.push(this.gidOf(this.theme.overlay[kind]));
      }
      ground.push(g);
      overlay.push(o);
    }
    this.makeLayer(ground, names).setDepth(0);
    this.overlay = this.makeLayer(overlay, names).setDepth(1);
    if (this.map.gate) this.gateGid = this.overlay.getTileAt(this.map.gate.x, this.map.gate.y)?.index ?? -1;
  }

  private makeLayer(data: number[][], names: string[]): Phaser.Tilemaps.TilemapLayer {
    const tilemap = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const sets = names.map((name, i) => {
      const src = this.theme.sources[name]!;
      return tilemap.addTilesetImage(name, `tiles:${name}`, src.tileWidth, src.tileHeight, 0, 0, FIRST_GID + i * GID_STRIDE)!;
    });
    return tilemap.createLayer(0, sets, 0, 0)!;
  }

  /** Global tile id for a theme tile reference, or -1 for nothing. */
  private gidOf(ref: TileRef | undefined): number {
    if (!ref) return -1;
    const index = this.pick(ref.index);
    if (index < 0) return -1;
    const sourceIndex = Object.keys(this.theme.sources).indexOf(ref.source);
    if (sourceIndex === -1) throw new Error(`Tile source ${ref.source} missing from theme`);
    return FIRST_GID + sourceIndex * GID_STRIDE + index;
  }

  /** Random variant when the data gives several tile indices. */
  private pick(index: number | number[]): number {
    if (!Array.isArray(index)) return index;
    let i: number;
    [i, this.rng] = nextInt(this.rng, index.length);
    return index[i]!;
  }

  private refreshGate(): void {
    const run = useGameStore.getState().run;
    const open = !!run && canOpenBossGate(this.area, run);
    const gate = this.map.gate;
    if (!gate || !this.overlay?.active) {
      this.gateOpen = open;
      return;
    }
    if (open === this.gateOpen && (open ? !this.overlay.hasTileAt(gate.x, gate.y) : true)) return;
    this.gateOpen = open;
    if (open) this.overlay.removeTileAt(gate.x, gate.y);
    else if (this.gateGid >= 0) this.overlay.putTileAt(this.gateGid, gate.x, gate.y);
  }

  private loadSheet(key: string, def: SpriteSheetDef): void {
    this.load.spritesheet(key, assetUrl(def.file), { frameWidth: def.frameWidth, frameHeight: def.frameHeight });
  }

  private createAnims(key: string, def: SpriteSheetDef): void {
    for (const [name, anim] of Object.entries(def.anims)) {
      const animKey = `${key}:${name}`;
      if (this.anims.exists(animKey)) continue;
      this.anims.create({
        key: animKey,
        frames: anim.frames.map((frame) => ({ key, frame })),
        frameRate: anim.frameRate,
        repeat: -1,
      });
    }
  }

  private enemyIds(): string[] {
    const ids = this.area.pool.map((e) => e.enemyId);
    if (this.area.boss) ids.push(this.area.boss);
    return [...new Set(ids)];
  }

  private spriteOf(enemyId: string): SpriteSheetDef {
    const def = ENEMY_SPRITES[enemyId];
    if (!def) throw new Error(`No sprite mapped for enemy ${enemyId} in src/data/sprites.ts`);
    return def;
  }

  private placeAt(sprite: Phaser.GameObjects.Sprite, tile: GridPoint): void {
    sprite.setPosition((tile.x + 0.5) * TILE, (tile.y + 0.5) * TILE);
  }

  // ---------- Monsters ----------

  private addMonster(data: MapMonster): void {
    const def = this.spriteOf(data.enemyId);
    const sprite = this.add.sprite(0, 0, `enemy:${data.enemyId}`, def.idleFrame).setDepth(5);
    if (def.tint !== undefined) sprite.setTint(def.tint);
    if (def.mapScale) sprite.setScale(def.mapScale);
    this.placeAt(sprite, data);
    sprite.play(`enemy:${data.enemyId}:idle`);
    this.monsters.push({ data, sprite });
  }

  private removeMonster(id: number, respawn: boolean): void {
    const i = this.monsters.findIndex((m) => m.data.id === id);
    if (i === -1) return;
    const [view] = this.monsters.splice(i, 1);
    this.tweens.add({ targets: view!.sprite, alpha: 0, duration: 300, onComplete: () => view!.sprite.destroy() });
    if (respawn) this.time.delayedCall(WORLD.respawnDelayMs, this.respawn, undefined, this);
  }

  private respawn(): void {
    const regulars = this.monsters.filter((m) => !m.data.isBoss).length;
    if (regulars >= this.area.monsterCount) return;
    let m: MapMonster | null;
    [m, this.rng] = spawnMonster(this.area, this.map, this.monsters.map((v) => v.data), this.playerTile, this.nextMonsterId++, this.rng);
    if (!m) return;
    this.addMonster(m);
    const view = this.monsters[this.monsters.length - 1]!;
    view.sprite.setAlpha(0);
    this.tweens.add({ targets: view.sprite, alpha: 1, duration: 400 });
  }

  private wander(): void {
    for (const view of this.monsters) {
      const others = [this.playerTile, ...this.monsters.filter((o) => o !== view).map((o) => o.data)];
      let target: GridPoint;
      [target, this.rng] = wanderStep(view.data, this.map, others, this.rng);
      if (samePoint(target, view.data)) continue;
      const def = this.spriteOf(view.data.enemyId);
      const animName = target.x > view.data.x ? 'walkRight' : target.x < view.data.x ? 'walkLeft' : target.y > view.data.y ? 'walkDown' : 'walkUp';
      if (def.anims[animName]) view.sprite.play(`enemy:${view.data.enemyId}:${animName}`, true);
      view.data.x = target.x;
      view.data.y = target.y;
      this.tweens.add({
        targets: view.sprite,
        x: (target.x + 0.5) * TILE,
        y: (target.y + 0.5) * TILE,
        duration: 1000 / WORLD.monsterTilesPerSecond,
        onComplete: () => view.sprite.active && view.sprite.play(`enemy:${view.data.enemyId}:idle`, true),
      });
    }
  }

  // ---------- Player movement ----------

  private walkable = (x: number, y: number): boolean => isWalkable(this.map, x, y, this.gateOpen);

  private onTap(pointer: Phaser.Input.Pointer): void {
    const world = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
    const target = { x: Math.floor(world.x / TILE), y: Math.floor(world.y / TILE) };
    const path = findPath(this.walkable, this.playerTile, target);
    if (!path) return;
    this.path = path;
    if (!this.moving) this.nextStep();
  }

  private heldDirection(): GridPoint | null {
    const c = this.cursors;
    const k = this.wasd;
    if ((c?.up.isDown || k?.up.isDown)) return { x: 0, y: -1 };
    if ((c?.down.isDown || k?.down.isDown)) return { x: 0, y: 1 };
    if ((c?.left.isDown || k?.left.isDown)) return { x: -1, y: 0 };
    if ((c?.right.isDown || k?.right.isDown)) return { x: 1, y: 0 };
    return null;
  }

  private nextStep(): void {
    const next = this.path.shift();
    if (!next) {
      this.moving = false;
      this.player.play(`player:idle${this.facing === 'Up' ? 'Up' : ''}`, true);
      return;
    }
    this.stepTowards(next);
  }

  /** Move one tile, or start a fight if a monster stands there. */
  private stepTowards(next: GridPoint): void {
    if (!this.walkable(next.x, next.y)) {
      this.path = [];
      this.moving = false;
      return;
    }
    const monster = monsterAt(this.monsters.map((m) => m.data), next);
    if (monster) {
      this.path = [];
      this.moving = false;
      this.face(next);
      useGameStore.getState().startEncounter(monster.id, monster.enemyId, monster.isBoss);
      return;
    }
    this.moving = true;
    this.face(next);
    this.player.play(`player:walk${this.facing}`, true);
    this.playerTile = next;
    this.tweens.add({
      targets: this.player,
      x: (next.x + 0.5) * TILE,
      y: (next.y + 0.5) * TILE,
      duration: 1000 / WORLD.playerTilesPerSecond,
      onComplete: () => this.arrived(next),
    });
  }

  private face(next: GridPoint): void {
    const dx = next.x - this.playerTile.x;
    const dy = next.y - this.playerTile.y;
    this.facing = dx > 0 ? 'Right' : dx < 0 ? 'Left' : dy < 0 ? 'Up' : 'Down';
  }

  private arrived(tile: GridPoint): void {
    const kind = this.map.tiles[tile.y]?.[tile.x];
    const store = useGameStore.getState();
    if (kind === 'exit') {
      this.path = [];
      store.leaveArea();
      return;
    }
    if (kind === 'meditation') {
      this.path = [];
      store.goToTab('cultivate');
      return;
    }
    if (kind === 'entrance') {
      this.path = [];
      store.goToTab('world');
      return;
    }
    this.nextStep();
  }
}
