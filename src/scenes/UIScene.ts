import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SceneKey } from '../config/constants';
import { ELEMENT_ORDER } from '../core/ElementSelector';
import { PALETTE, hex } from '../assets/palette';
import { textStyle } from '../ui/text';
import type { GameScene, HudState } from './GameScene';

const ENERGY_FILL_WIDTH = 92;
const SLOT_X = (i: number) => 12 + i * 28;
const SLOT_Y = 50;

/**
 * HUD ซ้อนบน GameScene (GDD หัวข้อ 7) และระบบ Pause
 * อ่านสถานะจาก GameScene ทุก frame
 */
export class UIScene extends Phaser.Scene {
  private hearts: Phaser.GameObjects.Image[] = [];
  private energyFill!: Phaser.GameObjects.Image;
  private slots: Phaser.GameObjects.Image[] = [];
  private slotSelect!: Phaser.GameObjects.Image;
  private livesText!: Phaser.GameObjects.Text;
  private coinsText!: Phaser.GameObjects.Text;
  private pauseLayer!: Phaser.GameObjects.Container;
  private lastKey = '';

  constructor() {
    super(SceneKey.UI);
  }

  create(): void {
    this.lastKey = '';
    this.hearts = [];
    for (let i = 0; i < 9; i += 1) {
      this.hearts.push(this.add.image(12 + i * 17, 12, 'ui', 'heart_full').setOrigin(0, 0).setVisible(false));
    }

    this.add.image(12, 32, 'ui', 'energy_bar_frame').setOrigin(0, 0);
    this.energyFill = this.add.image(14, 34, 'ui', 'energy_bar_fill_normal').setOrigin(0, 0);

    this.slotSelect = this.add.image(0, SLOT_Y - 2, 'ui', 'element_slot_select').setOrigin(0, 0).setVisible(false);
    this.slots = ELEMENT_ORDER.map((el, i) =>
      this.add.image(SLOT_X(i), SLOT_Y, 'ui', `element_icon_${el}_locked`).setOrigin(0, 0),
    );

    this.add.image(GAME_WIDTH - 104, 12, 'ui', 'lives_icon').setOrigin(0, 0);
    this.livesText = this.add.text(GAME_WIDTH - 84, 12, '', textStyle(12)).setOrigin(0, 0);
    this.add.image(GAME_WIDTH - 102, 34, 'ui', 'coin_icon').setOrigin(0, 0);
    this.coinsText = this.add.text(GAME_WIDTH - 84, 31, '', textStyle(12)).setOrigin(0, 0);

    this.pauseLayer = this.add
      .container(0, 0, [
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, hex(PALETTE.outline), 0.6).setOrigin(0, 0),
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, 'PAUSED', textStyle(24, PALETTE.gold)).setOrigin(0.5),
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'ESC to resume', textStyle(10, PALETTE.neutral4)).setOrigin(0.5),
      ])
      .setVisible(false)
      .setDepth(100);

    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());
    // สลับแท็บแล้วหยุดเกมไว้ ไม่ให้ตัวละครตายตอนผู้เล่นไม่อยู่
    const onHidden = () => this.setPaused(true);
    this.game.events.on(Phaser.Core.Events.HIDDEN, onHidden);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off(Phaser.Core.Events.HIDDEN, onHidden));
  }

  override update(): void {
    const game = this.scene.get(SceneKey.Game) as GameScene;
    if (!game.sys.isActive() && !game.sys.isPaused()) return;
    if (!game.player) return;
    this.render(game.hudState());
  }

  private render(s: HudState): void {
    const key = `${s.hp}/${s.maxHp}/${s.lives}/${s.coins}/${s.unlocked.join(',')}/${s.selected}`;
    if (key !== this.lastKey) {
      this.lastKey = key;
      this.hearts.forEach((h, i) => {
        h.setVisible(i < s.maxHp);
        h.setFrame(i < s.hp ? 'heart_full' : 'heart_empty');
      });
      this.livesText.setText(`×${s.lives}`);
      this.coinsText.setText(String(s.coins).padStart(2, '0'));
      ELEMENT_ORDER.forEach((el, i) => {
        this.slots[i].setFrame(`element_icon_${el}_${s.unlocked.includes(el) ? 'normal' : 'locked'}`);
      });
      const sel = s.selected === null ? -1 : ELEMENT_ORDER.indexOf(s.selected);
      this.slotSelect.setVisible(sel >= 0);
      if (sel >= 0) this.slotSelect.setX(SLOT_X(sel) - 2);
    }

    const flash = s.energyDenied && Math.floor(this.time.now / 80) % 2 === 0;
    this.energyFill.setFrame(flash ? 'energy_bar_fill_flash' : 'energy_bar_fill_normal');
    this.energyFill.setCrop(0, 0, Math.round(ENERGY_FILL_WIDTH * (s.energy / s.energyMax)), 8);
  }

  private togglePause(): void {
    this.setPaused(!this.scene.isPaused(SceneKey.Game));
  }

  private setPaused(paused: boolean): void {
    if (!this.scene.isActive(SceneKey.Game) && !this.scene.isPaused(SceneKey.Game)) return;
    if (paused) this.scene.pause(SceneKey.Game);
    else this.scene.resume(SceneKey.Game);
    this.pauseLayer.setVisible(paused);
  }
}
