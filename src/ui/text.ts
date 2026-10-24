import type Phaser from 'phaser';
import { PALETTE } from '../assets/palette';

/**
 * สไตล์ข้อความชั่วคราวจนกว่าจะมี bitmap font จาก Codex (ART_HANDOFF.md หัวข้อ 7.3)
 */
export function textStyle(size: number, color: string = PALETTE.highlight): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: '"Courier New", monospace',
    fontSize: `${size}px`,
    color,
    stroke: PALETTE.outline,
    strokeThickness: Math.max(2, Math.round(size / 5)),
    // canvas จริงใหญ่ 2 เท่าของพิกัด logical
    resolution: 4,
  };
}
