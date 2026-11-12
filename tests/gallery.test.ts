import { describe, expect, it } from 'vitest';
import { isGalleryUnlocked, newlyUnlocked, unlockedGallery, type ShardRecord } from '../src/core/Gallery';
import { GALLERY_IMAGES } from '../src/assets/manifest';
import { ADVENTURE_LEVELS } from '../src/levels';

const record = (shards: Record<string, number[]>): ShardRecord => ({ collectedShards: (level) => shards[level] ?? [] });

describe('Gallery', () => {
  it('has one image per adventure level, each under assets/gallery', () => {
    expect(GALLERY_IMAGES.map((g) => g.level)).toEqual(ADVENTURE_LEVELS.map((l) => l.key));
    for (const g of GALLERY_IMAGES) expect(g.png).toBe(`assets/gallery/${g.key}.png`);
    expect(new Set(GALLERY_IMAGES.map((g) => g.key)).size).toBe(GALLERY_IMAGES.length);
  });

  it('unlocks a level image only with all three of its Spirit Shards', () => {
    const r = record({ w1_1: [0, 1, 2], w1_2: [0, 2] });
    const [a, b, c] = GALLERY_IMAGES;
    expect(isGalleryUnlocked(r, a)).toBe(true);
    expect(isGalleryUnlocked(r, b)).toBe(false);
    expect(isGalleryUnlocked(r, c)).toBe(false);
    expect(unlockedGallery(r, GALLERY_IMAGES).map((g) => g.key)).toEqual([a.key]);
  });

  it('reports an image as new only on the clear that completes the set', () => {
    const r = record({ w1_2: [0, 1, 2] });
    expect(newlyUnlocked(r, GALLERY_IMAGES, 'w1_2', 2).map((g) => g.level)).toEqual(['w1_2']);
    expect(newlyUnlocked(r, GALLERY_IMAGES, 'w1_2', 3)).toEqual([]); // already complete before this clear
    expect(newlyUnlocked(record({ w1_2: [0, 1] }), GALLERY_IMAGES, 'w1_2', 1)).toEqual([]);
  });
});
