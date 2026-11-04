import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SceneKey } from '../config/constants';
import { ELEMENT_ORDER } from '../core/ElementSelector';
import { PALETTE, hex } from '../assets/palette';
import { textStyle } from '../ui/text';
import { useUiCamera } from '../ui/screen';
import { REGISTRY_LEVEL, type GameScene, type HudState } from './GameScene';
import { isAdventure } from '../levels';
import { setAtlasFrame } from '../assets/frames';
import { sfx } from '../systems/Sfx';
import { addSaveWarning } from '../ui/saveWarning';

const BOSS_FILL_WIDTH = 236;
const BOSS_BAR_X = (GAME_WIDTH - 240) / 2;
const BOSS_BAR_Y = GAME_HEIGHT - 24;

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
  private pauseHint!: Phaser.GameObjects.Text;
  private bossLayer!: Phaser.GameObjects.Container;
  private bossFill!: Phaser.GameObjects.Image;
  private bossName!: Phaser.GameObjects.Text;
  private shownBossHp = -1;
  private shardIcon!: Phaser.GameObjects.Image;
  private shardsText!: Phaser.GameObjects.Text;
  private settingsOpen = false;
  private lastKey = '';

  constructor() {
    super(SceneKey.UI);
  }

  create(): void {
    useUiCamera(this);
    addSaveWarning(this);
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

    this.shardIcon = this.add.image(GAME_WIDTH - 104, 52, 'items', 'spirit_shard_000').setOrigin(0, 0).setVisible(false);
    setAtlasFrame(this.shardIcon, 'items', 'spirit_shard_000');
    this.shardsText = this.add.text(GAME_WIDTH - 84, 53, '', textStyle(12, PALETTE.pink3)).setOrigin(0, 0).setVisible(false);

    this.shownBossHp = -1;
    this.bossFill = this.add.image(BOSS_BAR_X + 2, BOSS_BAR_Y + 2, 'ui', 'boss_bar_fill').setOrigin(0, 0);
    this.bossName = this.add.text(GAME_WIDTH / 2, BOSS_BAR_Y - 4, '', textStyle(10, PALETTE.highlight)).setOrigin(0.5, 1);
    this.bossLayer = this.add
      .container(0, 0, [this.add.image(BOSS_BAR_X, BOSS_BAR_Y, 'ui', 'boss_bar_frame').setOrigin(0, 0), this.bossFill, this.bossName])
      .setVisible(false);

    this.pauseHint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, '', textStyle(10, PALETTE.neutral4)).setOrigin(0.5);
    this.pauseLayer = this.add
      .container(0, 0, [
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, hex(PALETTE.outline), 0.6).setOrigin(0, 0),
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, 'PAUSED', textStyle(24, PALETTE.gold)).setOrigin(0.5),
        this.pauseHint,
      ])
      .setVisible(false)
      .setDepth(100);

    const kb = this.input.keyboard;
    this.settingsOpen = false;
    kb?.on('keydown-ESC', () => {
      if (!this.settingsOpen) this.togglePause();
    });
    kb?.on('keydown-M', () => {
      if (this.settingsOpen) return;
      sfx.toggleMute();
      this.refreshPauseHint();
    });
    // ออกจากด่านได้เฉพาะตอนหยุดเกม
    kb?.on('keydown-X', () => {
      if (!this.pauseLayer.visible || this.settingsOpen) return;
      const level = this.registry.get(REGISTRY_LEVEL) as string | undefined;
      this.scene.stop(SceneKey.Game);
      this.scene.start(level && isAdventure(level) ? SceneKey.WorldMap : SceneKey.Title, { focus: level });
    });
    // ตั้งปุ่มระหว่างหยุดเกม: เปิดหน้า Settings ซ้อนทับ แล้วให้เกมอ่านปุ่มใหม่ตอนปิด
    kb?.on('keydown-S', () => {
      if (!this.pauseLayer.visible || this.settingsOpen) return;
      this.settingsOpen = true;
      this.pauseLayer.setVisible(false);
      this.scene.launch(SceneKey.Settings, { overlay: true });
      this.scene.get(SceneKey.Settings).events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.settingsOpen = false;
        (this.scene.get(SceneKey.Game) as GameScene).reloadControls();
        this.pauseLayer.setVisible(true);
        this.refreshPauseHint();
      });
    });
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
    const key = `${s.hp}/${s.maxHp}/${s.lives}/${s.coins}/${s.unlocked.join(',')}/${s.selected}/${s.shards.have}/${s.shards.total}`;
    if (key !== this.lastKey) {
      this.lastKey = key;
      this.hearts.forEach((h, i) => {
        h.setVisible(i < s.maxHp);
        setAtlasFrame(h, 'ui', i < s.hp ? 'heart_full' : 'heart_empty');
      });
      this.livesText.setText(`×${s.lives}`);
      this.coinsText.setText(String(s.coins).padStart(2, '0'));
      this.shardIcon.setVisible(s.shards.total > 0);
      this.shardsText.setVisible(s.shards.total > 0).setText(`${s.shards.have}/${s.shards.total}`);
      ELEMENT_ORDER.forEach((el, i) => {
        setAtlasFrame(this.slots[i], 'ui', `element_icon_${el}_${s.unlocked.includes(el) ? 'normal' : 'locked'}`);
      });
      const sel = s.selected === null ? -1 : ELEMENT_ORDER.indexOf(s.selected);
      this.slotSelect.setVisible(sel >= 0);
      if (sel >= 0) this.slotSelect.setX(SLOT_X(sel) - 2);
    }

    this.renderBoss(s.boss);

    const flash = s.energyDenied && Math.floor(this.time.now / 80) % 2 === 0;
    setAtlasFrame(this.energyFill, 'ui', flash ? 'energy_bar_fill_flash' : 'energy_bar_fill_normal');
    this.energyFill.setCrop(0, 0, Math.round(ENERGY_FILL_WIDTH * (s.energy / s.energyMax)), 8);
  }

  private renderBoss(boss: HudState['boss']): void {
    this.bossLayer.setVisible(boss !== null && boss.hp > 0);
    if (!boss || boss.hp === this.shownBossHp) return;
    this.shownBossHp = boss.hp;
    this.bossName.setText(boss.name.toUpperCase());
    this.bossFill.setCrop(0, 0, Math.round(BOSS_FILL_WIDTH * (boss.hp / boss.max)), 8);
  }

  private refreshPauseHint(): void {
    const level = this.registry.get(REGISTRY_LEVEL) as string | undefined;
    const exit = level && isAdventure(level) ? 'World Map' : 'Title';
    this.pauseHint.setText(`ESC resume   S settings   M sound ${sfx.muted ? 'OFF' : 'ON'}   X quit to ${exit}`);
  }

  private togglePause(): void {
    this.setPaused(!this.scene.isPaused(SceneKey.Game));
  }

  private setPaused(paused: boolean): void {
    if (!this.scene.isActive(SceneKey.Game) && !this.scene.isPaused(SceneKey.Game)) return;
    if (paused) this.scene.pause(SceneKey.Game);
    else this.scene.resume(SceneKey.Game);
    this.pauseLayer.setVisible(paused);
    if (paused) this.refreshPauseHint();
  }
}
