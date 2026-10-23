import { ElementType } from './Element';
import type { SaveStore } from './SaveStore';

const SAVE_KEY = 'progress';

export interface ProgressData {
  cleared: string[];
  spirits: ElementType[];
}

const ELEMENTS = new Set<string>(Object.values(ElementType));

/**
 * ความคืบหน้าของผู้เล่น (GDD หัวข้อ 8): ด่านที่ผ่านแล้ว และภูตที่ได้แล้ว
 * ด่านในโหมดผจญภัยปลดล็อกตามลำดับ ด่านแรกเปิดเสมอ
 */
export class Progress {
  private readonly cleared = new Set<string>();
  private readonly spirits = new Set<ElementType>();

  constructor(
    private readonly order: readonly string[],
    private readonly store: SaveStore | null = null,
  ) {
    const saved = store?.load<unknown>(SAVE_KEY, null);
    if (saved && typeof saved === 'object') {
      const d = saved as Partial<ProgressData>;
      for (const k of Array.isArray(d.cleared) ? d.cleared : []) if (typeof k === 'string') this.cleared.add(k);
      for (const e of Array.isArray(d.spirits) ? d.spirits : []) if (ELEMENTS.has(e)) this.spirits.add(e);
    }
  }

  isCleared(key: string): boolean {
    return this.cleared.has(key);
  }

  isUnlocked(key: string): boolean {
    const i = this.order.indexOf(key);
    if (i < 0) return false;
    return i === 0 || this.cleared.has(this.order[i - 1]);
  }

  /** ด่านที่ควรเลือกไว้ใน World Map: ด่านแรกที่ยังไม่ผ่าน หรือด่านสุดท้าย */
  nextLevel(): string {
    return this.order.find((k) => !this.cleared.has(k)) ?? this.order[this.order.length - 1];
  }

  get spiritList(): ElementType[] {
    return [...this.spirits];
  }

  markCleared(key: string): void {
    if (this.cleared.has(key)) return;
    this.cleared.add(key);
    this.save();
  }

  addSpirit(element: ElementType): void {
    if (this.spirits.has(element)) return;
    this.spirits.add(element);
    this.save();
  }

  reset(): void {
    this.cleared.clear();
    this.spirits.clear();
    this.save();
  }

  toJSON(): ProgressData {
    return { cleared: [...this.cleared], spirits: [...this.spirits] };
  }

  /** คืนค่า false ถ้าบันทึกไม่ได้ (เช่น browser บล็อก localStorage) */
  save(): boolean {
    return this.store?.save(SAVE_KEY, this.toJSON()) ?? false;
  }
}
