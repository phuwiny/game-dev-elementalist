import Phaser from 'phaser';
import { ONE_WAY_DECK_OFFSET, SceneKey, TILE_SIZE, WORLD_ZOOM } from '../config/constants';
import { BossBalance, ElementBalance } from '../config/balance';
import { ElementType } from '../core/Element';
import { ELEMENT_ORDER } from '../core/ElementSelector';
import { parseLevel, Tile, type GridPoint, type LevelObject, type ParsedLevel } from '../core/LevelParser';
import { isGateOpen, linkTriggers } from '../core/TriggerLinks';
import { parseTiledMap, type TiledMap } from '../core/TiledLevel';
import type { Progress } from '../core/Progress';
import type { Vitals } from '../core/Vitals';
import { findLevel, isAdventure, mapCacheKey, nextAdventureLevel, type LevelDef } from '../levels';
import { Player, PlayerEvent, PlayerLayout } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { Enemy } from '../entities/enemies/Enemy';
import { MossSlime } from '../entities/enemies/MossSlime';
import { LeafWisp } from '../entities/enemies/LeafWisp';
import { ThornBeetle } from '../entities/enemies/ThornBeetle';
import { BrambleKing, type BossHost } from '../entities/bosses/BrambleKing';
import { SpiritCompanion, SPIRIT_NAMES, spiritKey } from '../entities/SpiritCompanion';
import type { ElementWorld } from '../elements/ElementPowers';
import { InputManager } from '../systems/InputManager';
import { ElementSystem } from '../systems/ElementSystem';
import { sfx } from '../systems/Sfx';
import {
  ArenaGate,
  Burnable,
  CrackedWall,
  Gate,
  IceBlock,
  MagicSeed,
  PressurePlate,
  type PuzzleHost,
  type PuzzleObject,
  Torch,
  type Trigger,
  WaterSurface,
  Windmill,
} from '../puzzles/PuzzleObjects';
import { animKey, backgroundForTileset } from '../assets/manifest';
import { PALETTE, hex } from '../assets/palette';
import { GRAYBOX_TILES } from './PreloadScene';
import { setAtlasFrame } from '../assets/frames';
import { buildArtTerrain } from '../systems/TerrainArt';
import { ParallaxBackground } from '../systems/ParallaxBackground';
import { REGISTRY_PROGRESS, REGISTRY_VITALS } from './BootScene';

export const REGISTRY_LEVEL = 'level';
/** id สำหรับ Combo.registerHit ของบอส (ศัตรูปกติใช้ id ตั้งแต่ 0 ขึ้นไป) */
const BOSS_HIT_ID = -1;

export interface HudState {
  hp: number;
  maxHp: number;
  lives: number;
  coins: number;
  energy: number;
  energyMax: number;
  energyDenied: boolean;
  unlocked: ElementType[];
  selected: ElementType | null;
  boss: { name: string; hp: number; max: number } | null;
  muted: boolean;
  /** Spirit Shard ของด่านนี้: ที่มีแล้ว (เก็บไว้ก่อนหน้าและในรอบนี้) / ทั้งหมด */
  shards: { have: number; total: number };
}

/** วัตถุที่กระสุนธาตุชนแล้วมีปฏิกิริยา (วัตถุ puzzle และโล่เถาวัลย์ของบอส) */
interface ElementTarget {
  removed: boolean;
  absorbs(element: ElementType): boolean;
  onElementHit(element: ElementType, power: number): void;
}

/** ระยะใต้ขอบล่างของด่านที่ถือว่าตกเหว */
const FALL_DEATH_MARGIN = 48;
const EB = ElementBalance.earth;

interface EarthBlock {
  sprite: Phaser.GameObjects.Sprite;
  zone: Phaser.GameObjects.Zone;
}

/**
 * ด่านเล่น: ประกอบด่าน, ตัวละคร, ศัตรู, ไอเท็ม, วัตถุ puzzle, พลังธาตุ
 * และกฎ HP / ชีวิต / checkpoint (GDD หัวข้อ 2–4)
 */
export class GameScene extends Phaser.Scene implements ElementWorld, PuzzleHost, BossHost {
  private level!: ParsedLevel;
  private layer!: Phaser.Tilemaps.TilemapLayer;
  player!: Player;
  private controls!: InputManager;
  private vitals!: Vitals;
  private elements!: ElementSystem;
  private companion!: SpiritCompanion;
  private enemies!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private waters!: Phaser.Physics.Arcade.StaticGroup;
  private sensors!: Phaser.Physics.Arcade.StaticGroup;
  private oneWays!: Phaser.Physics.Arcade.StaticGroup;
  private puzzleObjects: PuzzleObject[] = [];
  private objectGrid = new Map<string, PuzzleObject>();
  private plates: PressurePlate[] = [];
  private gates: Gate[] = [];
  private earthBlocks: EarthBlock[] = [];
  private respawnPoint = { x: 0, y: 0 };
  private activeCheckpoint: Phaser.GameObjects.Sprite | null = null;
  private stageCoins = 0;
  /** slot ของ Spirit Shard ที่เก็บในรอบนี้ (บันทึกลงเซฟตอนผ่านด่านเท่านั้น) */
  private stageShards = new Set<number>();
  /** slot ที่เก็บไว้แล้วจากรอบก่อนๆ */
  private savedShards: number[] = [];
  private finished = false;
  private puzzleDirty = true;
  private def!: LevelDef;
  private progress!: Progress;
  private boss: BrambleKing | null = null;
  private arenaGate: ArenaGate | null = null;
  private background: ParallaxBackground | null = null;
  private goalFlag: Phaser.GameObjects.Sprite | null = null;

  constructor() {
    super(SceneKey.Game);
  }

  get energy() {
    return this.elements.energy;
  }

  get puzzleScene(): Phaser.Scene {
    return this;
  }

