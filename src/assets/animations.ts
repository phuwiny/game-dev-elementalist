import type Phaser from 'phaser';
import { ATLASES, animKey, frameName } from './manifest';
import { atlasTextureFor } from './frames';

interface AnimOverride {
  atlas?: string;
  prefix?: string;
  frames?: number;
  frameRate?: number;
  repeat?: number;
}

/**
 * สร้าง animation ทุกตัวจาก manifest.ts
 * ถ้ามี animations.json (ART_HANDOFF.md หัวข้อ 3.7) ค่าในนั้นจะทับค่าเริ่มต้น
 * frame ที่ไม่มีอยู่ใน texture จะถูกข้ามพร้อม warning แทนที่จะทำให้เกมพัง
 */
export function registerAnimations(scene: Phaser.Scene, overrides: unknown): void {
  const table = isRecord(overrides) ? (overrides as Record<string, AnimOverride>) : {};

  for (const atlas of ATLASES) {
    for (const def of atlas.anims) {
      const key = animKey(atlas.key, def.name);
      const o = table[key] ?? {};
      const count = positiveInt(o.frames) ?? def.frames;
      const prefix = typeof o.prefix === 'string' ? o.prefix : `${def.name}_`;

      const frames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let i = 0; i < count; i += 1) {
        const name = prefix.endsWith('_') ? frameName(prefix.slice(0, -1), i) : `${prefix}${i}`;
        const key = atlasTextureFor(scene.textures, atlas.key, name);
        if (scene.textures.get(key).has(name)) frames.push({ key, frame: name });
      }
      if (frames.length === 0) {
        console.warn(`[animations] "${key}" has no frames in atlas "${atlas.key}"`);
        continue;
      }
      if (frames.length < count) {
        console.warn(`[animations] "${key}" expected ${count} frames, found ${frames.length}`);
      }

      if (scene.anims.exists(key)) scene.anims.remove(key);
      scene.anims.create({
        key,
        frames,
        frameRate: positiveNumber(o.frameRate) ?? def.frameRate,
        repeat: typeof o.repeat === 'number' ? o.repeat : def.repeat,
      });
    }
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function positiveInt(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isInteger(v) && v > 0 ? v : undefined;
}

function positiveNumber(v: unknown): number | undefined {
  return typeof v === 'number' && v > 0 ? v : undefined;
}
