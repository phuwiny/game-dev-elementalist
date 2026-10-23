import { ElementType } from './Element';

/** ลำดับช่องภูตบน HUD และปุ่ม 1–4 */
export const ELEMENT_ORDER: readonly ElementType[] = [
  ElementType.Fire,
  ElementType.Water,
  ElementType.Wind,
  ElementType.Earth,
];

/**
 * เลือกธาตุที่ใช้อยู่ (GDD หัวข้อ 3)
 * - ข้ามธาตุที่ยังไม่ได้ภูต
 * - สลับได้ทุก cooldownMs
 */
export class ElementSelector {
  private readonly unlockedSet = new Set<ElementType>();
  private _selected: ElementType | null = null;
  private sinceSwitchMs = Number.POSITIVE_INFINITY;

  constructor(private readonly cooldownMs: number) {}

  get selected(): ElementType | null {
    return this._selected;
  }

  get unlocked(): ElementType[] {
    return ELEMENT_ORDER.filter((e) => this.unlockedSet.has(e));
  }

  isUnlocked(element: ElementType): boolean {
    return this.unlockedSet.has(element);
  }

  /** ได้ภูตใหม่: เลือกธาตุนั้นทันที คืนค่า false ถ้าเคยได้แล้ว */
  unlock(element: ElementType): boolean {
    if (this.unlockedSet.has(element)) return false;
    this.unlockedSet.add(element);
    this._selected = element;
    this.sinceSwitchMs = 0;
    return true;
  }

  update(deltaMs: number): void {
    this.sinceSwitchMs += deltaMs;
  }

  /** เลือกตามช่อง 0–3 คืนค่า true ถ้าธาตุเปลี่ยน */
  selectSlot(slot: number): boolean {
    const element = ELEMENT_ORDER[slot];
    if (element === undefined || !this.unlockedSet.has(element)) return false;
    return this.setSelected(element);
  }

  /** วนไปช่องถัดไป (+1) หรือก่อนหน้า (-1) ที่ปลดล็อกแล้ว คืนค่า true ถ้าธาตุเปลี่ยน */
  cycle(direction: 1 | -1): boolean {
    const list = this.unlocked;
    if (list.length < 2 || this._selected === null) return false;
    const i = list.indexOf(this._selected);
    const next = list[(i + direction + list.length) % list.length];
    return this.setSelected(next);
  }

  private setSelected(element: ElementType): boolean {
    if (element === this._selected) return false;
    if (this.sinceSwitchMs < this.cooldownMs) return false;
    this._selected = element;
    this.sinceSwitchMs = 0;
    return true;
  }
}
