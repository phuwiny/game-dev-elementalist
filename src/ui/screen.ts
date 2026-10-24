import type Phaser from 'phaser';
import { RENDER_SCALE } from '../config/constants';

/**
 * กล้องของหน้าเมนูและ HUD: วางของด้วยพิกัด logical 640×360 แล้วขยายเต็ม canvas 1280×720
 */
export function useUiCamera(scene: Phaser.Scene): Phaser.Cameras.Scene2D.Camera {
  return scene.cameras.main.setOrigin(0, 0).setZoom(RENDER_SCALE);
}
