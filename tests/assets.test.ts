import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ATLASES, frameName } from '../src/assets/manifest';

const publicPath = (file: string) => new URL(`../public/${file}`, import.meta.url);

/**
 * ทุก frame ที่ manifest ประกาศต้องมีอยู่ใน atlas จริงที่ Codex ส่งมาแล้ว
 * ไม่งั้นเกมจะเติม placeholder ลงไปเงียบๆ (texture `<atlas>__fill`) และภาพหยาบโผล่ในเกม
 */
describe('delivered atlases cover the manifest', () => {
  for (const atlas of ATLASES) {
    const file = publicPath(atlas.json);
    it.skipIf(!existsSync(file))(`${atlas.key} has every frame the game asks for`, () => {
      const frames = (JSON.parse(readFileSync(file, 'utf8')) as { frames: Record<string, unknown> }).frames;
      const wanted = [
        ...atlas.anims.flatMap((a) => Array.from({ length: a.frames }, (_, i) => frameName(a.name, i))),
        ...(atlas.stills ?? []).map((s) => s.name),
      ];
      expect(wanted.filter((n) => !(n in frames))).toEqual([]);
    });
  }
});
