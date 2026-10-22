import Phaser from 'phaser';
import { AttackBalance, PlayerBalance as B } from '../config/balance';
import { Action } from '../core/Bindings';
import { Combo } from '../core/Combo';
import { JumpAssist } from '../core/JumpAssist';
import { animKey } from '../assets/manifest';
import type { InputManager } from '../systems/InputManager';

export type PlayerState = 'idle' | 'run' | 'jump' | 'fall' | 'land' | 'attack' | 'hurt' | 'dead';

export const PlayerEvent = {
  AttackStep: 'player-attack-step',
  DeathAnimationDone: 'player-death-done',
} as const;

const ATLAS = 'player';
const anim = (name: string) => animKey(ATLAS, name);

/**
 * Aclaire: state machine การเคลื่อนที่และการฟันดาบ (GDD หัวข้อ 2)
 * การคำนวณ HP/ชีวิตอยู่ใน Vitals ส่วนนี้ดูแลเฉพาะการเคลื่อนที่ ท่าทาง และ hitbox
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  mode: PlayerState = 'idle';
  private readonly jump = new JumpAssist(B.coyoteTimeMs, B.jumpBufferMs);
  private readonly combo = new Combo(AttackBalance);
  private invulnerableUntil = 0;
  private stunUntil = 0;
  private landUntil = 0;
  private wasGrounded = true;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly controls: InputManager,
  ) {
    super(scene, x, y, ATLAS, 'idle_000');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 1);
    this.body.setSize(B.bodyWidth, B.bodyHeight);
    this.body.setMaxVelocityY(B.maxFallSpeed);
    this.body.setCollideWorldBounds(true);
    // ปล่อยให้ตกออกขอบล่างของโลกได้ (ตกเหว)
    this.body.onWorldBounds = false;
    this.syncBodyToFrame();
    this.play(anim('idle'));

    this.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (a: Phaser.Animations.Animation) => {
      if (a.key === anim('dead')) this.emit(PlayerEvent.DeathAnimationDone);
    });
  }

  get isDead(): boolean {
    return this.mode === 'dead';
  }

  get isInvulnerable(): boolean {
    return this.scene.time.now < this.invulnerableUntil;
  }

  get facing(): 1 | -1 {
    return this.flipX ? -1 : 1;
  }

  override update(_time: number, delta: number): void {
    const now = this.scene.time.now;
    const grounded = this.body.blocked.down;

    if (this.mode === 'dead') {
      this.body.setAccelerationX(0);
      this.body.setVelocityX(this.body.velocity.x * 0.9);
      this.syncBodyToFrame();
      return;
    }

    this.updateBlink(now);

    if (this.mode === 'hurt' && now < this.stunUntil) {
      this.syncBodyToFrame();
      return;
    }

    this.jump.update(delta, grounded);
    const startedStep = this.combo.update(delta);
    if (startedStep >= 0) this.startAttackStep(startedStep);

    // ---- input ----
    if (this.controls.justPressed(Action.Jump)) this.jump.press();
    if (this.controls.justPressed(Action.Attack) && this.combo.press()) this.startAttackStep(this.combo.step);

    const dir = this.controls.horizontal();
    this.applyHorizontal(dir, grounded, delta);

    if (this.jump.consume()) {
      this.body.setVelocityY(-B.jumpVelocity);
    }
    // variable jump height: ปล่อยปุ่มระหว่างขาขึ้นจะตัดความสูง
    if (!this.controls.isDown(Action.Jump) && this.body.velocity.y < 0) {
      this.body.setVelocityY(this.body.velocity.y * (1 - (1 - B.jumpCutMultiplier) * Math.min(1, delta / 16.67)));
    }

    if (dir !== 0 && !this.combo.isAttacking) this.setFlipX(dir < 0);

    if (grounded && !this.wasGrounded && this.body.velocity.y >= 0) this.landUntil = now + 90;
    this.wasGrounded = grounded;

    this.updateState(grounded, dir, now);
    this.syncBodyToFrame();
  }

  /** พื้นที่ที่ดาบฟันโดนใน frame นี้ หรือ null ถ้าไม่ได้อยู่ในช่วงที่ hitbox ทำงาน */
  attackHitbox(): Phaser.Geom.Rectangle | null {
    if (!this.combo.isActive) return null;
    const reach = AttackBalance.reach;
    const h = AttackBalance.hitboxHeight;
    const x = this.facing === 1 ? this.x : this.x - reach;
    return new Phaser.Geom.Rectangle(x, this.y - B.bodyHeight + 4, reach, h);
  }

  attackDamage(): number {
    return AttackBalance.damage[Math.max(0, this.combo.step)] ?? 1;
  }

  /** คืนค่า true ถ้าเป้านี้ยังไม่โดนในจังหวะนี้ */
  registerHit(targetId: number): boolean {
    return this.combo.registerHit(targetId);
  }

  /** โดนตี: กระเด็นถอยหลัง เข้าสู่ i-frame */
  takeHit(fromX: number): void {
    if (this.isDead || this.isInvulnerable) return;
    const now = this.scene.time.now;
    this.combo.cancel();
    this.mode = 'hurt';
    this.stunUntil = now + B.hurtStunMs;
    this.invulnerableUntil = now + B.invulnerableMs;
    const away = this.x < fromX ? -1 : 1;
    this.body.setAccelerationX(0);
    this.body.setVelocity(away * B.hurtKnockbackX, -B.hurtKnockbackY);
    this.play(anim('hurt'), true);
  }

  die(): void {
    if (this.isDead) return;
    this.combo.cancel();
    this.mode = 'dead';
    this.setAlpha(1);
    this.body.setAccelerationX(0);
    this.body.setVelocityY(-200);
    this.play(anim('dead'), true);
  }

  respawn(x: number, y: number): void {
    this.setPosition(x, y);
    this.body.reset(x, y);
    this.body.setVelocity(0, 0);
    this.mode = 'idle';
    this.combo.cancel();
    this.invulnerableUntil = this.scene.time.now + B.invulnerableMs;
    this.setAlpha(1);
    this.play(anim('idle'), true);
  }

  private applyHorizontal(dir: number, grounded: boolean, delta: number): void {
    const attackingOnGround = this.combo.isAttacking && grounded;
    const target = attackingOnGround ? 0 : dir * B.runSpeed;
    const vx = this.body.velocity.x;
    const accelerating = dir !== 0 && Math.sign(target) === Math.sign(vx || target);
    const rate = grounded
      ? accelerating
        ? B.groundAccel
        : B.groundDecel
      : accelerating
        ? B.airAccel
        : B.airDecel;
    const step = (rate * delta) / 1000;
    let next = vx;
    if (vx < target) next = Math.min(target, vx + step);
    else if (vx > target) next = Math.max(target, vx - step);
    this.body.setVelocityX(next);
  }

  private startAttackStep(step: number): void {
    this.mode = 'attack';
    this.play(anim(`attack_${step + 1}`), true);
    this.emit(PlayerEvent.AttackStep, step);
  }

  private updateState(grounded: boolean, dir: number, now: number): void {
    if (this.combo.isAttacking) {
      this.mode = 'attack';
      return;
    }
    let next: PlayerState;
    if (!grounded) next = this.body.velocity.y < -40 ? 'jump' : 'fall';
    else if (now < this.landUntil) next = 'land';
    else next = dir !== 0 || Math.abs(this.body.velocity.x) > 20 ? 'run' : 'idle';

    this.mode = next;
    const key =
      next === 'jump'
        ? this.body.velocity.y < -120
          ? 'jump_up'
          : 'jump_peak'
        : next === 'land'
          ? 'land'
          : next;
    if (this.anims.currentAnim?.key !== anim(key)) this.play(anim(key), true);
  }

  private updateBlink(now: number): void {
    if (this.isInvulnerable) this.setAlpha(Math.floor(now / 70) % 2 === 0 ? 0.35 : 1);
    else if (this.alpha !== 1) this.setAlpha(1);
  }

  /** ปรับ body ให้อยู่กึ่งกลางล่างเสมอ แม้ frame ท่าฟันดาบจะกว้าง 64 px */
  private syncBodyToFrame(): void {
    const fw = this.frame.realWidth;
    const fh = this.frame.realHeight;
    this.body.setOffset((fw - B.bodyWidth) / 2, fh - B.bodyHeight);
  }
}
