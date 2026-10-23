import { ElementType } from '../core/Element';
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

/** ด่านโหมดผจญภัยตามลำดับ (ปลดล็อกทีละด่าน) */
export const ADVENTURE_LEVELS: readonly LevelDef[] = [
  { key: 'w1_1', name: '1-1 Ember Trail', map: 'assets/maps/w1_1.json' },
  { key: 'w1_2', name: '1-2 Burning Canopy', map: 'assets/maps/w1_2.json', startSpirits: [ElementType.Fire] },
  {
    key: 'w1_3',
    name: '1-3 Bramble Hollow',
    map: 'assets/maps/w1_3.json',
    startSpirits: [ElementType.Fire],
    boss: 'bramble_king',
  },
];

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
