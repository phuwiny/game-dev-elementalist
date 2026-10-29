import { SaveStore } from '../core/SaveStore';

/**
 * เสียงชั่วคราวสร้างด้วย Web Audio (ยังไม่มีไฟล์เสียงจริง GDD หัวข้อ 9)
 * เมื่อมีไฟล์ .ogg/.mp3 จะเปลี่ยนไปใช้ AudioManager ที่โหลดไฟล์แทน โดยใช้ชื่อเสียงชุดเดียวกัน
 *
 * browser ไม่ให้เล่นเสียงก่อนผู้เล่นกดปุ่มหรือคลิก จึงต้องเรียก unlock() จากหน้า Title
 */

export type SfxName =
  | 'jump'
  | 'double_jump'
  | 'slash'
  | 'hit'
  | 'block'
  | 'enemy_die'
  | 'hurt'
  | 'die'
  | 'coin'
  | 'one_up'
  | 'heart'
  | 'shard'
  | 'checkpoint'
  | 'spirit'
  | 'switch'
  | 'fire'
  | 'water'
  | 'wind'
  | 'earth'
  | 'slam'
  | 'deny'
  | 'burn'
  | 'freeze'
  | 'gate'
  | 'menu'
  | 'boss_roar'
  | 'boss_hit'
  | 'whip'
  | 'clear';

type Wave = OscillatorType | 'noise';

interface Tone {
  wave: Wave;
  from: number;
  to?: number;
  ms: number;
  gain?: number;
  delayMs?: number;
}

const SOUNDS: Record<SfxName, Tone[]> = {
  jump: [{ wave: 'square', from: 280, to: 520, ms: 110, gain: 0.12 }],
  double_jump: [{ wave: 'square', from: 420, to: 820, ms: 120, gain: 0.12 }],
  slash: [{ wave: 'noise', from: 2400, to: 900, ms: 90, gain: 0.18 }],
  hit: [{ wave: 'square', from: 180, to: 90, ms: 80, gain: 0.2 }],
  block: [{ wave: 'triangle', from: 1400, to: 1200, ms: 70, gain: 0.15 }],
  enemy_die: [{ wave: 'noise', from: 900, to: 200, ms: 220, gain: 0.2 }],
  hurt: [{ wave: 'sawtooth', from: 300, to: 120, ms: 200, gain: 0.18 }],
  die: [
    { wave: 'square', from: 440, to: 220, ms: 180, gain: 0.15 },
    { wave: 'square', from: 220, to: 110, ms: 260, gain: 0.15, delayMs: 180 },
  ],
  coin: [
    { wave: 'square', from: 988, ms: 60, gain: 0.08 },
    { wave: 'square', from: 1319, ms: 120, gain: 0.08, delayMs: 60 },
  ],
  one_up: [
    { wave: 'square', from: 660, ms: 80, gain: 0.1 },
    { wave: 'square', from: 880, ms: 80, gain: 0.1, delayMs: 90 },
    { wave: 'square', from: 1320, ms: 160, gain: 0.1, delayMs: 180 },
  ],
  heart: [{ wave: 'triangle', from: 520, to: 1040, ms: 200, gain: 0.15 }],
  shard: [
    { wave: 'triangle', from: 880, to: 1320, ms: 110, gain: 0.14 },
    { wave: 'triangle', from: 1320, to: 1760, ms: 160, gain: 0.14, delayMs: 100 },
    { wave: 'square', from: 1760, ms: 120, gain: 0.05, delayMs: 200 },
  ],
  checkpoint: [
    { wave: 'triangle', from: 523, ms: 100, gain: 0.15 },
    { wave: 'triangle', from: 784, ms: 200, gain: 0.15, delayMs: 100 },
  ],
  spirit: [
    { wave: 'triangle', from: 523, ms: 120, gain: 0.15 },
    { wave: 'triangle', from: 659, ms: 120, gain: 0.15, delayMs: 120 },
    { wave: 'triangle', from: 1047, ms: 300, gain: 0.15, delayMs: 240 },
  ],
  switch: [{ wave: 'triangle', from: 700, to: 1000, ms: 70, gain: 0.1 }],
  fire: [{ wave: 'noise', from: 600, to: 1800, ms: 160, gain: 0.18 }],
  water: [{ wave: 'sine', from: 500, to: 900, ms: 140, gain: 0.2 }],
  wind: [{ wave: 'noise', from: 3000, to: 1200, ms: 220, gain: 0.12 }],
  earth: [{ wave: 'square', from: 110, to: 70, ms: 160, gain: 0.22 }],
  slam: [{ wave: 'noise', from: 400, to: 60, ms: 300, gain: 0.3 }],
  deny: [{ wave: 'square', from: 140, ms: 120, gain: 0.12 }],
  burn: [{ wave: 'noise', from: 1200, to: 400, ms: 260, gain: 0.12 }],
  freeze: [{ wave: 'triangle', from: 1600, to: 2400, ms: 160, gain: 0.1 }],
  gate: [{ wave: 'sawtooth', from: 90, to: 140, ms: 400, gain: 0.12 }],
  menu: [{ wave: 'square', from: 660, ms: 50, gain: 0.08 }],
  boss_roar: [{ wave: 'sawtooth', from: 120, to: 60, ms: 700, gain: 0.25 }],
  boss_hit: [{ wave: 'square', from: 220, to: 110, ms: 160, gain: 0.25 }],
  whip: [{ wave: 'noise', from: 2000, to: 500, ms: 260, gain: 0.15 }],
  clear: [
    { wave: 'square', from: 523, ms: 120, gain: 0.12 },
    { wave: 'square', from: 659, ms: 120, gain: 0.12, delayMs: 130 },
    { wave: 'square', from: 784, ms: 120, gain: 0.12, delayMs: 260 },
    { wave: 'square', from: 1047, ms: 360, gain: 0.12, delayMs: 390 },
  ],
};

