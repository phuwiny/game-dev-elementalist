import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, RENDER_SCALE } from './config/constants';
import { PlayerBalance } from './config/balance';
import { PALETTE } from './assets/palette';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TitleScene } from './scenes/TitleScene';
import { WorldMapScene } from './scenes/WorldMapScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { GameOverScene, StageClearScene } from './scenes/EndScenes';
import { SettingsScene } from './scenes/SettingsScene';

const game = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game',
  width: GAME_WIDTH * RENDER_SCALE,
  height: GAME_HEIGHT * RENDER_SCALE,
  backgroundColor: PALETTE.outline,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: PlayerBalance.gravity },
      debug: new URLSearchParams(window.location.search).has('debug'),
    },
  },
  // SettingsScene อยู่หลัง UIScene เพื่อให้เปิดซ้อนบนหน้า Pause ได้
  scene: [BootScene, PreloadScene, TitleScene, WorldMapScene, GameScene, UIScene, SettingsScene, GameOverScene, StageClearScene],
});

// เปิดให้ทดสอบผ่าน console / automated test ได้
(window as unknown as { __game: Phaser.Game }).__game = game;
