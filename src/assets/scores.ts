import type { Score } from '../core/MusicScore';

/**
 * เพลงชั่วคราวสร้างด้วยโค้ด (chiptune: square, triangle, noise) จนกว่าจะมีไฟล์เพลงจริง
 * เมื่อวางไฟล์ `public/assets/audio/music/<ชื่อแทร็ก>.ogg` และ `.mp3` เกมจะใช้ไฟล์แทนโดยอัตโนมัติ
 * ชื่อแทร็กด้านล่างคือชื่อไฟล์ (GDD หัวข้อ 9: เพลงต่อโลก, บอส, Title, World Map)
 */
export type MusicName = 'title' | 'world_map' | 'world1' | 'boss' | 'stage_clear' | 'game_over';

export const MUSIC_NAMES: readonly MusicName[] = ['title', 'world_map', 'world1', 'boss', 'stage_clear', 'game_over'];

const join = (...bars: string[]): string => bars.join(' ');
/** อาร์เป็จจิโอ 16 step: โน้ต a b c b สลับ 4 รอบ (โน้ตละ 1 step) */
const arp16 = (a: string, b: string, c: string): string => Array(4).fill(`${a} ${b} ${c} ${b}`).join(' ');
/** อาร์เป็จจิโอ 16 step แบบช้า: โน้ตละ 2 step */
const arp8 = (a: string, b: string, c: string): string => Array(2).fill(`${a}:2 ${b}:2 ${c}:2 ${b}:2`).join(' ');
/** เบส 16 step: ราก ราก ห้า ราก ราก ห้า ออกเทฟ ห้า (โน้ตละ 2 step) */
const bass = (root: string, fifth: string, octave: string): string =>
  `${root}:2 ${root}:2 ${fifth}:2 ${root}:2 ${root}:2 ${fifth}:2 ${octave}:2 ${fifth}:2`;

// ---------------------------------------------------------------------------
// Ember Woods: D minor, ผจญภัย (8 ห้อง Dm Bb F C | Dm Bb C A)
// ---------------------------------------------------------------------------
const world1: Score = {
  bpm: 132,
  loop: true,
  channels: [
    {
      kind: 'tone',
      wave: 'square',
      gain: 0.1,
      notes: join(
        'A4:2 D5:2 F5:2 E5:1 D5:1 C5:2 A4:2 -:4',
        'D5:2 F5:2 A5:2 G5:1 F5:1 D5:4 -:4',
        'C5:2 F5:2 A5:2 G5:1 F5:1 E5:2 C5:2 -:4',
        'E5:2 G5:2 C6:2 B5:1 A5:1 G5:4 -:4',
        'D5:2 F5:2 A5:2 G5:1 F5:1 A5:2 D6:2 -:4',
        'Bb5:2 A5:2 G5:2 F5:2 D5:4 F5:2 -:2',
        'C5:2 E5:2 G5:2 E5:2 C5:2 E5:2 G5:2 C6:2',
        'A5:4 E5:2 C#5:2 A4:4 -:4',
      ),
    },
    {
      kind: 'tone',
      wave: 'square',
      gain: 0.045,
      notes: join(
        arp16('D4', 'F4', 'A4'),
        arp16('Bb3', 'D4', 'F4'),
        arp16('F4', 'A4', 'C5'),
        arp16('E4', 'G4', 'C5'),
        arp16('D4', 'F4', 'A4'),
        arp16('Bb3', 'D4', 'F4'),
        arp16('E4', 'G4', 'C5'),
        arp16('E4', 'A4', 'C#5'),
      ),
    },
    {
      kind: 'tone',
      wave: 'triangle',
      gain: 0.2,
      notes: join(
        bass('D2', 'A2', 'D3'),
        bass('Bb1', 'F2', 'Bb2'),
        bass('F2', 'C3', 'F3'),
        bass('C2', 'G2', 'C3'),
        bass('D2', 'A2', 'D3'),
        bass('Bb1', 'F2', 'Bb2'),
        bass('C2', 'G2', 'C3'),
        bass('A1', 'E2', 'A2'),
      ),
    },
    {
      kind: 'drums',
      gain: 0.1,
      notes: Array(8).fill('k h h h s h h h k h h k s h h h').join(' '),
    },
  ],
};

// ---------------------------------------------------------------------------
// Title: A minor, เงียบสงบ (Am F C G | Am F G Am)
// ---------------------------------------------------------------------------
const title: Score = {
  bpm: 92,
  loop: true,
  channels: [
    {
      kind: 'tone',
      wave: 'square',
      gain: 0.08,
      notes: join(
        'E5:6 A5:2 C6:4 B5:4',
        'A5:6 F5:2 A5:4 G5:4',
        'G5:6 E5:2 G5:4 C6:4',
        'B5:6 G5:2 D5:4 -:4',
        'E5:6 A5:2 C6:4 E6:4',
        'D6:6 C6:2 A5:4 F5:4',
        'G5:4 B5:4 D6:4 B5:4',
        'A5:12 -:4',
      ),
    },
    {
      kind: 'tone',
      wave: 'triangle',
      gain: 0.09,
      notes: join(
        arp8('A3', 'C4', 'E4'),
        arp8('F3', 'A3', 'C4'),
        arp8('C4', 'E4', 'G4'),
        arp8('G3', 'B3', 'D4'),
        arp8('A3', 'C4', 'E4'),
        arp8('F3', 'A3', 'C4'),
        arp8('G3', 'B3', 'D4'),
        arp8('A3', 'C4', 'E4'),
      ),
    },
    {
      kind: 'tone',
      wave: 'triangle',
      gain: 0.18,
      notes: join('A2:8 E3:8', 'F2:8 C3:8', 'C3:8 G2:8', 'G2:8 D3:8', 'A2:8 E3:8', 'F2:8 C3:8', 'G2:8 D3:8', 'A2:16'),
    },
  ],
};

