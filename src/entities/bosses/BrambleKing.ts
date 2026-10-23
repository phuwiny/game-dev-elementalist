import Phaser from 'phaser';
import { BossBalance } from '../../config/balance';
import { BossPhases } from '../../core/BossPhases';
import { ElementType } from '../../core/Element';
import { animKey } from '../../assets/manifest';
import { sfx } from '../../systems/Sfx';

const ATLAS = 'boss_bramble_king';
const B = BossBalance.brambleKing;
const anim = (name: string) => animKey(ATLAS, name);
const SIZE = 192;

/** สิ่งที่บอสต้องใช้จาก GameScene */
export interface BossHost {
  readonly puzzleScene: Phaser.Scene;
  /** กลุ่ม static body ที่ผู้เล่นและกระสุนชน */
  addSolid(zone: Phaser.GameObjects.Zone): void;
  /** ทำ damage ผู้เล่นถ้าพื้นที่นี้ทับผู้เล่น (คืนค่า true ถ้าโดน) */
  hurtPlayerIn(area: Phaser.Geom.Rectangle, damage: number, fromX: number): boolean;
  /** ศัตรูพุ่งชนโล่หิน (Phase 3 ของ Eathy): คืนค่า true ถ้ากันได้ */
  shieldBlocks(area: Phaser.Geom.Rectangle): boolean;
  /** ย้ายผู้เล่นออกจากพื้นที่นี้ไปยืนที่ x (ไม่ทำ damage) */
  evictPlayer(area: Phaser.Geom.Rectangle, toX: number): void;
  spawnFx(name: string, x: number, y: number): void;
  shake(ms: number, intensity: number): void;
}

/** โล่เถาวัลย์หน้าจุดอ่อน: ไฟเผาได้ วัตถุแข็งสำหรับผู้เล่นและกระสุน */
class VineShield {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly zone: Phaser.GameObjects.Zone;
  removed = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    bottom: number,
    private readonly onBurned: () => void,
  ) {
    this.sprite = scene.add.sprite(x, bottom, ATLAS, 'vine_shield_idle_000').setOrigin(0.5, 1).setDepth(5);
    this.zone = scene.add.zone(x, bottom - 16, 28, 32);
    this.zone.setData('puzzle', this);
  }

  get bounds(): Phaser.Geom.Rectangle {
    return this.zone.getBounds();
  }

  absorbs(): boolean {
    return true;
  }

  onElementHit(element: ElementType): void {
    if (element !== ElementType.Fire || this.removed) return;
    this.removed = true;
    const body = this.zone.body as Phaser.Physics.Arcade.StaticBody | null;
    if (body) body.enable = false;
    sfx.play('burn');
    this.sprite.play(anim('vine_shield_burn'));
    this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => this.sprite.destroy());
    this.onBurned();
  }

  destroy(): void {
    this.removed = true;
    this.zone.destroy();
    this.sprite.destroy();
  }
}

interface Whip {
  sprite: Phaser.GameObjects.Sprite;
}

interface Seed {
  sprite: Phaser.GameObjects.Sprite;
  marker: Phaser.GameObjects.Ellipse | null;
  dropAt: number;
}

/**
 * Bramble King (GDD หัวข้อ 5, บอสโลก 1)
 * - โล่เถาวัลย์ปิดจุดอ่อน (phase 1–3: 1, 2, 3 ชิ้น ซ้อนกันขึ้นไป) ต้องเผาด้วยไฟให้หมด
 * - จุดอ่อนเปิดชั่วคราว ฟันดาบหรือยิงไฟใส่ได้
 * - โจมตี: แส้เถาวัลย์กวาดพื้น (กระโดดหลบ) และ phase 2+ เมล็ดหนามตกจากด้านบน
 */
export class BrambleKing {
  readonly name = 'Bramble King';
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly wall: Phaser.GameObjects.Zone;
  private phases = new BossPhases(B);
  private shields: VineShield[] = [];
  private whips: Whip[] = [];
  private seeds: Seed[] = [];
  private telegraph: Phaser.GameObjects.Rectangle | null = null;
  private pendingWhipAt = 0;
  private attackCount = 0;
  private hurtFlashUntil = 0;
  private onDefeated: (() => void) | null = null;