  create(data: { level?: string }): void {
    this.finished = false;
    this.stageCoins = 0;
    this.stageShards = new Set<number>();
    this.savedShards = [];
    this.activeCheckpoint = null;
    this.puzzleObjects = [];
    this.objectGrid = new Map();
    this.plates = [];
    this.gates = [];
    this.earthBlocks = [];
    this.puzzleDirty = true;
    this.boss = null;
    this.arenaGate = null;
    this.background = null;
    this.goalFlag = null;

    const def = findLevel(data?.level ?? (this.registry.get(REGISTRY_LEVEL) as string | undefined));
    this.def = def;
    this.registry.set(REGISTRY_LEVEL, def.key);

    this.vitals = this.registry.get(REGISTRY_VITALS) as Vitals;
    this.progress = this.registry.get(REGISTRY_PROGRESS) as Progress;
    this.controls = new InputManager(this);
    this.cameras.main.setBackgroundColor(PALETTE.neutral1);

    this.level = def.rows ? parseLevel(def.rows) : parseTiledMap(this.cache.json.get(mapCacheKey(def.key)) as TiledMap);
    this.layer = this.buildTerrain(this.level);
    this.buildBackground();
    const worldW = this.level.width * TILE_SIZE;
    const worldH = this.level.height * TILE_SIZE;
    this.physics.world.setBounds(0, 0, worldW, worldH);
    // ไม่ชนขอบล่าง เพื่อให้ตกเหวได้
    this.physics.world.setBoundsCollision(true, true, true, false);

    this.solids = this.physics.add.staticGroup();
    this.waters = this.physics.add.staticGroup();
    this.sensors = this.physics.add.staticGroup();
    this.oneWays = this.physics.add.staticGroup();
    this.projectiles = this.physics.add.group({ allowGravity: false });
    this.buildOneWayTerrain();

    const start = this.footOf(this.level.player);
    this.respawnPoint = start;
    this.player = new Player(this, start.x, start.y, this.controls);
    this.player.on(PlayerEvent.AttackStep, (step: number) => this.spawnSlash(step));
    this.player.on(PlayerEvent.DeathAnimationDone, () => this.onPlayerDeathFinished());
    this.player.on(PlayerEvent.SlamImpact, (x: number, y: number) => this.slamImpact(x, y));
    this.player.on(PlayerEvent.Dash, () => {
      sfx.play('wind');
      this.spawnFx('dash_trail', this.player.x - this.player.facing * 10, this.player.y - PlayerLayout.chestY);
    });
    this.player.on(PlayerEvent.Jump, () => sfx.play('jump'));
    this.player.on(PlayerEvent.DoubleJump, () => sfx.play('double_jump'));

    this.companion = new SpiritCompanion(this, this.player);
    this.elements = new ElementSystem(this.controls, {
      onSwitch: (el) => this.onElementSwitch(el),
    });
    this.elements.attach(this);

    this.buildPuzzleObjects();
    this.buildSpikes();
    this.buildEnemies();
    this.buildPickups();
    this.buildCheckpoints();
    this.buildGoal();
    this.buildBoss();
    this.buildColliders();

    // ภูตที่มีตั้งแต่เริ่ม: ตามโลกใน GDD + ที่ได้แล้วในโหมดผจญภัย
    const owned = new Set<ElementType>(def.startSpirits ?? []);
    if (isAdventure(def.key)) for (const el of this.progress.spiritList) owned.add(el);
    if (new URLSearchParams(window.location.search).has('unlock')) for (const el of ELEMENT_ORDER) owned.add(el);
    for (const el of ELEMENT_ORDER) if (owned.has(el)) this.unlockSpirit(el, false);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldW, worldH);
    cam.setRoundPixels(true);
    cam.setZoom(WORLD_ZOOM);
    cam.startFollow(this.player, true, 0.15, 0.15);
    cam.setDeadzone(32, 28);

