/**
 * โครงสร้างโลกและการเลื่อนเลือกด่านบน World Map (GDD หัวข้อ 6)
 * ส่วนนี้ไม่รู้จัก Phaser: World Map ใช้เพื่อหาว่าควรแสดงหน้าไหนและเลือกด่านไหน
 */

export interface WorldLevels {
  levels: readonly { key: string }[];
}

/** ตำแหน่งที่เลือกบน World Map: โลก (index) และด่านในโลกนั้น (-1 = โลกที่ยังไม่มีด่าน) */
export interface MapSelection {
  world: number;
  level: number;
}

/** index ของโลกที่มีด่านนี้ หรือ -1 */
export function worldIndexOf(worlds: readonly WorldLevels[], levelKey: string | undefined): number {
  return worlds.findIndex((w) => w.levels.some((l) => l.key === levelKey));
}

/**
 * ด่านที่เลือกไว้ตอนเปิด World Map: ด่าน `focus` ถ้ามี ไม่เช่นนั้นด่านล่าสุดที่ปลดล็อกแล้ว
 */
export function initialSelection(worlds: readonly WorldLevels[], isUnlocked: (key: string) => boolean, focus?: string): MapSelection {
  const fw = worldIndexOf(worlds, focus);
  if (fw >= 0) return { world: fw, level: worlds[fw].levels.findIndex((l) => l.key === focus) };
  let latest: MapSelection = { world: 0, level: worlds[0]?.levels.length ? 0 : -1 };
  worlds.forEach((w, wi) =>
    w.levels.forEach((l, li) => {
      if (isUnlocked(l.key)) latest = { world: wi, level: li };
    }),
  );
  return latest;
}

/**
 * เลื่อนซ้าย (-1) หรือขวา (+1): ภายในโลกเดียวกันก่อน เลยขอบแล้วข้ามไปโลกข้างเคียง
 * (เข้าจากซ้ายเลือกด่านแรก เข้าจากขวาเลือกด่านสุดท้าย) ที่ขอบของโลกแรกและโลกสุดท้ายอยู่ที่เดิม
 */
export function stepSelection(worlds: readonly WorldLevels[], sel: MapSelection, d: -1 | 1): MapSelection {
  const count = worlds[sel.world]?.levels.length ?? 0;
  const next = sel.level + d;
  if (count > 0 && next >= 0 && next < count) return { world: sel.world, level: next };
  const w = sel.world + d;
  if (w < 0 || w >= worlds.length) return sel;
  const n = worlds[w].levels.length;
  return { world: w, level: n === 0 ? -1 : d === 1 ? 0 : n - 1 };
}
