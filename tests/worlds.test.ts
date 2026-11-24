import { describe, expect, it } from 'vitest';
import { initialSelection, stepSelection, worldIndexOf } from '../src/core/Worlds';
import { SINGLE_JUMP_RULES, WATER_WORLD_RULES } from '../src/core/LevelLint';
import { ADVENTURE_LEVELS, ADVENTURE_ORDER, WORLDS, levelMusic, worldOfLevel } from '../src/levels';
import { MUSIC_NAMES } from '../src/assets/scores';

const world = (...keys: string[]) => ({ levels: keys.map((key) => ({ key })) });
const three = [world('a1', 'a2', 'a3'), world('b1', 'b2'), world()];

describe('worldIndexOf', () => {
  it('finds the world of a level', () => {
    expect(worldIndexOf(three, 'a2')).toBe(0);
    expect(worldIndexOf(three, 'b1')).toBe(1);
    expect(worldIndexOf(three, 'nope')).toBe(-1);
    expect(worldIndexOf(three, undefined)).toBe(-1);
  });
});

describe('initialSelection', () => {
  const unlocked = (...keys: string[]) => (k: string) => keys.includes(k);

  it('opens on the focused level when given', () => {
    expect(initialSelection(three, unlocked('a1'), 'b2')).toEqual({ world: 1, level: 1 });
  });

  it('otherwise opens on the latest unlocked level, across worlds', () => {
    expect(initialSelection(three, unlocked('a1'))).toEqual({ world: 0, level: 0 });
    expect(initialSelection(three, unlocked('a1', 'a2'))).toEqual({ world: 0, level: 1 });
    expect(initialSelection(three, unlocked('a1', 'a2', 'a3', 'b1'))).toEqual({ world: 1, level: 0 });
  });

  it('falls back to the first level when nothing is unlocked or the focus is unknown', () => {
    expect(initialSelection(three, unlocked(), 'nope')).toEqual({ world: 0, level: 0 });
  });
});

describe('stepSelection', () => {
  it('moves inside a world', () => {
    expect(stepSelection(three, { world: 0, level: 0 }, 1)).toEqual({ world: 0, level: 1 });
    expect(stepSelection(three, { world: 0, level: 2 }, -1)).toEqual({ world: 0, level: 1 });
  });

  it('crosses to the neighbouring world at the edge: first level going right, last level going left', () => {
    expect(stepSelection(three, { world: 0, level: 2 }, 1)).toEqual({ world: 1, level: 0 });
    expect(stepSelection(three, { world: 1, level: 0 }, -1)).toEqual({ world: 0, level: 2 });
  });

  it('enters and leaves a world without levels', () => {
    expect(stepSelection(three, { world: 1, level: 1 }, 1)).toEqual({ world: 2, level: -1 });
    expect(stepSelection(three, { world: 2, level: -1 }, -1)).toEqual({ world: 1, level: 1 });
  });

  it('stays put at both ends of the map', () => {
    expect(stepSelection(three, { world: 0, level: 0 }, -1)).toEqual({ world: 0, level: 0 });
    expect(stepSelection(three, { world: 2, level: -1 }, 1)).toEqual({ world: 2, level: -1 });
  });
});

describe('WORLDS', () => {
  it('numbers worlds from 1 and keeps the adventure order world by world', () => {
    expect(WORLDS.map((w) => w.id)).toEqual(WORLDS.map((_w, i) => i + 1));
    expect(ADVENTURE_ORDER).toEqual(WORLDS.flatMap((w) => w.levels.map((l) => l.key)));
    expect(new Set(ADVENTURE_ORDER).size).toBe(ADVENTURE_ORDER.length);
  });

  it('prefixes level keys and names with the world number', () => {
    for (const w of WORLDS) {
      w.levels.forEach((l, i) => {
        expect(l.key).toBe(`w${w.id}_${i + 1}`);
        expect(l.name.startsWith(`${w.id}-${i + 1} `), l.name).toBe(true);
      });
    }
  });

  it('gives every world a known music track and lint rules', () => {
    for (const w of WORLDS) expect(MUSIC_NAMES).toContain(w.music);
    expect(WORLDS[0].lint).toBe(SINGLE_JUMP_RULES);
    expect(WORLDS[1].lint).toBe(WATER_WORLD_RULES);
    expect(WATER_WORLD_RULES.allowedObjects).toEqual(expect.arrayContaining([...SINGLE_JUMP_RULES.allowedObjects, 'water', 'seed']));
    // still single jump: the movement limits do not change until Valvaliz (world 3)
    expect({ ...WATER_WORLD_RULES, allowedObjects: [] }).toEqual({ ...SINGLE_JUMP_RULES, allowedObjects: [] });
  });

  it('looks up the world and music of a level', () => {
    for (const l of ADVENTURE_LEVELS) expect(worldOfLevel(l.key)?.levels).toContain(l);
    expect(worldOfLevel('lab')).toBeUndefined();
    expect(levelMusic('w1_2')).toBe('world1');
    expect(levelMusic('lab')).toBe('world1');
  });
});
