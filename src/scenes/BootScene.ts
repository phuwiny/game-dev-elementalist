import Phaser from 'phaser';
import { SceneKey } from '../config/constants';
import { VitalsBalance } from '../config/balance';
import { Vitals } from '../core/Vitals';
import { Progress } from '../core/Progress';
import { SaveStore } from '../core/SaveStore';
import { ADVENTURE_ORDER } from '../levels';
import { ANIMATIONS_JSON, ATLASES, GALLERY_IMAGES } from '../assets/manifest';
import { probeFiles, probeJson } from '../assets/probe';

export const REGISTRY_VITALS = 'vitals';
export const REGISTRY_AVAILABLE_JSON = 'available-json';
export const REGISTRY_PROGRESS = 'progress';

/** ตั้งค่าที่ต้องมีก่อนโหลด และตรวจว่า asset ไหนมีไฟล์จริงแล้ว */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Boot);
  }

  create(): void {
    this.registry.set(REGISTRY_VITALS, new Vitals(VitalsBalance));
    this.registry.set(REGISTRY_PROGRESS, new Progress(ADVENTURE_ORDER, new SaveStore()));
    const urls = [...ATLASES.map((a) => a.json), ANIMATIONS_JSON];
    // ภาพ gallery ยังไม่มีไฟล์ได้ (Codex export ทีหลัง) ตรวจก่อนเหมือน JSON เพื่อไม่ให้ console เต็มไปด้วย error
    void Promise.all([probeJson(urls), probeFiles(GALLERY_IMAGES.map((g) => g.png), 'image/')]).then(([json, images]) => {
      const found = new Set([...json, ...images]);
      this.registry.set(REGISTRY_AVAILABLE_JSON, found);
      this.scene.start(SceneKey.Preload);
    });
  }
}
