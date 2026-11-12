import { SHARDS_PER_LEVEL } from './LevelParser';

/** ภาพหนึ่งใน concept art gallery: ปลดล็อกด้วย Spirit Shard ของด่าน `level` */
export interface GalleryEntry {
  key: string;
  level: string;
}

/** ส่วนของ Progress ที่ gallery ต้องใช้ (แยกไว้ให้ test ได้โดยไม่ต้องมีเซฟ) */
export interface ShardRecord {
  collectedShards(level: string): readonly number[];
}

/**
 * GDD หัวข้อ 4: เก็บ Spirit Shard ครบทั้ง 3 ชิ้นของด่านไหน ได้ภาพ gallery ของด่านนั้น 1 ภาพ
 * (เก็บครบทั้งโลกปลดล็อกด่านพิเศษ แยกไว้ใน PR ของด่านพิเศษ)
 */
export function isGalleryUnlocked(record: ShardRecord, entry: GalleryEntry): boolean {
  return record.collectedShards(entry.level).length >= SHARDS_PER_LEVEL;
}

export function unlockedGallery(record: ShardRecord, entries: readonly GalleryEntry[]): GalleryEntry[] {
  return entries.filter((e) => isGalleryUnlocked(record, e));
}

/**
 * ภาพที่เพิ่งปลดล็อกจากการผ่านด่านครั้งนี้: ก่อนผ่านมี shard ไม่ครบ หลังบันทึกครบแล้ว
 * `before` คือจำนวน shard ที่บันทึกไว้ก่อนผ่านด่าน
 */
export function newlyUnlocked(record: ShardRecord, entries: readonly GalleryEntry[], level: string, before: number): GalleryEntry[] {
  if (before >= SHARDS_PER_LEVEL) return [];
  return entries.filter((e) => e.level === level && isGalleryUnlocked(record, e));
}
