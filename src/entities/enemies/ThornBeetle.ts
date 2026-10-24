import type Phaser from 'phaser';
import { W1EnemyBalance } from '../../config/balance';
import { ElementType } from '../../core/Element';
import { isFrontHit } from '../../core/BossPhases';
import { animKey } from '../../assets/manifest';
import { Enemy } from './Enemy';

const ATLAS = 'enemies_w1';
const B = W1EnemyBalance.thornBeetle;

/**
 * Thorn Beetle (ดิน, GDD หัวข้อ 5): มีเกราะหนามด้านหน้า
 * โจมตีจากด้านหน้าไม่เข้า ต้องตีจากด้านหลัง หรือใช้ลมพลิกให้หงายท้องก่อน
 * (ground slam ของดินก็พลิกได้ เพราะกระแทกจากด้านบน)
 */
export class ThornBeetle extends Enemy {
  readonly element = ElementType.Earth;
  readonly contactDamage = B.contactDamage;
  protected readonly hurtHeight = 24;
  private direction: 1 | -1 = -1;
  private flippedUntil = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly isGroundAt: (x: number, y: number) => boolean,
    private readonly onBlocked: (x: number, y: number) => void,
  ) {
    super(scene, x, y, ATLAS, 'thorn_beetle_walk_000', B.hp);
    this.body.setSize(22, 14);
    this.body.setOffset(5, 18);
    this.play(this.anim('move'));
  }

  get isFlipped(): boolean {
    return this.scene.time.now < this.flippedUntil;
  }

  get facing(): 1 | -1 {
    return this.direction;
  }

  protected anim(name: 'move' | 'hurt' | 'death'): string {
    const n = name === 'move' ? (this.isFlipped ? 'flipped' : 'walk') : name;
    return animKey(ATLAS, `thorn_beetle_${n}`);
  }

  override hit(baseDamage: number, fromX: number, element: ElementType | null): boolean {
    if (!this.isAlive) return false;
    if (element === ElementType.Earth) this.flip();
    if (!this.isFlipped && !this.isFrozen && isFrontHit(this.direction, this.x, fromX)) {
      this.onBlocked(this.x + this.direction * 12, this.y - 10);
      return false;
    }
    return super.hit(baseDamage, fromX, element);
  }

  override push(dir: 1 | -1, vx: number, vy: number): void {
    super.push(dir, vx, vy);
    this.flip();
  }

  flip(): void {
    if (!this.isAlive) return;
    this.flippedUntil = this.scene.time.now + B.flippedMs;
    this.play(this.anim('move'));
  }

  protected think(): void {
    if (this.isFlipped) {
      if (this.body.blocked.down) this.body.setVelocityX(0);
      if (this.anims.currentAnim?.key !== this.anim('move')) this.play(this.anim('move'));
      return;
    }
    if (this.body.blocked.down || this.body.touching.down) {
      const hitWall =
        (this.direction < 0 && (this.body.blocked.left || this.body.touching.left)) ||
        (this.direction > 0 && (this.body.blocked.right || this.body.touching.right));
      const groundAhead = this.isGroundAt(this.x + this.direction * 12, this.y + 2);
      if (hitWall || !groundAhead) this.direction = this.direction === 1 ? -1 : 1;
      this.body.setVelocityX(this.direction * B.speed);
    }
    // วาดหันขวา: เมื่อเดินไปทางขวาไม่ต้อง flip
    this.setFlipX(this.direction < 0);
    if (this.anims.currentAnim?.key !== this.anim('move')) this.play(this.anim('move'));
  }
}
