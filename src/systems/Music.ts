import { AudioBalance } from '../config/balance';
import { SCORES, type MusicName } from '../assets/scores';
import { compileScore, type CompiledScore, type Drum } from '../core/MusicScore';
import { sfx } from './Sfx';

/**
 * เพลงประกอบ (GDD หัวข้อ 9)
 * - ถ้ามีไฟล์ `assets/audio/music/<ชื่อ>.ogg` (หรือ `.mp3` ถ้า browser เล่น ogg ไม่ได้) ใช้ไฟล์
 * - ถ้าไม่มี เล่นเพลงชั่วคราวจาก `assets/scores.ts` ด้วย Web Audio (chiptune)
 * เปลี่ยนเพลงด้วยการค่อยๆ เบาลง/ดังขึ้น ปุ่ม M ปิดเสียงเพลงพร้อม SFX
 * browser ไม่ให้เล่นเสียงก่อนผู้เล่นกดปุ่มครั้งแรก: play() ก่อนหน้านั้นจะจำเพลงไว้แล้วเริ่มตอนปลดล็อก
 */

interface Running {
  name: MusicName;
  bus: GainNode;
  timer?: number;
  source?: AudioBufferSourceNode;
  /** ใช้เมื่อเล่นจาก score */
  compiled?: CompiledScore;
  step: number;
  nextTime: number;
}

/** เวลา (วินาที) ที่จัดคิวโน้ตไว้ล่วงหน้า */
const LOOKAHEAD = 0.25;
const TICK_MS = 40;

class MusicPlayer {
  private wanted: MusicName | null = null;
  private current: Running | null = null;
  private starting: MusicName | null = null;
  private token = 0;
  private master: GainNode | null = null;
  private ducked = false;
  private noise: AudioBuffer | null = null;
  private readonly compiled = new Map<MusicName, CompiledScore>();
  private readonly files = new Map<MusicName, Promise<AudioBuffer | null>>();

  constructor() {
    sfx.subscribe(() => this.sync());
    if (typeof document !== 'undefined') {
      // แท็บถูกซ่อน: หยุดเสียงทั้งหมด (เกมหยุดเองอยู่แล้ว) กลับมาแล้วเล่นต่อ
      document.addEventListener('visibilitychange', () => {
        const ctx = sfx.context;
        if (!ctx) return;
        if (document.hidden) void ctx.suspend();
        else void ctx.resume();
      });
    }
  }

  /** เพลงที่กำลังเล่น และเล่นจากไฟล์หรือจาก score (ไว้ตรวจใน test) */
  get state(): { name: MusicName; source: 'file' | 'score' } | null {
    return this.current ? { name: this.current.name, source: this.current.source ? 'file' : 'score' } : null;
  }

  /** ขอเล่นเพลงนี้ (ถ้ากำลังเล่นอยู่แล้วจะไม่เริ่มใหม่) */
  play(name: MusicName): void {
    this.wanted = name;
    this.sync();
  }

  stop(): void {
    this.wanted = null;
    this.sync();
  }

  /** ตอนหยุดเกม: ลดความดังเพลง */
  setDucked(on: boolean): void {
    this.ducked = on;
    this.sync();
  }

  private sync(): void {
    const ctx = sfx.context;
    if (!ctx) return;
    if (!this.master) {
      this.master = ctx.createGain();
      this.master.connect(ctx.destination);
    }
    const volume = sfx.muted ? 0 : AudioBalance.musicVolume * (this.ducked ? AudioBalance.duckFactor : 1);
    this.master.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);

