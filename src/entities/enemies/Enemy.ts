import Phaser from 'phaser';
import { ElementBalance } from '../../config/balance';
import { damageMultiplier, ElementType } from '../../core/Element';
import { StatusEffects } from '../../core/StatusEffects';
import { animKey } from '../../assets/manifest';

let nextId = 1;

/**
 * พื้นฐานของศัตรูทุกตัว: HP, ธาตุประจำตัว, Burn, Freeze, ถูกลมผลัก (GDD หัวข้อ 3, 5)
 * ศัตรูที่ถูกแช่แข็งหยุดนิ่งและยืนเหยียบได้
 */
export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  readonly enemyId = nextId++;
  abstract readonly element: ElementType | null;
  abstract readonly contactDamage: number;

  protected hp: number;
  protected readonly status = new StatusEffects(ElementBalance.fire);
  private dying = false;
  private stunnedUntil = 0;
  private iceOverlay: Phaser.GameObjects.Image | null = null;
  private burnFx: Phaser.GameObjects.Sprite | null = null;

  protected constructor(scene: Phaser.Scene, x: number, y: number, atlas: string, frame: string, hp: number) {
    super(scene, x, y, atlas, frame);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setDepth(4);
    this.hp = hp;
  }

  get isAlive(): boolean {
    return !this.dying;
  }

  get isFrozen(): boolean {
    return this.status.isFrozen;
  }

  /** ความสูงของพื้นที่ที่โดนโจมตีได้ (สูงกว่า body ที่ใช้ชนพื้น เพื่อให้ยิงศัตรูตัวเตี้ยโดน) */
  protected abstract readonly hurtHeight: number;

  /** พื้นที่ที่โดนกระสุนและดาบ */
  hurtbox(): Phaser.Geom.Rectangle {
    const w = this.body.width + 4;
    return new Phaser.Geom.Rectangle(this.body.center.x - w / 2, this.body.bottom - this.hurtHeight, w, this.hurtHeight);
  }

  /** ชื่อ animation ของศัตรูตัวนี้ เช่น 'move' → enemies_w1_moss_slime_move */
  protected abstract anim(name: 'move' | 'hurt' | 'death'): string;
  /** พฤติกรรมปกติ (ไม่ถูกเรียกระหว่างถูกแช่แข็งหรือถูกผลัก) */
  protected abstract think(delta: number): void;

  /** เรียกทุก frame จาก scene */
  tick(delta: number): void {
    if (this.dying) return;
    const wasFrozen = this.status.isFrozen;
    const burnDamage = this.status.update(delta);
    if (burnDamage > 0 && this.applyDamage(burnDamage, this.x)) return;

    if (wasFrozen && !this.status.isFrozen) this.unfreezeBody();
    this.syncOverlays();

    if (this.status.isFrozen) return;
    if (this.scene.time.now < this.stunnedUntil) return;
    this.think(delta);
  }

  /** โดนโจมตี คืนค่า true ถ้าตาย */
  hit(baseDamage: number, fromX: number, element: ElementType | null): boolean {
    if (this.dying) return false;
    if (element === ElementType.Fire) {
      this.status.ignite();
      this.unfreezeBody();
    }
    if (baseDamage <= 0) return false;
    return this.applyDamage(baseDamage * damageMultiplier(element, this.element), fromX);
  }

  freeze(durationMs: number): void {
    if (this.dying) return;
    this.status.freeze(durationMs);
    this.anims.pause();
    this.body.setVelocity(0, 0);
    this.body.moves = false;
    this.body.setImmovable(true);
    if (!this.iceOverlay) {
      this.iceOverlay = this.scene.add.image(this.x, this.y, 'fx', 'freeze_overlay_000').setOrigin(0.5, 1).setDepth(5);
    }
  }

  /** ถูกลมผลัก */
  push(dir: 1 | -1, vx: number, vy: number): void {
    if (this.dying || this.status.isFrozen) return;
    this.stunnedUntil = this.scene.time.now + 450;
    this.body.setVelocity(dir * vx, -vy);
  }

  /** ตกน้ำ ตกเหว: ตายทันทีโดยไม่เล่น animation */
  vanish(): void {
    if (this.dying) return;
    this.dying = true;
    this.cleanupOverlays();
    this.destroy();
  }

  private applyDamage(amount: number, fromX: number): boolean {
    this.hp -= Math.max(1, Math.round(amount));
    if (this.hp <= 0) {
      this.dying = true;
      if (this.status.isFrozen) this.shatterFx();
      this.cleanupOverlays();
      this.body.enable = false;
      this.anims.resume();
      this.play(this.anim('death'));
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => this.destroy());
      return true;
    }
    if (!this.status.isFrozen) {
      const away = this.x < fromX ? -1 : 1;
      this.stunnedUntil = this.scene.time.now + 250;
      this.body.setVelocity(away * 120, -120);
      this.play(this.anim('hurt'));
    }
    return false;
  }

  private unfreezeBody(): void {
    this.status.thaw();
    this.body.moves = true;
    this.body.setImmovable(false);
    this.anims.resume();
    if (this.iceOverlay) {
      this.shatterFx();
      this.iceOverlay.destroy();
      this.iceOverlay = null;
    }
  }

  private syncOverlays(): void {
    if (this.iceOverlay) this.iceOverlay.setPosition(this.x, this.y);
    if (this.status.isBurning) {
      if (!this.burnFx) {
        this.burnFx = this.scene.add.sprite(this.x, this.y, 'fx', 'burn_status_000').setOrigin(0.5, 1).setDepth(6);
        this.burnFx.play(animKey('fx', 'burn_status'));
      }
      this.burnFx.setPosition(this.x, this.y - 8);
    } else if (this.burnFx) {
      this.burnFx.destroy();
      this.burnFx = null;
    }
  }

  private shatterFx(): void {
    const fx = this.scene.add.sprite(this.x, this.y, 'fx', 'freeze_shatter_000').setOrigin(0.5, 1).setDepth(9);
    fx.play(animKey('fx', 'freeze_shatter'));
    fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy());
  }

  private cleanupOverlays(): void {
    this.iceOverlay?.destroy();
    this.iceOverlay = null;
    this.burnFx?.destroy();
    this.burnFx = null;
  }

  override destroy(fromScene?: boolean): void {
    this.cleanupOverlays();
    super.destroy(fromScene);
  }
}
