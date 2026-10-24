/**
 * ลำดับการสู้บอส Bramble King (GDD หัวข้อ 5) แยกจาก Phaser เพื่อเขียน test ได้
 *
 * วงจรแต่ละ phase
 *   guarded  : มีโล่เถาวัลย์ปิดจุดอ่อน บอสโจมตีเป็นจังหวะ
 *   exposed  : เผาโล่ครบแล้ว จุดอ่อนเปิดชั่วคราว ตีได้
 *   (หมดเวลา exposed แล้วยังไม่หมด HP ของ phase → กลับไป guarded โล่งอกใหม่)
 *   ตี HP ของ phase หมด → phase ถัดไป, หมดทุก phase → defeated
 */

export interface BossPhaseConfig {
  /** HP ของแต่ละ phase */
  hpPerPhase: number;
  /** จำนวนโล่ในแต่ละ phase */
  shields: readonly number[];
  /** เวลาระหว่างการโจมตีในแต่ละ phase (ms) */
  attackIntervalMs: readonly number[];
  exposedMs: number;
}

export type BossState = 'idle' | 'guarded' | 'exposed' | 'defeated';

export class BossPhases {
  private _phase = 0;
  private _state: BossState = 'idle';
  private _shieldsLeft = 0;
  private _phaseHp: number;
  private exposedLeftMs = 0;
  private sinceAttackMs = 0;

  constructor(private readonly config: BossPhaseConfig) {
    this._phaseHp = config.hpPerPhase;
  }

  get phase(): number {
    return this._phase;
  }

  get phaseCount(): number {
    return this.config.shields.length;
  }

  get state(): BossState {
    return this._state;
  }

  get shieldsLeft(): number {
    return this._shieldsLeft;
  }

  get totalHp(): number {
    return this.config.hpPerPhase * this.phaseCount;
  }

  get hp(): number {
    if (this._state === 'defeated') return 0;
    return this._phaseHp + this.config.hpPerPhase * (this.phaseCount - this._phase - 1);
  }

  /** เริ่มการต่อสู้: phase แรก มีโล่ */
  start(): void {
    if (this._state !== 'idle') return;
    this.enterGuarded();
  }

  /** โล่ถูกเผา 1 ชิ้น คืนค่า true ถ้าจุดอ่อนเพิ่งเปิด */
  shieldBroken(): boolean {
    if (this._state !== 'guarded' || this._shieldsLeft <= 0) return false;
    this._shieldsLeft -= 1;
    if (this._shieldsLeft > 0) return false;
    this._state = 'exposed';
    this.exposedLeftMs = this.config.exposedMs;
    return true;
  }

  /**
   * ตีจุดอ่อน คืนเหตุการณ์ที่เกิดขึ้น
   * 'ignored' ถ้าจุดอ่อนไม่เปิด
   */
  hitWeakPoint(damage: number): 'ignored' | 'hurt' | 'phase' | 'defeated' {
    if (this._state !== 'exposed' || damage <= 0) return 'ignored';
    this._phaseHp -= damage;
    if (this._phaseHp > 0) return 'hurt';
    if (this._phase >= this.phaseCount - 1) {
      this._state = 'defeated';
      return 'defeated';
    }
    this._phase += 1;
    this._phaseHp = this.config.hpPerPhase;
    this.enterGuarded();
    return 'phase';
  }

  /**
   * เรียกทุก frame คืนค่า 'attack' เมื่อถึงจังหวะโจมตี, 'regrow' เมื่อจุดอ่อนปิดกลับ
   */
  update(deltaMs: number): 'attack' | 'regrow' | null {
    if (this._state === 'exposed') {
      this.exposedLeftMs -= deltaMs;
      if (this.exposedLeftMs <= 0) {
        this.enterGuarded();
        return 'regrow';
      }
      return null;
    }
    if (this._state !== 'guarded') return null;
    this.sinceAttackMs += deltaMs;
    const interval = this.config.attackIntervalMs[this._phase] ?? this.config.attackIntervalMs[0];
    if (this.sinceAttackMs >= interval) {
      this.sinceAttackMs = 0;
      return 'attack';
    }
    return null;
  }

  private enterGuarded(): void {
    this._state = 'guarded';
    this._shieldsLeft = this.config.shields[this._phase] ?? 1;
    this.sinceAttackMs = 0;
  }
}

/** ฝั่งที่โดนโจมตีเทียบกับทิศที่หันอยู่: true = โดนจากด้านหน้า */
export function isFrontHit(facing: 1 | -1, selfX: number, attackerX: number): boolean {
  const fromRight = attackerX > selfX;
  return facing === 1 ? fromRight : !fromRight;
}