    if (this.wanted === (this.current?.name ?? null) || this.wanted === this.starting) return;
    this.fadeOut(this.current);
    this.current = null;
    if (this.wanted) void this.start(this.wanted);
  }

  private async start(name: MusicName): Promise<void> {
    const ctx = sfx.context;
    if (!ctx || !this.master) return;
    const token = ++this.token;
    this.starting = name;
    const buffer = await this.fileFor(name, ctx);
    if (token !== this.token || this.wanted !== name) return; // ระหว่างโหลดมีการขอเพลงอื่นแล้ว
    this.starting = null;

    const score = SCORES[name];
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0.0001, ctx.currentTime);
    bus.gain.linearRampToValueAtTime(1, ctx.currentTime + (score.loop ? AudioBalance.fadeSeconds : 0.03));
    bus.connect(this.master);
    const run: Running = { name, bus, step: 0, nextTime: ctx.currentTime + 0.08 };
    this.current = run;

    if (buffer) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = score.loop;
      source.connect(bus);
      source.onended = () => this.finished(run);
      source.start();
      run.source = source;
      return;
    }
    run.compiled = this.compile(name);
    run.timer = window.setInterval(() => this.tick(run), TICK_MS);
    this.tick(run);
  }

  private compile(name: MusicName): CompiledScore {
    let c = this.compiled.get(name);
    if (!c) {
      c = compileScore(SCORES[name]);
      this.compiled.set(name, c);
    }
    return c;
  }

  private tick(run: Running): void {
    const ctx = sfx.context;
    const compiled = run.compiled;
    if (!ctx || !compiled || this.current !== run) return;
    while (run.nextTime < ctx.currentTime + LOOKAHEAD) {
      if (!compiled.loop && run.step >= compiled.length) {
        window.clearInterval(run.timer);
        window.setTimeout(() => this.finished(run), 1200); // ปล่อยให้โน้ตสุดท้ายจบ
        return;
      }
      for (const e of compiled.byStep[run.step % compiled.length]) {
        const channel = compiled.channels[e.channel];
        const end = run.nextTime + e.lenSteps * compiled.stepSeconds * 0.95;
        if (e.drum) this.drum(ctx, run.bus, e.drum, run.nextTime, channel.gain);
        else if (e.freq && channel.kind === 'tone') this.tone(ctx, run.bus, channel.wave, e.freq, run.nextTime, end, channel.gain);
      }
      run.nextTime += compiled.stepSeconds;
      run.step += 1;
    }
  }

  /** jingle จบแล้ว: ล้างสถานะ เพื่อให้ขอเล่นซ้ำได้ */
  private finished(run: Running): void {
    if (this.current !== run) return;
    this.current = null;
    this.wanted = null;
    this.fadeOut(run);
  }

  private fadeOut(run: Running | null): void {
    const ctx = sfx.context;
    if (!run || !ctx) return;
    window.clearInterval(run.timer);
    run.bus.gain.cancelScheduledValues(ctx.currentTime);
    run.bus.gain.setTargetAtTime(0, ctx.currentTime, AudioBalance.fadeSeconds / 4);
    window.setTimeout(() => {
      try {
        run.source?.stop();
      } catch {
        // หยุดไปแล้ว
      }
      run.bus.disconnect();
    }, AudioBalance.fadeSeconds * 1000 + 600);
  }

  private tone(ctx: AudioContext, bus: GainNode, wave: OscillatorType, freq: number, start: number, end: number, gain: number): void {
    const osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, start);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.008);
    g.gain.setValueAtTime(gain, Math.max(start + 0.008, end - 0.06));
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(g).connect(bus);
    osc.start(start);
    osc.stop(end + 0.02);
  }

  private drum(ctx: AudioContext, bus: GainNode, drum: Drum, start: number, gain: number): void {
    const g = ctx.createGain();
    g.connect(bus);
    if (drum === 'k') {
      const end = start + 0.14;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(170, start);
      osc.frequency.exponentialRampToValueAtTime(45, end);
      g.gain.setValueAtTime(gain * 3, start);
      g.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(g);
      osc.start(start);
      osc.stop(end + 0.02);
      return;
    }
    const len = drum === 's' ? 0.13 : 0.04;
    const end = start + len;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = drum === 's' ? 'bandpass' : 'highpass';
    filter.frequency.setValueAtTime(drum === 's' ? 1800 : 7000, start);
    g.gain.setValueAtTime(drum === 's' ? gain * 1.6 : gain, start);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    src.connect(filter).connect(g);
    src.start(start);
    src.stop(end + 0.02);
  }

  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noise) return this.noise;
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    this.noise = buf;
    return buf;
  }

  /** ไฟล์เพลงจริง (cache) null ถ้าไม่มีหรือถอดรหัสไม่ได้ */
  private fileFor(name: MusicName, ctx: AudioContext): Promise<AudioBuffer | null> {
    let p = this.files.get(name);
    if (!p) {
      p = loadFile(name, ctx);
      this.files.set(name, p);
    }
    return p;
  }
}

async function loadFile(name: MusicName, ctx: AudioContext): Promise<AudioBuffer | null> {
  const canOgg = typeof Audio !== 'undefined' && new Audio().canPlayType('audio/ogg; codecs=vorbis') !== '';
  const url = `assets/audio/music/${name}.${canOgg ? 'ogg' : 'mp3'}`;
  try {
    const res = await fetch(url);
    const type = res.headers.get('content-type') ?? '';
    // dev server และ static host หลายเจ้าตอบ index.html แทน 404: ไม่ใช่เสียง ถือว่ายังไม่มีไฟล์
    if (!res.ok || !(type.startsWith('audio/') || type.includes('ogg'))) return null;
    return await ctx.decodeAudioData(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export const music = new MusicPlayer();
