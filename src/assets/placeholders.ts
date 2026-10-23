/**
 * สร้าง texture แทนชั่วคราวเมื่อยังไม่มีไฟล์ asset จริงจาก Codex
 *
 * ชื่อ frame และขนาดตรงกับ manifest.ts ทุกตัว ดังนั้นเมื่อวางไฟล์จริงลงไป
 * เกมจะใช้ไฟล์จริงทันทีโดยไม่ต้องแก้โค้ด ภาพที่วาดที่นี่ตั้งใจให้ดูหยาบ
 * เพื่อไม่ให้ถูกเข้าใจผิดว่าเป็น art จริง แต่ยังสื่อดีไซน์ของ Aclaire ได้พอทดสอบ
 */
import type Phaser from 'phaser';
import { type AtlasDef, frameName } from './manifest';
import { PALETTE as C } from './palette';

interface FrameInfo {
  name: string;
  anim: string;
  index: number;
  count: number;
  w: number;
  h: number;
}

type Painter = (p: PixelPen, f: FrameInfo) => void;

/** วาด pixel ด้วยพิกัดจำนวนเต็มเท่านั้น (ไม่มี anti-aliasing) */
export class PixelPen {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  rect(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  px(x: number, y: number, color: string): void {
    this.rect(x, y, 1, 1, color);
  }

  /** เส้นตรงแบบ Bresenham ความหนา t */
  line(x0: number, y0: number, x1: number, y1: number, t: number, color: string): void {
    let x = Math.round(x0);
    let y = Math.round(y0);
    const xe = Math.round(x1);
    const ye = Math.round(y1);
    const dx = Math.abs(xe - x);
    const dy = -Math.abs(ye - y);
    const sx = x < xe ? 1 : -1;
    const sy = y < ye ? 1 : -1;
    let err = dx + dy;
    const off = Math.floor(t / 2);
    for (;;) {
      this.rect(x - off, y - off, t, t, color);
      if (x === xe && y === ye) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }

  disc(cx: number, cy: number, r: number, color: string): void {
    for (let y = -r; y <= r; y += 1) {
      const half = Math.floor(Math.sqrt(r * r - y * y));
      this.rect(cx - half, cy + y, half * 2 + 1, 1, color);
    }
  }
}

/** สร้าง placeholder ให้ atlas หนึ่งชุด (ข้ามถ้ามี texture key นี้แล้ว) */
export function createPlaceholderAtlas(textures: Phaser.Textures.TextureManager, atlas: AtlasDef): void {
  if (textures.exists(atlas.key)) textures.remove(atlas.key);

  const frames = listFrames(atlas);
  const layout = packFrames(frames, 1024, 1);
  const canvas = textures.createCanvas(atlas.key, layout.width, layout.height);
  if (!canvas) throw new Error(`Cannot create placeholder texture "${atlas.key}"`);

  const ctx = canvas.context;
  ctx.imageSmoothingEnabled = false;
  const pen = new PixelPen(ctx);
  const painter = PAINTERS[atlas.key] ?? paintUnknown;

  for (const f of frames) {
    const pos = layout.positions.get(f.name);
    if (!pos) continue;
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.beginPath();
    ctx.rect(0, 0, f.w, f.h);
    ctx.clip();
    painter(pen, f);
    ctx.restore();
    canvas.add(f.name, 0, pos.x, pos.y, f.w, f.h);
  }
  canvas.refresh();
}

/** Texture สำหรับด่าน graybox: 0 = พื้นทึบ, 1 = พื้นผิวบน, 2 = หนาม */
export function createGrayboxTiles(textures: Phaser.Textures.TextureManager, key: string, tile: number): void {
  if (textures.exists(key)) return;
  const canvas = textures.createCanvas(key, tile * 3, tile);
  if (!canvas) throw new Error(`Cannot create texture "${key}"`);
  const pen = new PixelPen(canvas.context);

  // 0: พื้นทึบ
  pen.rect(0, 0, tile, tile, C.neutral2);
  pen.rect(0, 0, tile, 1, C.neutral3);
  pen.rect(0, 0, 1, tile, C.neutral3);
  pen.rect(4, 5, 2, 2, C.neutral1);
  pen.rect(10, 11, 2, 2, C.neutral1);

  // 1: พื้นผิวบน (หญ้า)
  const o = tile;
  pen.rect(o, 0, tile, tile, C.neutral2);
  pen.rect(o, 0, tile, 4, C.foliage2);
  pen.rect(o, 0, tile, 1, C.foliage3);
  for (let x = 1; x < tile; x += 3) pen.px(o + x, 4, C.foliage1);

  // 2: หนาม
  const s = tile * 2;
  for (let i = 0; i < 4; i += 1) {
    const bx = s + i * 4;
    for (let y = 0; y < 8; y += 1) {
      const half = Math.floor(y / 4);
      pen.rect(bx + 2 - half - 1, 8 + y, half * 2 + 2, 1, y < 2 ? C.highlight : C.neutral4);
    }
  }
  pen.rect(s, tile - 2, tile, 2, C.neutral1);

  canvas.refresh();
}

function listFrames(atlas: AtlasDef): FrameInfo[] {
  const out: FrameInfo[] = [];
  for (const a of atlas.anims) {
    for (let i = 0; i < a.frames; i += 1) {
      out.push({
        name: frameName(a.name, i),
        anim: a.name,
        index: i,
        count: a.frames,
        w: a.width ?? atlas.frameWidth,
        h: a.height ?? atlas.frameHeight,
      });
    }
  }
  for (const s of atlas.stills ?? []) {
    out.push({
      name: s.name,
      anim: s.name,
      index: 0,
      count: 1,
      w: s.width ?? atlas.frameWidth,
      h: s.height ?? atlas.frameHeight,
    });
  }
  return out;
}

function packFrames(frames: FrameInfo[], maxWidth: number, pad: number) {
  const positions = new Map<string, { x: number; y: number }>();
  let x = pad;
  let y = pad;
  let rowH = 0;
  let width = 0;
  for (const f of frames) {
    if (x + f.w + pad > maxWidth) {
      x = pad;
      y += rowH + pad;
      rowH = 0;
    }
    positions.set(f.name, { x, y });
    x += f.w + pad;
    rowH = Math.max(rowH, f.h);
    width = Math.max(width, x);
  }
  return { positions, width: Math.max(width, 1), height: y + rowH + pad };
}

// ---------------------------------------------------------------------------
// Painters
// ---------------------------------------------------------------------------

const PAINTERS: Record<string, Painter> = {
  player: paintAclaire,
  enemies_w1: paintEnemiesW1,
  items: paintItems,
  fx: paintFx,
  ui: paintUi,
};

function paintUnknown(p: PixelPen, f: FrameInfo): void {
  p.rect(0, 0, f.w, f.h, C.magic);
  p.rect(1, 1, f.w - 2, f.h - 2, C.neutral1);
}

/**
 * Aclaire v2 (art/reference/aclaire_character_sheet_v2.png) แบบหยาบ:
 * ผมส้มหางม้าสูง เสื้อแขนกุดชมพู เกราะอกเงิน กางเกงขาสั้น tan
 * ถุงเท้าเทาเข้มเหนือเข่า บูทดำขอบขาว ดาบใหญ่ฝักดำตั้งเกือบตรงบนหลัง
 */
function paintAclaire(p: PixelPen, f: FrameInfo): void {
  const cx = Math.floor(f.w / 2);
  const t = f.count > 1 ? f.index / (f.count - 1) : 0;

  if (f.anim === 'dead') {
    paintAclaireLying(p, f, cx, t);
    return;
  }

  let bob = 0;
  let legA = 0;
  let legB = 0;
  let tuck = 0;
  let blink = false;
  switch (f.anim) {
    case 'idle':
      bob = f.index === 2 || f.index === 3 ? 1 : 0;
      blink = f.index === 4;
      break;
    case 'run': {
      const phase = (f.index / f.count) * Math.PI * 2;
      legA = Math.round(Math.sin(phase) * 3);
      legB = -legA;
      bob = Math.abs(Math.round(Math.cos(phase))) === 1 ? 0 : 1;
      break;
    }
    case 'jump_up':
    case 'jump_peak':
      tuck = 3;
      legA = 2;
      legB = -1;
      break;
    case 'fall':
      tuck = 1;
      legA = -1;
      legB = 2;
      break;
    case 'land':
      bob = f.index === 0 ? 2 : 1;
      break;
    case 'hurt':
      legA = -2;
      legB = 1;
      break;
    default:
      break;
  }

  const foot = f.h - 1 - tuck;
  const top = foot - 39 + bob;
  const attacking = f.anim.startsWith('attack');

  // ดาบบนหลัง: ปุ่มด้าม ด้าม กันมือ และฝักอยู่บนแกนตรงเส้นเดียว เกือบตั้งตรงหลังแผ่นหลัง
  // ตอนฟันดาบ ด้ามหายไปจากหลัง เหลือฝักเปล่า
  // แกนดาบ: ปุ่มด้ามเหนือไหล่หลังศีรษะ → ปลายฝักใกล้น่อง
  p.line(cx - 8, top + 12, cx - 3, top + 34, 4, C.neutral3);
  p.line(cx - 8, top + 12, cx - 3, top + 34, 2, C.outline);
  if (!attacking) {
    p.rect(cx - 10, top + 11, 5, 1, C.gold); // กันมือ
    p.line(cx - 9, top + 7, cx - 8, top + 10, 2, C.gold); // ด้าม
    p.px(cx - 9, top + 8, C.foliage2);
    p.rect(cx - 10, top + 5, 2, 2, C.fire2); // ปุ่มด้ามสีแดง
  }

  // ขา: ต้นขาสีผิว → ถุงเท้าเทาเข้มเหนือเข่า → บูทดำขอบขาว พื้นขาว
  const legY = top + 27;
  for (const [dx, swing] of [
    [-3, legA],
    [2, legB],
  ] as const) {
    const lx = cx + dx + swing;
    p.rect(lx, legY, 3, 2, C.skin3);
    p.rect(lx, legY + 2, 3, foot - legY - 8, C.neutral2);
    p.rect(lx, legY + 2, 3, 1, C.neutral3);
    p.rect(lx - 1, foot - 6, 5, 6, C.outline);
    p.rect(lx - 1, foot - 6, 5, 1, C.highlight);
    p.rect(lx - 1, foot, 5, 1, C.highlight);
  }

  // กางเกงขาสั้น tan + เข็มขัดน้ำตาล
  p.rect(cx - 5, top + 21, 11, 6, C.earth);
  p.rect(cx - 5, top + 26, 11, 1, C.earth2);
  p.rect(cx - 5, top + 20, 11, 1, C.wood1);
  // เสื้อแขนกุดชมพู + คอตั้ง
  p.rect(cx - 5, top + 13, 11, 7, C.pink2);
  p.rect(cx - 5, top + 13, 2, 7, C.pink1);
  p.rect(cx - 1, top + 12, 4, 2, C.pink2);
  // เกราะอกเล็กสีเงิน
  p.rect(cx, top + 15, 5, 3, C.neutral4);
  p.rect(cx, top + 15, 5, 1, C.highlight);
  p.rect(cx, top + 17, 5, 1, C.neutral3);
  // สายสะพายดำพาดทแยงทับเกราะ
  p.line(cx - 4, top + 13, cx + 4, top + 19, 1, C.outline);
  // แขน
  if (!attacking) {
    p.rect(cx - 7, top + 15, 2, 7, C.skin2);
    p.rect(cx + 6, top + 15, 2, 7, C.skin2);
    p.px(cx + 6, top + 20, C.gold);
  }

  // หัว
  const hy = top + 6;
  p.disc(cx, hy, 6, C.skin3);
  // ผมส้มฟู + หน้าม้า
  p.rect(cx - 7, hy - 7, 14, 5, C.fire3);
  p.rect(cx - 7, hy - 3, 4, 7, C.fire3);
  p.rect(cx + 1, hy - 3, 5, 2, C.fire3);
  p.px(cx + 4, hy - 1, C.fire3);
  p.rect(cx - 6, hy - 7, 11, 1, C.gold);
  p.rect(cx - 7, hy + 1, 2, 3, C.fire);
  // หางม้าสูง + ยางรัดผมชมพู
  const tailSwing = f.anim === 'run' ? f.index % 2 : 0;
  p.rect(cx - 6, hy - 9, 3, 2, C.pink2);
  p.rect(cx - 11, hy - 10 + tailSwing, 6, 4, C.fire3);
  p.rect(cx - 13, hy - 7 + tailSwing, 4, 5, C.fire);
  p.px(cx - 10, hy - 10 + tailSwing, C.gold);
  // ตาสีฟ้า (หันขวา)
  if (blink) {
    p.rect(cx + 2, hy, 3, 1, C.outline);
  } else {
    p.rect(cx + 2, hy - 1, 2, 3, C.water);
    p.px(cx + 2, hy - 1, C.highlight);
  }

  if (attacking) paintSwordSwing(p, f, cx, top, t);

  if (f.anim === 'hurt') {
    // แสงแดงทับเพื่อบอกว่าโดนตี
    p.rect(cx - 6, top + 8, 2, 2, C.fire2);
    p.rect(cx + 6, top + 4, 2, 2, C.fire2);
  }
}

function paintSwordSwing(p: PixelPen, f: FrameInfo, cx: number, top: number, t: number): void {
  // มุมดาบตามจังหวะ: 1 ฟันแนวนอน, 2 ฟันเฉียงขึ้น, 3 ฟันหนักลงพื้น
  const ranges: Record<string, [number, number]> = {
    attack_1: [-1.9, 0.15],
    attack_2: [0.7, -1.2],
    attack_3: [-2.2, 1.05],
  };
  const [a0, a1] = ranges[f.anim] ?? [0, 0];
  const angle = a0 + (a1 - a0) * Math.min(1, t * 1.4);
  const hx = cx + 6;
  const hy = top + 18;
  const len = 24;
  const tx = hx + Math.cos(angle) * len;
  const ty = hy + Math.sin(angle) * len;
  // แขนจับดาบ
  p.rect(cx + 3, top + 16, 4, 2, C.skin2);
  // ใบดาบกว้าง
  p.line(hx, hy, tx, ty, 3, C.neutral4);
  p.line(hx, hy, tx, ty, 1, C.highlight);
  // ด้ามเหลือง-เขียว + ปุ่มแดง
  const bx = hx - Math.cos(angle) * 4;
  const by = hy - Math.sin(angle) * 4;
  p.line(hx, hy, bx, by, 2, C.gold);
  p.px((hx + bx) / 2, (hy + by) / 2, C.foliage2);
  p.rect(bx - 1, by - 1, 2, 2, C.fire2);
}

function paintAclaireLying(p: PixelPen, f: FrameInfo, cx: number, t: number): void {
  const y = f.h - 6;
  const fall = Math.round((1 - Math.min(1, t * 2)) * 8);
  p.rect(cx - 16, y - fall, 4, 4, C.outline);
  p.rect(cx - 12, y - fall, 4, 4, C.neutral2);
  p.rect(cx - 8, y - fall, 6, 4, C.earth);
  p.rect(cx - 2, y - fall, 8, 4, C.pink2);
  p.rect(cx + 1, y - fall, 3, 2, C.neutral4);
  p.disc(cx + 10, y + 2 - fall, 4, C.skin3);
  p.rect(cx + 8, y - 3 - fall, 8, 3, C.fire3);
  p.line(cx - 6, y - 2 - fall, cx + 8, y - 4 - fall, 2, C.outline);
}

function paintEnemiesW1(p: PixelPen, f: FrameInfo): void {
  if (!f.anim.startsWith('moss_slime')) {
    paintUnknown(p, f);
    return;
  }
  const t = f.count > 1 ? f.index / (f.count - 1) : 0;
  let squish = 0;
  let scale = 1;
  if (f.anim === 'moss_slime_move') squish = Math.round(Math.sin((f.index / f.count) * Math.PI * 2) * 2);
  if (f.anim === 'moss_slime_idle') squish = f.index % 2;
  if (f.anim === 'moss_slime_death') scale = 1 - t * 0.8;

  const w = Math.max(2, Math.round(22 * scale) + squish);
  const h = Math.max(2, Math.round(14 * scale) - squish);
  const x = Math.floor((f.w - w) / 2);
  const y = f.h - h;
  const body = f.anim === 'moss_slime_hurt' ? C.highlight : C.foliage3;
  p.rect(x, y + 2, w, h - 2, C.foliage1);
  p.rect(x + 1, y, w - 2, h - 2, body);
  p.rect(x + 2, y + 1, Math.max(1, w - 8), 2, C.foliage2);
  if (scale > 0.5) {
    p.rect(x + w - 8, y + 4, 2, 3, C.outline);
    p.rect(x + w - 4, y + 4, 2, 3, C.outline);
  }
}

function paintItems(p: PixelPen, f: FrameInfo): void {
  const cx = Math.floor(f.w / 2);
  if (f.anim === 'coin_spin') {
    const widths = [10, 8, 6, 4, 6, 8];
    const w = widths[f.index % widths.length];
    p.rect(cx - w / 2, 1, w, 10, C.earth4);
    p.rect(cx - w / 2, 1, Math.max(1, w / 2), 10, C.gold);
    p.rect(cx - w / 2, 0, w, 1, C.wood2);
    return;
  }
  if (f.anim === 'heart_fruit_bob') {
    const y = f.index % 2;
    p.disc(5, 6 + y, 3, C.fire2);
    p.disc(10, 6 + y, 3, C.fire2);
    for (let i = 0; i < 5; i += 1) p.rect(3 + i, 8 + i + y, 10 - i * 2, 1, C.fire2);
    p.px(5, 5 + y, C.highlight);
    p.rect(7, 1 + y, 2, 3, C.foliage2);
    return;
  }
  if (f.anim.startsWith('checkpoint_shrine')) {
    p.rect(8, 16, 16, 32, C.neutral3);
    p.rect(8, 16, 3, 32, C.neutral4);
    p.rect(6, 44, 20, 4, C.neutral2);
    p.rect(6, 14, 20, 3, C.neutral2);
    const lit = f.anim === 'checkpoint_shrine_lit';
    const lighting = f.anim === 'checkpoint_shrine_lighting';
    const flame = lit ? 8 + (f.index % 2) * 2 : lighting ? Math.round((f.index / (f.count - 1)) * 9) : 0;
    p.rect(13, 26, 6, 10, lit || lighting ? C.magic : C.neutral1);
    if (flame > 0) {
      p.rect(12, 13 - flame, 8, flame, C.fire3);
      p.rect(14, 13 - flame + 2, 4, Math.max(1, flame - 2), C.gold);
    }
    return;
  }
  if (f.anim === 'goal_flag_wave') {
    p.rect(6, 4, 2, 60, C.neutral4);
    p.disc(7, 4, 2, C.gold);
    for (let x = 0; x < 20; x += 1) {
      const wave = Math.round(Math.sin(x / 3 + f.index) * 1.5);
      p.rect(8 + x, 7 + wave, 1, 12, x % 6 < 3 ? C.magic : C.pink2);
    }
    return;
  }
  paintUnknown(p, f);
}

function paintFx(p: PixelPen, f: FrameInfo): void {
  const t = f.count > 1 ? f.index / (f.count - 1) : 0;
  if (f.anim.startsWith('slash_')) {
    const r = 10 + Math.round(t * 4);
    const cx = 6;
    const cy = 16;
    const start = f.anim === 'slash_2' ? 0.6 : -1.2;
    const end = f.anim === 'slash_2' ? -1.2 : f.anim === 'slash_3' ? 1.4 : 1.0;
    const steps = 18;
    for (let i = 0; i <= steps * (0.4 + t * 0.6); i += 1) {
      const a = start + ((end - start) * i) / steps;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      p.rect(x, y, 2, 2, i % 3 === 0 ? C.gold : C.highlight);
    }
    return;
  }
  if (f.anim === 'hit_spark') {
    const r = 2 + f.index * 2;
    p.rect(8 - r, 7, r * 2, 2, C.highlight);
    p.rect(7, 8 - r, 2, r * 2, C.highlight);
    p.rect(7, 7, 2, 2, C.gold);
    return;
  }
  if (f.anim === 'poof') {
    const r = 3 + Math.round(t * 10);
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      p.rect(16 + Math.cos(a) * r - 1, 16 + Math.sin(a) * r - 1, 3, 3, t > 0.6 ? C.neutral3 : C.neutral4);
    }
    return;
  }
  paintUnknown(p, f);
}

const ELEMENT_COLORS: Record<string, string> = {
  fire: C.fire,
  water: C.water,
  wind: C.wind,
  earth: C.earth,
};

function paintUi(p: PixelPen, f: FrameInfo): void {
  switch (f.name) {
    case 'heart_full':
    case 'heart_empty': {
      const fill = f.name === 'heart_full' ? C.fire2 : C.neutral1;
      p.disc(5, 6, 4, C.outline);
      p.disc(10, 6, 4, C.outline);
      for (let i = 0; i < 6; i += 1) p.rect(1 + i, 8 + i, 14 - i * 2, 1, C.outline);
      p.disc(5, 6, 3, fill);
      p.disc(10, 6, 3, fill);
      for (let i = 0; i < 5; i += 1) p.rect(2 + i, 8 + i, 12 - i * 2, 1, fill);
      if (f.name === 'heart_full') p.rect(4, 4, 2, 2, C.highlight);
      return;
    }
    case 'energy_bar_frame':
      p.rect(0, 0, f.w, f.h, C.outline);
      p.rect(1, 1, f.w - 2, f.h - 2, C.neutral1);
      return;
    case 'energy_bar_fill_normal':
      p.rect(0, 0, f.w, f.h, C.magic);
      p.rect(0, 0, f.w, 2, C.pink3);
      return;
    case 'energy_bar_fill_flash':
      p.rect(0, 0, f.w, f.h, C.highlight);
      return;
    case 'element_slot_select':
      p.rect(0, 0, f.w, f.h, C.gold);
      p.rect(2, 2, f.w - 4, f.h - 4, C.outline);
      return;
    case 'lives_icon':
      p.disc(8, 9, 6, C.skin3);
      p.rect(2, 2, 13, 5, C.fire3);
      p.rect(0, 1, 4, 3, C.fire);
      p.rect(10, 8, 2, 2, C.water2);
      return;
    case 'coin_icon':
      p.rect(1, 1, 10, 10, C.earth4);
      p.rect(1, 1, 5, 10, C.gold);
      return;
    default:
      break;
  }
  const icon = /^element_icon_(\w+)_(normal|locked)$/.exec(f.name);
  if (icon) {
    const color = icon[2] === 'locked' ? C.neutral2 : ELEMENT_COLORS[icon[1]] ?? C.magic;
    p.disc(12, 12, 11, C.outline);
    p.disc(12, 12, 9, color);
    p.rect(8, 7, 3, 3, icon[2] === 'locked' ? C.neutral3 : C.highlight);
    return;
  }
  paintUnknown(p, f);
}
