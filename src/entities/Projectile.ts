import Phaser from 'phaser';
import { ElementType } from '../core/Element';
import { ElementBalance, PlayerBalance } from '../config/balance';
import { animKey } from '../assets/manifest';

/**
 * กระสุนธาตุของผู้เล่น: fireball (ไฟ) วิ่งตรง และฟองน้ำ (น้ำ) ลอยเป็นวิถีโค้ง
 */
export class Projectile extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private readonly expiresAt: number;
  private spent = false;

  constructor(
    scene: Phaser.Scene,
    group: Phaser.Physics.Arcade.Group,
    x: number,
    y: number,
    dir: 1 | -1,
    readonly element: ElementType.Fire | ElementType.Water,
  ) {
    const fire = element === ElementType.Fire;
    super(scene, x, y, 'fx', fire ? 'fireball_000' : 'water_bubble_000');
    scene.add.existing(this);
    group.add(this);
    this.setDepth(8);
    this.setFlipX(dir < 0);
    this.play(animKey('fx', fire ? 'fireball' : 'water_bubble'));

    this.body.setSize(10, 10);
    if (fire) {
      const c = ElementBalance.fire;
      this.body.setAllowGravity(false);
      this.body.setVelocity(dir * c.speed, 0);
      this.expiresAt = scene.time.now + c.lifetimeMs;
    } else {
      const c = ElementBalance.water;
      this.body.setAllowGravity(true);
      // gravity ของ body บวกเพิ่มจาก world gravity จึงลบออกให้เหลือค่าสุทธิตาม balance
      this.body.setGravityY(c.gravity - PlayerBalance.gravity);
      this.body.setVelocity(dir * c.speedX, c.speedY);
      this.body.setBounce(0, c.bounce);
      this.expiresAt = scene.time.now + c.lifetimeMs;
    }
  }

  private bounces = 0;

  /** ชน terrain: fireball แตก, ฟองน้ำเด้งไปตามพื้นจนครบจำนวนหรือชนกำแพง */
  onTerrainHit(): void {
    if (this.spent) return;
    if (this.element === ElementType.Fire) {
      this.burst();
      return;
    }
    const b = this.body;
    if (b.blocked.left || b.blocked.right || b.blocked.up) {
      this.burst();
      return;
    }
    this.bounces += 1;
    if (this.bounces >= ElementBalance.water.maxBounces) this.burst();
  }

  get damage(): number {
    return this.element === ElementType.Fire ? ElementBalance.fire.damage : 0;
  }

  get isSpent(): boolean {
    return this.spent;
  }

  override preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.spent && time >= this.expiresAt) this.burst();
  }

  /** ชนแล้วแตก: แสดง effect และลบตัวเอง */
  burst(): void {
    if (this.spent) return;
    this.spent = true;
    this.body.enable = false;
    const name = this.element === ElementType.Fire ? 'fire_burst' : 'water_splash';
    const fx = this.scene.add.sprite(this.x, this.y, 'fx', `${name}_000`).setDepth(9);
    fx.play(animKey('fx', name));
    fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy());
    this.destroy();
  }
}