const MUTE_KEY = 'muted';

class SfxPlayer {
  private ctx: AudioContext | null = null;
  private noise: AudioBuffer | null = null;
  private readonly store = new SaveStore();
  private _muted = this.store.load<boolean>(MUTE_KEY, false) === true;
  private readonly lastPlayed = new Map<SfxName, number>();

  get muted(): boolean {
    return this._muted;
  }

  /** เรียกจาก input ของผู้เล่น (คลิก/กดปุ่ม) ก่อนเล่นเสียงครั้งแรก */
  unlock(): void {
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  toggleMute(): boolean {
    this._muted = !this._muted;
    this.store.save(MUTE_KEY, this._muted);
    return this._muted;
  }

  play(name: SfxName): void {
    const ctx = this.ctx;
    if (!ctx || this._muted || ctx.state !== 'running') return;
    // กันเสียงเดียวกันซ้อนกันใน frame เดียว (เช่น เถาวัลย์หลายชิ้นติดไฟพร้อมกัน)
    const now = performance.now();
    if (now - (this.lastPlayed.get(name) ?? 0) < 40) return;
    this.lastPlayed.set(name, now);
    for (const tone of SOUNDS[name]) this.playTone(ctx, tone);
  }

  private playTone(ctx: AudioContext, t: Tone): void {
    const start = ctx.currentTime + (t.delayMs ?? 0) / 1000;
    const end = start + t.ms / 1000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(t.gain ?? 0.15, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(ctx.destination);

    if (t.wave === 'noise') {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(t.from, start);
      if (t.to) filter.frequency.exponentialRampToValueAtTime(t.to, end);
      src.connect(filter).connect(gain);
      src.start(start);
      src.stop(end);
      return;
    }
    const osc = ctx.createOscillator();
    osc.type = t.wave;
    osc.frequency.setValueAtTime(t.from, start);
    if (t.to) osc.frequency.exponentialRampToValueAtTime(t.to, end);
    osc.connect(gain);
    osc.start(start);
    osc.stop(end);
  }

  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noise) return this.noise;
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    this.noise = buf;
    return buf;
  }
}

export const sfx = new SfxPlayer();
