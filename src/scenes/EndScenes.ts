import Phaser from 'phaser';
import { GAME_WIDTH, SceneKey } from '../config/constants';
import { PALETTE } from '../assets/palette';
import { textStyle } from '../ui/text';
import { useUiCamera } from '../ui/screen';
import type { Vitals } from '../core/Vitals';
import { REGISTRY_VITALS } from './BootScene';
import { REGISTRY_LEVEL } from './GameScene';
import { isAdventure } from '../levels';
import { sfx } from '../systems/Sfx';
import { addSaveWarning } from '../ui/saveWarning';

/** ด่านโหมดผจญภัยกลับไปที่แผนที่โลก ด่านทดสอบกลับไปหน้า Title */
function exitScene(levelKey: string | undefined): string {
  return levelKey && isAdventure(levelKey) ? SceneKey.WorldMap : SceneKey.Title;
}

/**
 * Game Over: Continue เริ่มด่านเดิมใหม่ด้วยชีวิตตั้งต้น (GDD หัวข้อ 4)
 */
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.GameOver);
  }

  create(): void {
    useUiCamera(this).setBackgroundColor(PALETTE.outline);
    addSaveWarning(this);
    const cx = GAME_WIDTH / 2;
    this.add.text(cx, 130, 'GAME OVER', textStyle(28, PALETTE.fire)).setOrigin(0.5);
    this.add.text(cx, 190, 'ENTER  Continue', textStyle(12)).setOrigin(0.5);
    const level = this.registry.get(REGISTRY_LEVEL) as string | undefined;
    const exit = exitScene(level);
    this.add.text(cx, 212, `ESC  ${exit === SceneKey.WorldMap ? 'World Map' : 'Title'}`, textStyle(12, PALETTE.neutral4)).setOrigin(0.5);

    const vitals = this.registry.get(REGISTRY_VITALS) as Vitals;
    this.input.keyboard?.once('keydown-ENTER', () => {
      vitals.resetForContinue();
      this.scene.start(SceneKey.Game);
    });
    this.input.keyboard?.once('keydown-ESC', () => {
      vitals.resetForContinue();
      this.scene.start(exit, { focus: level });
    });
  }
}

/** จบด่าน: โหมดผจญภัยไปด่านถัดไปหรือกลับแผนที่โลก ด่านทดสอบเล่นซ้ำได้ */
export class StageClearScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.StageClear);
  }

  create(data: { coins?: number; level?: string; next?: string | null }): void {
    useUiCamera(this).setBackgroundColor(PALETTE.outline);
    addSaveWarning(this);
    const cx = GAME_WIDTH / 2;
    const exit = exitScene(data.level);
    const adventure = exit === SceneKey.WorldMap;
    this.add.text(cx, 120, 'STAGE CLEAR', textStyle(28, PALETTE.gold)).setOrigin(0.5);
    this.add.text(cx, 165, `Coins collected: ${data.coins ?? 0}`, textStyle(12)).setOrigin(0.5);

    const kb = this.input.keyboard;
    if (adventure) {
      const next = data.next ?? null;
      this.add.text(cx, 210, next ? 'ENTER  Next stage' : 'ENTER  World Map', textStyle(12, PALETTE.neutral4)).setOrigin(0.5);
      this.add.text(cx, 232, 'ESC  World Map', textStyle(12, PALETTE.neutral3)).setOrigin(0.5);
      if (!next) this.add.text(cx, 270, 'World 1 complete! More worlds coming soon.', textStyle(10, PALETTE.wind)).setOrigin(0.5);
      kb?.once('keydown-ENTER', () => {
        sfx.play('menu');
        if (next) this.scene.start(SceneKey.Game, { level: next });
        else this.scene.start(SceneKey.WorldMap, { focus: data.level });
      });
      kb?.once('keydown-ESC', () => this.scene.start(SceneKey.WorldMap, { focus: next ?? data.level }));
      return;
    }
    this.add.text(cx, 210, 'ENTER  Play again', textStyle(12, PALETTE.neutral4)).setOrigin(0.5);
    this.add.text(cx, 232, 'ESC  Title', textStyle(12, PALETTE.neutral3)).setOrigin(0.5);
    kb?.once('keydown-ENTER', () => this.scene.start(SceneKey.Game, { level: data.level }));
    kb?.once('keydown-ESC', () => this.scene.start(SceneKey.Title));
  }
}
