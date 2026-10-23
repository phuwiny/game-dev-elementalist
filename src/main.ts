import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config/constants';
import { PlayerBalance } from './config/balance';
import { PALETTE } from './assets/palette';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TitleScene } from './scenes/TitleScene';
import { WorldMapScene } from './scenes/WorldMapScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { GameOverScene, StageClearScene } from './scenes/EndScenes';

const game = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
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
  scene: [BootScene, PreloadScene, TitleScene, WorldMapScene, GameScene, UIScene, GameOverScene, StageClearScene],
});

// เปิดให้ทดสอบผ่าน console / automated test ได้
(window as unknown as { __game: Phaser.Game }).__game = game;
