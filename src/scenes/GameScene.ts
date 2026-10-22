import Phaser from 'phaser';
import { GameEvent, SceneKey, TILE_SIZE } from '../config/constants';
import { EnergyBalance } from '../config/balance';
import { parseLevel, Tile, type GridPoint, type ParsedLevel } from '../core/LevelParser';
import type { Vitals } from '../core/Vitals';
import { GRAYBOX_LEVEL } from '../levels/graybox';
import { Player, PlayerEvent } from '../entities/Player';
import { MossSlime } from '../entities/enemies/MossSlime';
import { InputManager } from '../systems/InputManager';
import { animKey } from '../assets/manifest';
import { PALETTE } from '../assets/palette';
import { GRAYBOX_TILES } from './PreloadScene';
import { REGISTRY_VITALS } from './BootScene';

export interface HudStats {
  hp: number;
  maxHp: number;
  lives: number;
  coins: number;
  energy: number;
  energyMax: number;
}

/** ระยะใต้ขอบล่างของด่านที่ถือว่าตกเหว */
const FALL_DEATH_MARGIN = 48;

/**
 * ด่านเล่น: ประกอบด่าน, ตัวละคร, ศัตรู, ไอเท็ม และกฎ HP / ชีวิต / checkpoint (GDD หัวข้อ 2, 4)
 */
export class GameScene extends Phaser.Scene {
  private level!: ParsedLevel;
  private layer!: Phaser.Tilemaps.TilemapLayer;
  private player!: Player;
  private controls!: InputManager;
  private vitals!: Vitals;
  private enemies!: Phaser.Physics.Arcade.Group;
  private respawnPoint = { x: 0, y: 0 };
  private activeCheckpoint: Phaser.GameObjects.Sprite | null = null;
  private stageCoins = 0;
  private finished = false;

  constructor() {
    super(SceneKey.Game);
  }

  create(): void {
    this.finished = false;
    this.stageCoins = 0;
    this.activeCheckpoint = null;
    this.vitals = this.registry.get(REGISTRY_VITALS) as Vitals;
    this.controls = new InputManager(this);
    this.cameras.main.setBackgroundColor(PALETTE.neutral1);

    this.level = parseLevel(GRAYBOX_LEVEL);
    this.layer = this.buildTerrain(this.level);
    const worldW = this.level.width * TILE_SIZE;
    const worldH = this.level.height * TILE_SIZE;
    this.physics.world.setBounds(0, 0, worldW, worldH);
    // ไม่ชนขอบล่าง เพื่อให้ตกเหวได้
    this.physics.world.setBoundsCollision(true, true, true, false);

    const start = this.footOf(this.level.player);
    this.respawnPoint = start;
    this.player = new Player(this, start.x, start.y, this.controls);
    this.physics.add.collider(this.player, this.layer);
    this.player.on(PlayerEvent.AttackStep, (step: number) => this.spawnSlash(step));
    this.player.on(PlayerEvent.DeathAnimationDone, () => this.onPlayerDeathFinished());

    this.buildSpikes();
    this.buildEnemies();
    this.buildPickups();
    this.buildCheckpoints();
    this.buildGoal();

    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldW, worldH);
    cam.setRoundPixels(true);
    cam.startFollow(this.player, true, 0.15, 0.15);
    cam.setDeadzone(48, 40);

    if (!this.scene.isActive(SceneKey.UI)) this.scene.launch(SceneKey.UI);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.player.removeAllListeners());
    this.emitStats();
  }

  override update(time: number, delta: number): void {
    if (this.finished) return;
    this.player.update(time, delta);
    for (const e of this.enemies.getChildren() as MossSlime[]) e.update();

    this.resolveSwordHits();

    if (!this.player.isDead && this.player.y > this.level.height * TILE_SIZE + FALL_DEATH_MARGIN) {
      this.killPlayer();
      // ตกเหวแล้วไม่ต้องรอ animation ตาย
      this.onPlayerDeathFinished();
    }
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
    for (const p of this.level.slimes) {
      const pos = this.footOf(p);
      const slime = new MossSlime(this, pos.x, pos.y, this.layer);
      this.enemies.add(slime);
    }
    this.physics.add.collider(this.enemies, this.layer);
    this.physics.add.overlap(this.player, this.enemies, (_p, e) => this.onEnemyContact(e as MossSlime));
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
      this.emitStats();
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
      this.emitStats();
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

  // ---------------------------------------------------------------------------
  // Rules
  // ---------------------------------------------------------------------------

  private resolveSwordHits(): void {
    const box = this.player.attackHitbox();
    if (!box) return;
    for (const e of this.enemies.getChildren() as MossSlime[]) {
      if (!e.isAlive) continue;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(box, e.getBounds())) continue;
      if (!this.player.registerHit(e.enemyId)) continue;
      this.spawnFx('hit_spark', e.x, e.y - 8);
      if (e.hit(this.player.attackDamage(), this.player.x)) this.spawnFx('poof', e.x, e.y - 10);
      this.cameras.main.shake(60, 0.003);
    }
  }

  private onEnemyContact(enemy: MossSlime): void {
    if (!enemy.isAlive || this.player.isDead || this.player.isInvulnerable) return;
    const result = this.vitals.damage(enemy.contactDamage);
    if (result === 'died') this.killPlayer();
    else if (result === 'hurt') this.player.takeHit(enemy.x);
    this.emitStats();
  }

  private killPlayer(): void {
    if (this.player.isDead || this.finished) return;
    // ตกเหวหรือโดนหนาม: HP หมดทันที
    this.vitals.damage(this.vitals.hp);
    this.player.die();
    this.emitStats();
  }

  private onPlayerDeathFinished(): void {
    if (this.finished) return;
    const canContinue = this.vitals.loseLife();
    this.emitStats();
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
      this.cameras.main.fadeIn(200, 15, 11, 26);
    });
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

  private emitStats(): void {
    const s = this.vitals.snapshot();
    const stats: HudStats = { ...s, energy: EnergyBalance.max, energyMax: EnergyBalance.max };
    this.registry.set('hud', stats);
    this.events.emit(GameEvent.StatsChanged, stats);
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
    this.tweens.add({ targets: t, y: y - 16, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }
}
