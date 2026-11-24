import { ElementType } from '../core/Element';
import { type LintRules, SINGLE_JUMP_RULES, WATER_WORLD_RULES } from '../core/LevelLint';
import { PALETTE } from '../assets/palette';
import type { MusicName } from '../assets/scores';
import { GRAYBOX_LEVEL } from './graybox';
import { LAB_LEVEL } from './lab';

export interface LevelDef {
  key: string;
  name: string;
  /** ด่าน ASCII (ด่านทดสอบ) */
  rows?: readonly string[];
  /** path ของ Tiled JSON ใต้ public/ (ด่านจริง) */
  map?: string;
  /** ภูตที่มีตั้งแต่เริ่มด่าน (ตามลำดับโลกใน GDD) */
  startSpirits?: readonly ElementType[];
  /** ชนิดบอสถ้าด่านมีบอส */
  boss?: 'bramble_king';
}

/** โลกหนึ่งโลกในโหมดผจญภัย (GDD หัวข้อ 6) */
export interface WorldDef {
  /** เลขโลก 1–5 */
  id: number;
  name: string;
  /** เพลงของด่านในโลกนี้ */
  music: MusicName;
  /** กฎ LevelLint ของด่านในโลกนี้ (ตามธาตุที่ผู้เล่นมีและการเคลื่อนที่ที่ทำได้) */
  lint: LintRules;
  /** สีพื้นของหน้า World Map */
  mapColor: string;
  levels: readonly LevelDef[];
}

/** โลกตามลำดับ ด่านในแต่ละโลกปลดล็อกทีละด่านต่อเนื่องข้ามโลก */
export const WORLDS: readonly WorldDef[] = [
  {
    id: 1,
    name: 'Ember Woods',
    music: 'world1',
    lint: SINGLE_JUMP_RULES,
    mapColor: PALETTE.foliage1,
    levels: [
      { key: 'w1_1', name: '1-1 Ember Trail', map: 'assets/maps/w1_1.json' },
      { key: 'w1_2', name: '1-2 Burning Canopy', map: 'assets/maps/w1_2.json', startSpirits: [ElementType.Fire] },
      {
        key: 'w1_3',
        name: '1-3 Bramble Hollow',
        map: 'assets/maps/w1_3.json',
        startSpirits: [ElementType.Fire],
        boss: 'bramble_king',
      },
    ],
  },
  {
    id: 2,
    name: 'Tidal Caverns',
    // ยังไม่มีแทร็กของโลก 2 และยังไม่มีด่าน: World Map แสดงเป็น "Coming soon"
    music: 'world1',
    lint: WATER_WORLD_RULES,
    mapColor: PALETTE.water1,
    levels: [],
  },
];

/** ด่านโหมดผจญภัยตามลำดับ (ปลดล็อกทีละด่าน) */
export const ADVENTURE_LEVELS: readonly LevelDef[] = WORLDS.flatMap((w) => w.levels);

/** ด่านทดสอบระหว่างพัฒนา */
export const DEV_LEVELS: readonly LevelDef[] = [
  { key: 'lab', name: 'Elements Lab (Phase 2)', rows: LAB_LEVEL },
  { key: 'graybox', name: 'Graybox (Phase 1)', rows: GRAYBOX_LEVEL },
];

export const LEVELS: readonly LevelDef[] = [...ADVENTURE_LEVELS, ...DEV_LEVELS];

/** key ของ Tiled JSON ใน cache.json (PreloadScene โหลดไว้) */
export const mapCacheKey = (levelKey: string): string => `map:${levelKey}`;

export const ADVENTURE_ORDER: readonly string[] = ADVENTURE_LEVELS.map((l) => l.key);

export function findLevel(key: string | undefined): LevelDef {
  return LEVELS.find((l) => l.key === key) ?? ADVENTURE_LEVELS[0];
}

export function isAdventure(key: string): boolean {
  return ADVENTURE_ORDER.includes(key);
}

/** ด่านถัดไปในโหมดผจญภัย หรือ null ถ้าเป็นด่านสุดท้าย */
export function nextAdventureLevel(key: string): string | null {
  const i = ADVENTURE_ORDER.indexOf(key);
  return i >= 0 && i < ADVENTURE_ORDER.length - 1 ? ADVENTURE_ORDER[i + 1] : null;
}

/** โลกของด่านนี้ หรือ undefined ถ้าเป็นด่านทดสอบ */
export function worldOfLevel(key: string): WorldDef | undefined {
  return WORLDS.find((w) => w.levels.some((l) => l.key === key));
}

/** เพลงของด่าน (ด่านทดสอบใช้เพลงโลก 1) */
export function levelMusic(key: string): MusicName {
  return worldOfLevel(key)?.music ?? 'world1';
}
