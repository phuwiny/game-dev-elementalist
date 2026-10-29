import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, WORLD_SCALE } from '../config/constants';
import type { WorldBackground } from '../assets/manifest';

/** depth ต่ำกว่าทุกอย่างในด่าน (decor = -1) */
const BASE_DEPTH = -10;

/**
 * background หลายชั้นของโลก วางเต็มจอ ไม่ขยับตามกล้องโดยตรง (scrollFactor 0)
 * ภาพ 640×360 ย่อ 1/WORLD_SCALE เพื่อชดเชย zoom ของกล้องด่าน จึงแสดงเต็มจอที่ 1 pixel ภาพ = 1 pixel logical พอดี
 * แต่ละชั้นเลื่อนแนวนอนตามกล้องด้วยสัดส่วน parallax และวนซ้ำ
 */
export class ParallaxBackground {
  private readonly layers: { sprite: Phaser.GameObjects.TileSprite; parallax: number }[] = [];

  constructor(
    scene: Phaser.Scene,
    private readonly def: WorldBackground,
    private readonly camera: Phaser.Cameras.Scene2D.Camera,
  ) {
    def.layers.forEach((layer, i) => {
      if (!scene.textures.exists(layer.key)) return;
      const sprite = scene.add
        .tileSprite(camera.width / 2, camera.height / 2, GAME_WIDTH, GAME_HEIGHT, layer.key)
        .setScrollFactor(0)
        .setScale(1 / WORLD_SCALE)
        .setDepth(BASE_DEPTH + i);
      this.layers.push({ sprite, parallax: layer.parallax });
    });
  }

  get isEmpty(): boolean {
    return this.layers.length === 0;
  }

  /** สลับชั้นไกลสุดเป็นภาพของสนามบอส (on) หรือกลับเป็นภาพปกติ (off) */
  setBossArena(on: boolean): void {
    const far = this.layers[0];
    if (!far) return;
    const key = on ? this.def.bossFar.key : this.def.layers[0].key;
    if (far.sprite.scene.textures.exists(key)) far.sprite.setTexture(key);
  }

  update(): void {
    for (const { sprite, parallax } of this.layers) {
      // เลื่อนทีละ pixel ภาพเต็มหน่วย ไม่ให้ภาพสั่น
      sprite.tilePositionX = Math.round(this.camera.scrollX * WORLD_SCALE * parallax);
    }
  }
}
