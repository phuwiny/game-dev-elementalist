/**
 * แปลงด่าน graybox แบบข้อความ (ASCII) เป็นข้อมูล tile และจุด spawn
 * ใช้ใน Phase 1–2 ก่อนเปลี่ยนไปใช้ Tiled ใน Phase 3
 *
 * สัญลักษณ์พื้นฐาน
 *   .  ว่าง           #  พื้นแข็ง        ^  หนาม (ตายทันที)
 *   P  จุดเริ่ม        G  ธงเส้นชัย       K  checkpoint
 *   c  เหรียญ         h  Heart Fruit
 *
 * ศัตรู (Phase 3)
 *   s  Moss Slime     f  Leaf Wisp (ลอยกลางอากาศ)     r  Thorn Beetle
 *   B  บอส (มุมล่างซ้ายของสนาม ชนิดบอสกำหนดใน LevelDef หรือ Tiled)
 *   A  ประตูสนามบอส 2×3 (เปิดอยู่ ปิดเมื่อเริ่มสู้บอส)
 *
 * วัตถุ puzzle (Phase 2) ช่องที่มีสัญลักษณ์คือมุม "ล่างซ้าย" ของวัตถุ
 * ช่องอื่นที่วัตถุทับต้องเป็น '.'
 *   v  เถาวัลย์ 1×1 (เผาได้)          b  ลังไม้ 1×1 (เผาได้)
 *   i  ก้อนน้ำแข็ง 1×1 (ละลายได้)      ~  ผิวน้ำ 1×1 (แช่แข็งได้)
 *   t  คบเพลิง 1×2                    w  เมล็ดวิเศษ 1×1 (รดน้ำแล้วโต)
 *   m  กังหันลม 3×3                   X  กำแพงร้าว 2×2 (ทุบด้วยดิน)
 *   _  แผ่นกด 2×1                     D  ประตู 2×3
 *   1–4  ภูต (1 ไฟ, 2 น้ำ, 3 ลม, 4 ดิน)
 * ช่องที่มี spawn หรือวัตถุถือว่าเป็นช่องว่างในชั้น tile
 */

export enum Tile {
  Empty = 0,
  Solid = 1,
  Spike = 2,
}

export interface GridPoint {
  col: number;
  row: number;
}

export type ObjectKind =
  | 'vine'
  | 'crate'
  | 'ice'
  | 'water'
  | 'torch'
  | 'seed'
  | 'windmill'
  | 'crackedWall'
  | 'plate'
  | 'gate'
  | 'arenaGate'
  | 'spirit';

export type EnemyKind = 'moss_slime' | 'leaf_wisp' | 'thorn_beetle';

export interface EnemySpawn extends GridPoint {
  kind: EnemyKind;
}

export interface LevelObject extends GridPoint {
  kind: ObjectKind;
  /** ภูต: ช่อง 0–3 ตามลำดับ ไฟ น้ำ ลม ดิน */
  slot?: number;
}

export interface ParsedLevel {
  width: number;
  height: number;
  /** tiles[row][col] */
  tiles: Tile[][];
  player: GridPoint;
  goal: GridPoint;
  checkpoints: GridPoint[];
  coins: GridPoint[];
  hearts: GridPoint[];
  enemies: EnemySpawn[];
  objects: LevelObject[];
  /** จุดวางบอส (มุมล่างซ้าย) ถ้าด่านมีบอส */
  boss: GridPoint | null;
}

export class LevelParseError extends Error {}

const OBJECT_SYMBOLS: Record<string, ObjectKind> = {
  v: 'vine',
  b: 'crate',
  i: 'ice',
  '~': 'water',
  t: 'torch',
  w: 'seed',
  m: 'windmill',
  X: 'crackedWall',
  _: 'plate',
  D: 'gate',
  A: 'arenaGate',
};

const ENEMY_SYMBOLS: Record<string, EnemyKind> = {
  s: 'moss_slime',
  f: 'leaf_wisp',
  r: 'thorn_beetle',
};

