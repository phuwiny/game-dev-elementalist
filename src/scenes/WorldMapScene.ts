import Phaser from 'phaser';
import { GAME_WIDTH, SceneKey } from '../config/constants';
import { PALETTE, hex } from '../assets/palette';
import { animKey, textureScale } from '../assets/manifest';
import { textStyle } from '../ui/text';
import { useUiCamera } from '../ui/screen';
import { WORLDS } from '../levels';
import { initialSelection, type MapSelection, stepSelection } from '../core/Worlds';
import { ELEMENT_ORDER } from '../core/ElementSelector';
import type { Progress } from '../core/Progress';
import { SHARDS_PER_LEVEL } from '../core/LevelParser';
import type { Vitals } from '../core/Vitals';
import { sfx } from '../systems/Sfx';
import { music } from '../systems/Music';
import { addSaveWarning } from '../ui/saveWarning';
import { GALLERY_IMAGES } from '../assets/manifest';
import { unlockedGallery } from '../core/Gallery';
import { REGISTRY_PROGRESS, REGISTRY_VITALS } from './BootScene';

const NODE_Y = 190;
const nodeX = (i: number, n: number) => GAME_WIDTH / 2 + (i - (n - 1) / 2) * 140;

/**
 * แผนที่โลก (GDD หัวข้อ 8): เลือกด่านที่ปลดล็อกแล้ว ด่านถัดไปเปิดเมื่อผ่านด่านก่อนหน้า
 * แสดงทีละโลก เลื่อนซ้าย/ขวาเลยด่านริมสุดเพื่อข้ามไปโลกข้างเคียง (scene เริ่มใหม่ด้วย `select`)
 */
