import Phaser from 'phaser';
import { GAME_WIDTH, SceneKey } from '../config/constants';
import { PALETTE } from '../assets/palette';
import { animKey, textureScale } from '../assets/manifest';
import { textStyle } from '../ui/text';
import { useUiCamera } from '../ui/screen';
import { DEV_LEVELS } from '../levels';
import { sfx } from '../systems/Sfx';

interface MenuItem {
  label: string;
  run: () => void;
}

/**
 * หน้า Title (GDD หัวข้อ 8): browser ไม่ให้เล่นเสียงก่อนผู้เล่น interact
 * จึงปลดล็อกเสียงที่การกดปุ่มครั้งแรก
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Title);
  }

  create(): void {
    useUiCamera(this);
    this.cameras.main.setBackgroundColor(PALETTE.outline);
    const cx = GAME_WIDTH / 2;

    this.add.text(cx, 64, 'ELEMENTAL SPIRIT', textStyle(28, PALETTE.gold)).setOrigin(0.5);
    this.add.text(cx, 94, 'Phase 3 · Vertical Slice', textStyle(10, PALETTE.neutral4)).setOrigin(0.5);
    this.add.sprite(cx, 176, 'player', 'idle_000').setOrigin(0.5, 1).setScale(textureScale('player')).play(animKey('player', 'idle'));

    const menu: MenuItem[] = [
      { label: 'Adventure', run: () => this.scene.start(SceneKey.WorldMap) },
      ...DEV_LEVELS.map((l) => ({ label: l.name, run: () => this.scene.start(SceneKey.Game, { level: l.key }) })),
    ];

    let selected = 0;
    const items = menu.map((_m, i) => this.add.text(cx, 196 + i * 18, '', textStyle(12)).setOrigin(0.5));
    const refresh = () =>
      items.forEach((t, i) =>
        t.setText(`${i === selected ? '>' : ' '} ${menu[i].label}`).setColor(i === selected ? PALETTE.highlight : PALETTE.neutral3),
      );
    refresh();

    const muteText = this.add.text(cx, 270, '', textStyle(10, PALETTE.neutral4)).setOrigin(0.5);
    const refreshMute = () => muteText.setText(`M  Sound: ${sfx.muted ? 'OFF' : 'ON'}`);
    refreshMute();

    this.add
      .text(cx, 304, 'A/D move  SPACE jump  J sword  K element  Q/E or 1-4 switch  ESC pause', textStyle(10, PALETTE.neutral3))
      .setOrigin(0.5);
    this.add.text(cx, 322, 'UP/DOWN select  ENTER start', textStyle(10, PALETTE.neutral3)).setOrigin(0.5);

    const kb = this.input.keyboard;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      sfx.unlock();
      sfx.play('menu');
      menu[selected].run();
    };
    // ปุ่มแรกที่กดคือจังหวะที่ browser อนุญาตให้เปิดเสียง
    kb?.on('keydown', () => sfx.unlock());
    kb?.on('keydown-UP', () => {
      selected = (selected + menu.length - 1) % menu.length;
      sfx.play('menu');
      refresh();
    });
    kb?.on('keydown-DOWN', () => {
      selected = (selected + 1) % menu.length;
      sfx.play('menu');
      refresh();
    });
    kb?.on('keydown-M', () => {
      sfx.toggleMute();
      refreshMute();
    });
    kb?.on('keydown-ENTER', start);
    kb?.on('keydown-SPACE', start);
    this.input.once('pointerdown', start);
  }
}
