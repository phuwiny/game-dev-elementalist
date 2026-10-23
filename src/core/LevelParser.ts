/**
 * แปลงด่าน graybox แบบข้อความ (ASCII) เป็นข้อมูล tile และจุด spawn
 * ใช้ใน Phase 1 ก่อนเปลี่ยนไปใช้ Tiled ใน Phase 3
 *
 * สัญลักษณ์
 *   .  ว่าง           #  พื้นแข็ง        ^  หนาม (ตายทันที)
 *   P  จุดเริ่ม        G  ธงเส้นชัย       K  checkpoint
 *   c  เหรียญ         h  Heart Fruit     s  Moss Slime
 * ช่องที่มี spawn ถือว่าเป็นช่องว่างในชั้น tile
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
  slimes: GridPoint[];
}

export class LevelParseError extends Error {}

export function parseLevel(lines: readonly string[]): ParsedLevel {
  if (lines.length === 0) throw new LevelParseError('Level has no rows');
  const width = lines[0].length;
  if (width === 0) throw new LevelParseError('Level has no columns');

  const tiles: Tile[][] = [];
  const checkpoints: GridPoint[] = [];
  const coins: GridPoint[] = [];
  const hearts: GridPoint[] = [];
  const slimes: GridPoint[] = [];
  let player: GridPoint | null = null;
  let goal: GridPoint | null = null;

  lines.forEach((line, row) => {
    if (line.length !== width) {
      throw new LevelParseError(`Row ${row} has ${line.length} columns, expected ${width}`);
    }
    const tileRow: Tile[] = [];
    for (let col = 0; col < width; col += 1) {
      const ch = line[col];
      const point = { col, row };
      let tile = Tile.Empty;
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
        case 's':
          slimes.push(point);
          break;
        default:
          throw new LevelParseError(`Unknown symbol "${ch}" at row ${row}, col ${col}`);
      }
      tileRow.push(tile);
    }
    tiles.push(tileRow);
  });

  if (!player) throw new LevelParseError('Level has no player start (P)');
  if (!goal) throw new LevelParseError('Level has no goal (G)');

  return { width, height: lines.length, tiles, player, goal, checkpoints, coins, hearts, slimes };
}
