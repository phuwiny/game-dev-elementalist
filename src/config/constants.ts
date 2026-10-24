/** ค่าคงที่ที่ไม่ใช่ตัวเลขปรับสมดุล (ขนาดจอ, tile, key ของ scene) */

/** ขนาดจอแบบ logical ที่ใช้จัดตำแหน่งเมนูและ HUD */
export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;
/**
 * canvas วาดจริงที่ 2 เท่าของ logical (1280×720) ภาพ Aclaire V4 แบบ density 2 จึงแสดงได้ครบทุกพิกเซล
 * เติม `?lowres` ท้าย URL เพื่อวาดที่ 640×360 (เครื่องช้า หรือ automated test ที่ใช้ software GL)
 */
export const RENDER_SCALE =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('lowres') ? 1 : 2;
/**
 * 1 pixel ในด่าน = 1.5 pixel แบบ logical: tile 16 px แสดงเท่ากับ 24 px บนจอ 640×360
 * ฉาก ศัตรู และวัตถุจึงใหญ่ขึ้น 1.5 เท่าเทียบกับ Aclaire ที่ขนาดบนจอคงเดิม
 */
export const WORLD_SCALE = 1.5;
/** zoom ของกล้องในด่านเทียบกับ canvas (3 เมื่อ canvas 1280×720) */
export const WORLD_ZOOM = WORLD_SCALE * RENDER_SCALE;
export const TILE_SIZE = 16;

export const SceneKey = {
  Boot: 'BootScene',
  Preload: 'PreloadScene',
  Title: 'TitleScene',
  WorldMap: 'WorldMapScene',
  Game: 'GameScene',
  UI: 'UIScene',
  GameOver: 'GameOverScene',
  StageClear: 'StageClearScene',
} as const;
