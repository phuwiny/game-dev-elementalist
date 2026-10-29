import { ElementType } from './Element';
import { SHARDS_PER_LEVEL } from './LevelParser';
import type { SaveStore } from './SaveStore';

const SAVE_KEY = 'progress';

export interface ProgressData {
  cleared: string[];
  spirits: ElementType[];
  /** Spirit Shard ที่เก็บแล้วต่อด่าน (slot 0–2) */
  shards: Record<string, number[]>;
}

const ELEMENTS = new Set<string>(Object.values(ElementType));

/**
 * ความคืบหน้าของผู้เล่น (GDD หัวข้อ 8): ด่านที่ผ่านแล้ว, ภูตที่ได้แล้ว และ Spirit Shard ที่เก็บแล้วต่อด่าน
 * ด่านในโหมดผจญภัยปลดล็อกตามลำดับ ด่านแรกเปิดเสมอ
 */
export class Progress {
  private readonly cleared = new Set<string>();
  private readonly spirits = new Set<ElementType>();
  private readonly shards = new Map<string, Set<number>>();

  constructor(
    private readonly order: readonly string[],
    private readonly store: SaveStore | null = null,
  ) {
    const saved = store?.load<unknown>(SAVE_KEY, null);
    if (saved && typeof saved === 'object') {
      const d = saved as Partial<ProgressData>;
      for (const k of Array.isArray(d.cleared) ? d.cleared : []) if (typeof k === 'string') this.cleared.add(k);
      for (const e of Array.isArray(d.spirits) ? d.spirits : []) if (ELEMENTS.has(e)) this.spirits.add(e);
      if (d.shards && typeof d.shards === 'object' && !Array.isArray(d.shards)) {
        for (const [level, slots] of Object.entries(d.shards)) {
          if (!order.includes(level) || !Array.isArray(slots)) continue;
          for (const s of slots) if (Number.isInteger(s) && s >= 0 && s < SHARDS_PER_LEVEL) this.shardSet(level).add(s);
        }
      }
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

  private shardSet(level: string): Set<number> {
    let set = this.shards.get(level);
    if (!set) {
      set = new Set<number>();
      this.shards.set(level, set);
    }
    return set;
  }

  /** slot ของ Spirit Shard ที่เก็บแล้วในด่านนี้ */
  collectedShards(level: string): number[] {
    return [...(this.shards.get(level) ?? [])].sort((a, b) => a - b);
  }

  /** จำนวน Spirit Shard ที่เก็บแล้วทุกด่าน */
  get totalShards(): number {
    let n = 0;
    for (const set of this.shards.values()) n += set.size;
    return n;
  }

  /** จำนวน Spirit Shard ทั้งหมดที่หาได้ในด่านโหมดผจญภัย */
  get maxShards(): number {
    return this.order.length * SHARDS_PER_LEVEL;
  }

  /** บันทึก shard ที่เก็บในรอบนี้ (เรียกตอนผ่านด่าน) คืนจำนวนชิ้นที่เพิ่งได้เป็นครั้งแรก */
  addShards(level: string, slots: Iterable<number>): number {
    if (!this.order.includes(level)) return 0;
    const set = this.shardSet(level);
    let added = 0;
    for (const s of slots) {
      if (Number.isInteger(s) && s >= 0 && s < SHARDS_PER_LEVEL && !set.has(s)) {
        set.add(s);
        added += 1;
      }
    }
    if (added > 0) this.save();
    return added;
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
    this.shards.clear();
    this.save();
  }

  toJSON(): ProgressData {
    const shards: Record<string, number[]> = {};
    for (const [level, set] of this.shards) if (set.size > 0) shards[level] = [...set].sort((a, b) => a - b);
    return { cleared: [...this.cleared], spirits: [...this.spirits], shards };
  }

  /** คืนค่า false ถ้าบันทึกไม่ได้ (เช่น browser บล็อก localStorage) */
  save(): boolean {
    return this.store?.save(SAVE_KEY, this.toJSON()) ?? false;
  }
}