  /**
   * @param left ขอบซ้ายของบอส (px) @param bottom พื้นที่บอสยืน (px)
   * @param arenaLeft ขอบซ้ายของพื้นที่สู้ (หลังประตูสนาม)
   */
  constructor(
    private readonly host: BossHost,
    private readonly left: number,
    private readonly bottom: number,
    private readonly arenaLeft: number,
  ) {
    const scene = host.puzzleScene;
    this.sprite = scene.add.sprite(left, bottom, ATLAS, 'idle_000').setOrigin(0, 1).setDepth(3);
    this.sprite.play(anim('idle'));
    // ลำต้นเป็นกำแพง ผู้เล่นเดินทะลุไม่ได้ ส่วนหน้าลำต้นเว้นไว้ให้จุดอ่อนกับโล่
    this.wall = scene.add.zone(left + 60 + (SIZE - 60) / 2, bottom - SIZE / 2, SIZE - 60, SIZE);
    host.addSolid(this.wall);
  }

  get isActive(): boolean {
    return this.phases.state === 'guarded' || this.phases.state === 'exposed';
  }

  get isDefeated(): boolean {
    return this.phases.state === 'defeated';
  }

  get hp(): number {
    return this.phases.hp;
  }

  get maxHp(): number {
    return this.phases.totalHp;
  }

