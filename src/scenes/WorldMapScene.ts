import Phaser from 'phaser';
import { GAME_WIDTH, SceneKey } from '../config/constants';
import { PALETTE, hex } from '../assets/palette';
import { animKey } from '../assets/manifest';
import { textStyle } from '../ui/text';
import { ADVENTURE_LEVELS } from '../levels';
import { ELEMENT_ORDER } from '../core/ElementSelector';
import type { Progress } from '../core/Progress';
import type { Vitals } from '../core/Vitals';
import { sfx } from '../systems/Sfx';
import { REGISTRY_PROGRESS, REGISTRY_VITALS } from './BootScene';

const NODE_Y = 190;
const nodeX = (i: number, n: number) => GAME_WIDTH / 2 + (i - (n - 1) / 2) * 140;

/**
 * แผนที่โลก (GDD หัวข้อ 8): เลือกด่านที่ปลดล็อกแล้ว ด่านถัดไปเปิดเมื่อผ่านด่านก่อนหน้า
 * ตอนนี้มีเฉพาะโลก 1 Ember Woods
 */
export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.WorldMap);
  }

  create(data?: { focus?: string }): void {
    const progress = this.registry.get(REGISTRY_PROGRESS) as Progress;
    const vitals = this.registry.get(REGISTRY_VITALS) as Vitals;
    this.cameras.main.setBackgroundColor(PALETTE.foliage1);
    const cx = GAME_WIDTH / 2;
    const n = ADVENTURE_LEVELS.length;

    this.add.text(cx, 40, 'WORLD 1 · EMBER WOODS', textStyle(20, PALETTE.gold)).setOrigin(0.5);

    // เส้นทางเชื่อมระหว่างด่าน
    const path = this.add.graphics();
    for (let i = 0; i < n - 1; i += 1) {
      const open = progress.isUnlocked(ADVENTURE_LEVELS[i + 1].key);
      path.lineStyle(3, hex(open ? PALETTE.earth4 : PALETTE.neutral2), 1);
      path.lineBetween(nodeX(i, n) + 12, NODE_Y, nodeX(i + 1, n) - 12, NODE_Y);
    }

    const labels: Phaser.GameObjects.Text[] = [];
    ADVENTURE_LEVELS.forEach((l, i) => {
      const state = progress.isCleared(l.key) ? 'cleared' : progress.isUnlocked(l.key) ? 'open' : 'locked';
      this.add.image(nodeX(i, n), NODE_Y, 'ui', `world_map_node_${state}`).setScale(2);
      labels.push(
        this.add.text(nodeX(i, n), NODE_Y + 28, l.name, textStyle(10, state === 'locked' ? PALETTE.neutral3 : PALETTE.highlight)).setOrigin(0.5, 0),
      );
      if (l.boss) this.add.text(nodeX(i, n), NODE_Y - 34, 'BOSS', textStyle(10, PALETTE.fire)).setOrigin(0.5);
    });

    // เริ่มที่ด่านที่ส่งมา หรือด่านล่าสุดที่เปิดอยู่
    let selected = ADVENTURE_LEVELS.findIndex((l) => l.key === data?.focus);
    if (selected < 0) {
      selected = 0;
      ADVENTURE_LEVELS.forEach((l, i) => {
        if (progress.isUnlocked(l.key)) selected = i;
      });
    }

    const cursor = this.add.sprite(nodeX(selected, n), NODE_Y - 8, 'player', 'idle_000').setOrigin(0.5, 1);
    cursor.play(animKey('player', 'idle'));

    const info = this.add.text(cx, 270, '', textStyle(12, PALETTE.neutral4)).setOrigin(0.5);
    const refresh = () => {
      cursor.setX(nodeX(selected, n));
      labels.forEach((t, i) => t.setFontStyle(i === selected ? 'bold' : ''));
      const l = ADVENTURE_LEVELS[selected];
      info.setText(progress.isUnlocked(l.key) ? `ENTER  Play ${l.name}` : 'Locked: clear the previous stage');
    };
    refresh();

    // ภูตที่ได้แล้วและชีวิตคงเหลือ
    ELEMENT_ORDER.forEach((el, i) => {
      const owned = progress.spiritList.includes(el);
      this.add.image(16 + i * 28, 320, 'ui', `element_icon_${el}_${owned ? 'normal' : 'locked'}`).setOrigin(0, 0);
    });
    this.add.image(GAME_WIDTH - 80, 322, 'ui', 'lives_icon').setOrigin(0, 0);
    this.add.text(GAME_WIDTH - 60, 322, `×${vitals.lives}`, textStyle(12)).setOrigin(0, 0);
    this.add.text(cx, 300, 'LEFT/RIGHT select  ESC title  DEL reset save', textStyle(10, PALETTE.neutral3)).setOrigin(0.5);

    const kb = this.input.keyboard;
    const move = (d: number) => {
      selected = Phaser.Math.Clamp(selected + d, 0, n - 1);
      sfx.play('menu');
      refresh();
    };
    kb?.on('keydown-LEFT', () => move(-1));
    kb?.on('keydown-A', () => move(-1));
    kb?.on('keydown-RIGHT', () => move(1));
    kb?.on('keydown-D', () => move(1));
    const play = () => {
      const l = ADVENTURE_LEVELS[selected];
      if (!progress.isUnlocked(l.key)) {
        sfx.play('deny');
        return;
      }
      sfx.play('menu');
      this.scene.start(SceneKey.Game, { level: l.key });
    };
    kb?.on('keydown-ENTER', play);
    kb?.on('keydown-SPACE', play);
    kb?.once('keydown-ESC', () => this.scene.start(SceneKey.Title));

    // ล้างเซฟต้องกดยืนยันซ้ำ
    let confirmReset = false;
    kb?.on('keydown-DELETE', () => {
      if (!confirmReset) {
        confirmReset = true;
        info.setText('Press DEL again to erase progress');
        this.time.delayedCall(2500, () => {
          confirmReset = false;
          refresh();
        });
        return;
      }
      progress.reset();
      this.scene.restart();
    });
  }
}
