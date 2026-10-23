/**
 * Spirit Energy (GDD หัวข้อ 3): เกจเดียวใช้ร่วมกันทุกธาตุ
 * ฟื้นเองหลังไม่ได้ใช้ครบเวลาที่กำหนด และฟื้นเมื่อฟันศัตรูโดน
 */

export interface EnergyConfig {
  max: number;
  regenPerSecond: number;
  regenDelayMs: number;
  gainOnMeleeHit: number;
}

export class SpiritEnergy {
  private _value: number;
  private sinceSpendMs = Number.POSITIVE_INFINITY;

  constructor(private readonly config: EnergyConfig) {
    this._value = config.max;
  }

  get value(): number {
    return this._value;
  }

  get max(): number {
    return this.config.max;
  }

  get isEmpty(): boolean {
    return this._value <= 0;
  }

  canSpend(cost: number): boolean {
    return this._value >= cost;
  }

  /** หักแบบครั้งเดียว คืนค่า false และไม่หักถ้าไม่พอ */
  trySpend(cost: number): boolean {
    if (cost <= 0) return true;
    if (this._value < cost) return false;
    this._value -= cost;
    this.sinceSpendMs = 0;
    return true;
  }

  /**
   * หักต่อเนื่อง (เช่น glide) หักได้เท่าที่มี คืนค่า true ถ้ายังมีพลังเหลือหลังหัก
   */
  drain(perSecond: number, deltaMs: number): boolean {
    if (this._value <= 0) return false;
    this._value = Math.max(0, this._value - (perSecond * deltaMs) / 1000);
    this.sinceSpendMs = 0;
    return this._value > 0;
  }

  gainFromMelee(): void {
    this.add(this.config.gainOnMeleeHit);
  }

  add(amount: number): void {
    if (amount <= 0) return;
    this._value = Math.min(this.config.max, this._value + amount);
  }

  refill(): void {
    this._value = this.config.max;
    this.sinceSpendMs = Number.POSITIVE_INFINITY;
  }

  update(deltaMs: number): void {
    this.sinceSpendMs += deltaMs;
    if (this.sinceSpendMs < this.config.regenDelayMs) return;
    this.add((this.config.regenPerSecond * deltaMs) / 1000);
  }
}
