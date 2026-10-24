import type Phaser from 'phaser';
import { fillTextureKey } from './manifest';

/**
 * texture ที่มี frame นี้: atlas จริงก่อน ถ้าไม่มีใช้ placeholder ที่เติมไว้ (PreloadScene)
 */
export function atlasTextureFor(textures: Phaser.Textures.TextureManager, atlasKey: string, frame: string): string {
  if (textures.get(atlasKey).has(frame)) return atlasKey;
  const fill = fillTextureKey(atlasKey);
  return textures.exists(fill) && textures.get(fill).has(frame) ? fill : atlasKey;
}

/** setFrame ที่ใช้ได้แม้ frame นั้นยังเป็น placeholder อยู่ใน texture แยก */
export function setAtlasFrame(sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image, atlasKey: string, frame: string): void {
  const key = atlasTextureFor(sprite.scene.textures, atlasKey, frame);
  if (sprite.texture.key === key) sprite.setFrame(frame);
  else sprite.setTexture(key, frame);
}
