import Phaser from 'phaser';
import { EnemyBalance } from '../../config/balance';
import { animKey } from '../../assets/manifest';

const ATLAS = 'enemies_w1';
const anim = (name: string) => animKey(ATLAS, `moss_slime_${name}`);
const B = EnemyBalance.mossSlime;

let nextId = 1;

/**
 * Moss Slime (GDD หัวข้อ 5): เดินไปมาบนพื้น หันกลับเมื่อชนกำแพงหรือถึงขอบพื้น
 */
export class MossSlime extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  readonly enemyId = nextId++;
  readonly contactDamage = B.contactDamage;
  private hp: number = B.hp;
  private direction: 1 | -1 = -1;
  private hurtUntil = 0;
  private dying = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly ground: Phaser.Tilemaps.TilemapLayer,
  ) {
    super(scene, x, y, ATLAS, 'moss_slime_idle_000');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.body.setSize(20, 12);
    this.body.setOffset(6, 20);
    this.play(anim('move'));
  }

  get isAlive(): boolean {
    return !this.dying;
  }

  override update(): void {
    if (this.dying) return;
    const now = this.scene.time.now;
    if (now < this.hurtUntil) return;

    if (this.body.blocked.down) {
      const hitWall = (this.direction < 0 && this.body.blocked.left) || (this.direction > 0 && this.body.blocked.right);
      const aheadX = this.x + this.direction * 10;
      const groundAhead = this.ground.getTileAtWorldXY(aheadX, this.y + 2, false) !== null;
      if (hitWall || !groundAhead) this.direction = this.direction === 1 ? -1 : 1;
      this.body.setVelocityX(this.direction * B.speed);
    }
    this.setFlipX(this.direction > 0);
    if (this.anims.currentAnim?.key !== anim('move')) this.play(anim('move'));
  }

  /** คืนค่า true ถ้าตายจากการโดนครั้งนี้ */
  hit(damage: number, fromX: number): boolean {
    if (this.dying) return false;
    this.hp -= damage;
    const away = this.x < fromX ? -1 : 1;
    if (this.hp <= 0) {
      this.dying = true;
      this.body.enable = false;
      this.play(anim('death'));
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => this.destroy());
      return true;
    }
    this.hurtUntil = this.scene.time.now + 250;
    this.body.setVelocity(away * 120, -120);
    this.play(anim('hurt'));
    return false;
  }
}
