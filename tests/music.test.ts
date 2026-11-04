import { describe, expect, it } from 'vitest';
import { channelLength, compileScore, noteFreq, type Score } from '../src/core/MusicScore';
import { MUSIC_NAMES, SCORES } from '../src/assets/scores';

describe('noteFreq', () => {
  it('matches the equal-tempered scale', () => {
    expect(noteFreq('A4')).toBeCloseTo(440, 5);
    expect(noteFreq('C4')).toBeCloseTo(261.6256, 3);
    expect(noteFreq('A5')).toBeCloseTo(880, 5);
    expect(noteFreq('C#5')).toBeCloseTo(554.3653, 3);
    expect(noteFreq('Bb3')).toBeCloseTo(233.0819, 3);
  });

  it('rejects bad names', () => {
    expect(() => noteFreq('H4')).toThrow();
    expect(() => noteFreq('C')).toThrow();
  });
});

describe('compileScore', () => {
  const tiny = (a: string, b: string): Score => ({
    bpm: 120,
    loop: true,
    channels: [
      { kind: 'tone', wave: 'square', gain: 0.1, notes: a },
      { kind: 'drums', gain: 0.1, notes: b },
    ],
  });

  it('places notes, rests and drums on their steps', () => {
    const c = compileScore(tiny('A4:2 -:1 C5', 'k - s h'));
    expect(c.length).toBe(4);
    expect(c.stepSeconds).toBeCloseTo(60 / (120 * 4), 6);
    expect(c.byStep[0].map((e) => [e.channel, e.freq && Math.round(e.freq), e.drum, e.lenSteps])).toEqual([
      [0, 440, undefined, 2],
      [1, undefined, 'k', 1],
    ]);
    expect(c.byStep[1]).toEqual([]);
    expect(c.byStep[2].map((e) => e.drum)).toEqual(['s']);
    expect(c.byStep[3].map((e) => [e.channel, e.freq && Math.round(e.freq), e.drum])).toEqual([
      [0, 523, undefined],
      [1, undefined, 'h'],
    ]);
  });

  it('rejects channels of different length, bad tokens and unknown drums', () => {
    expect(() => compileScore(tiny('A4:2', 'k - s h'))).toThrow(/differ/);
    expect(() => compileScore(tiny('A4:0 A4:3', 'k - s h'))).toThrow(/Bad token/);
    expect(() => compileScore(tiny('A4:4', 'k - x h'))).toThrow(/Unknown drum/);
    expect(() => compileScore({ bpm: 100, loop: false, channels: [] })).toThrow();
  });
});

describe('built-in scores', () => {
  it.each(MUSIC_NAMES)('%s compiles with equal channel lengths and whole bars', (name) => {
    const score = SCORES[name];
    const compiled = compileScore(score);
    expect(compiled.length % 16, `${name} is not a whole number of 16-step bars`).toBe(0);
    for (const channel of score.channels) expect(channelLength(channel)).toBe(compiled.length);
    expect(compiled.byStep.some((s) => s.length > 0)).toBe(true);
  });

  it('loops the scene music and plays the jingles once', () => {
    for (const name of ['title', 'world_map', 'world1', 'boss'] as const) expect(SCORES[name].loop).toBe(true);
    for (const name of ['stage_clear', 'game_over'] as const) expect(SCORES[name].loop).toBe(false);
  });
});
