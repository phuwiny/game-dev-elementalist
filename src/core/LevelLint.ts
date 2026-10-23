import { type ObjectKind, type ParsedLevel, Tile } from './LevelParser';
import { linkTriggers } from './TriggerLinks';

/**
 * ตรวจด่านแบบ static ว่าผ่านได้ด้วยการกระโดดปกติ (ไม่มี double jump)
 * ใช้กับด่านในโหมดผจญภัยของโลกที่ยังไม่มีภูตลม
 *
 * ค่าเริ่มต้นมาจาก physics ใน balance.ts: กระโดดสูงสุด ~64 px (4 ช่อง)
 * วิ่งกระโดดไกลสุด ~104 px โดยต้องเผื่อความกว้างตัว 14 px และหนามด้านข้าง
 */
export interface LintRules {
  /** หลุม (คอลัมน์ที่ไม่มีพื้นในแถวล่างสุด) กว้างได้ไม่เกิน */
  maxPitTiles: number;
  /** หนามติดกันแนวนอนได้ไม่เกิน */
  maxSpikeTiles: number;
  /** ขั้นพื้นที่ต้องปีนขึ้นสูงได้ไม่เกิน */
  maxStepUpTiles: number;
  /**
   * ช่องว่างเหนือหลุม/หนามที่ต้องไม่มีพื้นกั้น (ตัวสูง ~2.5 ช่อง + กระโดด 4 ช่อง)
   * กันกรณีวาง platform เหนือหลุมแล้วหัวชนจนตกหลุม
   */
  minHeadroomTiles: number;
  /** วัตถุ puzzle ที่อนุญาต (ตามธาตุที่ผู้เล่นมีในโลกนั้น) */
  allowedObjects: readonly ObjectKind[];
}

export const SINGLE_JUMP_RULES: LintRules = {
  maxPitTiles: 4,
  maxSpikeTiles: 3,
  maxStepUpTiles: 3,
  minHeadroomTiles: 6,
  allowedObjects: ['vine', 'crate', 'ice', 'torch', 'gate', 'arenaGate', 'spirit'],
};

export function lintLevel(level: ParsedLevel, rules: LintRules): string[] {
  const issues: string[] = [];
  const { width, height, tiles } = level;
  const solid = (r: number, c: number) => r >= 0 && r < height && c >= 0 && c < width && tiles[r][c] === Tile.Solid;

  // 1) หลุม: คอลัมน์ที่แถวล่างสุดไม่มีพื้น
  let pit = 0;
  for (let c = 0; c <= width; c += 1) {
    const open = c < width && !solid(height - 1, c);
    if (open) pit += 1;
    else {
      if (pit > rules.maxPitTiles) issues.push(`pit of ${pit} tiles ends at col ${c - 1} (max ${rules.maxPitTiles})`);
      pit = 0;
    }
  }

  // 2) หนามติดกันแนวนอน
  for (let r = 0; r < height; r += 1) {
    let run = 0;
    for (let c = 0; c <= width; c += 1) {
      if (c < width && tiles[r][c] === Tile.Spike) run += 1;
      else {
        if (run > rules.maxSpikeTiles) issues.push(`spike strip of ${run} tiles at row ${r}, ends col ${c - 1} (max ${rules.maxSpikeTiles})`);
        run = 0;
      }
    }
  }

  // 3) ขั้นพื้น: ผิวบนสุดของก้อนพื้นที่ต่อจากแถวล่างสุด ต้องไม่สูงขึ้นเกินกำหนดระหว่างคอลัมน์ติดกัน
  const surface: (number | null)[] = [];
  for (let c = 0; c < width; c += 1) {
    if (!solid(height - 1, c)) {
      surface.push(null);
      continue;
    }
    let r = height - 1;
    while (r - 1 >= 0 && solid(r - 1, c)) r -= 1;
    // ก้อนที่สูงถึงแถวบนสุดคือกำแพงกั้นขอบด่าน ไม่ใช่ขั้นที่ต้องปีน
    surface.push(r === 0 ? null : r);
  }
  for (let c = 1; c < width; c += 1) {
    const a = surface[c - 1];
    const b = surface[c];
    if (a === null || b === null) continue;
    if (a - b > rules.maxStepUpTiles) issues.push(`step up of ${a - b} tiles at col ${c} (max ${rules.maxStepUpTiles})`);
    if (b - a > rules.maxStepUpTiles) issues.push(`step up of ${b - a} tiles at col ${c - 1} going left (max ${rules.maxStepUpTiles})`);
  }

  // 3.5) ที่ว่างเหนือหลุมและหนาม: ต้องกระโดดข้ามได้โดยหัวไม่ชนพื้นด้านบน
  const checkHeadroom = (c0: number, c1: number, standRow: number, what: string) => {
    for (let c = c0; c <= c1; c += 1) {
      for (let r = Math.max(0, standRow - rules.minHeadroomTiles); r < standRow; r += 1) {
        if (solid(r, c)) {
          issues.push(`${what} at cols ${c0}-${c1}: ceiling at col ${c} row ${r} blocks the jump (need ${rules.minHeadroomTiles} free rows)`);
          return;
        }
      }
    }
  };
  for (let c = 0; c < width; c += 1) {
    if (surface[c] !== null || solid(0, c) || c === 0 || surface[c - 1] === null) continue;
    let end = c;
    while (end + 1 < width && surface[end + 1] === null && !solid(0, end + 1)) end += 1;
    // แถวที่ผู้เล่นยืนตรงขอบหลุม (เหนือผิวพื้นหนึ่งแถว)
    checkHeadroom(c, end, (surface[c - 1] as number) - 1, 'pit');
  }
  for (let r = 0; r < height; r += 1) {
    for (let c = 0; c < width; c += 1) {
      if (tiles[r][c] !== Tile.Spike || (c > 0 && tiles[r][c - 1] === Tile.Spike)) continue;
      let end = c;
      while (end + 1 < width && tiles[r][end + 1] === Tile.Spike) end += 1;
      checkHeadroom(c, end, r, 'spikes');
    }
  }

  // 4) วัตถุที่ต้องใช้ธาตุที่ผู้เล่นยังไม่มี
  for (const o of level.objects) {
    if (!rules.allowedObjects.includes(o.kind)) issues.push(`object "${o.kind}" at col ${o.col} needs an element not available here`);
  }

  // 5) ประตูทุกบานต้องมีตัวกระตุ้น
  const triggers = level.objects.filter((o) => o.kind === 'torch' || o.kind === 'windmill' || o.kind === 'plate');
  const gates = level.objects.filter((o) => o.kind === 'gate');
  linkTriggers(triggers, gates).forEach((list, i) => {
    if (list.length === 0) issues.push(`gate at col ${gates[i].col} has no trigger on its left`);
  });

  // 6) สนามบอส
  const arenaGates = level.objects.filter((o) => o.kind === 'arenaGate');
  if (level.boss && arenaGates.length !== 1) issues.push('a boss level needs exactly one arena gate (A)');
  if (level.boss && arenaGates[0] && arenaGates[0].col > level.boss.col) issues.push('arena gate must be left of the boss');

  return issues;
}
