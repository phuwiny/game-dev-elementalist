import Phaser from 'phaser';
import { AttackBalance, ElementBalance, PlayerBalance as B } from '../config/balance';
import { Action } from '../core/Bindings';
import { Combo } from '../core/Combo';
import { JumpAssist } from '../core/JumpAssist';
import { animKey, textureScale } from '../assets/manifest';
import type { InputManager } from '../systems/InputManager';

export type PlayerState =
  | 'idle'
  | 'run'
  | 'jump'
  | 'fall'
  | 'land'
  | 'attack'
  | 'cast'
  | 'dash'
  | 'glide'
  | 'slam'
  | 'hurt'
  | 'dead';

export const PlayerEvent = {
  AttackStep: 'player-attack-step',
  DeathAnimationDone: 'player-death-done',
  SlamImpact: 'player-slam-impact',
  Jump: 'player-jump',
  DoubleJump: 'player-double-jump',
  Dash: 'player-dash',
} as const;

const ATLAS = 'player';
/** pixel ของ texture ต่อ 1 pixel ในเกม (V4 = 2) */
const DENSITY = 1 / textureScale(ATLAS);

/**
 * ตำแหน่งบนตัว Aclaire V4 วัดจากฝ่าเท้าขึ้นไป (px ในเกม) ใช้วาง FX และจุดยิง
 * ตัวที่วาดสูงประมาณ 62 px (ART_HANDOFF.md หัวข้อ 5.1)
 */
export const PlayerLayout = {
  /** กลางลำตัว: FX ที่ซ้อนตัวละคร เช่น slash, aura */
  chestY: 32,
  /** มือที่ปล่อยพลัง: ต่ำพอให้กระสุนโดนศัตรูตัวเตี้ย */
  muzzleY: 22,
  /** เหนือหัว: ข้อความลอย, ภูตที่ตามอยู่ */
  overheadY: 70,
} as const;
const anim = (name: string) => animKey(ATLAS, name);
const W = ElementBalance.wind;
const E = ElementBalance.earth;

