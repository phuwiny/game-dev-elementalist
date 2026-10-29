import {
  type EnemyKind,
  type GridPoint,
  type LevelArt,
  LevelParseError,
  type LevelObject,
  type ObjectKind,
  type ParsedLevel,
  Tile,
} from './LevelParser';

/**
 * แปลงด่านจาก Tiled (JSON map format) เป็น ParsedLevel แบบเดียวกับด่าน ASCII
 *
 * ข้อกำหนดของไฟล์ Tiled
 * - tile ขนาด 16×16, orientation orthogonal, ไม่ใช่ infinite map
 * - tile layer ชื่อ "terrain": tile ที่มี property `collides: true` = พื้นแข็ง, `hazard: true` = หนาม,
 *   `oneWay: true` = แท่นยืนจากด้านบน
 * - tile layer ชื่อ "decor" (ไม่บังคับ): ภาพตกแต่งและผนัง ไม่ชน ไม่มีผลต่อ gameplay
 * - object layer ชื่อ "objects": ใช้ class (หรือ type ใน Tiled รุ่นเก่า) เป็นชนิดวัตถุ
 *   ตำแหน่งวัตถุอ่านจากมุมล่างซ้ายของสี่เหลี่ยม (หรือจุด) แล้วปัดเป็นช่อง
 *
 * class ที่รองรับ: player, goal, checkpoint, coin, heart, boss,
 *   moss_slime, leaf_wisp, thorn_beetle,
 *   vine, crate, ice, water, torch, seed, windmill, cracked_wall, plate, gate, arena_gate,
 *   spirit (property `slot` 0–3 = ไฟ น้ำ ลม ดิน)
 */

interface TiledProperty {
  name: string;
  type?: string;
  value: unknown;
}

interface TiledTile {
  id: number;
  properties?: TiledProperty[];
}

interface TiledTileset {
  firstgid: number;
  name?: string;
  tiles?: TiledTile[];
  tilecount?: number;
  margin?: number;
  spacing?: number;
}

interface TiledObject {
  id: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  class?: string;
  type?: string;
  name?: string;
  point?: boolean;
  properties?: TiledProperty[];
}

interface TiledLayer {
  name: string;
  type: 'tilelayer' | 'objectgroup' | string;
  width?: number;
  height?: number;
  data?: number[];
  objects?: TiledObject[];
}

export interface TiledMap {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  infinite?: boolean;
  tilesets: TiledTileset[];
  layers: TiledLayer[];
}

const OBJECT_CLASSES: Record<string, ObjectKind> = {
  vine: 'vine',
  crate: 'crate',
  ice: 'ice',
  water: 'water',
  torch: 'torch',
  seed: 'seed',
  windmill: 'windmill',
  cracked_wall: 'crackedWall',
  plate: 'plate',
  gate: 'gate',
  arena_gate: 'arenaGate',
};

const ENEMY_CLASSES: readonly EnemyKind[] = ['moss_slime', 'leaf_wisp', 'thorn_beetle'];

/** ล้างค่า gid flip flags ของ Tiled (3 บิตบน) */
const GID_MASK = 0x1fffffff;
const GID_FLIP_H = 0x80000000;

/** tile id ใน tileset (ไม่รวม firstgid และ flip flag) หรือ -1 ถ้าเป็นช่องว่าง */
export function gidToTileId(gid: number, firstgid: number): number {
  const g = gid & GID_MASK;
  return g === 0 ? -1 : g - firstgid;
}

export function isFlippedH(gid: number): boolean {
  return (gid & GID_FLIP_H) !== 0;
}