export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.WorldMap);
  }

  /** โลกและด่านที่เลือกอยู่ (e2e อ่านค่านี้) */
  selection: MapSelection = { world: 0, level: 0 };

  create(data?: { focus?: string; select?: MapSelection }): void {
    const progress = this.registry.get(REGISTRY_PROGRESS) as Progress;
    const vitals = this.registry.get(REGISTRY_VITALS) as Vitals;
    const sel = data?.select ?? initialSelection(WORLDS, (k) => progress.isUnlocked(k), data?.focus);
    this.selection = sel;
    const world = WORLDS[sel.world];
    const levels = world.levels;
    useUiCamera(this);
    this.cameras.main.setBackgroundColor(world.mapColor);
    const cx = GAME_WIDTH / 2;
    const n = levels.length;
    addSaveWarning(this);
    music.play('world_map');

    this.add.text(cx, 40, `WORLD ${world.id} · ${world.name.toUpperCase()}`, textStyle(20, PALETTE.gold)).setOrigin(0.5);
    const gallery = unlockedGallery(progress, GALLERY_IMAGES).length;
    this.add
      .text(cx, 62, `Spirit Shards ${progress.totalShards}/${progress.maxShards}   Gallery ${gallery}/${GALLERY_IMAGES.length}`, textStyle(10, PALETTE.pink3))
      .setOrigin(0.5);

    // โลกข้างเคียง: บอกว่าเลื่อนเลยขอบแล้วไปที่ไหน
    const prev = WORLDS[sel.world - 1];
    const next = WORLDS[sel.world + 1];
    if (prev) this.add.text(12, NODE_Y, `< ${prev.name}`, textStyle(10, PALETTE.neutral4)).setOrigin(0, 0.5);
    if (next) this.add.text(GAME_WIDTH - 12, NODE_Y, `${next.name} >`, textStyle(10, PALETTE.neutral4)).setOrigin(1, 0.5);

    // เส้นทางเชื่อมระหว่างด่าน
    const path = this.add.graphics();
    for (let i = 0; i < n - 1; i += 1) {
      const open = progress.isUnlocked(levels[i + 1].key);
      path.lineStyle(3, hex(open ? PALETTE.earth4 : PALETTE.neutral2), 1);
      path.lineBetween(nodeX(i, n) + 12, NODE_Y, nodeX(i + 1, n) - 12, NODE_Y);
    }

    const labels: Phaser.GameObjects.Text[] = [];
    levels.forEach((l, i) => {
      const state = progress.isCleared(l.key) ? 'cleared' : progress.isUnlocked(l.key) ? 'open' : 'locked';
      this.add.image(nodeX(i, n), NODE_Y, 'ui', `world_map_node_${state}`).setScale(2);
      labels.push(
        this.add.text(nodeX(i, n), NODE_Y + 28, l.name, textStyle(10, state === 'locked' ? PALETTE.neutral3 : PALETTE.highlight)).setOrigin(0.5, 0),
      );
      const got = progress.collectedShards(l.key).length;
      this.add
        .text(nodeX(i, n), NODE_Y + 44, `Shards ${got}/${SHARDS_PER_LEVEL}`, textStyle(10, got === SHARDS_PER_LEVEL ? PALETTE.pink3 : PALETTE.neutral3))
        .setOrigin(0.5, 0);
      if (l.boss) this.add.text(nodeX(i, n), NODE_Y - 34, 'BOSS', textStyle(10, PALETTE.fire)).setOrigin(0.5);
    });
    if (n === 0) this.add.text(cx, NODE_Y, 'Coming soon', textStyle(16, PALETTE.neutral4)).setOrigin(0.5);

    const selected = sel.level;
    const level = selected >= 0 ? levels[selected] : undefined;
    if (level) {
      const cursor = this.add.sprite(nodeX(selected, n), NODE_Y - 8, 'player', 'idle_000').setOrigin(0.5, 1).setScale(textureScale('player'));
      cursor.play(animKey('player', 'idle'));
      labels[selected].setFontStyle('bold');
    }

    const info = this.add.text(cx, 270, '', textStyle(12, PALETTE.neutral4)).setOrigin(0.5);
    const refresh = () => {
      if (!level) info.setText('No stages here yet');
      else info.setText(progress.isUnlocked(level.key) ? `ENTER  Play ${level.name}` : 'Locked: clear the previous stage');
    };
    refresh();

    // ภูตที่ได้แล้วและชีวิตคงเหลือ
    ELEMENT_ORDER.forEach((el, i) => {
      const owned = progress.spiritList.includes(el);
      this.add.image(16 + i * 28, 320, 'ui', `element_icon_${el}_${owned ? 'normal' : 'locked'}`).setOrigin(0, 0);
    });
    this.add.image(GAME_WIDTH - 80, 322, 'ui', 'lives_icon').setOrigin(0, 0);
    this.add.text(GAME_WIDTH - 60, 322, `×${vitals.lives}`, textStyle(12)).setOrigin(0, 0);
    this.add.text(cx, 300, 'LEFT/RIGHT select  G gallery  ESC title  DEL reset save', textStyle(10, PALETTE.neutral3)).setOrigin(0.5);

    const kb = this.input.keyboard;
    const move = (d: -1 | 1) => {
      const to = stepSelection(WORLDS, sel, d);
      if (to.world === sel.world && to.level === sel.level) return;
      sfx.play('menu');
      this.scene.restart({ select: to });
    };
    kb?.on('keydown-LEFT', () => move(-1));
    kb?.on('keydown-A', () => move(-1));
    kb?.on('keydown-RIGHT', () => move(1));
    kb?.on('keydown-D', () => move(1));
    const play = () => {
      if (!level || !progress.isUnlocked(level.key)) {
        sfx.play('deny');
        return;
      }
      sfx.play('menu');
      this.scene.start(SceneKey.Game, { level: level.key });
    };
    kb?.on('keydown-ENTER', play);
    kb?.on('keydown-SPACE', play);
    kb?.once('keydown-ESC', () => this.scene.start(SceneKey.Title));
    kb?.once('keydown-G', () => {
      sfx.play('menu');
      this.scene.start(SceneKey.Gallery, { from: SceneKey.WorldMap });
    });

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
      this.scene.restart({});
    });
  }
}
