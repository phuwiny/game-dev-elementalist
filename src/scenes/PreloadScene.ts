import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SceneKey, TILE_SIZE } from '../config/constants';
import { ANIMATIONS_JSON, ATLASES } from '../assets/manifest';
import { createGrayboxTiles, createPlaceholderAtlas } from '../assets/placeholders';
import { registerAnimations } from '../assets/animations';
import { PALETTE, hex } from '../assets/palette';
import { REGISTRY_AVAILABLE_JSON } from './BootScene';
import { LEVELS, mapCacheKey } from '../levels';

export const GRAYBOX_TILES = 'graybox_tiles';
const ANIMATIONS_KEY = 'animations';

/**
 * โหลด asset ตาม manifest.ts
 * atlas ไหนโหลดไม่ได้ (ยังไม่มีไฟล์จาก Codex) จะสร้าง placeholder แทน
 */
export class PreloadScene extends Phaser.Scene {
  private readonly failed = new Set<string>();

  constructor() {
    super(SceneKey.Preload);
  }

  preload(): void {
    const bar = this.add.rectangle(GAME_WIDTH / 2 - 100, GAME_HEIGHT / 2, 0, 6, hex(PALETTE.magic)).setOrigin(0, 0.5);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 204, 10).setStrokeStyle(1, hex(PALETTE.neutral3));
    this.load.on(Phaser.Loader.Events.PROGRESS, (v: number) => bar.setSize(200 * v, 6));

    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      // atlas เป็น MultiFile: ชื่อ key ของไฟล์ย่อยเท่ากับ key ของ atlas
      this.failed.add(file.key);
    });

    const available = (this.registry.get(REGISTRY_AVAILABLE_JSON) as Set<string> | undefined) ?? new Set<string>();
    for (const atlas of ATLASES) {
      if (available.has(atlas.json)) this.load.atlas(atlas.key, atlas.png, atlas.json);
      else this.failed.add(atlas.key);
    }
    if (available.has(ANIMATIONS_JSON)) this.load.json(ANIMATIONS_KEY, ANIMATIONS_JSON);
    // ด่าน Tiled เป็นของฝั่งโค้ด ต้องมีเสมอ ถ้าโหลดไม่ได้ให้ error ชัด ๆ
    for (const level of LEVELS) if (level.map) this.load.json(mapCacheKey(level.key), level.map);
    else this.failed.add(ANIMATIONS_KEY);
  }

  create(): void {
    const placeholders: string[] = [];
    for (const atlas of ATLASES) {
      if (this.failed.has(atlas.key) || !this.textures.exists(atlas.key)) {
        createPlaceholderAtlas(this.textures, atlas);
        placeholders.push(atlas.key);
      }
    }
    if (placeholders.length > 0) {
      console.info(`[assets] using placeholders for: ${placeholders.join(', ')}`);
    }
    createGrayboxTiles(this.textures, GRAYBOX_TILES, TILE_SIZE);

    const overrides = this.failed.has(ANIMATIONS_KEY) ? null : this.cache.json.get(ANIMATIONS_KEY);
    registerAnimations(this, overrides);

    this.scene.start(SceneKey.Title);
  }
}
