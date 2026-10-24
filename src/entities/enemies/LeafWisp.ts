import type Phaser from 'phaser';
import { W1EnemyBalance } from '../../config/balance';
import { ElementType } from '../../core/Element';
import { animKey } from '../../assets/manifest';
import { Enemy } from './Enemy';
import { PlayerLayout } from '../Player';

const ATLAS = 'enemies_w1';
const B = W1EnemyBalance.leafWisp;

/**
 * Leaf Wisp (ลม, GDD หัวข้อ 5): ลอยไปมาเป็นคลื่นไซน์รอบจุดเกิด
 * เมื่อผู้เล่นเข้าใกล้จะพุ่งเข้าหา แล้วกลับขึ้นไปที่ความสูงเดิม
 */
export class LeafWisp extends Enemy {
  readonly element = ElementType.Wind;
  readonly contactDamage = B.contactDamage;
  protected readonly hurtHeight = 20;
  private readonly homeX: number;
  private readonly homeY: number;
  private elapsed = 0;
  private diving = false;
  private diveTarget = { x: 0, y: 0 };
  private sinceDiveMs: number = B.diveCooldownMs;
  private diveElapsedMs = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly target: () => { x: number; y: number; alive: boolean },
  ) {
    super(scene, x, y, ATLAS, 'leaf_wisp_fly_000', B.hp);
    this.homeX = x;
    this.homeY = y;
    this.body.setAllowGravity(false);
    this.body.setSize(18, 16);
    this.body.setOffset(7, 8);
    this.play(this.anim('move'));
  }

  protected anim(name: 'move' | 'hurt' | 'death'): string {
    const n = name === 'move' ? (this.diving ? 'dive' : 'fly') : name;
    return animKey(ATLAS, `leaf_wisp_${n}`);
  }

  protected think(delta: number): void {
    this.elapsed += delta;
    this.sinceDiveMs += delta;
    const t = this.target();

    if (!this.diving && t.alive && this.sinceDiveMs >= B.diveCooldownMs) {
      const dx = t.x - this.x;
      const dy = t.y - PlayerLayout.chestY - this.y;
      if (Math.hypot(dx, dy) < B.diveRange) {
        this.diving = true;
        this.diveElapsedMs = 0;
        this.diveTarget = { x: t.x, y: t.y - PlayerLayout.chestY };
        this.play(this.anim('move'));
      }
    }

    if (this.diving) {
      const dx = this.diveTarget.x - this.x;
      const dy = this.diveTarget.y - this.y;
      const d = Math.hypot(dx, dy);
      this.diveElapsedMs += delta;
      // ชนกำแพง/พื้นระหว่างพุ่งจะไปไม่ถึงเป้า: เลิกพุ่งเมื่อเกินเวลา
      if (d < 6 || this.diveElapsedMs >= B.diveTimeoutMs) {
        this.diving = false;
        this.sinceDiveMs = 0;
        this.play(this.anim('move'));
      } else {
        this.body.setVelocity((dx / d) * B.diveSpeed, (dy / d) * B.diveSpeed);
      }
      this.setFlipX(dx < 0);
      return;
    }

    // กลับไปลอยรอบจุดเกิด
    const px = this.homeX + Math.sin(this.elapsed / 900) * B.patrolRange;
    const py = this.homeY + Math.sin(this.elapsed / 260) * B.waveAmplitude;
    this.body.setVelocity((px - this.x) * 3, (py - this.y) * 3);
    if (Math.abs(this.body.velocity.x) > 5) this.setFlipX(this.body.velocity.x < 0);
    if (this.anims.currentAnim?.key !== this.anim('move')) this.play(this.anim('move'));
  }
}
