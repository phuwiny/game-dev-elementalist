import Phaser from 'phaser';
import { GAME_WIDTH, SceneKey } from '../config/constants';
import { PALETTE } from '../assets/palette';
import { textStyle } from '../ui/text';
import type { Vitals } from '../core/Vitals';
import { REGISTRY_VITALS } from './BootScene';

/**
 * Game Over: Continue เริ่มด่านเดิมใหม่ด้วยชีวิตตั้งต้น (GDD หัวข้อ 4)
 */
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.GameOver);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.outline);
    const cx = GAME_WIDTH / 2;
    this.add.text(cx, 130, 'GAME OVER', textStyle(28, PALETTE.fire)).setOrigin(0.5);
    this.add.text(cx, 190, 'ENTER  Continue', textStyle(12)).setOrigin(0.5);
    this.add.text(cx, 212, 'ESC  Title', textStyle(12, PALETTE.neutral4)).setOrigin(0.5);

    const vitals = this.registry.get(REGISTRY_VITALS) as Vitals;
    this.input.keyboard?.once('keydown-ENTER', () => {
      vitals.resetForContinue();
      this.scene.start(SceneKey.Game);
    });
    this.input.keyboard?.once('keydown-ESC', () => {
      vitals.resetForContinue();
      this.scene.start(SceneKey.Title);
    });
  }
}

/** จบด่าน: Phase 1 มีด่านเดียว จึงวนกลับไปเล่นด่านเดิม */
export class StageClearScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.StageClear);
  }

  create(data: { coins?: number }): void {
    this.cameras.main.setBackgroundColor(PALETTE.outline);
    const cx = GAME_WIDTH / 2;
    this.add.text(cx, 120, 'STAGE CLEAR', textStyle(28, PALETTE.gold)).setOrigin(0.5);
    this.add.text(cx, 165, `Coins collected: ${data.coins ?? 0}`, textStyle(12)).setOrigin(0.5);
    this.add.text(cx, 210, 'ENTER  Play again', textStyle(12, PALETTE.neutral4)).setOrigin(0.5);
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start(SceneKey.Game));
  }
}
