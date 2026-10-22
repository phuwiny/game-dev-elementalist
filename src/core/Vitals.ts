/**
 * HP, ชีวิต และเหรียญของผู้เล่น (GDD หัวข้อ 4) ไม่ผูกกับ Phaser
 */

export interface VitalsConfig {
  maxHp: number;
  startLives: number;
  maxLives: number;
  coinsPerExtraLife: number;
}

export interface VitalsSnapshot {
  hp: number;
  maxHp: number;
  lives: number;
  coins: number;
}

export type DamageResult = 'hurt' | 'died' | 'ignored';

export class Vitals {
  private _hp: number;
  private _lives: number;
  private _coins = 0;

  constructor(private readonly config: VitalsConfig) {
    this._hp = config.maxHp;
    this._lives = config.startLives;
  }

  get hp(): number {
    return this._hp;
  }

  get lives(): number {
    return this._lives;
  }

  get coins(): number {
    return this._coins;
  }

  get isGameOver(): boolean {
    return this._lives <= 0;
  }

  snapshot(): VitalsSnapshot {
    return { hp: this._hp, maxHp: this.config.maxHp, lives: this._lives, coins: this._coins };
  }

  /** ลด HP ถ้า HP หมดจะคืนค่า 'died' (ยังไม่หักชีวิต ให้เรียก loseLife แยก) */
  damage(amount: number): DamageResult {
    if (amount <= 0 || this._hp <= 0) return 'ignored';
    this._hp = Math.max(0, this._hp - amount);
    return this._hp === 0 ? 'died' : 'hurt';
  }

  heal(amount: number): void {
    if (amount <= 0) return;
    this._hp = Math.min(this.config.maxHp, this._hp + amount);
  }

  /** หัก 1 ชีวิต และเติม HP เต็มถ้ายังเหลือชีวิต คืนค่า true ถ้ายังเล่นต่อได้ */
  loseLife(): boolean {
    this._lives = Math.max(0, this._lives - 1);
    if (this._lives > 0) this._hp = this.config.maxHp;
    return this._lives > 0;
  }

  addLife(): void {
    this._lives = Math.min(this.config.maxLives, this._lives + 1);
  }

  /** เพิ่มเหรียญ คืนจำนวนชีวิตที่ได้เพิ่มจากการเก็บครบ */
  addCoins(amount: number): number {
    if (amount <= 0) return 0;
    this._coins += amount;
    let extraLives = 0;
    while (this._coins >= this.config.coinsPerExtraLife) {
      this._coins -= this.config.coinsPerExtraLife;
      this.addLife();
      extraLives += 1;
    }
    return extraLives;
  }

  /** Continue หลัง Game Over: เริ่มด่านใหม่ด้วยชีวิตตั้งต้น HP เต็ม เหรียญรีเซ็ต */
  resetForContinue(): void {
    this._hp = this.config.maxHp;
    this._lives = this.config.startLives;
    this._coins = 0;
  }
}
