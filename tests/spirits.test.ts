import { describe, expect, it } from 'vitest';
import { ATLASES, SPIRIT_KEYS, findAtlas, spiritAtlasKey, textureScale } from '../src/assets/manifest';

describe('spirit atlases', () => {
  it('puts Valvaliz and Eathy in the density-2 atlas, Burnil and Wata in the 32px atlas', () => {
    expect(spiritAtlasKey('burnil')).toBe('spirits');
    expect(spiritAtlasKey('wata')).toBe('spirits');
    expect(spiritAtlasKey('valvaliz')).toBe('spirits_hd');
    expect(spiritAtlasKey('eathy')).toBe('spirits_hd');
  });

  it('shows every spirit at the same 32×32 in-game size', () => {
    for (const k of SPIRIT_KEYS) {
      const atlas = findAtlas(spiritAtlasKey(k));
      const scale = textureScale(atlas.key);
      expect(atlas.frameWidth * scale).toBe(32);
      expect(atlas.frameHeight * scale).toBe(32);
    }
    expect(findAtlas('spirits_hd')).toMatchObject({ frameWidth: 64, frameHeight: 64, density: 2 });
  });

  it('declares idle/cast/icon of each spirit exactly once with unchanged frame counts and timing', () => {
    const spiritAtlases = ATLASES.filter((a) => a.key === 'spirits' || a.key === 'spirits_hd');
    for (const k of SPIRIT_KEYS) {
      const owner = spiritAtlases.filter((a) => a.anims.some((d) => d.name.startsWith(`${k}_`)));
      expect(owner.map((a) => a.key)).toEqual([spiritAtlasKey(k)]);
      const anims = owner[0].anims.filter((d) => d.name.startsWith(`${k}_`));
      expect(anims).toEqual([
        { name: `${k}_idle`, frames: 6, frameRate: 8, repeat: -1 },
        { name: `${k}_cast`, frames: 4, frameRate: 12, repeat: 0 },
      ]);
      expect(owner[0].stills).toContainEqual({ name: `${k}_icon` });
    }
  });
});