export function parseTiledMap(map: TiledMap, tileSize = 16): ParsedLevel {
  if (map.infinite) throw new LevelParseError('Infinite Tiled maps are not supported');
  if (map.tilewidth !== tileSize || map.tileheight !== tileSize) {
    throw new LevelParseError(`Tiled map must use ${tileSize}x${tileSize} tiles`);
  }

  const terrain = map.layers.find((l) => l.name === 'terrain' && l.type === 'tilelayer');
  if (!terrain?.data) throw new LevelParseError('Tiled map has no tile layer named "terrain"');
  const objectLayer = map.layers.find((l) => l.name === 'objects' && l.type === 'objectgroup');

  const tileKinds = collectTileKinds(map.tilesets);
  const tiles: Tile[][] = [];
  for (let row = 0; row < map.height; row += 1) {
    const out: Tile[] = [];
    for (let col = 0; col < map.width; col += 1) {
      const gid = (terrain.data[row * map.width + col] ?? 0) & GID_MASK;
      out.push(gid === 0 ? Tile.Empty : (tileKinds.get(gid) ?? Tile.Empty));
    }
    tiles.push(out);
  }
  const decor = map.layers.find((l) => l.name === 'decor' && l.type === 'tilelayer');

  const level: ParsedLevel = {
    width: map.width,
    height: map.height,
    tiles,
    player: { col: -1, row: -1 },
    goal: { col: -1, row: -1 },
    checkpoints: [],
    coins: [],
    hearts: [],
    enemies: [],
    objects: [],
    boss: null,
    art: collectArt(map, terrain.data, decor?.data),
  };
  let hasPlayer = false;
  let hasGoal = false;

  for (const o of objectLayer?.objects ?? []) {
    const cls = (o.class ?? o.type ?? '').trim();
    const p = anchorOf(o, tileSize);
    if (p.col < 0 || p.col >= map.width || p.row < 0 || p.row >= map.height) {
      throw new LevelParseError(`Object "${cls}" (id ${o.id}) is outside the map`);
    }
    switch (cls) {
      case 'player':
        if (hasPlayer) throw new LevelParseError('Tiled map has more than one player');
        level.player = p;
        hasPlayer = true;
        break;
      case 'goal':
        if (hasGoal) throw new LevelParseError('Tiled map has more than one goal');
        level.goal = p;
        hasGoal = true;
        break;
      case 'checkpoint':
        level.checkpoints.push(p);
        break;
      case 'coin':
        level.coins.push(p);
        break;
      case 'heart':
        level.hearts.push(p);
        break;
      case 'boss':
        if (level.boss) throw new LevelParseError('Tiled map has more than one boss');
        level.boss = p;
        break;
      case 'spirit': {
        const slot = Number(prop(o, 'slot') ?? 0);
        if (!Number.isInteger(slot) || slot < 0 || slot > 3) throw new LevelParseError(`Spirit (id ${o.id}) needs slot 0-3`);
        level.objects.push({ kind: 'spirit', ...p, slot });
        break;
      }
      default: {
        if ((ENEMY_CLASSES as readonly string[]).includes(cls)) {
          level.enemies.push({ kind: cls as EnemyKind, ...p });
          break;
        }
        const kind = OBJECT_CLASSES[cls];
        if (!kind) throw new LevelParseError(`Unknown object class "${cls}" (id ${o.id})`);
        const obj: LevelObject = { kind, ...p };
        level.objects.push(obj);
      }
    }
  }

  if (!hasPlayer) throw new LevelParseError('Tiled map has no player object');
  if (!hasGoal) throw new LevelParseError('Tiled map has no goal object');
  return level;
}

function collectTileKinds(tilesets: readonly TiledTileset[]): Map<number, Tile> {
  const kinds = new Map<number, Tile>();
  for (const ts of tilesets) {
    for (const t of ts.tiles ?? []) {
      const gid = ts.firstgid + t.id;
      if (propList(t.properties, 'hazard') === true) kinds.set(gid, Tile.Spike);
      else if (propList(t.properties, 'collides') === true) kinds.set(gid, Tile.Solid);
      else if (propList(t.properties, 'oneWay') === true) kinds.set(gid, Tile.OneWay);
    }
  }
  return kinds;
}

/** ข้อมูลสำหรับวาดด่านด้วย tileset จริง (ใช้ tileset แรกของแผนที่) */
function collectArt(map: TiledMap, terrain: readonly number[], decor: readonly number[] | undefined): LevelArt | undefined {
  const ts = map.tilesets[0];
  if (!ts?.name) return undefined;
  const grid = (data: readonly number[] | undefined): number[][] =>
    Array.from({ length: map.height }, (_, r) =>
      Array.from({ length: map.width }, (_, c) => data?.[r * map.width + c] ?? 0),
    );
  const collidingIds = (ts.tiles ?? []).filter((t) => propList(t.properties, 'collides') === true).map((t) => t.id);
  return {
    tileset: ts.name,
    firstgid: ts.firstgid,
    margin: ts.margin ?? 0,
    spacing: ts.spacing ?? 0,
    terrain: grid(terrain),
    decor: grid(decor),
    collidingIds,
  };
}

/** มุมล่างซ้ายของวัตถุเป็นช่อง (สี่เหลี่ยมใน Tiled มี y ที่ขอบบน) */
function anchorOf(o: TiledObject, tileSize: number): GridPoint {
  const h = o.point ? 0 : (o.height ?? 0);
  const bottom = o.y + h;
  return {
    col: Math.floor((o.x + 0.01) / tileSize),
    row: h > 0 ? Math.ceil(bottom / tileSize - 0.01) - 1 : Math.floor(o.y / tileSize),
  };
}

function prop(o: TiledObject, name: string): unknown {
  return propList(o.properties, name);
}

function propList(list: readonly TiledProperty[] | undefined, name: string): unknown {
  return list?.find((p) => p.name === name)?.value;
}
