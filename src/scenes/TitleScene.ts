import Phaser from 'phaser';
import { GAME_WIDTH, SceneKey } from '../config/constants';
import { PALETTE } from '../assets/palette';
import { animKey, textureScale } from '../assets/manifest';
import { textStyle } from '../ui/text';
import { useUiCamera } from '../ui/screen';
import { DEV_LEVELS } from '../levels';
import { sfx } from '../systems/Sfx';
import { music } from '../systems/Music';
import { controlsHint, loadBindings } from '../core/Bindings';
import { SaveStore } from '../core/SaveStore';
import { addSaveWarning } from '../ui/saveWarning';
import { BUTTON_HEIGHT, MenuButton, addCursor } from '../ui/widgets';

/** กึ่งกลางของปุ่มแรกและความกว้างปุ่มเมนู (ชื่อด่านทดสอบยาวสุด ~22 ตัวอักษร) */
const MENU_Y = 172;
const MENU_WIDTH = 200;

interface MenuItem {
  label: string;
  run: () => void;
}

/**
 * หน้า Title (GDD หัวข้อ 8): browser ไม่ให้เล่นเสียงก่อนผู้เล่น interact
 * จึงปลดล็อกเสียงที่การกดปุ่มครั้งแรก
 */
export class TitleScene extends Phaser.Scene {
  /** ชื่อรายการที่เลือกอยู่ (สคริปต์ e2e อ่านค่านี้) */
  selectedLabel = '';

  constructor() {
    super(SceneKey.Title);
  }

  create(): void {
    useUiCamera(this);
    this.cameras.main.setBackgroundColor(PALETTE.outline);
    const cx = GAME_WIDTH / 2;
    addSaveWarning(this);
    music.play('title');

    this.add.text(cx, 50, 'ELEMENTAL SPIRIT', textStyle(28, PALETTE.gold)).setOrigin(0.5);
    this.add.text(cx, 78, 'Phase 3 · Vertical Slice', textStyle(10, PALETTE.neutral4)).setOrigin(0.5);
    this.add.sprite(cx, 152, 'player', 'idle_000').setOrigin(0.5, 1).setScale(textureScale('player')).play(animKey('player', 'idle'));

    const menu: MenuItem[] = [
      { label: 'Adventure', run: () => this.scene.start(SceneKey.WorldMap) },
      { label: 'Settings', run: () => this.scene.start(SceneKey.Settings) },
      { label: 'Gallery', run: () => this.scene.start(SceneKey.Gallery, { from: SceneKey.Title }) },
      ...DEV_LEVELS.map((l) => ({ label: l.name, run: () => this.scene.start(SceneKey.Game, { level: l.key }) })),
    ];

    let selected = 0;
    const buttons = menu.map((m, i) => new MenuButton(this, cx, MENU_Y + i * (BUTTON_HEIGHT + 2), MENU_WIDTH, m.label));
    const cursor = addCursor(this);
    const refresh = () => {
      buttons.forEach((b, i) => b.setState(i === selected ? 'hover' : 'normal'));
      cursor.setPosition(buttons[selected].left - 4, buttons[selected].y);
      this.selectedLabel = menu[selected].label;
    };
    refresh();

    // ข้อความใต้เมนูเรียงต่อจากปุ่มสุดท้าย
    const below = MENU_Y + (menu.length - 1) * (BUTTON_HEIGHT + 2) + BUTTON_HEIGHT / 2;
    const muteText = this.add.text(cx, below + 8, '', textStyle(10, PALETTE.neutral4)).setOrigin(0.5);
    const refreshMute = () => muteText.setText(`M  Sound: ${sfx.muted ? 'OFF' : 'ON'}`);
    refreshMute();

    this.add
      .text(cx, below + 26, controlsHint(loadBindings(new SaveStore())), textStyle(10, PALETTE.neutral3))
      .setOrigin(0.5);
    this.add.text(cx, below + 42, 'UP/DOWN select  ENTER start', textStyle(10, PALETTE.neutral3)).setOrigin(0.5);

    const kb = this.input.keyboard;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      sfx.unlock();
      sfx.play('menu');
      buttons[selected].setState('pressed');
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
