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
import { music } from '../systems/Music';
import { addSaveWarning } from '../ui/saveWarning';
import { MenuButton, addPanel } from '../ui/widgets';

const BUTTON_W = 200;

/** ปุ่มของหน้าจบ: ENTER เป็นปุ่มหลัก (hover) และกดแล้วแสดง pressed */
function keyButtons(scene: Phaser.Scene, y: number, enter: string, esc: string): { enter: MenuButton; esc: MenuButton } {
  const cx = GAME_WIDTH / 2;
  return {
    enter: new MenuButton(scene, cx, y, BUTTON_W, `ENTER  ${enter}`).setState('hover'),
    esc: new MenuButton(scene, cx, y + 28, BUTTON_W, `ESC  ${esc}`),
  };
}

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
    music.play('game_over');
    const cx = GAME_WIDTH / 2;
    addPanel(this, cx - 140, 96, 280, 160);
    this.add.text(cx, 130, 'GAME OVER', textStyle(28, PALETTE.fire)).setOrigin(0.5);
    const level = this.registry.get(REGISTRY_LEVEL) as string | undefined;
    const exit = exitScene(level);
    const buttons = keyButtons(this, 190, 'Continue', exit === SceneKey.WorldMap ? 'World Map' : 'Title');

    const vitals = this.registry.get(REGISTRY_VITALS) as Vitals;
    this.input.keyboard?.once('keydown-ENTER', () => {
      buttons.enter.setState('pressed');
      vitals.resetForContinue();
      this.scene.start(SceneKey.Game);
    });
    this.input.keyboard?.once('keydown-ESC', () => {
      buttons.esc.setState('pressed');
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

  create(data: {
    coins?: number;
    level?: string;
    next?: string | null;
    shards?: { have: number; total: number; added: number };
    /** การผ่านด่านครั้งนี้ปลดล็อกภาพ gallery ใหม่ */
    galleryUnlocked?: boolean;
  }): void {
    useUiCamera(this).setBackgroundColor(PALETTE.outline);
    addSaveWarning(this);
    music.play('stage_clear');
    const cx = GAME_WIDTH / 2;
    const exit = exitScene(data.level);
    const adventure = exit === SceneKey.WorldMap;
    addPanel(this, cx - 160, 80, 320, 206);
    this.add.text(cx, 110, 'STAGE CLEAR', textStyle(28, PALETTE.gold)).setOrigin(0.5);
    this.add.text(cx, 150, `Coins collected: ${data.coins ?? 0}`, textStyle(12)).setOrigin(0.5);
    const sh = data.shards;
    if (sh && sh.total > 0) {
      const fresh = sh.added > 0 ? `  (+${sh.added} new)` : '';
      this.add.text(cx, 168, `Spirit Shards: ${sh.have}/${sh.total}${fresh}`, textStyle(12, PALETTE.pink3)).setOrigin(0.5);
    }
    if (data.galleryUnlocked) {
      this.add.text(cx, 186, 'New gallery image unlocked!', textStyle(12, PALETTE.gold)).setOrigin(0.5);
    }

    const kb = this.input.keyboard;
    if (adventure) {
      const next = data.next ?? null;
      const buttons = keyButtons(this, 222, next ? 'Next stage' : 'World Map', 'World Map');
      if (!next) this.add.text(cx, 292, 'World 1 complete! More worlds coming soon.', textStyle(10, PALETTE.wind)).setOrigin(0.5);
      kb?.once('keydown-ENTER', () => {
        buttons.enter.setState('pressed');
        sfx.play('menu');
        if (next) this.scene.start(SceneKey.Game, { level: next });
        else this.scene.start(SceneKey.WorldMap, { focus: data.level });
      });
      kb?.once('keydown-ESC', () => {
        buttons.esc.setState('pressed');
        this.scene.start(SceneKey.WorldMap, { focus: next ?? data.level });
      });
      return;
    }
    const buttons = keyButtons(this, 222, 'Play again', 'Title');
    kb?.once('keydown-ENTER', () => {
      buttons.enter.setState('pressed');
      this.scene.start(SceneKey.Game, { level: data.level });
    });
    kb?.once('keydown-ESC', () => {
      buttons.esc.setState('pressed');
      this.scene.start(SceneKey.Title);
    });
  }
}
