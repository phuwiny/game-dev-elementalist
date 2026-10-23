import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, GameEvent, SceneKey } from '../config/constants';
import { PALETTE, hex } from '../assets/palette';
import { textStyle } from '../ui/text';
import type { HudStats } from './GameScene';

const ELEMENTS = ['fire', 'water', 'wind', 'earth'] as const;

/**
 * HUD ซ้อนบน GameScene (GDD หัวข้อ 7) และระบบ Pause
 * Phase 1: ภูตทุกช่องยังล็อก แถบ Energy แสดงเต็มไว้ก่อน
 */
export class UIScene extends Phaser.Scene {
  private hearts: Phaser.GameObjects.Image[] = [];
  private energyFill!: Phaser.GameObjects.Image;
  private livesText!: Phaser.GameObjects.Text;
  private coinsText!: Phaser.GameObjects.Text;
  private pauseLayer!: Phaser.GameObjects.Container;

  constructor() {
    super(SceneKey.UI);
  }

  create(): void {
    this.hearts = [];
    for (let i = 0; i < 9; i += 1) {
      this.hearts.push(this.add.image(12 + i * 17, 12, 'ui', 'heart_full').setOrigin(0, 0).setVisible(false));
    }

    this.add.image(12, 32, 'ui', 'energy_bar_frame').setOrigin(0, 0);
    this.energyFill = this.add.image(14, 34, 'ui', 'energy_bar_fill_normal').setOrigin(0, 0);

    ELEMENTS.forEach((el, i) => {
      this.add.image(12 + i * 28, 50, 'ui', `element_icon_${el}_locked`).setOrigin(0, 0);
    });

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

    const game = this.scene.get(SceneKey.Game);
    const onStats = (s: HudStats) => this.render(s);
    game.events.on(GameEvent.StatsChanged, onStats);

    const stats = this.registry.get('hud') as HudStats | undefined;
    if (stats) this.render(stats);

    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());
    // สลับแท็บแล้วหยุดเกมไว้ ไม่ให้ตัวละครตายตอนผู้เล่นไม่อยู่
    const onHidden = () => this.setPaused(true);
    this.game.events.on(Phaser.Core.Events.HIDDEN, onHidden);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      game.events.off(GameEvent.StatsChanged, onStats);
      this.game.events.off(Phaser.Core.Events.HIDDEN, onHidden);
    });
  }

  private render(s: HudStats): void {
    this.hearts.forEach((h, i) => {
      h.setVisible(i < s.maxHp);
      h.setFrame(i < s.hp ? 'heart_full' : 'heart_empty');
    });
    this.energyFill.setCrop(0, 0, Math.round(92 * (s.energy / s.energyMax)), 8);
    this.livesText.setText(`×${s.lives}`);
    this.coinsText.setText(String(s.coins).padStart(2, '0'));
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