// ---------------------------------------------------------------------------
// World Map: C major, สดใส (C Am F G | C Am Dm G)
// ---------------------------------------------------------------------------
const worldMap: Score = {
  bpm: 108,
  loop: true,
  channels: [
    {
      kind: 'tone',
      wave: 'square',
      gain: 0.085,
      notes: join(
        'E5:3 G5:1 C6:4 B5:2 G5:2 E5:4',
        'A5:3 E5:1 C5:4 E5:2 A5:2 C6:4',
        'A5:3 C6:1 F6:4 E6:2 C6:2 A5:4',
        'G5:3 B5:1 D6:4 B5:2 G5:2 D5:4',
        'C6:3 B5:1 G5:4 E5:2 G5:2 C6:4',
        'C6:3 A5:1 E5:4 A5:2 C6:2 E6:4',
        'D6:3 A5:1 F5:4 A5:2 D6:2 F6:4',
        'B5:3 D6:1 G6:4 D6:2 B5:2 G5:4',
      ),
    },
    {
      kind: 'tone',
      wave: 'triangle',
      gain: 0.08,
      notes: join(
        arp8('C4', 'E4', 'G4'),
        arp8('A3', 'C4', 'E4'),
        arp8('F3', 'A3', 'C4'),
        arp8('G3', 'B3', 'D4'),
        arp8('C4', 'E4', 'G4'),
        arp8('A3', 'C4', 'E4'),
        arp8('D4', 'F4', 'A4'),
        arp8('G3', 'B3', 'D4'),
      ),
    },
    {
      kind: 'tone',
      wave: 'triangle',
      gain: 0.18,
      notes: join(
        'C3:4 G3:4 C3:4 G3:4',
        'A2:4 E3:4 A2:4 E3:4',
        'F2:4 C3:4 F2:4 C3:4',
        'G2:4 D3:4 G2:4 D3:4',
        'C3:4 G3:4 C3:4 G3:4',
        'A2:4 E3:4 A2:4 E3:4',
        'D3:4 A3:4 D3:4 A3:4',
        'G2:4 D3:4 G2:4 D3:4',
      ),
    },
  ],
};

// ---------------------------------------------------------------------------
// Boss: E minor, เร่งเร้า (Em Em C D | Em Em C B)
// ---------------------------------------------------------------------------
const bossBass = (n: string, low: string): string => Array(4).fill(`${n}:1 ${n}:1 ${low}:1 ${n}:1`).join(' ');
const boss: Score = {
  bpm: 156,
  loop: true,
  channels: [
    {
      kind: 'tone',
      wave: 'square',
      gain: 0.1,
      notes: join(
        'E5:2 G5:2 B5:2 G5:2 E5:2 G5:2 B5:4',
        'B5:2 A5:2 G5:2 A5:2 B5:4 -:4',
        'C6:2 B5:2 G5:2 E5:2 G5:4 E5:4',
        'F#5:2 A5:2 D6:2 A5:2 F#5:4 A5:4',
        'E6:2 D6:2 B5:2 G5:2 E5:2 G5:2 B5:4',
        'G5:2 B5:2 E6:2 B5:2 G6:4 E6:4',
        'C6:2 E6:2 G6:2 E6:2 C6:2 B5:2 A5:2 G5:2',
        'B5:2 D#6:2 F#6:2 D#6:2 B5:4 -:4',
      ),
    },
    {
      kind: 'tone',
      wave: 'sawtooth',
      gain: 0.12,
      notes: join(
        bossBass('E2', 'E3'),
        bossBass('E2', 'E3'),
        bossBass('C2', 'C3'),
        bossBass('D2', 'D3'),
        bossBass('E2', 'E3'),
        bossBass('E2', 'E3'),
        bossBass('C2', 'C3'),
        bossBass('B1', 'B2'),
      ),
    },
    {
      kind: 'drums',
      gain: 0.11,
      notes: Array(8).fill('k h h h s h k h k h h k s h s s').join(' '),
    },
  ],
};

// ---------------------------------------------------------------------------
// Jingle (เล่นครั้งเดียว)
// ---------------------------------------------------------------------------
const stageClear: Score = {
  bpm: 144,
  loop: false,
  channels: [
    { kind: 'tone', wave: 'square', gain: 0.11, notes: 'C5:2 E5:2 G5:2 C6:6 G5:2 C6:2 E6:2 G6:8 -:6' },
    { kind: 'tone', wave: 'triangle', gain: 0.18, notes: 'C3:8 G3:8 C3:8 C3:8' },
  ],
};

const gameOver: Score = {
  bpm: 96,
  loop: false,
  channels: [
    { kind: 'tone', wave: 'square', gain: 0.1, notes: 'E5:4 D5:4 C5:4 B4:4 A4:12 -:4' },
    { kind: 'tone', wave: 'triangle', gain: 0.18, notes: 'A2:16 E2:16' },
  ],
};

export const SCORES: Readonly<Record<MusicName, Score>> = {
  title,
  world_map: worldMap,
  world1,
  boss,
  stage_clear: stageClear,
  game_over: gameOver,
};