/**
 * Aclaire: state machine การเคลื่อนที่ การฟันดาบ และการเคลื่อนที่จากพลังธาตุ (GDD หัวข้อ 2–3)
 * การคำนวณ HP/ชีวิตอยู่ใน Vitals ส่วนการใช้ Energy อยู่ใน ElementSystem
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  mode: PlayerState = 'idle';
  /** เปิดเมื่อได้ภูตลม (Valvaliz) แล้ว: double jump ใช้ได้ตลอดไม่ต้องเลือกธาตุลม */
  doubleJumpUnlocked = false;

  private readonly jump = new JumpAssist(B.coyoteTimeMs, B.jumpBufferMs);
  private readonly combo = new Combo(AttackBalance);
  private invulnerableUntil = 0;
  private stunUntil = 0;
  private landUntil = 0;
  private castUntil = 0;
  private doubleJumpAnimUntil = 0;
  private wasGrounded = true;
  private airJumpsLeft = 0;
  private dashUntil = 0;
  private dashUsed = false;
  private gliding = false;
  private slamming = false;
  private shielding = false;
  private shieldSprite: Phaser.GameObjects.Sprite | null = null;

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
    this.setScale(textureScale(ATLAS));
    this.setDepth(6);
    // ขนาด body ระบุเป็น pixel ของ texture แล้ว Phaser คูณ scale ให้เป็นขนาดในเกม
    this.body.setSize(B.bodyWidth * DENSITY, B.bodyHeight * DENSITY);
    this.body.setMaxVelocityY(B.maxFallSpeed);
    this.body.setCollideWorldBounds(true);
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

  get isGrounded(): boolean {
    return this.body.blocked.down || this.body.touching.down;
  }

  get isDashing(): boolean {
    return this.scene.time.now < this.dashUntil;
  }

  get isGliding(): boolean {
    return this.gliding;
  }

  get isSlamming(): boolean {
    return this.slamming;
  }

  get isShielding(): boolean {
    return this.shielding;
  }

  /** ใช้พลังธาตุได้หรือไม่ (ไม่ได้ตาย ไม่ได้กำลังโดนตี ไม่ได้ทุบพื้นหรือ dash อยู่) */
  get canAct(): boolean {
    if (this.isDead || this.slamming || this.isDashing) return false;
    return !(this.mode === 'hurt' && this.scene.time.now < this.stunUntil);
  }

  /** จุดที่พลังธาตุพุ่งออก (หน้ามือ) */
  get muzzle(): { x: number; y: number } {
    return { x: this.x + this.facing * 12, y: this.y - PlayerLayout.muzzleY };
  }

  override update(_time: number, delta: number): void {
    const now = this.scene.time.now;
    const grounded = this.isGrounded;

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

    if (grounded) {
      this.airJumpsLeft = this.doubleJumpUnlocked ? W.airJumps : 0;
      this.dashUsed = false;
      this.gliding = false;
    }

    // ---- ทุบพื้น: พุ่งลงตรง ไม่รับ input จนกว่าจะแตะพื้น ----
    if (this.slamming) {
      if (grounded) this.finishSlam(now);
      else {
        this.body.setVelocity(0, E.slamSpeed);
        this.playAnim('ground_slam');
      }
      this.syncBodyToFrame();
      return;
    }

    // ---- dash: พุ่งแนวนอน ไม่มีแรงโน้มถ่วง ----
    if (this.dashUntil > 0) {
      if (now < this.dashUntil) {
        this.body.setVelocity(this.facing * W.dashSpeed, 0);
        this.playAnim('dash');
        this.syncBodyToFrame();
        return;
      }
      this.endDash();
    }

    this.jump.update(delta, grounded);
    const startedStep = this.combo.update(delta);
    if (startedStep >= 0) this.startAttackStep(startedStep);

    // ---- input ----
    if (this.controls.justPressed(Action.Jump)) {
      if (!this.jump.canGroundJump && this.airJumpsLeft > 0) this.doDoubleJump(now);
      else this.jump.press();
    }
    if (this.controls.justPressed(Action.Attack) && this.combo.press()) this.startAttackStep(this.combo.step);

    const dir = this.controls.horizontal();
    this.applyHorizontal(dir, grounded, delta);

    if (this.jump.consume()) {
      this.body.setVelocityY(-B.jumpVelocity);
      this.emit(PlayerEvent.Jump);
    }
    // variable jump height: ปล่อยปุ่มระหว่างขาขึ้นจะตัดความสูง
    if (!this.controls.isDown(Action.Jump) && this.body.velocity.y < 0) {
      this.body.setVelocityY(this.body.velocity.y * (1 - (1 - B.jumpCutMultiplier) * Math.min(1, delta / 16.67)));
    }

    if (this.gliding && this.body.velocity.y > W.glideFallSpeed) this.body.setVelocityY(W.glideFallSpeed);

    if (dir !== 0 && !this.combo.isAttacking) this.setFlipX(dir < 0);

    if (grounded && !this.wasGrounded && this.body.velocity.y >= 0) this.landUntil = now + 90;
    this.wasGrounded = grounded;

    this.updateState(grounded, dir, now);
    this.syncBodyToFrame();
    this.shieldSprite?.setPosition(this.x + this.facing * 12, this.y - 6);
  }

  // ---------------------------------------------------------------------------
  // Element mobility (เรียกจาก ElementPower)
  // ---------------------------------------------------------------------------

  /** ท่าปล่อยพลัง */
  playCast(): void {
    this.castUntil = this.scene.time.now + 250;
  }

  /** dash ได้ครั้งเดียวต่อการลอยกลางอากาศหนึ่งครั้ง */
  canDash(): boolean {
    return !this.isGrounded && !this.dashUsed && this.canAct;
  }

  startDash(): void {
    this.dashUsed = true;
    this.gliding = false;
    this.combo.cancel();
    this.dashUntil = this.scene.time.now + W.dashMs;
    this.body.setAllowGravity(false);
    this.body.setVelocity(this.facing * W.dashSpeed, 0);
    this.emit(PlayerEvent.Dash);
  }

  setGliding(on: boolean): void {
    this.gliding = on && !this.isGrounded && !this.slamming && !this.isDashing;
  }

  /** โล่หินของ Eathy: เดินช้าลงขณะยกโล่ */
  setShielding(on: boolean): void {
    if (this.shielding === on) return;
    this.shielding = on;
    if (on) {
      this.shieldSprite ??= this.scene.add.sprite(this.x, this.y, 'fx', 'stone_shield_idle_000').setOrigin(0.5, 1).setDepth(7);
      this.shieldSprite.setVisible(true).play(animKey('fx', 'stone_shield_appear'));
    } else if (this.shieldSprite) {
      const s = this.shieldSprite;
      s.play(animKey('fx', 'stone_shield_break'));
      s.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (!this.shielding) s.setVisible(false);
      });
    }
  }

  canSlam(): boolean {
    return !this.isGrounded && this.canAct;
  }

  startSlam(): void {
    this.slamming = true;
    this.gliding = false;
    this.combo.cancel();
    this.body.setMaxVelocityY(E.slamSpeed);
    this.body.setVelocity(0, E.slamSpeed);
  }

  // ---------------------------------------------------------------------------
  // Sword
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Damage / respawn
  // ---------------------------------------------------------------------------

  /** โดนตี: กระเด็นถอยหลัง เข้าสู่ i-frame */
  takeHit(fromX: number): void {
    if (this.isDead || this.isInvulnerable) return;
    const now = this.scene.time.now;
    this.cancelMobility();
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
    this.cancelMobility();
    this.mode = 'dead';
    this.setAlpha(1);
    this.body.setAccelerationX(0);
    this.body.setVelocityY(-200);
    this.play(anim('dead'), true);
  }

  respawn(x: number, y: number): void {
    this.cancelMobility();
    this.setPosition(x, y);
    this.body.reset(x, y);
    this.body.setVelocity(0, 0);
    this.mode = 'idle';
    this.invulnerableUntil = this.scene.time.now + B.invulnerableMs;
    this.setAlpha(1);
    this.play(anim('idle'), true);
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private doDoubleJump(now: number): void {
    this.airJumpsLeft -= 1;
    this.jump.clearPress();
    this.gliding = false;
    this.body.setVelocityY(-W.doubleJumpVelocity);
    this.doubleJumpAnimUntil = now + 260;
    this.emit(PlayerEvent.DoubleJump);
  }

  private endDash(): void {
    this.dashUntil = 0;
    this.body.setAllowGravity(true);
    this.body.setVelocityX(this.facing * B.runSpeed);
  }

  private finishSlam(now: number): void {
    this.slamming = false;
    this.body.setMaxVelocityY(B.maxFallSpeed);
    this.body.setVelocity(0, 0);
    this.landUntil = now + 180;
    this.emit(PlayerEvent.SlamImpact, this.x, this.y);
  }

  private cancelMobility(): void {
    this.combo.cancel();
    this.gliding = false;
    this.setShielding(false);
    if (this.slamming) {
      this.slamming = false;
      this.body.setMaxVelocityY(B.maxFallSpeed);
    }
    if (this.dashUntil > 0) {
      this.dashUntil = 0;
      this.body.setAllowGravity(true);
    }
  }

  private applyHorizontal(dir: number, grounded: boolean, delta: number): void {
    const attackingOnGround = this.combo.isAttacking && grounded;
    const speed = this.shielding ? B.runSpeed * E.shieldMoveFactor : B.runSpeed;
    const target = attackingOnGround ? 0 : dir * speed;
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
    let key: string;
    if (now < this.castUntil) {
      next = 'cast';
      key = 'cast';
    } else if (!grounded) {
      if (this.gliding) {
        next = 'glide';
        key = 'glide';
      } else if (now < this.doubleJumpAnimUntil) {
        next = 'jump';
        key = 'double_jump';
      } else if (this.body.velocity.y < -40) {
        next = 'jump';
        key = this.body.velocity.y < -120 ? 'jump_up' : 'jump_peak';
      } else {
        next = 'fall';
        key = 'fall';
      }
    } else if (now < this.landUntil) {
      next = 'land';
      key = 'land';
    } else {
      next = dir !== 0 || Math.abs(this.body.velocity.x) > 20 ? 'run' : 'idle';
      key = next;
    }
    this.mode = next;
    this.playAnim(key);
  }

  private playAnim(name: string): void {
    if (name === 'dash') this.mode = 'dash';
    if (name === 'ground_slam') this.mode = 'slam';
    if (this.anims.currentAnim?.key !== anim(name)) this.play(anim(name), true);
  }

  private updateBlink(now: number): void {
    if (this.isInvulnerable) this.setAlpha(Math.floor(now / 70) % 2 === 0 ? 0.35 : 1);
    else if (this.alpha !== 1) this.setAlpha(1);
  }

  /** ปรับ body ให้อยู่กึ่งกลางล่างเสมอ แม้ frame ท่าวิ่งและท่าฟันดาบจะกว้างกว่า (offset เป็น pixel ของ texture) */
  private syncBodyToFrame(): void {
    const fw = this.frame.realWidth;
    const fh = this.frame.realHeight;
    this.body.setOffset((fw - B.bodyWidth * DENSITY) / 2, fh - B.bodyHeight * DENSITY);
  }
}
