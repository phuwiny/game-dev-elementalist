/** ค่าคงที่ที่ไม่ใช่ตัวเลขปรับสมดุล (ขนาดจอ, tile, key ของ scene) */

export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;
export const TILE_SIZE = 16;

export const SceneKey = {
  Boot: 'BootScene',
  Preload: 'PreloadScene',
  Title: 'TitleScene',
  Game: 'GameScene',
  UI: 'UIScene',
  GameOver: 'GameOverScene',
  StageClear: 'StageClearScene',
} as const;

/** ชื่อ event ที่ GameScene ส่งให้ UIScene */
export const GameEvent = {
  StatsChanged: 'stats-changed',
  Paused: 'paused',
  Resumed: 'resumed',
} as const;
