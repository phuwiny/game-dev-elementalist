import Phaser from 'phaser';
import { GAME_WIDTH, SceneKey } from '../config/constants';
import { PALETTE } from '../assets/palette';
import { animKey } from '../assets/manifest';
import { textStyle } from '../ui/text';

/**
 * หน้า Press to Start: browser ไม่ให้เล่นเสียงก่อนผู้เล่น interact (GDD หัวข้อ 8)
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Title);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.outline);
    const cx = GAME_WIDTH / 2;

    this.add.text(cx, 90, 'ELEMENTAL SPIRIT', textStyle(28, PALETTE.gold)).setOrigin(0.5);
    this.add.text(cx, 122, 'Phase 1 · Core Prototype', textStyle(10, PALETTE.neutral4)).setOrigin(0.5);
    this.add.sprite(cx, 210, 'player', 'idle_000').setOrigin(0.5, 1).setScale(2).play(animKey('player', 'idle'));

    const prompt = this.add.text(cx, 250, 'PRESS ANY KEY', textStyle(12, PALETTE.highlight)).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

    this.add
      .text(
        cx,
        310,
        'A/D or ←/→ move   SPACE jump   J sword   ESC pause',
        textStyle(10, PALETTE.neutral3),
      )
      .setOrigin(0.5);

    const start = () => {
      this.scene.start(SceneKey.Game);
    };
    this.input.keyboard?.once('keydown', start);
    this.input.once('pointerdown', start);
  }
}
