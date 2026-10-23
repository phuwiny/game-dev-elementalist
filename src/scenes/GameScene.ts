import Phaser from 'phaser';
import { SceneKey, TILE_SIZE } from '../config/constants';
import { ElementBalance } from '../config/balance';
import { ElementType } from '../core/Element';
import { ELEMENT_ORDER } from '../core/ElementSelector';
import { parseLevel, Tile, type GridPoint, type LevelObject, type ParsedLevel } from '../core/LevelParser';
import { isGateOpen, linkTriggers } from '../core/TriggerLinks';
import type { Vitals } from '../core/Vitals';
import { findLevel } from '../levels';
import { Player, PlayerEvent } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { Enemy } from '../entities/enemies/Enemy';
import { MossSlime } from '../entities/enemies/MossSlime';
import { SpiritCompanion, SPIRIT_NAMES, spiritKey } from '../entities/SpiritCompanion';
import type { ElementWorld } from '../elements/ElementPowers';
import { InputManager } from '../systems/InputManager';
import { ElementSystem } from '../systems/ElementSystem';
import {
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
import { animKey } from '../assets/manifest';
import { PALETTE, hex } from '../assets/palette';
import { GRAYBOX_TILES } from './PreloadScene';
import { REGISTRY_VITALS } from './BootScene';

export const REGISTRY_LEVEL = 'level';

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
export class GameScene extends Phaser.Scene implements ElementWorld, PuzzleHost {
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
  private finished = false;
  private puzzleDirty = true;

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
    this.activeCheckpoint = null;
    this.puzzleObjects = [];
    this.objectGrid = new Map();
    this.plates = [];
    this.gates = [];
    this.earthBlocks = [];
    this.puzzleDirty = true;

    const def = findLevel(data?.level ?? (this.registry.get(REGISTRY_LEVEL) as string | undefined));
    this.registry.set(REGISTRY_LEVEL, def.key);

    this.vitals = this.registry.get(REGISTRY_VITALS) as Vitals;
    this.controls = new InputManager(this);
    this.cameras.main.setBackgroundColor(PALETTE.neutral1);

    this.level = parseLevel(def.rows);
    this.layer = this.buildTerrain(this.level);
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

    const start = this.footOf(this.level.player);
    this.respawnPoint = start;
    this.player = new Player(this, start.x, start.y, this.controls);
    this.player.on(PlayerEvent.AttackStep, (step: number) => this.spawnSlash(step));
    this.player.on(PlayerEvent.DeathAnimationDone, () => this.onPlayerDeathFinished());
    this.player.on(PlayerEvent.SlamImpact, (x: number, y: number) => this.slamImpact(x, y));
    this.player.on(PlayerEvent.Dash, () => this.spawnFx('dash_trail', this.player.x - this.player.facing * 10, this.player.y - 24));

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
    this.buildColliders();

    if (new URLSearchParams(window.location.search).has('unlock')) {
      for (const el of ELEMENT_ORDER) this.unlockSpirit(el, false);
    }

    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldW, worldH);
    cam.setRoundPixels(true);
    cam.startFollow(this.player, true, 0.15, 0.15);
    cam.setDeadzone(48, 40);

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
    };
  }

  // ---------------------------------------------------------------------------
  // ElementWorld
  // ---------------------------------------------------------------------------

  spawnProjectile(element: ElementType.Fire | ElementType.Water): void {
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
    const fx = this.spawnFx('wind_wave', this.player.x + dir * 24, this.player.y - 20);
    fx.setFlipX(dir < 0);

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

    const size = EB.blockSize;
    const sprite = this.add.sprite(spot.x + size / 2, spot.y + size, 'fx', 'earth_block_appear_000').setOrigin(0.5, 1).setDepth(3);
    sprite.play(animKey('fx', 'earth_block_appear'));
    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => sprite.setFrame('earth_block_idle_000'));
    const zone = this.add.zone(spot.x + size / 2, spot.y + size / 2, size, size);
    this.solids.add(zone);
    this.earthBlocks.push({ sprite, zone });
    this.puzzleDirty = true;
  }

  denyEnergy(): void {
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
    if (announce) this.floatText(this.player.x, this.player.y - 60, `${SPIRIT_NAMES[element]} joined!`, PALETTE.gold);
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
    for (const p of this.level.slimes) {
      const pos = this.footOf(p);
      this.enemies.add(new MossSlime(this, pos.x, pos.y, isGroundAt));
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
      if (extra > 0) this.floatText(this.player.x, this.player.y - 50, '1UP', PALETTE.wind);
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
    this.physics.add.overlap(this.player, flag, () => this.reachGoal());
  }

  private buildColliders(): void {
    const frozenWater = (_a: unknown, w: unknown) => this.waterOf(w)?.frozen === true;
    const openWater = (_a: unknown, w: unknown) => this.waterOf(w)?.frozen === false;
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
    if (enemies.length === 0) return;
    for (const p of this.projectiles.getChildren() as Projectile[]) {
      if (p.isSpent) continue;
      const pb = p.body;
      const rect = new Phaser.Geom.Rectangle(pb.x, pb.y, pb.width, pb.height);
      const target = enemies.find((e) => Phaser.Geom.Intersects.RectangleToRectangle(rect, e.hurtbox()));
      if (target) this.projectileHitsEnemy(p, target);
    }
  }

  private projectileHitsEnemy(p: Projectile, e: Enemy): void {
    if (p.isSpent || !e.isAlive) return;
    if (p.element === ElementType.Water) {
      e.freeze(ElementBalance.water.freezeMs);
    } else if (e.hit(p.damage, p.x, p.element)) {
      this.spawnFx('poof', e.x, e.y - 10);
    }
    p.burst();
  }

  private projectileHitsObject(p: Projectile, zone: Phaser.GameObjects.Zone): void {
    if (p.isSpent) return;
    const obj = zone.getData('puzzle') as PuzzleObject | undefined;
    if (!obj) {
      // บล็อกหินของผู้เล่น
      p.burst();
      return;
    }
    if (obj.removed || !obj.absorbs(p.element)) return;
    obj.onElementHit(p.element, p.damage);
    p.burst();
  }

  private slamImpact(x: number, y: number): void {
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
    const front = p.facing === 1 ? p.x + 8 : p.x - 8 - size;
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
      if (e.hit(this.player.attackDamage(), this.player.x, null)) this.spawnFx('poof', e.x, e.y - 10);
      this.cameras.main.shake(60, 0.003);
    }
  }

  private onEnemyContact(enemy: Enemy): void {
    if (!enemy.isAlive || this.player.isDead || this.player.isInvulnerable) return;
    const result = this.vitals.damage(enemy.contactDamage);
    if (result === 'died') this.killPlayer();
    else if (result === 'hurt') this.player.takeHit(enemy.x);
  }

  private killPlayer(): void {
    if (this.player.isDead || this.finished) return;
    // ตกเหว ตกน้ำ หรือโดนหนาม: HP หมดทันที
    this.vitals.damage(this.vitals.hp);
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
      this.companion.snap();
      this.cameras.main.fadeIn(200, 15, 11, 26);
    });
  }

  private onElementSwitch(element: ElementType): void {
    this.companion.setElement(element);
    this.spawnFx(`element_switch_aura_${element}`, this.player.x, this.player.y - 24);
  }

  private activateCheckpoint(shrine: Phaser.GameObjects.Sprite): void {
    if (this.player.isDead || this.activeCheckpoint === shrine) return;
    this.activeCheckpoint = shrine;
    this.respawnPoint = { x: shrine.x, y: shrine.y };
    shrine.play(animKey('items', 'checkpoint_shrine_lighting'));
    shrine.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => shrine.play(animKey('items', 'checkpoint_shrine_lit')));
    this.floatText(shrine.x, shrine.y - 56, 'CHECKPOINT', PALETTE.gold);
  }

  private reachGoal(): void {
    if (this.finished || this.player.isDead) return;
    this.finished = true;
    this.player.body.setVelocity(0, 0);
    this.player.body.setAcceleration(0, 0);
    this.time.delayedCall(600, () => {
      this.scene.stop(SceneKey.UI);
      this.scene.start(SceneKey.StageClear, { coins: this.stageCoins });
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
    const dir = this.player.facing;
    const fx = this.spawnFx(`slash_${step + 1}`, this.player.x + dir * 18, this.player.y - 24);
    fx.setFlipX(dir < 0);
  }

  private spawnFx(name: string, x: number, y: number): Phaser.GameObjects.Sprite {
    const s = this.add.sprite(x, y, 'fx', `${name}_000`).setDepth(10);
    s.play(animKey('fx', name));
    s.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => s.destroy());
    return s;
  }

  private floatText(x: number, y: number, text: string, color: string): void {
    const t = this.add
      .text(x, y, text, { fontFamily: 'monospace', fontSize: '10px', color, stroke: PALETTE.outline, strokeThickness: 3 })
      .setOrigin(0.5)
      .setDepth(20);
    this.tweens.add({ targets: t, y: y - 16, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
  }
}
