import type Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../assets/palette';
import { saveStatus } from '../core/SaveStatus';
import { textStyle } from './text';

export const SAVE_WARNING_TEXT = '! Cannot save progress';

/**
 * ข้อความเตือนกลางจอด้านบน แสดงตราบใดที่บันทึกไม่ได้ (GDD หัวข้อ 8)
 * เรียกใน create() ของ scene ที่ใช้กล้อง UI พิกัด logical 640×360
 */
export function addSaveWarning(scene: Phaser.Scene): Phaser.GameObjects.Text {
  const text = scene.add
    .text(GAME_WIDTH / 2, 4, SAVE_WARNING_TEXT, textStyle(10, PALETTE.gold))
    .setOrigin(0.5, 0)
    .setDepth(1000)
    .setVisible(saveStatus.failed);
  const off = saveStatus.subscribe((failed) => text.setVisible(failed));
  scene.events.once('shutdown', off);
  return text;
}
