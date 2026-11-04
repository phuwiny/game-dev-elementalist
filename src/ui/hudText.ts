import Phaser from 'phaser';
import { HUD_FONT } from '../assets/manifest';
import { PALETTE, hex } from '../assets/palette';
import { textStyle } from './text';

export type HudText = Phaser.GameObjects.BitmapText | Phaser.GameObjects.Text;

/** ความสูงของช่องตัวอักษรใน font_hud (pixel ของไฟล์ภาพ) */
const CELL = 8;

/** font_hud มีแต่ตัวพิมพ์ใหญ่: แปลงข้อความให้ตรงกับตัวอักษรที่มี */
export function hudString(text: string): string {
  return text.toUpperCase();
}

/**
 * ข้อความตัวเลขและคำสั้นๆ ของ HUD ด้วย bitmap font ของ Codex
 * - scale คือจำนวนเท่าของ pixel font (HUD ใช้ 2 = ช่องสูง 16 logical px, ในด่านใช้ 1 = 8 px ในด่าน)
 * - สีใช้ tint ทับตัวอักษรสีครีม พร้อมเงาสี outline 1 px ให้อ่านออกบนฉากหลัง
 * - ถ้า font โหลดไม่ได้ใช้ข้อความ font ระบบขนาดใกล้กันแทน
 */
export function addHudText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color: string = PALETTE.highlight,
  scale = 2,
): HudText {
  if (scene.cache.bitmapFont.exists(HUD_FONT.key)) {
    return scene.add
      .bitmapText(x, y, HUD_FONT.key, hudString(text), CELL)
      .setScale(scale)
      .setTint(hex(color))
      .setDropShadow(1, 1, hex(PALETTE.outline), 1);
  }
  return scene.add.text(x, y, text, { ...textStyle(Math.round(CELL * scale * 0.75), color) });
}

/** เปลี่ยนข้อความโดยแปลงตัวอักษรให้ตรงกับ font */
export function setHudText(t: HudText, text: string): HudText {
  return t instanceof Phaser.GameObjects.BitmapText ? t.setText(hudString(text)) : t.setText(text);
}
