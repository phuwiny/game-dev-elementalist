import Phaser from 'phaser';
import { SceneKey } from '../config/constants';
import { VitalsBalance } from '../config/balance';
import { Vitals } from '../core/Vitals';
import { ANIMATIONS_JSON, ATLASES } from '../assets/manifest';
import { probeJson } from '../assets/probe';

export const REGISTRY_VITALS = 'vitals';
export const REGISTRY_AVAILABLE_JSON = 'available-json';

/** ตั้งค่าที่ต้องมีก่อนโหลด และตรวจว่า asset ไหนมีไฟล์จริงแล้ว */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Boot);
  }

  create(): void {
    this.registry.set(REGISTRY_VITALS, new Vitals(VitalsBalance));
    const urls = [...ATLASES.map((a) => a.json), ANIMATIONS_JSON];
    void probeJson(urls).then((found) => {
      this.registry.set(REGISTRY_AVAILABLE_JSON, found);
      this.scene.start(SceneKey.Preload);
    });
  }
}
