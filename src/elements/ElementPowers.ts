import { ElementBalance } from '../config/balance';
import { ElementType } from '../core/Element';
import type { SpiritEnergy } from '../core/SpiritEnergy';
import type { Player } from '../entities/Player';

/**
 * สิ่งที่พลังธาตุต้องใช้จากโลกของเกม GameScene เป็นผู้ implement
 */
export interface ElementWorld {
  readonly player: Player;
  readonly energy: SpiritEnergy;
  spawnProjectile(element: ElementType.Fire | ElementType.Water): void;
  /** ปล่อยลมด้านหน้าผู้เล่น */
  gust(): void;
  /** หาตำแหน่งวางบล็อกหินได้หรือไม่ (ยังไม่วาง) */
  canPlaceEarthBlock(): boolean;
  placeEarthBlock(): void;
  /** Energy ไม่พอ: ให้ HUD กะพริบ */
  denyEnergy(): void;
  /** ภูตเล่นท่าใช้พลัง */
  spiritCast(): void;
}

/**
 * พลังธาตุแบบ Strategy pattern (GDD หัวข้อ 3, 8)
 * press = กด K, hold = กดค้าง K (เรียกทุก frame), release = ปล่อย K
 */
export abstract class ElementPower {
  abstract readonly element: ElementType;

  constructor(protected readonly world: ElementWorld) {}

  abstract press(): void;
  hold(_deltaMs: number): void {}
  release(): void {}

  protected spend(cost: number): boolean {
    if (this.world.energy.trySpend(cost)) return true;
    this.world.denyEnergy();
    return false;
  }

  protected castFx(): void {
    this.world.player.playCast();
    this.world.spiritCast();
  }
}

/** Burnil: ยิง fireball ติด Burn */
export class FirePower extends ElementPower {
  readonly element = ElementType.Fire;

  press(): void {
    if (!this.spend(ElementBalance.fire.cost)) return;
    this.world.spawnProjectile(ElementType.Fire);
    this.castFx();
  }
}

/** Wata: ยิงฟองน้ำวิถีโค้ง แช่แข็งศัตรูและผิวน้ำ รดเมล็ดให้โต */
export class WaterPower extends ElementPower {
  readonly element = ElementType.Water;

  press(): void {
    if (!this.spend(ElementBalance.water.cost)) return;
    this.world.spawnProjectile(ElementType.Water);
    this.castFx();
  }
}

/**
 * Valvaliz
 * - บนพื้น: คลื่นลมผลักศัตรู หมุนกังหัน
 * - กลางอากาศ: air dash (ครั้งเดียวต่อการลอย) และกดค้างตอนกำลังตกเพื่อ glide
 * - double jump ใช้ได้ตลอดเมื่อได้ Valvaliz แล้ว (ตั้งค่าที่ Player.doubleJumpUnlocked)
 */
export class WindPower extends ElementPower {
  readonly element = ElementType.Wind;
  private warnedEmpty = false;

  press(): void {
    const p = this.world.player;
    this.warnedEmpty = false;
    if (p.isGrounded) {
      if (!this.spend(ElementBalance.wind.gustCost)) return;
      this.world.gust();
      this.castFx();
      return;
    }
    if (p.canDash() && this.spend(ElementBalance.wind.dashCost)) {
      p.startDash();
      this.world.spiritCast();
    }
  }

  override hold(deltaMs: number): void {
    const p = this.world.player;
    const falling = !p.isGrounded && !p.isDashing && !p.isSlamming && p.body.velocity.y >= 0;
    if (!falling) {
      p.setGliding(false);
      return;
    }
    if (this.world.energy.drain(ElementBalance.wind.glideCostPerSecond, deltaMs)) {
      p.setGliding(true);
    } else {
      p.setGliding(false);
      if (!this.warnedEmpty) this.world.denyEnergy();
      this.warnedEmpty = true;
    }
  }

  override release(): void {
    this.world.player.setGliding(false);
  }
}

/**
 * Eathy
 * - บนพื้น: สร้างบล็อกหินด้านหน้า (สูงสุด 2 ก้อน ก้อนเก่าสุดพังเมื่อสร้างก้อนที่ 3)
 * - กลางอากาศ: ทุบพื้น ทำ damage รอบตัวและพังกำแพงร้าว
 * โล่หินเลื่อนไป Phase 3
 */
export class EarthPower extends ElementPower {
  readonly element = ElementType.Earth;

  press(): void {
    const p = this.world.player;
    if (p.isGrounded) {
      if (!this.world.canPlaceEarthBlock()) return;
      if (!this.spend(ElementBalance.earth.blockCost)) return;
      this.world.placeEarthBlock();
      this.castFx();
      return;
    }
    if (p.canSlam() && this.spend(ElementBalance.earth.slamCost)) {
      p.startSlam();
      this.world.spiritCast();
    }
  }
}

export function createPowers(world: ElementWorld): Record<ElementType, ElementPower> {
  return {
    [ElementType.Fire]: new FirePower(world),
    [ElementType.Water]: new WaterPower(world),
    [ElementType.Wind]: new WindPower(world),
    [ElementType.Earth]: new EarthPower(world),
  };
}
