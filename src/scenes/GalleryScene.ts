import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SceneKey } from '../config/constants';
import { PALETTE, hex } from '../assets/palette';
import { GALLERY_IMAGES } from '../assets/manifest';
import { isGalleryUnlocked, unlockedGallery } from '../core/Gallery';
import { SHARDS_PER_LEVEL } from '../core/LevelParser';
import type { Progress } from '../core/Progress';
import { LEVELS } from '../levels';
import { textStyle } from '../ui/text';
import { useUiCamera } from '../ui/screen';
import { addPanel } from '../ui/widgets';
import { addSaveWarning } from '../ui/saveWarning';
import { sfx } from '../systems/Sfx';
import { music } from '../systems/Music';
import { REGISTRY_PROGRESS } from './BootScene';

/** กรอบภาพในหน้า gallery (logical px) และขอบ panel รอบภาพ */
const VIEW = { width: 416, height: 234, y: 184 } as const;
const PANEL_PAD = 14;

/**
 * Concept art gallery (GDD หัวข้อ 4): ภาพละด่าน ปลดล็อกเมื่อเก็บ Spirit Shard ครบ 3 ชิ้นของด่านนั้น
 * เปิดจากเมนู Title หรือกด G ที่ World Map แล้วกลับไปหน้าที่เปิดมา
 */
export class GalleryScene extends Phaser.Scene {
  /** สถานะให้สคริปต์ e2e อ่าน */
  selectedKey = '';
  fullView = false;

  constructor() {
    super(SceneKey.Gallery);
  }

  create(data?: { from?: string }): void {
    const progress = this.registry.get(REGISTRY_PROGRESS) as Progress;
    const back = data?.from === SceneKey.WorldMap ? SceneKey.WorldMap : SceneKey.Title;
    useUiCamera(this).setBackgroundColor(PALETTE.outline);
    addSaveWarning(this);
    music.play('title');
    const cx = GAME_WIDTH / 2;
    const total = GALLERY_IMAGES.length;
    this.fullView = false;

    const heading = this.add.text(cx, 18, 'GALLERY', textStyle(20, PALETTE.gold)).setOrigin(0.5);
    const unlockedText = this.add
      .text(cx, 38, `Unlocked ${unlockedGallery(progress, GALLERY_IMAGES).length}/${total}`, textStyle(10, PALETTE.pink3))
      .setOrigin(0.5);

    const frame = addPanel(
      this,
      cx - VIEW.width / 2 - PANEL_PAD,
      VIEW.y - VIEW.height / 2 - PANEL_PAD,
      VIEW.width + PANEL_PAD * 2,
      VIEW.height + PANEL_PAD * 2,
    );
    const image = this.add.image(cx, VIEW.y, GALLERY_IMAGES[0].key);
    // ภาพที่ยังล็อก: กล่องมืดแทนภาพ ไม่ให้เห็นเนื้อหาก่อนปลดล็อก
    const lockedBox = this.add.rectangle(cx, VIEW.y, VIEW.width, VIEW.height, hex(PALETTE.neutral1));
    const lockedText = this.add
      .text(cx, VIEW.y, '', { ...textStyle(12, PALETTE.neutral4), align: 'center', wordWrap: { width: VIEW.width - 48 } })
      .setOrigin(0.5);
    const caption = this.add.text(cx, VIEW.y + VIEW.height / 2 + PANEL_PAD + 12, '', textStyle(12)).setOrigin(0.5);
    // ลำดับภาพชิดขวาบรรทัดเดียวกับชื่อภาพ
    const counter = this.add.text(cx + VIEW.width / 2 + PANEL_PAD, caption.y, '', textStyle(10, PALETTE.neutral3)).setOrigin(1, 0.5);
    const hint = this.add.text(cx, GAME_HEIGHT - 14, '', textStyle(10, PALETTE.neutral3)).setOrigin(0.5);
    // ทุกอย่างนอกจากภาพ ซ่อนตอนดูเต็มจอ
    const chrome = [heading, unlockedText, frame, caption, counter, hint];

    let index = 0;
    const levelName = (level: string) => LEVELS.find((l) => l.key === level)?.name ?? level;
    const fit = (w: number, h: number) => Math.min(w / image.frame.width, h / image.frame.height);

    const refresh = () => {
      const entry = GALLERY_IMAGES[index];
      const open = isGalleryUnlocked(progress, entry);
      this.selectedKey = entry.key;
      image.setTexture(entry.key).setVisible(open);
      if (this.fullView) {
        image.setPosition(cx, GAME_HEIGHT / 2).setScale(fit(GAME_WIDTH, GAME_HEIGHT));
      } else {
        image.setPosition(cx, VIEW.y).setScale(fit(VIEW.width, VIEW.height));
      }
      lockedBox.setVisible(!open && !this.fullView);
      const have = progress.collectedShards(entry.level).length;
      lockedText
        .setVisible(!open && !this.fullView)
        .setText(`LOCKED\n\nCollect all ${SHARDS_PER_LEVEL} Spirit Shards in\n${levelName(entry.level)}\n\nShards ${have}/${SHARDS_PER_LEVEL}`);
      caption.setText(open ? levelName(entry.level) : '???');
      counter.setText(`${index + 1} / ${total}`);
      hint.setText(open ? 'LEFT/RIGHT browse   ENTER full view   ESC back' : 'LEFT/RIGHT browse   ESC back');
      chrome.forEach((o) => o.setVisible(!this.fullView));
    };
    refresh();

    const kb = this.input.keyboard;
    const move = (d: number) => {
      if (this.fullView) return;
      index = (index + d + total) % total;
      sfx.play('menu');
      refresh();
    };
    kb?.on('keydown-LEFT', () => move(-1));
    kb?.on('keydown-A', () => move(-1));
    kb?.on('keydown-RIGHT', () => move(1));
    kb?.on('keydown-D', () => move(1));
    kb?.on('keydown-ENTER', () => {
      if (!isGalleryUnlocked(progress, GALLERY_IMAGES[index])) {
        sfx.play('deny');
        return;
      }
      this.fullView = !this.fullView;
      sfx.play('menu');
      refresh();
    });
    kb?.on('keydown-ESC', () => {
      sfx.play('menu');
      if (this.fullView) {
        this.fullView = false;
        refresh();
        return;
      }
      this.scene.start(back);
    });
  }
}
