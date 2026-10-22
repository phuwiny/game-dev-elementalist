/**
 * สัญญาระหว่างโค้ดกับ asset (ART_HANDOFF.md หัวข้อ 3–7)
 *
 * - path, key ของ atlas และชื่อ frame ทั้งหมดประกาศที่ไฟล์นี้ที่เดียว
 * - ถ้าไฟล์จริงยังไม่มี PreloadScene จะสร้าง placeholder ตามขนาดและชื่อ frame ที่นี่
 * - ถ้ามี public/assets/animations.json ค่าในไฟล์นั้น (frames, frameRate, repeat) จะทับค่าที่นี่
 *
 * Phase 1 ประกาศเฉพาะ atlas ที่เกมใช้แล้ว เพิ่มรายการเมื่อระบบใหม่ต้องใช้
 */

export interface AnimDef {
  /** ชื่อ animation ภายใน atlas เช่น 'run', 'moss_slime_move' */
  name: string;
  frames: number;
  frameRate: number;
  /** -1 = loop, 0 = เล่นครั้งเดียว */
  repeat: number;
  /** ขนาด frame ถ้าต่างจากค่าเริ่มต้นของ atlas */
  width?: number;
  height?: number;
}

export interface AtlasDef {
  key: string;
  png: string;
  json: string;
  frameWidth: number;
  frameHeight: number;
  anims: AnimDef[];
  /** frame เดี่ยวที่ไม่ใช่ animation ชื่อ frame ตามที่เขียน (ไม่มีเลขต่อท้าย) */
  stills?: { name: string; width?: number; height?: number }[];
}

export const ANIMATIONS_JSON = 'assets/animations.json';

const sprite = (dir: string, key: string) => ({
  key,
  png: `assets/sprites/${dir}/${key}.png`,
  json: `assets/sprites/${dir}/${key}.json`,
});

export const ATLASES: AtlasDef[] = [
  {
    ...sprite('player', 'player'),
    frameWidth: 32,
    frameHeight: 48,
    anims: [
      { name: 'idle', frames: 6, frameRate: 8, repeat: -1 },
      { name: 'run', frames: 8, frameRate: 12, repeat: -1 },
      { name: 'jump_up', frames: 2, frameRate: 10, repeat: 0 },
      { name: 'jump_peak', frames: 2, frameRate: 10, repeat: 0 },
      { name: 'fall', frames: 2, frameRate: 10, repeat: -1 },
      { name: 'land', frames: 2, frameRate: 14, repeat: 0 },
      { name: 'attack_1', frames: 4, frameRate: 16, repeat: 0, width: 64 },
      { name: 'attack_2', frames: 4, frameRate: 16, repeat: 0, width: 64 },
      { name: 'attack_3', frames: 5, frameRate: 16, repeat: 0, width: 64 },
      { name: 'hurt', frames: 2, frameRate: 10, repeat: 0 },
      { name: 'dead', frames: 6, frameRate: 10, repeat: 0 },
    ],
  },
  {
    ...sprite('enemies', 'enemies_w1'),
    frameWidth: 32,
    frameHeight: 32,
    anims: [
      { name: 'moss_slime_idle', frames: 4, frameRate: 6, repeat: -1 },
      { name: 'moss_slime_move', frames: 6, frameRate: 8, repeat: -1 },
      { name: 'moss_slime_hurt', frames: 2, frameRate: 10, repeat: 0 },
      { name: 'moss_slime_death', frames: 5, frameRate: 12, repeat: 0 },
    ],
  },
  {
    ...sprite('items', 'items'),
    frameWidth: 16,
    frameHeight: 16,
    anims: [
      { name: 'coin_spin', frames: 6, frameRate: 10, repeat: -1, width: 12, height: 12 },
      { name: 'heart_fruit_bob', frames: 4, frameRate: 6, repeat: -1 },
      { name: 'checkpoint_shrine_unlit', frames: 1, frameRate: 1, repeat: 0, width: 32, height: 48 },
      { name: 'checkpoint_shrine_lighting', frames: 6, frameRate: 12, repeat: 0, width: 32, height: 48 },
      { name: 'checkpoint_shrine_lit', frames: 4, frameRate: 8, repeat: -1, width: 32, height: 48 },
      { name: 'goal_flag_wave', frames: 6, frameRate: 8, repeat: -1, width: 32, height: 64 },
    ],
  },
  {
    ...sprite('fx', 'fx'),
    frameWidth: 32,
    frameHeight: 32,
    anims: [
      { name: 'slash_1', frames: 3, frameRate: 20, repeat: 0 },
      { name: 'slash_2', frames: 3, frameRate: 20, repeat: 0 },
      { name: 'slash_3', frames: 3, frameRate: 20, repeat: 0 },
      { name: 'hit_spark', frames: 4, frameRate: 20, repeat: 0, width: 16, height: 16 },
      { name: 'poof', frames: 6, frameRate: 16, repeat: 0 },
    ],
  },
  {
    key: 'ui',
    png: 'assets/ui/ui.png',
    json: 'assets/ui/ui.json',
    frameWidth: 16,
    frameHeight: 16,
    anims: [],
    stills: [
      { name: 'heart_full' },
      { name: 'heart_empty' },
      { name: 'energy_bar_frame', width: 96, height: 12 },
      { name: 'energy_bar_fill_normal', width: 92, height: 8 },
      { name: 'energy_bar_fill_flash', width: 92, height: 8 },
      { name: 'element_icon_fire_normal', width: 24, height: 24 },
      { name: 'element_icon_fire_locked', width: 24, height: 24 },
      { name: 'element_icon_water_normal', width: 24, height: 24 },
      { name: 'element_icon_water_locked', width: 24, height: 24 },
      { name: 'element_icon_wind_normal', width: 24, height: 24 },
      { name: 'element_icon_wind_locked', width: 24, height: 24 },
      { name: 'element_icon_earth_normal', width: 24, height: 24 },
      { name: 'element_icon_earth_locked', width: 24, height: 24 },
      { name: 'element_slot_select', width: 28, height: 28 },
      { name: 'lives_icon' },
      { name: 'coin_icon', width: 12, height: 12 },
    ],
  },
];

/** ชื่อ frame ตาม ART_HANDOFF.md หัวข้อ 3.6: <anim>_<NNN> */
export function frameName(anim: string, index: number): string {
  return `${anim}_${String(index).padStart(3, '0')}`;
}

/** Animation key ที่ใช้ในเกม: <atlas>_<anim> */
export function animKey(atlas: string, anim: string): string {
  return `${atlas}_${anim}`;
}

export function findAtlas(key: string): AtlasDef {
  const atlas = ATLASES.find((a) => a.key === key);
  if (!atlas) throw new Error(`Unknown atlas "${key}"`);
  return atlas;
}
