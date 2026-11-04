import type Phaser from 'phaser';
import { animKey, frameName, spiritAtlasKey, textureScale, type SpiritKey } from './manifest';
import { atlasTextureFor } from './frames';

export type SpiritAction = 'idle' | 'cast';

/**
 * ภูตแต่ละตนอาจอยู่คนละ atlas และคนละ density (manifest.ts: spiritAtlasKey)
 * ทุกจุดที่แสดงภูตต้องผ่านฟังก์ชันในไฟล์นี้ เพื่อให้ขนาดในเกมเป็น 32×32 เท่ากันทุกตน
 * origin อยู่กึ่งกลาง frame ทั้งสอง atlas จึงสลับตัวได้โดยตำแหน่งไม่เลื่อน
 */

/** animation key ของท่านี้ของภูต */
export function spiritAnimKey(spirit: SpiritKey, action: SpiritAction): string {
  return animKey(spiritAtlasKey(spirit), `${spirit}_${action}`);
}

/** สร้าง sprite ภูตที่เล่นท่า idle อยู่ */
export function addSpiritSprite(scene: Phaser.Scene, x: number, y: number, spirit: SpiritKey): Phaser.GameObjects.Sprite {
  const atlas = spiritAtlasKey(spirit);
  const frame = frameName(`${spirit}_idle`, 0);
  const sprite = scene.add.sprite(x, y, atlasTextureFor(scene.textures, atlas, frame), frame);
  playSpirit(sprite, spirit, 'idle');
  return sprite;
}

/** เล่นท่าของภูต พร้อมตั้ง scale ตาม atlas ของตนนั้น (ใช้ตอนสลับตัวด้วย) */
export function playSpirit(sprite: Phaser.GameObjects.Sprite, spirit: SpiritKey, action: SpiritAction): void {
  sprite.setScale(textureScale(spiritAtlasKey(spirit)));
  sprite.play(spiritAnimKey(spirit, action));
}

/** icon หน้าตรงของภูต (frame `<key>_icon`) */
export function addSpiritIcon(scene: Phaser.Scene, x: number, y: number, spirit: SpiritKey): Phaser.GameObjects.Image {
  const atlas = spiritAtlasKey(spirit);
  const frame = `${spirit}_icon`;
  return scene.add.image(x, y, atlasTextureFor(scene.textures, atlas, frame), frame).setScale(textureScale(atlas));
}