/** ขนาดวัตถุเป็นช่อง [กว้าง, สูง] */
export const OBJECT_SIZE: Record<ObjectKind, readonly [number, number]> = {
  vine: [1, 1],
  crate: [1, 1],
  ice: [1, 1],
  water: [1, 1],
  torch: [1, 2],
  seed: [1, 1],
  windmill: [3, 3],
  crackedWall: [2, 2],
  plate: [2, 1],
  gate: [2, 3],
  arenaGate: [2, 3],
  spirit: [1, 1],
};

export function parseLevel(lines: readonly string[]): ParsedLevel {
  if (lines.length === 0) throw new LevelParseError('Level has no rows');
  const width = lines[0].length;
  if (width === 0) throw new LevelParseError('Level has no columns');

  const tiles: Tile[][] = [];
  const checkpoints: GridPoint[] = [];
  const coins: GridPoint[] = [];
  const hearts: GridPoint[] = [];
  const enemies: EnemySpawn[] = [];
  const objects: LevelObject[] = [];
  let player: GridPoint | null = null;
  let goal: GridPoint | null = null;
  let boss: GridPoint | null = null;

  lines.forEach((line, row) => {
    if (line.length !== width) {
      throw new LevelParseError(`Row ${row} has ${line.length} columns, expected ${width}`);
    }
    const tileRow: Tile[] = [];
    for (let col = 0; col < width; col += 1) {
      const ch = line[col];
      const point = { col, row };
      let tile = Tile.Empty;
      const objectKind = OBJECT_SYMBOLS[ch];
      const enemyKind = ENEMY_SYMBOLS[ch];
      if (enemyKind) {
        enemies.push({ kind: enemyKind, col, row });
      } else if (objectKind) {
        objects.push({ kind: objectKind, col, row });
      } else if (ch >= '1' && ch <= '4') {
        objects.push({ kind: 'spirit', col, row, slot: Number(ch) - 1 });
      } else {
        switch (ch) {
          case '.':
            break;
          case '#':
            tile = Tile.Solid;
            break;
          case '^':
            tile = Tile.Spike;
            break;
          case 'P':
            if (player) throw new LevelParseError('Level has more than one player start (P)');
            player = point;
            break;
          case 'G':
            if (goal) throw new LevelParseError('Level has more than one goal (G)');
            goal = point;
            break;
          case 'K':
            checkpoints.push(point);
            break;
          case 'c':
            coins.push(point);
            break;
          case 'h':
            hearts.push(point);
            break;
          case 'B':
            if (boss) throw new LevelParseError('Level has more than one boss (B)');
            boss = point;
            break;
          default:
            throw new LevelParseError(`Unknown symbol "${ch}" at row ${row}, col ${col}`);
        }
      }
      tileRow.push(tile);
    }
    tiles.push(tileRow);
  });

  if (!player) throw new LevelParseError('Level has no player start (P)');
  if (!goal) throw new LevelParseError('Level has no goal (G)');

  const level: ParsedLevel = {
    width,
    height: lines.length,
    tiles,
    player,
    goal,
    checkpoints,
    coins,
    hearts,
    enemies,
    objects,
    boss,
  };
  validateObjectFootprints(level, lines);
  return level;
}

/** วัตถุหลายช่องต้องอยู่ในด่าน และช่องที่ทับต้องว่าง */
export function validateObjectFootprints(level: ParsedLevel, lines: readonly string[]): void {
  for (const o of level.objects) {
    const [w, h] = OBJECT_SIZE[o.kind];
    for (let dy = 0; dy < h; dy += 1) {
      for (let dx = 0; dx < w; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const col = o.col + dx;
        const row = o.row - dy;
        if (col >= level.width || row < 0) {
          throw new LevelParseError(`${o.kind} at row ${o.row}, col ${o.col} goes outside the level`);
        }
        if (lines[row][col] !== '.') {
          throw new LevelParseError(
            `${o.kind} at row ${o.row}, col ${o.col} overlaps "${lines[row][col]}" at row ${row}, col ${col}`,
          );
        }
      }
    }
  }
}
