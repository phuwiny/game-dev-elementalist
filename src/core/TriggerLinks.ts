import type { GridPoint } from './LevelParser';

/**
 * ผูกตัวกระตุ้น (คบเพลิง, กังหัน, แผ่นกด) กับประตูในด่าน ASCII
 *
 * กฎ: ตัวกระตุ้นแต่ละตัวผูกกับประตูตัวแรกที่อยู่ทางขวาของมัน (คอลัมน์มากกว่าหรือเท่ากับ)
 * ถ้ามีหลายบานในคอลัมน์ที่ใกล้เท่ากัน เลือกบานที่แถวใกล้ที่สุด
 * ตัวกระตุ้นที่ไม่มีประตูทางขวาจะไม่ถูกผูก
 *
 * @returns linked[gateIndex] = รายการ index ของตัวกระตุ้น
 */
export function linkTriggers(triggers: readonly GridPoint[], gates: readonly GridPoint[]): number[][] {
  const linked: number[][] = gates.map(() => []);
  triggers.forEach((t, ti) => {
    let best = -1;
    let bestScore = Number.POSITIVE_INFINITY;
    gates.forEach((g, gi) => {
      if (g.col < t.col) return;
      const score = (g.col - t.col) * 1000 + Math.abs(g.row - t.row);
      if (score < bestScore) {
        bestScore = score;
        best = gi;
      }
    });
    if (best >= 0) linked[best].push(ti);
  });
  return linked;
}

/** ประตูเปิดเมื่อตัวกระตุ้นที่ผูกไว้ทำงานครบทุกตัว ประตูที่ไม่มีตัวกระตุ้นจะปิดตลอด */
export function isGateOpen(linkedTriggers: readonly number[], active: readonly boolean[]): boolean {
  return linkedTriggers.length > 0 && linkedTriggers.every((i) => active[i] === true);
}
