/**
 * โน้ตเพลงชั่วคราวที่เล่นด้วย Web Audio (GDD หัวข้อ 9) ส่วนนี้ไม่ใช้ Phaser หรือ Web Audio
 * จึงทดสอบได้: แปลงข้อความโน้ตเป็นเหตุการณ์ต่อ step
 *
 * รูปแบบโน้ตของแต่ละ channel: โทเค็นคั่นด้วยช่องว่าง
 *   ชื่อโน้ต:ความยาว   เช่น `C#5:2` `Bb3:8` (ความยาวเป็น step 1/16 โน้ต ค่าเริ่มต้น 1)
 *   `-:4`              พัก 4 step
 *   ช่องกลอง           `k` กลองใหญ่, `s` สแนร์, `h` ไฮแฮต (ความยาว step เหมือนกัน)
 */

export type ToneWave = 'square' | 'triangle' | 'sawtooth' | 'sine';
export type Drum = 'k' | 's' | 'h';

export interface ToneChannel {
  kind: 'tone';
  wave: ToneWave;
  gain: number;
  notes: string;
}

export interface DrumChannel {
  kind: 'drums';
  gain: number;
  notes: string;
}

export type Channel = ToneChannel | DrumChannel;

export interface Score {
  bpm: number;
  /** true = เล่นวนจบแล้วเริ่มใหม่ (เพลงฉาก) false = เล่นครั้งเดียว (jingle) */
  loop: boolean;
  channels: readonly Channel[];
}

export interface NoteEvent {
  channel: number;
  /** ความถี่ (Hz) ของโน้ตเสียง หรือ undefined ถ้าเป็นกลอง */
  freq?: number;
  drum?: Drum;
  lenSteps: number;
}

export interface CompiledScore {
  stepSeconds: number;
  /** จำนวน step ทั้งเพลง */
  length: number;
  loop: boolean;
  /** เหตุการณ์ที่เริ่มในแต่ละ step */
  byStep: readonly (readonly NoteEvent[])[];
  channels: readonly Channel[];
}

const SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** ความถี่ของโน้ต เช่น `A4` = 440 Hz, `C#5`, `Bb3` */
export function noteFreq(name: string): number {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`Bad note "${name}"`);
  const midi = 12 * (Number(m[3]) + 1) + SEMITONES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 440 * 2 ** ((midi - 69) / 12);
}

interface Token {
  name: string;
  len: number;
}

function tokens(notes: string): Token[] {
  return notes
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((t) => {
      const [name, lenText] = t.split(':');
      const len = lenText === undefined ? 1 : Number(lenText);
      if (!name || !Number.isInteger(len) || len < 1) throw new Error(`Bad token "${t}"`);
      return { name, len };
    });
}

/** จำนวน step ของ channel (รวมช่วงพัก) */
export function channelLength(channel: Channel): number {
  return tokens(channel.notes).reduce((sum, t) => sum + t.len, 0);
}

/**
 * แปลง Score เป็นตารางเหตุการณ์ต่อ step ทุก channel ต้องยาวเท่ากัน
 * @throws Error ถ้าโทเค็นผิดรูปแบบ ชื่อกลองไม่รู้จัก หรือ channel ยาวไม่เท่ากัน
 */
export function compileScore(score: Score): CompiledScore {
  if (score.channels.length === 0) throw new Error('Score has no channels');
  const lengths = score.channels.map(channelLength);
  const length = lengths[0];
  if (lengths.some((l) => l !== length)) throw new Error(`Channels differ in length: ${lengths.join(', ')}`);
  const byStep: NoteEvent[][] = Array.from({ length }, () => []);
  score.channels.forEach((channel, ci) => {
    let step = 0;
    for (const t of tokens(channel.notes)) {
      if (t.name !== '-') {
        if (channel.kind === 'drums') {
          if (t.name !== 'k' && t.name !== 's' && t.name !== 'h') throw new Error(`Unknown drum "${t.name}"`);
          byStep[step].push({ channel: ci, drum: t.name, lenSteps: t.len });
        } else {
          byStep[step].push({ channel: ci, freq: noteFreq(t.name), lenSteps: t.len });
        }
      }
      step += t.len;
    }
  });
  return { stepSeconds: 60 / (score.bpm * 4), length, loop: score.loop, byStep, channels: score.channels };
}
