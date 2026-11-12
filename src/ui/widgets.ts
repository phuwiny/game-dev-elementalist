import type Phaser from 'phaser';
import { atlasTextureFor } from '../assets/frames';
import { PALETTE } from '../assets/palette';
import { textStyle } from './text';

/** ขอบของ panel_9slice (ART_HANDOFF.md หัวข้อ 7: 48×48 ขอบ 16 px) */
const PANEL_EDGE = 16;
/** ขอบของปุ่ม: กรอบทอง 4 px ยืดได้ทั้งแนวนอนและแนวตั้ง */
const BUTTON_EDGE = 4;
export const BUTTON_HEIGHT = 24;

function uiTexture(scene: Phaser.Scene, frame: string): string {
  return atlasTextureFor(scene.textures, 'ui', frame);
}

/** กล่องเมนู 9-slice (x, y มุมบนซ้าย) */
export function addPanel(scene: Phaser.Scene, x: number, y: number, w: number, h: number): Phaser.GameObjects.NineSlice {
  return scene.add
    .nineslice(x, y, uiTexture(scene, 'panel_9slice'), 'panel_9slice', w, h, PANEL_EDGE, PANEL_EDGE, PANEL_EDGE, PANEL_EDGE)
    .setOrigin(0, 0);
}

/** ลูกศรชี้รายการที่เลือก วางชิดซ้ายของรายการ (origin ขวากลาง) */
export function addCursor(scene: Phaser.Scene): Phaser.GameObjects.Image {
  return scene.add.image(0, 0, uiTexture(scene, 'cursor_arrow'), 'cursor_arrow').setOrigin(1, 0.5);
}

export type ButtonState = 'normal' | 'hover' | 'pressed';

/**
 * ปุ่มเมนู: กรอบ button_* ยืดตามความกว้าง (9-slice) และข้อความกึ่งกลาง
 * hover = รายการที่เลือกอยู่, pressed = จังหวะกดยืนยัน
 */
export class MenuButton {
  readonly frame: Phaser.GameObjects.NineSlice;
  readonly label: Phaser.GameObjects.Text;
  private current: ButtonState = 'normal';

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    text: string,
  ) {
    this.frame = scene.add.nineslice(
      x,
      y,
      uiTexture(scene, 'button_normal'),
      'button_normal',
      width,
      BUTTON_HEIGHT,
      BUTTON_EDGE,
      BUTTON_EDGE,
      BUTTON_EDGE,
      BUTTON_EDGE,
    );
    this.label = scene.add.text(x, y, text, textStyle(12)).setOrigin(0.5);
    this.setState('normal');
  }

  get state(): ButtonState {
    return this.current;
  }

  get x(): number {
    return this.frame.x;
  }

  get y(): number {
    return this.frame.y;
  }

  get left(): number {
    return this.frame.x - this.frame.width / 2;
  }

  setState(state: ButtonState): this {
    this.current = state;
    const frame = `button_${state}`;
    this.frame.setTexture(uiTexture(this.scene, frame), frame);
    this.label.setColor(state === 'normal' ? PALETTE.neutral3 : PALETTE.highlight);
    // ข้อความจมลง 1 px ตอนกด
    this.label.setY(this.frame.y + (state === 'pressed' ? 1 : 0));
    return this;
  }
}
