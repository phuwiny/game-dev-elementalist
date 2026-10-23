import type Phaser from 'phaser';
import { EnemyBalance } from '../../config/balance';
import { animKey } from '../../assets/manifest';
import { Enemy } from './Enemy';

const ATLAS = 'enemies_w1';
const B = EnemyBalance.mossSlime;

/**
 * Moss Slime (GDD หัวข้อ 5): เดินไปมาบนพื้น หันกลับเมื่อชนกำแพงหรือถึงขอบพื้น ไม่มีธาตุ
 */
export class MossSlime extends Enemy {
  readonly element = null;
  readonly contactDamage = B.contactDamage;
  protected readonly hurtHeight = 24;
  private direction: 1 | -1 = -1;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly isGroundAt: (x: number, y: number) => boolean,
  ) {
    super(scene, x, y, ATLAS, 'moss_slime_idle_000', B.hp);
    this.body.setSize(20, 12);
    this.body.setOffset(6, 20);
    this.play(this.anim('move'));
  }

  protected anim(name: 'move' | 'hurt' | 'death'): string {
    return animKey(ATLAS, `moss_slime_${name}`);
  }

  protected think(): void {
    if (this.body.blocked.down || this.body.touching.down) {
      const hitWall =
        (this.direction < 0 && (this.body.blocked.left || this.body.touching.left)) ||
        (this.direction > 0 && (this.body.blocked.right || this.body.touching.right));
      const groundAhead = this.isGroundAt(this.x + this.direction * 10, this.y + 2);
      if (hitWall || !groundAhead) this.direction = this.direction === 1 ? -1 : 1;
      this.body.setVelocityX(this.direction * B.speed);
    }
    this.setFlipX(this.direction > 0);
    if (this.anims.currentAnim?.key !== this.anim('move')) this.play(this.anim('move'));
  }
}
