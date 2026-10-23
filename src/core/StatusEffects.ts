/**
 * สถานะผิดปกติของศัตรู (GDD หัวข้อ 3): Burn ทำ damage ต่อเนื่อง, Freeze หยุดนิ่ง
 */

export interface BurnConfig {
  burnMs: number;
  burnTickMs: number;
  burnDamage: number;
}

export class StatusEffects {
  private burnLeftMs = 0;
  private sinceTickMs = 0;
  private freezeLeftMs = 0;

  constructor(private readonly burn: BurnConfig) {}

  get isBurning(): boolean {
    return this.burnLeftMs > 0;
  }

  get isFrozen(): boolean {
    return this.freezeLeftMs > 0;
  }

  get freezeRemainingMs(): number {
    return this.freezeLeftMs;
  }

  /** ติดไฟใหม่จะรีเซ็ตเวลา และละลายน้ำแข็ง */
  ignite(): void {
    this.burnLeftMs = this.burn.burnMs;
    this.sinceTickMs = 0;
    this.freezeLeftMs = 0;
  }

  /** แช่แข็งจะดับไฟ */
  freeze(durationMs: number): void {
    this.freezeLeftMs = Math.max(this.freezeLeftMs, durationMs);
    this.burnLeftMs = 0;
  }

  thaw(): void {
    this.freezeLeftMs = 0;
  }

  clear(): void {
    this.burnLeftMs = 0;
    this.freezeLeftMs = 0;
  }

  /** คืน damage จากไฟที่ต้องทำใน frame นี้ */
  update(deltaMs: number): number {
    this.freezeLeftMs = Math.max(0, this.freezeLeftMs - deltaMs);
    if (this.burnLeftMs <= 0) return 0;

    const step = Math.min(deltaMs, this.burnLeftMs);
    this.burnLeftMs -= step;
    this.sinceTickMs += step;
    let damage = 0;
    while (this.sinceTickMs >= this.burn.burnTickMs) {
      this.sinceTickMs -= this.burn.burnTickMs;
      damage += this.burn.burnDamage;
    }
    return damage;
  }
}
