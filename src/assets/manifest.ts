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
  /** ขนาด frame เป็น pixel ของไฟล์ภาพ (physical) */
  frameWidth: number;
  frameHeight: number;
  /**
   * pixel ของไฟล์ภาพต่อ 1 pixel ในเกม (ค่าเริ่มต้น 1)
   * player V4 ใช้ 2: ภาพ 96×128 แสดงในเกมเป็น 48×64 (ART_HANDOFF.md หัวข้อ 5.1)
   */
  density?: number;
  anims: AnimDef[];
  /** frame เดี่ยวที่ไม่ใช่ animation ชื่อ frame ตามที่เขียน (ไม่มีเลขต่อท้าย) */
  stills?: { name: string; width?: number; height?: number }[];
}

export const ANIMATIONS_JSON = 'assets/animations.json';

/**
 * tileset ของด่าน Tiled: key ตรงกับ name ใน .tsx / แผนที่ (LevelArt.tileset)
 * margin และ spacing อ่านจากแผนที่ ไม่ต้องประกาศที่นี่
 */
export interface TilesetDef {
  key: string;
  png: string;
}

export const TILESETS: readonly TilesetDef[] = [
  { key: 'tiles_w1_ember_woods', png: 'assets/tilesets/tiles_w1_ember_woods.png' },
];

/** ชั้น background 640×360 วนซ้ำแนวนอน (ART_HANDOFF.md) */
export interface BackgroundDef {
  key: string;
  png: string;
}

export interface WorldBackground {
  /** ชั้นไกลสุดไปใกล้สุด พร้อมสัดส่วนที่เลื่อนตามกล้อง (0 = นิ่ง, 1 = เท่ากล้อง) */
  layers: readonly (BackgroundDef & { parallax: number })[];
  /** ชั้นไกลสุดที่ใช้แทนในสนามบอส */
  bossFar: BackgroundDef;
}

const bg = (key: string): BackgroundDef => ({ key, png: `assets/backgrounds/w1/${key}.png` });

export const WORLD1_BACKGROUND: WorldBackground = {
  layers: [
    { ...bg('bg_w1_far'), parallax: 0.1 },
    { ...bg('bg_w1_mid'), parallax: 0.3 },
    { ...bg('bg_w1_near'), parallax: 0.6 },
  ],
  bossFar: bg('bg_w1_boss_far'),
};

/** background ของด่านที่ใช้ tileset นี้ */
export function backgroundForTileset(tileset: string): WorldBackground | null {
  return tileset === 'tiles_w1_ember_woods' ? WORLD1_BACKGROUND : null;
}

/** texture ที่เก็บ placeholder ของ frame ที่ไฟล์จริงยังไม่มี (atlas ส่งมาไม่ครบทุกท่า) */
export const fillTextureKey = (atlasKey: string): string => `${atlasKey}__fill`;

/** scale ที่ต้องตั้งให้ sprite ของ atlas นี้ เพื่อให้ขนาดในเกมเป็น logical pixel */
export function textureScale(atlasKey: string): number {
  const atlas = ATLASES.find((a) => a.key === atlasKey);
  return 1 / (atlas?.density ?? 1);
}

/** ชื่อภูตที่ใช้เป็น prefix ของ frame ใน atlas spirits (ลำดับ ไฟ น้ำ ลม ดิน) */
export const SPIRIT_KEYS = ['burnil', 'wata', 'valvaliz', 'eathy'] as const;
/** ชื่อธาตุที่ใช้ในชื่อ frame (ตรงกับค่าของ ElementType) */
export const ELEMENT_KEYS = ['fire', 'water', 'wind', 'earth'] as const;

const sprite = (dir: string, key: string) => ({
  key,
  png: `assets/sprites/${dir}/${key}.png`,
  json: `assets/sprites/${dir}/${key}.json`,
});

