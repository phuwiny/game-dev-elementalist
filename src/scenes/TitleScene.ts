import Phaser from 'phaser';
import { GAME_WIDTH, SceneKey } from '../config/constants';
import { PALETTE } from '../assets/palette';
import { animKey } from '../assets/manifest';
import { textStyle } from '../ui/text';
import { DEFAULT_LEVEL, LEVELS } from '../levels';

/**
 * หน้า Press to Start: browser ไม่ให้เล่นเสียงก่อนผู้เล่น interact (GDD หัวข้อ 8)
 * ระหว่างพัฒนามีตัวเลือกด่านทดสอบ
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Title);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.outline);
    const cx = GAME_WIDTH / 2;

    this.add.text(cx, 70, 'ELEMENTAL SPIRIT', textStyle(28, PALETTE.gold)).setOrigin(0.5);
    this.add.text(cx, 100, 'Phase 2 · Element System', textStyle(10, PALETTE.neutral4)).setOrigin(0.5);
    this.add.sprite(cx, 180, 'player', 'idle_000').setOrigin(0.5, 1).setScale(2).play(animKey('player', 'idle'));

    let selected = Math.max(0, LEVELS.findIndex((l) => l.key === DEFAULT_LEVEL));
    const items = LEVELS.map((l, i) =>
      this.add.text(cx, 210 + i * 18, `${i + 1}  ${l.name}`, textStyle(12, PALETTE.neutral4)).setOrigin(0.5),
    );
    const refresh = () =>
      items.forEach((t, i) => t.setColor(i === selected ? PALETTE.highlight : PALETTE.neutral3).setText(`${i === selected ? '>' : ' '} ${i + 1}  ${LEVELS[i].name}`));
    refresh();

    const prompt = this.add.text(cx, 262, 'ENTER to start', textStyle(12, PALETTE.highlight)).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

    this.add
      .text(cx, 300, 'A/D move  SPACE jump  J sword  K element  Q/E or 1-4 switch  ESC pause', textStyle(10, PALETTE.neutral3))
      .setOrigin(0.5);

    const start = () => this.scene.start(SceneKey.Game, { level: LEVELS[selected].key });
    const kb = this.input.keyboard;
    kb?.on('keydown-UP', () => {
      selected = (selected + LEVELS.length - 1) % LEVELS.length;
      refresh();
    });
    kb?.on('keydown-DOWN', () => {
      selected = (selected + 1) % LEVELS.length;
      refresh();
    });
    LEVELS.forEach((_l, i) => kb?.on(`keydown-${['ONE', 'TWO', 'THREE', 'FOUR'][i]}`, () => {
      selected = i;
      refresh();
    }));
    kb?.once('keydown-ENTER', start);
    kb?.once('keydown-SPACE', start);
    this.input.once('pointerdown', start);
  }
}
