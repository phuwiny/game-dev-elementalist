import { ElementBalance, EnergyBalance } from '../config/balance';
import { Action } from '../core/Bindings';
import { ElementType } from '../core/Element';
import { ElementSelector } from '../core/ElementSelector';
import { SpiritEnergy } from '../core/SpiritEnergy';
import { createPowers, type ElementPower, type ElementWorld } from '../elements/ElementPowers';
import type { InputManager } from './InputManager';

const SLOT_ACTIONS = [Action.Element1, Action.Element2, Action.Element3, Action.Element4] as const;

export interface ElementSystemHooks {
  onSwitch(element: ElementType): void;
}

/**
 * รวมการเลือกธาตุ, Spirit Energy และการกดใช้พลัง (GDD หัวข้อ 3, 7)
 */
export class ElementSystem {
  readonly selector = new ElementSelector(ElementBalance.switchCooldownMs);
  readonly energy = new SpiritEnergy(EnergyBalance);
  private powers: Record<ElementType, ElementPower> | null = null;
  private castWasDown = false;
  private sinceCastMs = Number.POSITIVE_INFINITY;
  private deniedUntil = 0;

  constructor(
    private readonly controls: InputManager,
    private readonly hooks: ElementSystemHooks,
  ) {}

  /** ผูกกับโลกของเกม (ต้องเรียกหลังสร้าง player แล้ว) */
  attach(world: ElementWorld): void {
    this.powers = createPowers(world);
  }

  get selected(): ElementType | null {
    return this.selector.selected;
  }

  /** HUD ควรกะพริบแถบ Energy อยู่หรือไม่ */
  isDenied(now: number): boolean {
    return now < this.deniedUntil;
  }

  deny(now: number): void {
    this.deniedUntil = now + 350;
  }

  unlock(element: ElementType): boolean {
    const added = this.selector.unlock(element);
    if (added) this.hooks.onSwitch(element);
    return added;
  }

  /** เรียกทุก frame เมื่อผู้เล่นควบคุมได้ */
  update(deltaMs: number, canAct: boolean): void {
    this.selector.update(deltaMs);
    this.energy.update(deltaMs);
    this.sinceCastMs += deltaMs;

    const before = this.selector.selected;
    if (this.controls.justPressed(Action.NextElement)) this.selector.cycle(1);
    if (this.controls.justPressed(Action.PrevElement)) this.selector.cycle(-1);
    SLOT_ACTIONS.forEach((a, slot) => {
      if (this.controls.justPressed(a)) this.selector.selectSlot(slot);
    });
    const after = this.selector.selected;
    if (after !== before && after !== null) {
      if (before !== null) this.powers?.[before].release(true);
      this.hooks.onSwitch(after);
    }

    const power = after !== null && this.powers ? this.powers[after] : null;
    const down = this.controls.isDown(Action.Cast);
    if (!power) {
      this.castWasDown = down;
      return;
    }

    if (down && !this.castWasDown && canAct && this.sinceCastMs >= ElementBalance.castCooldownMs) {
      this.sinceCastMs = 0;
      power.press();
    } else if (down && this.castWasDown) {
      power.hold(deltaMs);
    } else if (!down && this.castWasDown) {
      power.release();
    }
    this.castWasDown = down;
  }
}
