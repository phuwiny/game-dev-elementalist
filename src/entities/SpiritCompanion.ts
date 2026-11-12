import Phaser from 'phaser';
import { ElementType } from '../core/Element';
import { SPIRIT_KEYS, type SpiritKey } from '../assets/manifest';
import { addSpiritSprite, playSpirit } from '../assets/spirits';
import { ELEMENT_ORDER } from '../core/ElementSelector';
import { PlayerLayout, type Player } from './Player';

/** ชื่อภูตตามธาตุ (ใช้เป็น prefix ของ frame ใน atlas spirits / spirits_hd) */
export function spiritKey(element: ElementType): SpiritKey {
  return SPIRIT_KEYS[ELEMENT_ORDER.indexOf(element)];
}

export const SPIRIT_NAMES: Record<ElementType, string> = {
  [ElementType.Fire]: 'Burnil',
  [ElementType.Water]: 'Wata',
  [ElementType.Wind]: 'Valvaliz',
  [ElementType.Earth]: 'Eathy',
};

/**
 * ภูตธาตุที่เลือกอยู่ลอยตามหลัง Aclaire (GDD หัวข้อ 3)
 * เปลี่ยนตัวตามธาตุที่เลือก เพื่อให้ผู้เล่นรู้ธาตุปัจจุบันโดยไม่ต้องมอง HUD
 */
export class SpiritCompanion {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private element: ElementType | null = null;
  private elapsed = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly player: Player,
  ) {
    this.sprite = addSpiritSprite(scene, player.x, player.y - PlayerLayout.overheadY, 'burnil').setDepth(7).setVisible(false);
  }

  setElement(element: ElementType | null): void {
    this.element = element;
    if (element === null) {
      this.sprite.setVisible(false);
      return;
    }
    this.sprite.setVisible(true);
    // ภูตแต่ละตนอาจคนละ atlas/density: playSpirit ตั้ง scale ใหม่ทุกครั้งที่สลับ
    playSpirit(this.sprite, spiritKey(element), 'idle');
  }

  playCast(): void {
    if (this.element === null) return;
    playSpirit(this.sprite, spiritKey(this.element), 'cast');
    this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.element !== null) playSpirit(this.sprite, spiritKey(this.element), 'idle');
    });
  }

  /** วางภูตทันทีข้างผู้เล่น (ใช้ตอนเกิดใหม่) */
  snap(): void {
    const t = this.target();
    this.sprite.setPosition(t.x, t.y);
  }

  update(delta: number): void {
    if (this.element === null) return;
    this.elapsed += delta;
    const t = this.target();
    const k = 1 - Math.pow(0.001, delta / 1000);
    this.sprite.x += (t.x - this.sprite.x) * k;
    this.sprite.y += (t.y + Math.sin(this.elapsed / 280) * 2 - this.sprite.y) * k;
    this.sprite.setFlipX(this.player.facing < 0);
    this.sprite.setAlpha(this.player.isDead ? 0.4 : 1);
  }

  private target(): { x: number; y: number } {
    return { x: this.player.x - this.player.facing * 18, y: this.player.y - PlayerLayout.overheadY };
  }
}
