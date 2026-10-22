/**
 * Combo ฟันดาบ 3 จังหวะ (GDD หัวข้อ 2)
 *
 * - กดโจมตีระหว่างจังหวะปัจจุบัน จะจองจังหวะถัดไปไว้ (input buffer)
 * - กดหลังจังหวะจบแต่ยังอยู่ใน comboWindow จะต่อจังหวะถัดไป
 * - เกินจากนั้น combo เริ่มนับใหม่ที่จังหวะแรก
 */

export interface ComboConfig {
  stepDurationsMs: readonly number[];
  activeWindowsMs: readonly (readonly [number, number])[];
  comboWindowMs: number;
}

export class Combo {
  /** index ของจังหวะที่กำลังเล่น หรือ -1 ถ้าไม่ได้โจมตี */
  private stepIndex = -1;
  private elapsedMs = 0;
  private queued = false;
  private lastStepIndex = -1;
  private sinceEndMs = Number.POSITIVE_INFINITY;
  private hitIds = new Set<number>();

  constructor(private readonly config: ComboConfig) {}

  get isAttacking(): boolean {
    return this.stepIndex >= 0;
  }

  /** จังหวะปัจจุบัน 0, 1, 2 หรือ -1 */
  get step(): number {
    return this.stepIndex;
  }

  /** hitbox ควรทำงานใน frame นี้หรือไม่ */
  get isActive(): boolean {
    if (this.stepIndex < 0) return false;
    const [start, end] = this.config.activeWindowsMs[this.stepIndex];
    return this.elapsedMs >= start && this.elapsedMs <= end;
  }

  /** คืนค่า true ถ้าเริ่มจังหวะใหม่ทันที */
  press(): boolean {
    if (this.stepIndex >= 0) {
      if (this.stepIndex < this.config.stepDurationsMs.length - 1) this.queued = true;
      return false;
    }
    const continuing =
      this.sinceEndMs <= this.config.comboWindowMs &&
      this.lastStepIndex >= 0 &&
      this.lastStepIndex < this.config.stepDurationsMs.length - 1;
    this.startStep(continuing ? this.lastStepIndex + 1 : 0);
    return true;
  }

  /** คืน index ของจังหวะที่เพิ่งเริ่มใน frame นี้ หรือ -1 */
  update(deltaMs: number): number {
    if (this.stepIndex < 0) {
      this.sinceEndMs += deltaMs;
      return -1;
    }
    this.elapsedMs += deltaMs;
    const duration = this.config.stepDurationsMs[this.stepIndex];
    if (this.elapsedMs < duration) return -1;

    if (this.queued) {
      this.startStep(this.stepIndex + 1);
      return this.stepIndex;
    }
    this.lastStepIndex = this.stepIndex;
    this.stepIndex = -1;
    this.sinceEndMs = 0;
    return -1;
  }

  /** ป้องกันการโดนเป้าเดิมซ้ำในจังหวะเดียวกัน คืนค่า true ถ้ายังไม่เคยโดนในจังหวะนี้ */
  registerHit(targetId: number): boolean {
    if (this.hitIds.has(targetId)) return false;
    this.hitIds.add(targetId);
    return true;
  }

  /** ยกเลิก combo (เช่น โดนตี) */
  cancel(): void {
    this.stepIndex = -1;
    this.lastStepIndex = -1;
    this.queued = false;
    this.sinceEndMs = Number.POSITIVE_INFINITY;
  }

  private startStep(index: number): void {
    this.stepIndex = index;
    this.elapsedMs = 0;
    this.queued = false;
    this.hitIds = new Set<number>();
  }
}