    if (!this.scene.isActive(SceneKey.UI)) this.scene.launch(SceneKey.UI);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.player.removeAllListeners());
  }

  override update(time: number, delta: number): void {
    if (this.finished) return;
    this.player.update(time, delta);
    this.elements.update(delta, this.player.canAct);
    this.companion.update(delta);

    const worldBottom = this.level.height * TILE_SIZE;
    for (const e of this.enemies.getChildren() as Enemy[]) {
      e.tick(delta);
      if (e.active && e.y > worldBottom + FALL_DEATH_MARGIN) e.vanish();
    }

    this.resolveSwordHits();
    this.resolveProjectileHits();
    this.updatePlates();
    if (this.puzzleDirty) this.updateGates();
    this.updateBoss(delta);
    this.background?.update();

    if (!this.player.isDead && this.player.y > worldBottom + FALL_DEATH_MARGIN) {
      this.killPlayer();
      // ตกเหวแล้วไม่ต้องรอ animation ตาย
      this.onPlayerDeathFinished();
    }
  }

  /** สถานะสำหรับ HUD (UIScene อ่านทุก frame) */
  hudState(): HudState {
    const s = this.vitals.snapshot();
    return {
      ...s,
      energy: this.elements.energy.value,
      energyMax: this.elements.energy.max,
      energyDenied: this.elements.isDenied(this.time.now),
      unlocked: this.elements.selector.unlocked,
      selected: this.elements.selected,
      boss: this.boss && (this.boss.isActive || this.boss.isDefeated) ? { name: this.boss.name, hp: this.boss.hp, max: this.boss.maxHp } : null,
      muted: sfx.muted,
      shards: { have: new Set([...this.savedShards, ...this.stageShards]).size, total: this.level.shards.length },
    };
  }

  now(): number {
    return this.time.now;
  }

  // ---------------------------------------------------------------------------
  // BossHost
  // ---------------------------------------------------------------------------

  addSolid(zone: Phaser.GameObjects.Zone): void {
    this.solids.add(zone);
  }

  hurtPlayerIn(area: Phaser.Geom.Rectangle, damage: number, fromX: number): boolean {
    if (this.player.isDead || this.player.isInvulnerable) return false;
    const b = this.player.body;
    if (!Phaser.Geom.Intersects.RectangleToRectangle(area, new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height))) return false;
    this.damagePlayer(damage, fromX);
    return true;
  }

  shieldBlocks(area: Phaser.Geom.Rectangle): boolean {
    if (!this.player.isShielding) return false;
    const b = this.player.body;
    const guard = new Phaser.Geom.Rectangle(b.x - 8, b.y - 10, b.width + 16, b.height + 10);
    return Phaser.Geom.Intersects.RectangleToRectangle(area, guard);
  }

  evictPlayer(area: Phaser.Geom.Rectangle, toX: number): void {
    const b = this.player.body;
    if (this.player.isDead || !Phaser.Geom.Intersects.RectangleToRectangle(area, new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height))) return;
    this.spawnFx('poof', this.player.x, this.player.y - PlayerLayout.chestY);
    b.reset(toX, this.player.y);
  }

  shake(ms: number, intensity: number): void {
    this.cameras.main.shake(ms, intensity);
  }

  // ---------------------------------------------------------------------------
  // ElementWorld
  // ---------------------------------------------------------------------------

  spawnProjectile(element: ElementType.Fire | ElementType.Water): void {
    sfx.play(element === ElementType.Fire ? 'fire' : 'water');
    const m = this.player.muzzle;
    new Projectile(this, this.projectiles, m.x, m.y, this.player.facing, element);
  }

  gust(): void {
    const W = ElementBalance.wind;
    const dir = this.player.facing;
    const area = new Phaser.Geom.Rectangle(
      dir === 1 ? this.player.x : this.player.x - W.gustWidth,
      this.player.y - W.gustHeight - 4,
      W.gustWidth,
      W.gustHeight,
    );
    const fx = this.spawnFx('wind_wave', this.player.x + dir * 24, this.player.y - PlayerLayout.muzzleY);
    fx.setFlipX(dir < 0);
    sfx.play('wind');

    for (const e of this.enemies.getChildren() as Enemy[]) {
      if (e.isAlive && Phaser.Geom.Intersects.RectangleToRectangle(area, e.hurtbox())) {
        e.push(dir, W.gustPushX, W.gustPushY);
      }
    }
    this.hitObjectsIn(area, ElementType.Wind);
  }

  canPlaceEarthBlock(): boolean {
    return this.findEarthBlockSpot() !== null;
  }

  placeEarthBlock(): void {
    const spot = this.findEarthBlockSpot();
    if (!spot) return;
    if (this.earthBlocks.length >= EB.maxBlocks) this.crumbleEarthBlock(this.earthBlocks[0]);

    sfx.play('earth');
    const size = EB.blockSize;
    const sprite = this.add.sprite(spot.x + size / 2, spot.y + size, 'fx', 'earth_block_appear_000').setOrigin(0.5, 1).setDepth(3);
    sprite.play(animKey('fx', 'earth_block_appear'));
    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => setAtlasFrame(sprite, 'fx', 'earth_block_idle_000'));
    const zone = this.add.zone(spot.x + size / 2, spot.y + size / 2, size, size);
    this.solids.add(zone);
    this.earthBlocks.push({ sprite, zone });
    this.puzzleDirty = true;
  }

  denyEnergy(): void {
    sfx.play('deny');
    this.elements.deny(this.time.now);
  }

  spiritCast(): void {
    this.companion.playCast();
  }

  // ---------------------------------------------------------------------------
  // PuzzleHost
  // ---------------------------------------------------------------------------

  objectAt(col: number, row: number): PuzzleObject | undefined {
    return this.objectGrid.get(`${col},${row}`);
  }

  addOneWayPlatform(x: number, y: number, width: number): void {
    const zone = this.add.zone(x, y + 2, width, 4);
    this.oneWays.add(zone);
    const body = zone.body as Phaser.Physics.Arcade.StaticBody;
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
  }

  onChanged(): void {
    this.puzzleDirty = true;
  }

  // ---------------------------------------------------------------------------
  // Level building
  // ---------------------------------------------------------------------------

  private buildTerrain(level: ParsedLevel): Phaser.Tilemaps.TilemapLayer {
    // ด่าน Tiled ที่มี tileset จริง: วาดตาม gid ในไฟล์แผนที่ ที่เหลือใช้ graybox จาก grid
    if (level.art && this.textures.exists(level.art.tileset)) return buildArtTerrain(this, level.art);
    // tile index: 0 = พื้นทึบ, 1 = พื้นผิวบน, 2 = หนาม (ไม่ชน แยก hitbox ไว้ที่ buildSpikes)
    const data = level.tiles.map((row, r) =>
      row.map((t, c) => {
        if (t === Tile.Spike) return 2;
        if (t !== Tile.Solid) return -1;
        const above = r > 0 ? level.tiles[r - 1][c] : Tile.Empty;
        return above === Tile.Solid ? 0 : 1;
      }),
    );
    const map = this.make.tilemap({ data, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE });
    const tileset = map.addTilesetImage(GRAYBOX_TILES, GRAYBOX_TILES, TILE_SIZE, TILE_SIZE, 0, 0);
    if (!tileset) throw new Error('Cannot create graybox tileset');
    const layer = map.createLayer(0, tileset, 0, 0) as Phaser.Tilemaps.TilemapLayer | null;
    if (!layer) throw new Error('Cannot create terrain layer');
    layer.setCollision([0, 1]);
    return layer;
  }

  private buildBackground(): void {
    const art = this.level.art;
    const def = art ? backgroundForTileset(art.tileset) : null;
    if (!def) return;
    const background = new ParallaxBackground(this, def, this.cameras.main);
    if (!background.isEmpty) this.background = background;
  }

  /** แท่น one-way จาก tile ในแผนที่: รวม tile ที่ติดกันเป็นแผ่นเดียว */
  private buildOneWayTerrain(): void {
    this.level.tiles.forEach((row, r) => {
      let c = 0;
      while (c < row.length) {
        if (row[c] !== Tile.OneWay) {
          c += 1;
          continue;
        }
        let end = c;
        while (end + 1 < row.length && row[end + 1] === Tile.OneWay) end += 1;
        const width = (end - c + 1) * TILE_SIZE;
        this.addOneWayPlatform(c * TILE_SIZE + width / 2, r * TILE_SIZE + ONE_WAY_DECK_OFFSET, width);
        c = end + 1;
      }
    });
  }

  private buildPuzzleObjects(): void {
    const triggerPoints: GridPoint[] = [];
    const triggers: Trigger[] = [];
    const gatePoints: GridPoint[] = [];
    const waterFill = this.add.graphics().setDepth(1);

    for (const o of this.level.objects) {
      if (o.kind === 'spirit') {
        this.buildSpiritPickup(o);
        continue;
      }
      const obj = this.createPuzzleObject(o);
      this.puzzleObjects.push(obj);
      this.objectGrid.set(`${o.col},${o.row}`, obj);
      const group = obj.group === 'solid' ? this.solids : obj.group === 'water' ? this.waters : this.sensors;
      group.add(obj.zone);

      if (obj instanceof Torch || obj instanceof Windmill || obj instanceof PressurePlate) {
        triggerPoints.push(o);
        triggers.push(obj);
      }
      if (obj instanceof PressurePlate) this.plates.push(obj);
      if (obj instanceof Gate) {
        this.gates.push(obj);
        gatePoints.push(o);
      }
      if (obj instanceof WaterSurface) {
        // น้ำด้านใต้ผิวลงไปถึงขอบล่างของด่าน
        const top = (o.row + 1) * TILE_SIZE;
        waterFill.fillStyle(hex(PALETTE.water1), 1).fillRect(o.col * TILE_SIZE, top, TILE_SIZE, this.level.height * TILE_SIZE - top);
      }
    }

    linkTriggers(triggerPoints, gatePoints).forEach((indices, gi) => {
      this.gates[gi].triggers = indices.map((i) => triggers[i]);
      if (indices.length === 0) console.warn(`[puzzle] gate at col ${gatePoints[gi].col} has no triggers`);
    });
  }

  private createPuzzleObject(o: LevelObject): PuzzleObject {
    switch (o.kind) {
      case 'vine':
      case 'crate':
        return new Burnable(this, o);
      case 'ice':
        return new IceBlock(this, o);
      case 'water':
        return new WaterSurface(this, o, ElementBalance.water.freezeRadiusTiles);
      case 'torch':
        return new Torch(this, o);
      case 'seed':
        return new MagicSeed(this, o);
      case 'windmill':
        return new Windmill(this, o);
      case 'crackedWall':
        return new CrackedWall(this, o);
      case 'plate':
        return new PressurePlate(this, o);
      case 'gate':
        return new Gate(this, o);
      case 'arenaGate': {
        const gate = new ArenaGate(this, o);
        this.arenaGate = gate;
        return gate;
      }
      default:
        throw new Error(`Unsupported object ${o.kind}`);
    }
  }

  private buildSpiritPickup(o: LevelObject): void {
    const element = ELEMENT_ORDER[o.slot ?? 0];
    const pos = this.centerOf(o);
    const sprite = this.add.sprite(pos.x, pos.y, 'spirits', `${spiritKey(element)}_idle_000`).setDepth(3);
    sprite.play(animKey('spirits', `${spiritKey(element)}_idle`));
    this.tweens.add({ targets: sprite, y: pos.y - 4, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.physics.add.existing(sprite, true);
    this.physics.add.overlap(this.player, sprite, () => {
      if (!sprite.active) return;
      sprite.destroy();
      this.unlockSpirit(element, true);
    });
  }

  private unlockSpirit(element: ElementType, announce: boolean): void {
    if (!this.elements.unlock(element)) return;
    if (element === ElementType.Wind) this.player.doubleJumpUnlocked = true;
    this.elements.energy.refill();
    if (announce) {
      sfx.play('spirit');
      this.floatText(this.player.x, this.player.y - PlayerLayout.overheadY - 10, `${SPIRIT_NAMES[element]} joined!`, PALETTE.gold);
      if (isAdventure(this.def.key)) this.progress.addSpirit(element);
    }
  }

  private buildSpikes(): void {
    const spikes = this.physics.add.staticGroup();
    this.level.tiles.forEach((row, r) =>
      row.forEach((t, c) => {
        if (t !== Tile.Spike) return;
        // hitbox ครึ่งล่างของ tile ให้แตะหนามจริงๆ ถึงจะตาย
        const zone = this.add.zone(c * TILE_SIZE + TILE_SIZE / 2, r * TILE_SIZE + TILE_SIZE * 0.75, TILE_SIZE - 4, TILE_SIZE / 2);
        spikes.add(zone);
      }),
    );
    this.physics.add.overlap(this.player, spikes, () => this.killPlayer());
  }

  private buildEnemies(): void {
    this.enemies = this.physics.add.group({ runChildUpdate: false, allowGravity: true });
    const isGroundAt = (x: number, y: number) => this.isSolidAt(x, y);
    const target = () => ({ x: this.player.x, y: this.player.y, alive: !this.player.isDead });
    const blocked = (x: number, y: number) => {
      sfx.play('block');
      this.spawnFx('hit_spark', x, y);
    };
    for (const spawn of this.level.enemies) {
      const foot = this.footOf(spawn);
      switch (spawn.kind) {
        case 'moss_slime':
          this.enemies.add(new MossSlime(this, foot.x, foot.y, isGroundAt));
          break;
        case 'leaf_wisp': {
          const c = this.centerOf(spawn);
          const wisp = new LeafWisp(this, c.x, c.y + 8, target);
          this.enemies.add(wisp);
          wisp.body.setAllowGravity(false);
          break;
        }
        case 'thorn_beetle':
          this.enemies.add(new ThornBeetle(this, foot.x, foot.y, isGroundAt, blocked));
          break;
        default:
          throw new Error(`Unknown enemy ${String(spawn.kind)}`);
      }
    }
  }

  private buildPickups(): void {
    const coins = this.physics.add.staticGroup();
    for (const p of this.level.coins) {
      const c = this.add.sprite(this.centerOf(p).x, this.centerOf(p).y, 'items', 'coin_spin_000');
      c.play(animKey('items', 'coin_spin'));
      coins.add(c);
    }
    this.physics.add.overlap(this.player, coins, (_p, obj) => {
      (obj as Phaser.GameObjects.Sprite).destroy();
      this.stageCoins += 1;
      const extra = this.vitals.addCoins(1);
      sfx.play(extra > 0 ? 'one_up' : 'coin');
      if (extra > 0) this.floatText(this.player.x, this.player.y - PlayerLayout.overheadY, '1UP', PALETTE.wind);
    });

    // Spirit Shard: ชิ้นที่เก็บไว้แล้วจากรอบก่อนแสดงเป็นเงาจาง เก็บซ้ำไม่ได้
    const adventure = isAdventure(this.def.key);
    this.savedShards = adventure ? this.progress.collectedShards(this.def.key) : [];
    const shards = this.physics.add.staticGroup();
    for (const s of this.level.shards) {
      const c = this.centerOf(s);
      const sprite = this.add.sprite(c.x, c.y, 'items', 'spirit_shard_000').setDepth(3);
      sprite.play(animKey('items', 'spirit_shard_shine'));
      if (this.savedShards.includes(s.slot)) {
        sprite.setAlpha(0.3);
        continue;
      }
      sprite.setData('slot', s.slot);
      shards.add(sprite);
    }
    this.physics.add.overlap(this.player, shards, (_p, obj) => {
      const sprite = obj as Phaser.GameObjects.Sprite;
      this.stageShards.add(sprite.getData('slot') as number);
      sprite.destroy();
      sfx.play('shard');
      this.floatText(this.player.x, this.player.y - PlayerLayout.overheadY, 'SPIRIT SHARD', PALETTE.pink3);
    });

    const hearts = this.physics.add.staticGroup();
    for (const p of this.level.hearts) {
      const h = this.add.sprite(this.centerOf(p).x, this.centerOf(p).y, 'items', 'heart_fruit_bob_000');
      h.play(animKey('items', 'heart_fruit_bob'));
      hearts.add(h);
    }
    this.physics.add.overlap(this.player, hearts, (_p, obj) => {
      if (this.vitals.hp >= this.vitals.snapshot().maxHp) return;
      (obj as Phaser.GameObjects.Sprite).destroy();
      sfx.play('heart');
      this.vitals.heal(1);
    });
  }

  private buildCheckpoints(): void {
    const group = this.physics.add.staticGroup();
    for (const p of this.level.checkpoints) {
      const pos = this.footOf(p);
      const shrine = this.add.sprite(pos.x, pos.y, 'items', 'checkpoint_shrine_unlit_000').setOrigin(0.5, 1);
      group.add(shrine);
      (shrine.body as Phaser.Physics.Arcade.StaticBody).setSize(16, 48);
    }
    this.physics.add.overlap(this.player, group, (_p, obj) => this.activateCheckpoint(obj as Phaser.GameObjects.Sprite));
  }

  private buildGoal(): void {
    const pos = this.footOf(this.level.goal);
    const flag = this.add.sprite(pos.x, pos.y, 'items', 'goal_flag_wave_000').setOrigin(0.5, 1);
    flag.play(animKey('items', 'goal_flag_wave'));
    this.physics.add.existing(flag, true);
    this.physics.add.overlap(this.player, flag, () => {
      if (flag.visible) this.reachGoal();
    });
    this.goalFlag = flag;
    // ด่านบอส: ธงปรากฏเมื่อชนะบอส
    if (this.level.boss) flag.setVisible(false);
  }

  private buildBoss(): void {
    if (!this.level.boss) return;
    if (!this.arenaGate) throw new Error('Boss level needs an arena gate');
    const left = this.level.boss.col * TILE_SIZE;
    const bottom = (this.level.boss.row + 1) * TILE_SIZE;
    const arenaLeft = (this.arenaGate.col + 2) * TILE_SIZE;
    this.boss = new BrambleKing(this, left, bottom, arenaLeft);
  }

  /** เริ่มสู้เมื่อผู้เล่นเดินผ่านประตูสนามเข้าไป */
  private updateBoss(delta: number): void {
    const boss = this.boss;
    const gate = this.arenaGate;
    if (!boss || !gate) return;
    if (!boss.isActive && !boss.isDefeated && !this.player.isDead) {
      const enterX = gate.bounds.right + BossBalance.brambleKing.startOffset;
      if (this.player.body.x > enterX) {
        gate.setClosed(true);
        sfx.play('gate');
        boss.start(() => this.onBossDefeated());
        this.frameBossFight(true);
        this.background?.setBossArena(true);
      }
    }
    boss.update(delta);
  }

  /**
   * ระหว่างสู้บอส: วางผู้เล่นไว้ฝั่งซ้ายของจอ ให้เห็นบอสที่อยู่ทางขวา
   * (มุมกล้องในด่านแคบกว่าสนามบอส)
   */
  private frameBossFight(on: boolean): void {
    const cam = this.cameras.main;
    cam.setFollowOffset(on ? -cam.worldView.width * 0.28 : 0, 0);
  }

  private onBossDefeated(): void {
    this.frameBossFight(false);
    this.arenaGate?.setClosed(false);
    this.time.delayedCall(1200, () => {
      this.goalFlag?.setVisible(true);
      sfx.play('clear');
      if (this.goalFlag) this.floatText(this.goalFlag.x, this.goalFlag.y - 72, 'STAGE CLEAR!', PALETTE.gold);
    });
  }

  private buildColliders(): void {
    const frozenWater = (_a: unknown, w: unknown) => this.waterOf(w)?.frozen === true;
    // ตกน้ำเมื่อกลางตัวอยู่เหนือช่องน้ำที่ไม่แข็งและจมลงไปแล้ว ไม่ใช่แค่ขอบตัวแตะช่องข้างๆ
    const openWater = (a: unknown, w: unknown) => {
      const water = this.waterOf(w);
      if (!water || water.frozen) return false;
      const body = (a as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.Body;
      const zone = water.bounds;
      return body.center.x >= zone.left && body.center.x < zone.right && body.bottom > zone.top + 4;
    };
    const frozenEnemy = (_p: unknown, e: unknown) => (e as Enemy).isFrozen;

    // ผู้เล่น
    this.physics.add.collider(this.player, this.layer);
    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.player, this.oneWays);
    this.physics.add.collider(this.player, this.waters, undefined, frozenWater);
    this.physics.add.overlap(this.player, this.waters, () => this.killPlayer(), openWater);
    this.physics.add.collider(this.player, this.enemies, undefined, frozenEnemy);
    this.physics.add.overlap(
      this.player,
      this.enemies,
      (_p, e) => this.onEnemyContact(e as Enemy),
      (_p, e) => !(e as Enemy).isFrozen,
    );

    // ศัตรู
    this.physics.add.collider(this.enemies, this.layer);
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.collider(this.enemies, this.oneWays);
    this.physics.add.collider(this.enemies, this.waters, undefined, frozenWater);
    this.physics.add.overlap(this.enemies, this.waters, (e) => (e as Enemy).vanish(), openWater);

    // กระสุนธาตุ
    this.physics.add.collider(this.projectiles, this.layer, (p) => (p as Projectile).onTerrainHit());
    const hitObject = (p: unknown, z: unknown) => this.projectileHitsObject(p as Projectile, z as Phaser.GameObjects.Zone);
    this.physics.add.overlap(this.projectiles, this.solids, hitObject);
    this.physics.add.overlap(this.projectiles, this.waters, hitObject);
    this.physics.add.overlap(this.projectiles, this.sensors, hitObject);
  }

  // ---------------------------------------------------------------------------
  // Rules
  // ---------------------------------------------------------------------------

  /** กระสุนกับศัตรูใช้ hurtbox แทน body (body ของศัตรูตัวเตี้ยต่ำกว่าระดับที่ยิง) */
  private resolveProjectileHits(): void {
    const enemies = (this.enemies.getChildren() as Enemy[]).filter((e) => e.isAlive);
    const weak = this.boss?.isExposed ? this.boss.weakPoint : null;
    for (const p of this.projectiles.getChildren() as Projectile[]) {
      if (p.isSpent) continue;
      const pb = p.body;
      const rect = new Phaser.Geom.Rectangle(pb.x, pb.y, pb.width, pb.height);
      if (weak && p.damage > 0 && Phaser.Geom.Intersects.RectangleToRectangle(rect, weak)) {
        this.boss?.hitWeakPoint(p.damage);
        p.burst();
        continue;
      }
      const target = enemies.find((e) => Phaser.Geom.Intersects.RectangleToRectangle(rect, e.hurtbox()));
      if (target) this.projectileHitsEnemy(p, target);
    }
  }

  private projectileHitsEnemy(p: Projectile, e: Enemy): void {
    if (p.isSpent || !e.isAlive) return;
    if (p.element === ElementType.Water) {
      e.freeze(ElementBalance.water.freezeMs);
      sfx.play('freeze');
    } else if (e.hit(p.damage, p.x, p.element)) {
      sfx.play('enemy_die');
      this.spawnFx('poof', e.x, e.y - 10);
    } else {
      sfx.play('hit');
    }
    p.burst();
  }

  private projectileHitsObject(p: Projectile, zone: Phaser.GameObjects.Zone): void {
    if (p.isSpent) return;
    const obj = zone.getData('puzzle') as ElementTarget | undefined;
    if (!obj) {
      // บล็อกหินของผู้เล่น
      p.burst();
      return;
    }
    if (obj.removed || !obj.absorbs(p.element)) return;
    obj.onElementHit(p.element, p.damage);
    if (p.element === ElementType.Fire) sfx.play('burn');
    else sfx.play('freeze');
    p.burst();
  }

  private slamImpact(x: number, y: number): void {
    sfx.play('slam');
    this.spawnFx('ground_slam_wave', x, y - 16);
    this.cameras.main.shake(120, 0.006);
    // ครอบลงใต้เท้าเล็กน้อย ให้โดนวัตถุที่ฐานอยู่ระดับเดียวกับพื้นที่ยืน
    const area = new Phaser.Geom.Rectangle(x - EB.slamWidth / 2, y - EB.slamHeight, EB.slamWidth, EB.slamHeight + 8);
    for (const e of this.enemies.getChildren() as Enemy[]) {
      if (!e.isAlive || !Phaser.Geom.Intersects.RectangleToRectangle(area, e.hurtbox())) continue;
      if (e.hit(EB.slamDamage, x, ElementType.Earth)) this.spawnFx('poof', e.x, e.y - 10);
    }
    this.hitObjectsIn(area, ElementType.Earth);
  }

  private hitObjectsIn(area: Phaser.Geom.Rectangle, element: ElementType): void {
    for (const o of this.puzzleObjects) {
      if (!o.removed && Phaser.Geom.Intersects.RectangleToRectangle(area, o.bounds)) o.onElementHit(element, 1);
    }
  }

  /** แผ่นกดทำงานเมื่อมีผู้เล่นที่ยืนอยู่, บล็อกหิน หรือศัตรูทับ */
  private updatePlates(): void {
    if (this.plates.length === 0) return;
    const weights: Phaser.Geom.Rectangle[] = this.earthBlocks.map((b) => b.zone.getBounds());
    if (!this.player.isDead && this.player.isGrounded) weights.push(this.player.getBounds());
    for (const e of this.enemies.getChildren() as Enemy[]) if (e.isAlive) weights.push(e.getBounds());
    for (const plate of this.plates) {
      const area = plate.pressArea;
      plate.setPressed(weights.some((w) => Phaser.Geom.Intersects.RectangleToRectangle(area, w)));
    }
  }

  private updateGates(): void {
    this.puzzleDirty = false;
    for (const gate of this.gates) {
      const active = gate.triggers.map((t) => t.isActive);
      const open = isGateOpen(
        gate.triggers.map((_t, i) => i),
        active,
      );
      gate.setOpen(open, !open && this.isGateBlocked(gate));
      // ปิดไม่ได้เพราะมีของขวาง: ลองใหม่ frame ถัดไป
      if (gate.isOpen !== open) this.puzzleDirty = true;
    }
  }

  private isGateBlocked(gate: Gate): boolean {
    const b = gate.bounds;
    if (Phaser.Geom.Intersects.RectangleToRectangle(b, this.player.getBounds())) return true;
    return (this.enemies.getChildren() as Enemy[]).some((e) => e.isAlive && Phaser.Geom.Intersects.RectangleToRectangle(b, e.getBounds()));
  }

  /**
   * ตำแหน่งบล็อกหิน (มุมซ้ายบน) ข้างหน้าผู้เล่น ชิด grid ของ tile
   * ต้องมีพื้นรองรับภายใน blockDropTiles ช่อง และไม่ทับ terrain หรือวัตถุแข็ง
   */
  private findEarthBlockSpot(): { x: number; y: number } | null {
    const size = EB.blockSize;
    const p = this.player;
    // เว้นจากขอบ hitbox 1 px ไม่ให้บล็อกทับตัวผู้เล่น
    const front = p.facing === 1 ? p.body.right + 1 : p.body.x - 1 - size;
    const left = p.facing === 1 ? Math.ceil(front / TILE_SIZE) * TILE_SIZE : Math.floor(front / TILE_SIZE) * TILE_SIZE;
    let bottom = Math.round(p.y / TILE_SIZE) * TILE_SIZE;

    for (let drop = 0; drop <= EB.blockDropTiles; drop += 1, bottom += TILE_SIZE) {
      const rect = new Phaser.Geom.Rectangle(left, bottom - size, size, size);
      if (this.isAreaBlocked(rect)) return null;
      const support = this.isSolidAt(left + 4, bottom + 2) || this.isSolidAt(left + size - 4, bottom + 2);
      if (support) return { x: left, y: bottom - size };
    }
    return null;
  }

  private isAreaBlocked(rect: Phaser.Geom.Rectangle): boolean {
    const tiles = this.layer.getTilesWithinWorldXY(rect.x + 1, rect.y + 1, rect.width - 2, rect.height - 2, { isColliding: true });
    if (tiles.length > 0) return true;
    for (const o of this.puzzleObjects) {
      if (o.removed || o.group === 'sensor') continue;
      if (o instanceof Gate && o.isOpen) continue;
      if (Phaser.Geom.Intersects.RectangleToRectangle(rect, o.bounds)) return true;
    }
    for (const b of this.earthBlocks) if (Phaser.Geom.Intersects.RectangleToRectangle(rect, b.zone.getBounds())) return true;
    const body = this.player.body;
    return Phaser.Geom.Intersects.RectangleToRectangle(rect, new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height));
  }

  /** อ่านปุ่มที่ผู้เล่นตั้งไว้ใหม่ (เรียกหลังปิดหน้า Settings ที่เปิดจากหน้า Pause) */
  reloadControls(): void {
    this.controls.reload();
  }

  /** ตำแหน่งนี้มีพื้นแข็งหรือไม่ (terrain, วัตถุแข็ง, น้ำแข็ง, บล็อกหิน) */
  private isSolidAt(x: number, y: number): boolean {
    if (this.layer.getTileAtWorldXY(x, y, false)?.collides) return true;
    for (const o of this.puzzleObjects) {
      if (o.removed) continue;
      const solid = o.group === 'solid' ? !(o instanceof Gate && o.isOpen) : o instanceof WaterSurface && o.frozen;
      if (solid && o.bounds.contains(x, y)) return true;
    }
    return this.earthBlocks.some((b) => b.zone.getBounds().contains(x, y));
  }

  private crumbleEarthBlock(block: EarthBlock): void {
    this.earthBlocks = this.earthBlocks.filter((b) => b !== block);
    (block.zone.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    block.zone.destroy();
    block.sprite.play(animKey('fx', 'earth_block_crumble'));
    block.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => block.sprite.destroy());
    this.puzzleDirty = true;
  }

  private resolveSwordHits(): void {
    const box = this.player.attackHitbox();
    if (!box) return;
    for (const e of this.enemies.getChildren() as Enemy[]) {
      if (!e.isAlive) continue;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(box, e.hurtbox())) continue;
      if (!this.player.registerHit(e.enemyId)) continue;
      this.spawnFx('hit_spark', e.x, e.y - 8);
      this.elements.energy.gainFromMelee();
      if (e.hit(this.player.attackDamage(), this.player.x, null)) {
        sfx.play('enemy_die');
        this.spawnFx('poof', e.x, e.y - 10);
      } else {
        sfx.play('hit');
      }
      this.cameras.main.shake(60, 0.003);
    }
    // จุดอ่อนของบอส: ฟันได้ครั้งเดียวต่อหนึ่งจังหวะดาบ
    const boss = this.boss;
    if (boss?.isExposed && Phaser.Geom.Intersects.RectangleToRectangle(box, boss.weakPoint) && this.player.registerHit(BOSS_HIT_ID)) {
      this.elements.energy.gainFromMelee();
      boss.hitWeakPoint(this.player.attackDamage());
      this.cameras.main.shake(80, 0.004);
    }
  }

  private onEnemyContact(enemy: Enemy): void {
    if (!enemy.isAlive) return;
    this.damagePlayer(enemy.contactDamage, enemy.x);
  }

  private damagePlayer(amount: number, fromX: number): void {
    if (this.player.isDead || this.player.isInvulnerable || this.finished) return;
    const result = this.vitals.damage(amount);
    if (result === 'died') {
      this.killPlayer();
    } else if (result === 'hurt') {
      sfx.play('hurt');
      this.player.takeHit(fromX);
    }
  }

  private killPlayer(): void {
    if (this.player.isDead || this.finished) return;
    // ตกเหว ตกน้ำ หรือโดนหนาม: HP หมดทันที
    this.vitals.damage(this.vitals.hp);
    sfx.play('die');
    this.player.die();
  }

  private onPlayerDeathFinished(): void {
    if (this.finished) return;
    const canContinue = this.vitals.loseLife();
    if (!canContinue) {
      this.finished = true;
      this.time.delayedCall(400, () => {
        this.scene.stop(SceneKey.UI);
        this.scene.start(SceneKey.GameOver);
      });
      return;
    }
    this.cameras.main.fadeOut(200, 15, 11, 26);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.player.respawn(this.respawnPoint.x, this.respawnPoint.y);
      this.elements.energy.refill();
      // ตายระหว่างสู้บอส: บอสกลับเป็นเต็มเลือด เปิดประตูสนามให้เดินเข้าใหม่
      if (this.boss?.isActive) {
        this.boss.reset();
        this.frameBossFight(false);
        this.background?.setBossArena(false);
        this.arenaGate?.setClosed(false);
      }
      this.companion.snap();
      this.cameras.main.fadeIn(200, 15, 11, 26);
    });
  }

  private onElementSwitch(element: ElementType): void {
    this.companion.setElement(element);
    this.spawnFx(`element_switch_aura_${element}`, this.player.x, this.player.y - PlayerLayout.chestY);
  }

  private activateCheckpoint(shrine: Phaser.GameObjects.Sprite): void {
    if (this.player.isDead || this.activeCheckpoint === shrine) return;
    this.activeCheckpoint = shrine;
    this.respawnPoint = { x: shrine.x, y: shrine.y };
    shrine.play(animKey('items', 'checkpoint_shrine_lighting'));
    shrine.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => shrine.play(animKey('items', 'checkpoint_shrine_lit')));
    sfx.play('checkpoint');
    this.floatText(shrine.x, shrine.y - 56, 'CHECKPOINT', PALETTE.gold);
  }

  private reachGoal(): void {
    if (this.finished || this.player.isDead) return;
    this.finished = true;
    this.player.body.setVelocity(0, 0);
    this.player.body.setAcceleration(0, 0);
    sfx.play('clear');
    const adventure = isAdventure(this.def.key);
    let newShards = 0;
    if (adventure) {
      this.progress.markCleared(this.def.key);
      newShards = this.progress.addShards(this.def.key, this.stageShards);
    }
    const shards = { have: adventure ? this.progress.collectedShards(this.def.key).length : this.stageShards.size, total: this.level.shards.length, added: newShards };
    const next = adventure ? nextAdventureLevel(this.def.key) : null;
    this.time.delayedCall(600, () => {
      this.scene.stop(SceneKey.UI);
      this.scene.start(SceneKey.StageClear, { coins: this.stageCoins, level: this.def.key, next, shards });
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private waterOf(obj: unknown): WaterSurface | undefined {
    const data = (obj as Phaser.GameObjects.Zone).getData?.('puzzle');
    return data instanceof WaterSurface ? data : undefined;
  }

  /** จุดกึ่งกลางล่างของช่อง (ใช้วางตัวละครให้ยืนบนพื้นใต้ช่องนั้น) */
  private footOf(p: GridPoint): { x: number; y: number } {
    return { x: p.col * TILE_SIZE + TILE_SIZE / 2, y: (p.row + 1) * TILE_SIZE };
  }

  private centerOf(p: GridPoint): { x: number; y: number } {
    return { x: p.col * TILE_SIZE + TILE_SIZE / 2, y: p.row * TILE_SIZE + TILE_SIZE / 2 };
  }

  private spawnSlash(step: number): void {
    sfx.play('slash');
    const dir = this.player.facing;
    const fx = this.spawnFx(`slash_${step + 1}`, this.player.x + dir * 24, this.player.y - PlayerLayout.chestY);
    fx.setFlipX(dir < 0);
  }

  spawnFx(name: string, x: number, y: number): Phaser.GameObjects.Sprite {
    const s = this.add.sprite(x, y, 'fx', `${name}_000`).setDepth(10);
    s.play(animKey('fx', name));
    s.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => s.destroy());
    return s;
  }

  private floatText(x: number, y: number, text: string, color: string): void {
    const t = this.add
      .text(x, y, text, { fontFamily: 'monospace', fontSize: '7px', color, stroke: PALETTE.outline, strokeThickness: 2, resolution: 6 })
      .setOrigin(0.5)
      .setDepth(20);
    this.tweens.add({ targets: t, y: y - 16, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
  }
}