  /** จุดอ่อน (โจมตีได้เมื่อเปิด) */
  get weakPoint(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.left + 20, this.bottom - 68, 44, 52);
  }

  get isExposed(): boolean {
    return this.phases.state === 'exposed';
  }

  start(onDefeated: () => void): void {
    if (this.phases.state !== 'idle') return;
    this.onDefeated = onDefeated;
    this.phases.start();
    this.attackCount = 0;
    this.roar();
    this.spawnShields();
  }

  /** ผู้เล่นตายระหว่างสู้: กลับไปสถานะเริ่มต้น HP เต็ม */
  reset(): void {
    if (this.isDefeated) return;
    this.clearAttacks();
    for (const s of this.shields) s.destroy();
    this.shields = [];
    this.phases = new BossPhases(B);
    this.sprite.play(anim('idle'));
  }

  /** ตีจุดอ่อน คืนค่า true ถ้าโดน */
  hitWeakPoint(damage: number): boolean {
    const result = this.phases.hitWeakPoint(damage);
    if (result === 'ignored') return false;
    sfx.play('boss_hit');
    this.hurtFlashUntil = this.host.puzzleScene.time.now + 120;
    this.host.spawnFx('hit_spark', this.weakPoint.centerX, this.weakPoint.centerY);
    if (result === 'phase') {
      this.clearAttacks();
      this.roar();
      this.spawnShields();
    } else if (result === 'defeated') {
      this.defeat();
    }
    return true;
  }

  update(delta: number): void {
    const now = this.host.puzzleScene.time.now;
    this.sprite.setTintMode(Phaser.TintModes.FILL);
    if (now < this.hurtFlashUntil) this.sprite.setTint(0xffffff);
    else this.sprite.clearTint();

    if (!this.isActive) return;
    const event = this.phases.update(delta);
    if (event === 'attack') this.attack(now);
    if (event === 'regrow') {
      this.sprite.play(anim('idle'));
      this.spawnShields();
    }

    if (this.pendingWhipAt > 0 && now >= this.pendingWhipAt) {
      this.pendingWhipAt = 0;
      this.telegraph?.destroy();
      this.telegraph = null;
      this.launchWhip();
    }
    this.updateWhips(delta);
    this.updateSeeds(now, delta);
  }

  destroy(): void {
    this.clearAttacks();
    for (const s of this.shields) s.destroy();
    this.sprite.destroy();
    this.wall.destroy();
  }

  // ---------------------------------------------------------------------------

  private spawnShields(): void {
    for (const s of this.shields) s.destroy();
    this.shields = [];
    // ผู้เล่นที่ยืนฟันจุดอ่อนอยู่ตอนโล่งอกกลับ จะถูกเถาวัลย์ดันออกมาด้านหน้า ไม่ติดอยู่ระหว่างโล่กับลำต้น
    this.host.evictPlayer(new Phaser.Geom.Rectangle(this.left - 10, this.bottom - SIZE, 70, SIZE), this.left - 28);
    const scene = this.host.puzzleScene;
    const count = this.phases.shieldsLeft;
    for (let i = 0; i < count; i += 1) {
      const shield = new VineShield(scene, this.left + 6, this.bottom - i * 32, () => this.onShieldBurned());
      this.host.addSolid(shield.zone);
      this.shields.push(shield);
    }
  }

  private onShieldBurned(): void {
    if (this.phases.shieldBroken()) {
      this.clearAttacks();
      this.sprite.play(anim('weak_exposed'));
    }
  }

  private attack(now: number): void {
    this.attackCount += 1;
    const seeds = B.seedsPerVolley[this.phases.phase] ?? 0;
    const doSeeds = seeds > 0 && (this.phases.phase >= 2 || this.attackCount % 2 === 0);
    const doWhip = this.phases.phase >= 2 || !doSeeds;
    this.sprite.play(anim('vine_attack'));
    this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.isActive && !this.isExposed) this.sprite.play(anim('idle'));
    });
    if (doWhip) this.telegraphWhip(now);
    if (doSeeds) this.dropSeeds(now, seeds);
  }

  private telegraphWhip(now: number): void {
    const scene = this.host.puzzleScene;
    const w = this.left + 60 - this.arenaLeft;
    this.telegraph?.destroy();
    this.telegraph = scene.add
      .rectangle(this.arenaLeft + w / 2, this.bottom - 4, w, 8, 0xb8321f, 0.35)
      .setDepth(2);
    scene.tweens.add({ targets: this.telegraph, alpha: 0.05, duration: 120, yoyo: true, repeat: -1 });
    this.pendingWhipAt = now + B.whipTelegraphMs;
  }

  private launchWhip(): void {
    const scene = this.host.puzzleScene;
    // เริ่มจากโคนลำต้น กวาดผ่านพื้นที่หน้าจุดอ่อนด้วย ยืนชิดบอสแล้วหลบไม่ได้
    const sprite = scene.add.sprite(this.left + 60 - 64, this.bottom, ATLAS, 'vine_whip_000').setOrigin(0, 1).setDepth(7);
    sprite.play(anim('vine_whip'));
    this.whips.push({ sprite });
    sfx.play('whip');
  }

  private updateWhips(delta: number): void {
    for (const whip of [...this.whips]) {
      whip.sprite.x -= (B.whipSpeed * delta) / 1000;
      const area = new Phaser.Geom.Rectangle(whip.sprite.x + 4, this.bottom - B.whipHeight, 56, B.whipHeight);
      this.host.hurtPlayerIn(area, B.contactDamage, whip.sprite.x + 64);
      if (whip.sprite.x + 64 < this.arenaLeft) {
        whip.sprite.destroy();
        this.whips = this.whips.filter((w) => w !== whip);
      }
    }
  }

  private dropSeeds(now: number, count: number): void {
    const scene = this.host.puzzleScene;
    const minX = this.arenaLeft + 16;
    const maxX = this.left - 24;
    for (let i = 0; i < count; i += 1) {
      const x = minX + ((maxX - minX) * (i + 0.5)) / count + Phaser.Math.Between(-12, 12);
      const marker = scene.add.ellipse(x, this.bottom - 2, 18, 5, 0x0f0b1a, 0.5).setDepth(2);
      const sprite = scene.add
        .sprite(x, this.bottom - SIZE, ATLAS, 'thorn_seed_000')
        .setDepth(7)
        .setVisible(false);
      sprite.play(anim('thorn_seed'));
      this.seeds.push({ sprite, marker, dropAt: now + B.seedTelegraphMs + i * 90 });
    }
  }

  private updateSeeds(now: number, delta: number): void {
    for (const seed of [...this.seeds]) {
      if (now < seed.dropAt) continue;
      seed.sprite.setVisible(true);
      seed.sprite.y += (B.seedFallSpeed * delta) / 1000;
      const area = new Phaser.Geom.Rectangle(seed.sprite.x - 6, seed.sprite.y - 6, 12, 12);
      const blocked = this.host.shieldBlocks(area);
      const hit = !blocked && this.host.hurtPlayerIn(area, B.contactDamage, seed.sprite.x);
      if (blocked || hit || seed.sprite.y >= this.bottom - 6) {
        this.host.spawnFx('poof', seed.sprite.x, seed.sprite.y);
        this.removeSeed(seed);
      }
    }
  }

  private removeSeed(seed: Seed): void {
    seed.sprite.destroy();
    seed.marker?.destroy();
    this.seeds = this.seeds.filter((s) => s !== seed);
  }

  private clearAttacks(): void {
    this.pendingWhipAt = 0;
    this.telegraph?.destroy();
    this.telegraph = null;
    for (const w of this.whips) w.sprite.destroy();
    this.whips = [];
    for (const s of [...this.seeds]) this.removeSeed(s);
  }

  private roar(): void {
    this.sprite.play(anim('roar'));
    this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.isActive && !this.isExposed) this.sprite.play(anim('idle'));
    });
    sfx.play('boss_roar');
    this.host.shake(400, 0.008);
  }

  private defeat(): void {
    this.clearAttacks();
    for (const s of this.shields) s.destroy();
    this.shields = [];
    this.sprite.play(anim('death'));
    this.host.shake(800, 0.01);
    sfx.play('boss_roar');
    this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      (this.wall.body as Phaser.Physics.Arcade.StaticBody | null)?.destroy();
      this.wall.destroy();
      this.sprite.setAlpha(0.4);
    });
    this.onDefeated?.();
  }
}