export const ATLASES: AtlasDef[] = [
  {
    ...sprite('player', 'player'),
    // Aclaire V4: 48×64 logical (run 64×64, attack 96×64) วาดที่ density 2
    frameWidth: 96,
    frameHeight: 128,
    density: 2,
    anims: [
      { name: 'idle', frames: 6, frameRate: 8, repeat: -1 },
      { name: 'run', frames: 4, frameRate: 8, repeat: -1, width: 128 },
      { name: 'jump_up', frames: 2, frameRate: 10, repeat: 0 },
      { name: 'jump_peak', frames: 2, frameRate: 10, repeat: 0 },
      { name: 'fall', frames: 2, frameRate: 10, repeat: -1 },
      { name: 'land', frames: 2, frameRate: 14, repeat: 0 },
      { name: 'double_jump', frames: 4, frameRate: 14, repeat: 0 },
      { name: 'cast', frames: 4, frameRate: 12, repeat: 0 },
      { name: 'dash', frames: 3, frameRate: 16, repeat: 0 },
      { name: 'glide', frames: 4, frameRate: 10, repeat: -1 },
      { name: 'ground_slam', frames: 5, frameRate: 14, repeat: 0 },
      { name: 'attack_1', frames: 4, frameRate: 16, repeat: 0, width: 192 },
      { name: 'attack_2', frames: 4, frameRate: 16, repeat: 0, width: 192 },
      { name: 'attack_3', frames: 5, frameRate: 16, repeat: 0, width: 192 },
      { name: 'hurt', frames: 2, frameRate: 10, repeat: 0 },
      { name: 'dead', frames: 6, frameRate: 10, repeat: 0 },
    ],
  },
  {
    ...sprite('spirits', 'spirits'),
    frameWidth: 32,
    frameHeight: 32,
    anims: SPIRIT_KEYS.flatMap((k) => [
      { name: `${k}_idle`, frames: 6, frameRate: 8, repeat: -1 },
      { name: `${k}_cast`, frames: 4, frameRate: 12, repeat: 0 },
    ]),
    stills: SPIRIT_KEYS.map((k) => ({ name: `${k}_icon` })),
  },
  {
    ...sprite('objects', 'objects'),
    frameWidth: 16,
    frameHeight: 16,
    anims: [
      { name: 'burnable_vine_idle', frames: 1, frameRate: 1, repeat: 0 },
      { name: 'burnable_vine_burn', frames: 6, frameRate: 12, repeat: 0 },
      { name: 'wooden_crate_idle', frames: 1, frameRate: 1, repeat: 0 },
      { name: 'wooden_crate_burn', frames: 6, frameRate: 12, repeat: 0 },
      { name: 'torch_unlit', frames: 1, frameRate: 1, repeat: 0, height: 32 },
      { name: 'torch_lit', frames: 4, frameRate: 10, repeat: -1, height: 32 },
      { name: 'ice_block_idle', frames: 1, frameRate: 1, repeat: 0 },
      { name: 'ice_block_melt', frames: 5, frameRate: 12, repeat: 0 },
      { name: 'water_surface_water', frames: 4, frameRate: 6, repeat: -1 },
      { name: 'water_surface_frozen', frames: 1, frameRate: 1, repeat: 0 },
      { name: 'magic_seed_seed', frames: 1, frameRate: 1, repeat: 0, height: 64 },
      { name: 'magic_seed_grow', frames: 8, frameRate: 12, repeat: 0, height: 64 },
      { name: 'magic_seed_grown', frames: 1, frameRate: 1, repeat: 0, height: 64 },
      { name: 'windmill_idle', frames: 1, frameRate: 1, repeat: 0, width: 48, height: 48 },
      { name: 'windmill_spin', frames: 8, frameRate: 14, repeat: -1, width: 48, height: 48 },
      { name: 'cracked_wall_idle', frames: 1, frameRate: 1, repeat: 0, width: 32, height: 32 },
      { name: 'cracked_wall_break', frames: 6, frameRate: 14, repeat: 0, width: 32, height: 32 },
      { name: 'pressure_plate_up', frames: 1, frameRate: 1, repeat: 0, width: 32, height: 8 },
      { name: 'pressure_plate_down', frames: 1, frameRate: 1, repeat: 0, width: 32, height: 8 },
      { name: 'gate_door_closed', frames: 1, frameRate: 1, repeat: 0, width: 32, height: 48 },
      { name: 'gate_door_open', frames: 6, frameRate: 12, repeat: 0, width: 32, height: 48 },
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
      { name: 'leaf_wisp_fly', frames: 6, frameRate: 10, repeat: -1 },
      { name: 'leaf_wisp_dive', frames: 3, frameRate: 12, repeat: -1 },
      { name: 'leaf_wisp_hurt', frames: 2, frameRate: 10, repeat: 0 },
      { name: 'leaf_wisp_death', frames: 5, frameRate: 12, repeat: 0 },
      { name: 'thorn_beetle_walk', frames: 6, frameRate: 8, repeat: -1 },
      { name: 'thorn_beetle_flipped', frames: 4, frameRate: 8, repeat: -1 },
      { name: 'thorn_beetle_hurt', frames: 2, frameRate: 10, repeat: 0 },
      { name: 'thorn_beetle_death', frames: 6, frameRate: 12, repeat: 0 },
    ],
  },
  {
    ...sprite('bosses', 'boss_bramble_king'),
    frameWidth: 192,
    frameHeight: 192,
    anims: [
      { name: 'idle', frames: 6, frameRate: 6, repeat: -1 },
      { name: 'vine_attack', frames: 8, frameRate: 12, repeat: 0 },
      { name: 'roar', frames: 6, frameRate: 8, repeat: 0 },
      { name: 'weak_exposed', frames: 4, frameRate: 8, repeat: -1 },
      { name: 'hurt', frames: 2, frameRate: 10, repeat: 0 },
      { name: 'death', frames: 10, frameRate: 10, repeat: 0 },
      { name: 'vine_whip', frames: 6, frameRate: 12, repeat: -1, width: 64, height: 16 },
      { name: 'vine_shield_idle', frames: 1, frameRate: 1, repeat: 0, width: 32, height: 32 },
      { name: 'vine_shield_burn', frames: 6, frameRate: 12, repeat: 0, width: 32, height: 32 },
      { name: 'thorn_seed', frames: 2, frameRate: 8, repeat: -1, width: 16, height: 16 },
    ],
  },
  {
    ...sprite('items', 'items'),
    frameWidth: 16,
    frameHeight: 16,
    anims: [
      { name: 'coin_spin', frames: 6, frameRate: 10, repeat: -1, width: 12, height: 12 },
      { name: 'heart_fruit_bob', frames: 4, frameRate: 6, repeat: -1 },
      { name: 'spirit_shard_shine', frames: 6, frameRate: 10, repeat: -1 },
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
      { name: 'fireball', frames: 4, frameRate: 12, repeat: -1, width: 16, height: 16 },
      { name: 'fire_burst', frames: 6, frameRate: 16, repeat: 0 },
      { name: 'burn_status', frames: 4, frameRate: 10, repeat: -1, width: 16, height: 16 },
      { name: 'water_bubble', frames: 4, frameRate: 10, repeat: -1, width: 16, height: 16 },
      { name: 'water_splash', frames: 5, frameRate: 16, repeat: 0 },
      { name: 'freeze_overlay', frames: 1, frameRate: 1, repeat: 0 },
      { name: 'freeze_shatter', frames: 5, frameRate: 16, repeat: 0 },
      { name: 'wind_wave', frames: 5, frameRate: 16, repeat: 0 },
      { name: 'dash_trail', frames: 3, frameRate: 16, repeat: 0, height: 48 },
      { name: 'ground_slam_wave', frames: 6, frameRate: 16, repeat: 0, width: 64 },
      { name: 'stone_shield_appear', frames: 4, frameRate: 16, repeat: 0, width: 16 },
      { name: 'stone_shield_idle', frames: 1, frameRate: 1, repeat: 0, width: 16 },
      { name: 'stone_shield_break', frames: 4, frameRate: 14, repeat: 0, width: 16 },
      { name: 'earth_block_appear', frames: 4, frameRate: 16, repeat: 0 },
      { name: 'earth_block_idle', frames: 1, frameRate: 1, repeat: 0 },
      { name: 'earth_block_crumble', frames: 4, frameRate: 14, repeat: 0 },
      ...ELEMENT_KEYS.map((el) => ({
        name: `element_switch_aura_${el}`,
        frames: 5,
        frameRate: 16,
        repeat: 0,
        height: 48,
      })),
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
      { name: 'boss_bar_frame', width: 240, height: 12 },
      { name: 'boss_bar_fill', width: 236, height: 8 },
      { name: 'world_map_node_locked' },
      { name: 'world_map_node_open' },
      { name: 'world_map_node_cleared' },
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
